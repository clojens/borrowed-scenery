// t r u f f l e Copyright (C) 2012 FoAM vzw   \_\ __     /\
//                                          /\    /_/    / /  
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

//////////////////////////////////////////////////////////////////////

function game(world) {
    this.world=world;
    this.entities=[];
    this.next_pull_time=0;
    this.player=null;
    this.avatar=null;
    this.tile_change=false;
    this.loading_spr=null;
    this.particle_systems_this_frame=0;
    this.max_particle_systems_per_frame=1;
    this.map_update_frame_count=0;
    this.update_next_frame=false;
    this.border_min=1;
    this.border_max=13;
    this.world.canvas_state.bg_colour = "#000000";

    this.arrow_indicator=new truffle.sprite_entity(
        this.world,
        new truffle.vec3(-999,5,-1),
        "");
    this.arrow_indicator.needs_update=true;
    this.arrow_indicator.depth_offset=-100;

    centre=new truffle.vec2(51.04751,3.72739); // becomes 0,0 in world tile space
    //centre=new truffle.vec2(51.04672,3.73121); // becomes 0,0 in world tile space
    zoom=17;
    var that=this;

/*    this.pstest = new truffle.particles_entity(
        world,
        new truffle.vec3(2,2,-1),
        "images/particle.png",
        20,"continuous");
    this.pstest.needs_update=true;
*/
    var camera_pos=world.screen_transform(new truffle.vec3(7,7,1));
    world.canvas_state.snap_world_to(camera_pos.x,camera_pos.y);

    this.map=new map(centre,zoom);
    this.map.do_create_tile=function(world_x,world_y,sub_image) {
        var x=world_x+sub_image[0];
        var y=world_y+sub_image[1];

        var s=new truffle.sprite_entity(
            that.world,
            new truffle.vec3(x,y,0),
            "images/empty_map.png");

        //s.spr.draw_bb=true;
        s.spr.set_bitmap(sub_image[2]); 
        s.depth_offset=100;
        // crudely set the iso projection
        var t=new truffle.mat23();
        t.translate(40,0);
        t.scale(1.67,0.42*1.67);
        t.rotate(31*Math.PI/180);
        t.scale(1,1.2);
        t.translate(-10,-10);
        t.rotate(270*Math.PI/180);

        s.spr.parent_transform=t;
        s.spr.expand_bb=20; // enable larger clipping region
        s.spr.do_transform=true;

        // show the compass
        if (x>that.border_max || x<that.border_min || 
            y>that.border_max || y<that.border_min) { 
            s.spr.mouse_over(function() {
                if (x>that.border_max) that.arrow_indicator.spr.change_bitmap("images/compass-east.png");
                if (x<that.border_min) that.arrow_indicator.spr.change_bitmap("images/compass-west.png");
                if (y>that.border_max) that.arrow_indicator.spr.change_bitmap("images/compass-south.png");
                if (y<that.border_min) that.arrow_indicator.spr.change_bitmap("images/compass-north.png");

                that.arrow_indicator.move_to(that.world,new truffle.vec3(x,y,0));
            });
            s.spr.mouse_out(function() {
                // hack
                that.arrow_indicator.move_to(that.world,new truffle.vec3(-999,0,0));
            });
        }

        s.spr.mouse_down(function() {
            
            that.move_player(s.logical_pos);

            //if (px==9) { that.player.tile.x+=2; that.update_tile() }
            //if (py==9) { that.player.tile.y+=2; that.update_tile() }

        });
        return s;        
    }
    
    this.map.do_update_tile=function(world_x,world_y,sub_image,entity) {
        entity.spr.set_bitmap(sub_image[2],true); 
    }

    this.updating_text=new truffle.textbox(new truffle.vec2(0,0),
                                           "loading map...",
                                           500,300,"50pt MaidenOrange");
    this.updating_text.text_colour="#777777";
    this.world.add_sprite(this.updating_text);
    this.updating_text.hide(true);
    this.world.pre_sort_scene=function(depth) {
        that.updating_text.set_depth(depth++);
        return depth;
    }

}



///////////////////////////////////////////////////////////////////////////////

game.prototype.connect_and_login=function(name) {
    var that=this;
    this.server=new truffle.server('ws://localhost:8002/borrowed-scenery',
                                   function () {
                                       that.server.call("login",[name,0,0]);
                                   });
    this.server.listen("login", function(player) {
        that.logged_in=true;
        that.player=player;
        that.tile_change=true;
        log(that.player.name+" has logged in");
        that.update_tile()
    });
}

game.prototype.chat=function(text) {
    if (this.logged_in) {
        this.server.call("chat",[this.player.id,
                                 text,
                                 0]);
    }
    else
    {
        alert("You need to log in first");
    }
}

/////////////////////////////////////////////////////////////////////////////////

game.prototype.find_entity=function(id) {
    for (var i=0; i<this.entities.length; i++) {
        if (id==this.entities[i].id) return this.entities[i];
    }
    return null;
} 

game.prototype.clear_entities=function() {
    var that=this;
    this.entities.forEach(function(entity) {
        that.world.remove(entity);
    });
    this.entities=[];
}

game.prototype.update_entity=function(entity,from_server,tile) {
    if (from_server["entity-type"]=="plant") {
        // if the state has changed
        if (from_server.state!=entity.state) {
            entity.state=from_server.state;
            entity.spr.change_bitmap(this.entity_texture(from_server));
            entity.needs_update=false; // turn off shaking

            // if we have just grown, spawn a particle system
            if (entity.state=="grow-a" || 
                entity.state=="grow-b" ||
                entity.state=="grow-c" || 
                entity.state=="grow-d" || 
                entity.state=="spore") {

                if (this.particle_systems_this_frame<
                    this.max_particle_systems_per_frame) {
                    // particle system will delete itself when done
                    var p=new truffle.particles_entity(
                        this.world,
                        new truffle.vec3(entity.logical_pos.x,
                                         entity.logical_pos.y,
                                         -1),
                        "images/particle.png",
                        10, "one-shot");
                    this.particle_systems_this_frame++;
                }
            }
        }
    }
    if (from_server["entity-type"]=="avatar") {
       // log(JSON.stringify(from_server));
        var pos=this.server_to_client_coords(
            this.player.tile.x,
            this.player.tile.y,
            tile.x,
            tile.y,
            from_server.pos.x,
            from_server.pos.y);

        // if we have changed position
        if (entity.logical_pos.x!=pos.x ||
            entity.logical_pos.y!=pos.y) {
            entity.move_to(this.world,new truffle.vec3(pos.x,pos.y,0));
            entity.needs_update=true;
            entity.on_reached_dest=function() {
                entity.needs_update=false;
            };
        }

        if (from_server.chat!=entity.chat_last) {
//            alert("found different msg");
            entity.chat_time=this.world.time;
            entity.chat_text.set_text(from_server.chat);
            entity.chat_last=from_server.chat;
            entity.chat_active=true;
            entity.update(this.world,0);
        }

        if (entity.chat_active &&
            this.world.time>entity.chat_time+10) {
            entity.chat_text.set_text("");
            entity.chat_active=false;
        }

    }
}

game.prototype.move_player=function(to) {
    var that=this;
    var sx=that.avatar.logical_pos.x;
    var sy=that.avatar.logical_pos.y;
    var px=to.x;
    var py=to.y;
    var cam=this.world.screen_transform(new truffle.vec3(px,py,0));
    this.world.move_world_to(cam.x,cam.y);
    
    if (sx!=px) {
        if (sx<px) that.avatar.spr.change_bitmap('images/'+that.player["avatar-type"]+'-east.png');
        else that.avatar.spr.change_bitmap('images/'+that.player["avatar-type"]+'-west.png');
    }
    
    that.avatar.speed=0.025;
    that.avatar.move_to(that.world,new truffle.vec3(px,sy,0));
    that.avatar.on_reached_dest=function() {
        if (sy!=py) {
            if (sy<py) that.avatar.spr.change_bitmap('images/'+that.player["avatar-type"]+'-south.png');
            else that.avatar.spr.change_bitmap('images/'+that.player["avatar-type"]+'-north.png');
        }
        that.avatar.move_to(that.world,new truffle.vec3(px,py,0));
        
        that.avatar.on_reached_dest=function() {
            that.world.redraw();

            var tcx=0;
            var tcy=0;

            // this part sucks
            if (px>that.border_max) { 
                that.player.tile.x+=1;
                that.tile_change=true;
                tcx=-5;
            }
            if (px<that.border_min) { 
                that.player.tile.x-=1;
                that.tile_change=true;
                tcx=5;
            }  
            if (py>that.border_max) { 
                that.player.tile.y+=1;
                that.tile_change=true;
                tcy=-5;
            }  
            if (py<that.border_min) { 
                that.player.tile.y-=1;
                that.tile_change=true;
                tcy=5;
            }  
            
            if (that.tile_change) {
                that.avatar.speed=0;
                that.avatar.move_to(that.world,new truffle.vec3(px+tcx,py+tcy,0));
                that.avatar.hide(true);
            }

            // need to figure out server tile by looking at current
            // client tile (0->14)
            var server_tile_x=that.player.tile.x+(Math.floor(px/5)-1);
            var server_tile_y=that.player.tile.y+(Math.floor(py/5)-1);

            that.server.call("move-player",[that.player.id,
                                            server_tile_x,
                                            server_tile_y,
                                            px%5,
                                            py%5,0]);
            
        };
    };
    
    //that.server
}

game.prototype.entity_texture=function(entity) {
    if (entity["entity-type"]=="plant") {
        if (entity.type=="knobbly")
            return "images/knobbly-"+this.state_to_texture(entity.state)+".png";
        else
            return "images/pointy-"+this.state_to_texture(entity.state)+".png";
    }
    if (entity["entity-type"]=="avatar") {
        return "images/"+entity["avatar-type"]+"-west.png";
    }
    return "none";
}

game.prototype.state_to_texture=function(state) {
    if (state=="grow-a" || state=="grow-a-ready") return "a";
    if (state=="grow-b" || state=="grow-b-ready") return "b";
    if (state=="grow-c" || state=="grow-c-ready") return "c";
    if (state=="grow-d" || state=="grow-d-ready" || state=="spore") return "d";
    if (state=="decay-a") return "d";
    if (state=="decay-b") return "c";
    if (state=="decay-c") return "b";
    if (state=="decay-d") return "a";
}

game.prototype.make_new_entity=function(gamepos,tilepos,entity) {
    var that=this;

//    if (tilepos.x!=this.player.tile.x ||
//        tilepos.y!=this.player.tile.y) return;

    if (entity["entity-type"]=="avatar") {
        // no need to display ourself
        if (entity.id==this.player.id) {
            // if we exist already, update our chat text if required 
            if (this.avatar!=null) {
                if (entity.chat!=this.avatar.chat_last) {
                    this.avatar.chat_time=this.world.time;
                    this.avatar.chat_text.set_text(entity.chat);
                    this.avatar.chat_last=entity.chat;
                    this.avatar.chat_active=true;
                }

                if (this.avatar.chat_active &&
                    this.world.time>this.avatar.chat_time+10) {
                    this.avatar.chat_text.set_text("");
                    this.avatar.chat_active=false;
                }

                return;
            }
            // make the player's avatar
            this.avatar = new truffle.sprite_entity(
                that.world,
                new truffle.vec3(gamepos.x,gamepos.y,0),
                'images/'+this.player["avatar-type"]+'-south.png');
            this.avatar.needs_update=true;
            this.avatar.speed=0.025;
            this.avatar.chat_time=0;
            this.avatar.chat_last="";
            var ct=new truffle.textbox(new truffle.vec2(0,-200),
                                      "",
                                      300,300,"15pt patafont");
            ct.text_height=55;
            ct.text_colour="#5555ff";
            this.avatar.chat_text=ct;
            this.avatar.chat_active=false;
            this.avatar.add_child(this.world,ct);
            var t=new truffle.textbox(new truffle.vec2(0,-150),
                                      entity.owner,
                                      300,300,"15pt MaidenOrange");
            t.text_height=25;
            this.avatar.add_child(this.world,t);
        }
        else
        {
            log("making new avatar");
            
            var e=new truffle.sprite_entity(
                this.world,
                new truffle.vec3(gamepos.x,gamepos.y,0),
                this.entity_texture(entity));
            e.id=entity.id;
            e.needs_update=false;
            e.speed=0.025;
            e.chat_time=0;
            e.chat_last="";
            e.chat_active=false;
            var ct=new truffle.textbox(new truffle.vec2(0,-200),
                                      "",
                                      300,300,"15pt patafont");
            ct.text_height=50;
            ct.text_colour="#55ff55";
            e.chat_text=ct;
            e.add_child(this.world,ct);

            var t=new truffle.textbox(new truffle.vec2(0,-150),
                                      entity.owner,
                                      300,300,"15pt MaidenOrange");
            t.text_height=25;
            e.add_child(this.world,t);
            this.entities.push(e);        
        }
    }
    else if (entity["entity-type"]=="plant") {
        var e=new truffle.sprite_entity(
            this.world,
            new truffle.vec3(gamepos.x,gamepos.y,0),
            this.entity_texture(entity))
        e.state=entity.state;
        e.id=entity.id;
        //e.spr.draw_bb=true;

        if (entity.state=="grow-a-ready" &&
            this.particle_systems_this_frame<
            this.max_particle_systems_per_frame) {
            var p=new truffle.particles_entity(
                this.world,
                new truffle.vec3(gamepos.x,
                                 gamepos.y,
                                 -1),
                "images/particle.png",
                20, "one-shot");
            this.particle_systems_this_frame++;
        }

        e.spr.mouse_down(function() {
            that.avatar.move_to(that.world,new truffle.vec3(e.logical_pos.x,
                                                            e.logical_pos.y,0));

            that.avatar.on_reached_dest=function(){
                that.server.call("grow",[tilepos.x,
                                         tilepos.y,
                                         entity.id,
                                         that.player.id,
                                         0]);
            };
        });
        
        e.spr.mouse_over(function() {
            if (e.state=="grow-a-ready" || e.state=="grow-b-ready" ||
                e.state=="grow-c-ready" || e.state=="spore-ready") {
                e.needs_update=true;
                e.every_frame=function() {
                    e.spr.rotate(Math.sin(that.world.time*50)/80);
                }
            }
        });

        e.spr.mouse_out(function() {
            e.needs_update=false;
        });

        this.entities.push(e);
    }
    else if (entity["entity-type"]=="ushahidi") {
        log("making boskoi plant at "+gamepos.x+" "+gamepos.y);
        var e=new truffle.sprite_entity(
            this.world,
            new truffle.vec3(gamepos.x,gamepos.y,0),
            "images/boskoi-"+entity.layer+".png")
        e.id=entity.id;
        var t=new truffle.textbox(new truffle.vec2(0,-200),
                                  entity.incident.incidentdescription+" "+
                                  entity.incident.locationname+" "+
                                  entity.incident.incidentdate,
                                  200,300,"15pt patafont");
        t.text_height=25;
        e.add_child(this.world,t);
        this.entities.push(e);
    }
}

game.prototype.shift_entities=function(x,y) {
    

}

//////////////////////////////////////////////////////////////////////////

game.prototype.update_tile=function() {
    // defer doing the update so the wait text gets shown
    if (this.update_next_frame) {
        this.do_update_tile();
        this.update_next_frame=false;
        return;
    }

    if (this.tile_change) {
        this.updating_text.hide(false);
        this.updating_text.set_pos(this.world.in_screen_coords(0,-200));
        this.update_next_frame=true;
        this.world.redraw();
        this.world.do_render=false;
        return;
    }
 
    this.do_update_tile();
}

game.prototype.do_update_tile=function() {
    var that=this;
    if (!this.player) return;

    this.map.update(this.player.tile, 
                    function() {
                        that.map_update_frame_count=1;
                    });

    if (this.tile_change) {
        this.clear_entities();
        this.tile_change=false;
    }

    this.server.call("pull",[this.player.id,
                             this.player.tile.x,
                             this.player.tile.y,0]);

    this.server.listen("pull", function(data) {
        // update the distance info
        var dist=data["most-distant-info"];
        var d=that.map.distance_from_centre(dist["tile-pos"]);
        d=Math.round(d*100)/100;
        document.getElementById('game-stats').innerHTML = 
            "Fungi has reached "+d+" km from Vooruit, created by "+dist.player;

        // update the leaderboard
        var leaderboard="";
        data.leaderboard.forEach(function (score) {
            leaderboard+=score.player+" has grown "+score.score+" fungi to help "+score.helped+" earth plants<br/>";
        });
        document.getElementById('leaderboard').innerHTML=leaderboard;
            
        // update the entities
        data.tiles.forEach(function(tile) {
            var tilepos=tile.pos;
            tile.entities.forEach(function(entity) {
                var gamepos=that.server_to_client_coords(
                    that.player.tile.x,
                    that.player.tile.y,
                    tilepos.x,tilepos.y,
                    entity.pos.x,entity.pos.y);
                
                var existing=that.find_entity(entity.id);
                if (existing) that.update_entity(existing,entity,tilepos);
                else that.make_new_entity(gamepos,tilepos,entity);
            });
        });
        that.particle_systems_this_frame=0;
    });
}

/////////////////////////////////////////////////////////////////////////////

game.prototype.server_to_client_coords=function(wtx,wty,tx,ty,px,py) {
    return new truffle.vec2(((tx-wtx)+1)*5+px,
                            ((ty-wty)+1)*5+py);
}

////////////////////////////////////////////////////////////////////////////

game.prototype.update=function() {
    var time=(new Date).getTime();

    // render some frame to make sure! :(
    if (this.map_update_frame_count>5) {
        this.updating_text.hide(true);
        this.map_update_frame_count=0;
        this.world.do_render=true;
        this.avatar.hide(false);
        this.world.redraw();
    }

    if (this.map_update_frame_count>0) {
        this.map_update_frame_count++;
    }

    if (this.next_pull_time<time)
    {
        this.update_tile();
        this.next_pull_time=time+1000;
    }
}

////////////////////////////////////////////////////////////////////////////


var g;

function login_form() {
    var name=document.getElementById('player_name').value;
    if (name!="" && name!="What are you called?") {
        var element=document.getElementById("input_form");
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        document.getElementById('game-goes-here').innerHTML = 
            '<canvas id="canvas" width="880" height="460"></canvas>\
<input \
     id="chat"\
     type="text"\
     name="chat" \
     style="font-family:patafont"\
     size="10"\
     onkeydown="if (event.keyCode==13) chat();"/>\
<input\
     type="button"\
     style="font-size:50"\
     value="Chat"\
     onclick="chat();" /><br/>\
<div id="fps"></div>';

        truffle.main.init(game_create,game_update);
        g.connect_and_login(name);
    }
    else
    {
        alert("Type in your name...");
    }
}

function chat() {
    var text=document.getElementById('chat').value;
    g.chat(text);    
}

function game_create() {
    g=new game(truffle.main.world);
}

function game_update() {
    g.update();
}