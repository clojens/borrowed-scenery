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
    this.check_zizim_time=0;
    this.player=null;
    this.avatar=null;
    this.tile_change=false;
    this.loading_spr=null;
    this.time_since_last_ps=0;
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

    for (var x=-10; x<25; x++) {
        for (var y=-10; y<25; y++) {
            if ((x<0 || x>=15) ||
                (y<0 || y>=15)) {
                this.create_empty_tile(x,y);
            }
        }
    }

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
 
        that.setup_tile(s);

        s.spr.mouse_down(function() {
            
            that.move_player(s.logical_pos,function(){});

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
    
    this.updating_text.height=70;
    this.updating_text.text_height=100;
    this.updating_text.text_colour="#ffffff";
    this.world.add_sprite(this.updating_text);
    this.updating_text.hide(true);
    this.world.pre_sort_scene=function(depth) {
        that.updating_text.set_depth(depth++);
        return depth;
    }

}

///////////////////////////////////////////////////////////////////////////////

game.prototype.create_empty_tile=function(x,y) {
    var that=this;
    var s=new truffle.sprite_entity(
        that.world,
        new truffle.vec3(x,y,0),
        "images/empty_map_"+Math.floor(Math.random()*3)+".png");
    
    s.spr.zone=1;
    this.setup_tile(s);

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
        var x=s.logical_pos.x;
        var y=s.logical_pos.y;
        
        that.move_player(new truffle.vec3(x,y,0),function(){});
        
        //if (px==9) { that.player.tile.x+=2; that.update_tile() }
        //if (py==9) { that.player.tile.y+=2; that.update_tile() }
        
    });
}


game.prototype.setup_tile=function(s) {
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
}

///////////////////////////////////////////////////////////////////////////////

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

game.prototype.calc_route=function(from,to) {
    var dir_x=to.x-from.x;
    var dir_y=to.y-from.y;
    if (dir_x>0) dir_x=1;
    else dir_x=-1;
    if (dir_y>0) dir_y=1;
    else dir_y=-1;

    var pos_x=from.x;
    var pos_y=from.y;
    var route=[];

    var first=true;
    var safe=100;

    var from_heading_x="e";
    var from_heading_y="s";
    var to_heading_x="w";
    var to_heading_y="n";


    if (dir_x>0) {
        from_heading_x="w";
        to_heading_x="e";
    }
    if (dir_y>0) {
        from_heading_y="n";
        to_heading_y="s";
    }

    if (Math.random()<0.5) {
        var tex="m"+to_heading_x;

        while (safe>0 && pos_x!=to.x) {
            route.push({"pos":new truffle.vec2(pos_x,from.y),
                        "tex":tex});
            tex=from_heading_x+to_heading_x;
            pos_x+=dir_x;
            safe--;
        }
        
        tex=from_heading_x+to_heading_y;
        
        while (safe>0 && pos_y!=to.y) {
            route.push({"pos":new truffle.vec2(to.x,pos_y),
                        "tex":tex});
            tex=from_heading_y+to_heading_y;
            pos_y+=dir_y;
            safe--;
        }

        route.push({"pos":new truffle.vec2(to.x,to.y),
                    "tex":from_heading_y+"m"});

    } else {
        var tex="m"+to_heading_y;
                
        while (safe>0 && pos_y!=to.y) {
            route.push({"pos":new truffle.vec2(from.x,pos_y),
                        "tex":tex});
            tex=from_heading_y+to_heading_y;
            //        log(""+to.x+" "+pos_y+" "+tex);
            pos_y+=dir_y;
            safe--;
        }

        tex=from_heading_y+to_heading_x;

        while (safe>0 && pos_x!=to.x) {
            route.push({"pos":new truffle.vec2(pos_x,to.y),
                        "tex":tex});
            tex=from_heading_x+to_heading_x;
            //        log(""+pos_x+" "+from.y+" "+tex);
            pos_x+=dir_x;
            safe--;
        }
        route.push({"pos":new truffle.vec2(to.x,to.y),
                    "tex":from_heading_x+"m"});

    }


    return route;
}

game.prototype.make_mycorrhiza=function(from,to) {
    var route=this.calc_route(from,to);
    var that=this;

    route.forEach(function(r) {
        if (r.pos.x>=0 && r.pos.x<15 &&
            r.pos.y>=0 && r.pos.y<15) {
            var tile=that.map.find_tile_entity(r.pos.x,r.pos.y);
            tile.entity.spr.composite("images/mycorrhiza-"+r.tex+".png","src-over");
        }
    });
}


game.prototype.attempt_grow=function(e,tilepos){
    var that=this;
    if (e.resize_timer<that.world.time) {
        if (e.state=="grow-a-ready" ||
            e.state=="grow-b-ready" ||
            e.state=="grow-c-ready" ||
            e.state=="grow-d-ready" ||
            e.state=="spore-ready") {
            this.server.call("grow",[tilepos.x,
                                     tilepos.y,
                                     e.id,
                                     this.player.id,
                                     0]);
        } else {
            e.resize_timer=this.world.time+0.5;
            e.spr.scale(new truffle.vec2(1.2,1.2));
            e.needs_update=true;
            e.every_frame=function() {
                if (e.resize_timer<that.world.time) {
                    e.spr.clear_transform();
                    e.every_frame=null;
                    e.needs_update=false;
                }
            };
        }
    }
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
            this.avatar.speed=1;
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

            // move the camera to focus on the player
            var cam=g.world.screen_transform(new truffle.vec3(gamepos.x,gamepos.y,0));
            this.world.move_world_to(cam.x,cam.y);
        }
        else
        {
            var e=new truffle.sprite_entity(
                this.world,
                new truffle.vec3(gamepos.x,gamepos.y,0),
                this.entity_texture(entity));
            e.id=entity.id;
            e.game_type=entity["entity-type"];
            e.needs_update=false;
            e.speed=1;
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
        e.game_type=entity["entity-type"];
        e.powering=0;
        e.resize_timer=0;
        //e.spr.draw_bb=true;

/*
        if (entity.state=="grow-a-ready") {
            this.spawn_particles("images/particle.png",
                                 gamepos.x,
                                 gamepos.y,
                                 -1);
        }
*/
        e.spr.mouse_down(function() {
            // if the avatar is in the same place, try immediately
            if (e.logical_pos.eq(that.avatar.logical_pos)) {
                that.attempt_grow(e,tilepos);
                
            } else {
                // move the player to the right place
                that.move_player(new truffle.vec3(e.logical_pos.x,
                                                  e.logical_pos.y,0),
                                 function () { 
                                     that.attempt_grow(e,tilepos); 
                                 });
            }
        });
        
        e.spr.mouse_over(function() {
            if (e.resize_timer<that.world.time) {
                if (e.state=="grow-a-ready" || e.state=="grow-b-ready" ||
                    e.state=="grow-c-ready" || e.state=="spore-ready") {
                    e.needs_update=true;
                    e.every_frame=function() {
                        e.spr.rotate(Math.sin(that.world.time*50)/80);
                    }
                }
            }
        });

        e.spr.mouse_out(function() {
            if (e.resize_timer<that.world.time) {
                e.needs_update=false;
            }
        });

        this.entities.push(e);
    }
    else if (entity["entity-type"]=="ushahidi") {
        var e=new truffle.sprite_entity(
            this.world,
            new truffle.vec3(gamepos.x,gamepos.y,0),
            "images/boskoi-"+entity.layer+".png")
        //e.id=entity.id;
        e.id=entity.id;
        e.game_type=entity["entity-type"];
        e.layer=entity.layer;
        e.neighbours=entity.power;

        if (e.neighbours==0) {
            e.power_state="low";
            e.spr.change_bitmap("images/boskoi-"+e.layer+"-c4"+".png");
        } else if (entity.neighbours>0 && entity.neighbours<=4) {
            e.power_state="med"; 
            e.spr.change_bitmap("images/boskoi-"+e.layer+"-c1"+".png");
        } else if (entity.neighbours>4) {
            e.spr.change_bitmap("images/boskoi-"+e.layer+".png");
            e.power_state="high";
        }    

        var t=new truffle.textbox(new truffle.vec2(0,-200),
                                  entity.incident.incidentdescription,//+" "+
                                  //entity.incident.locationname+" "+
                                  //entity.incident.incidentdate,
                                  200,300,"25pt MaidenOrange");
        t.text_height=25;
        e.add_child(this.world,t);
        this.entities.push(e);
    }
}

game.prototype.spawn_particles=function(img,x,y,z) {
    if (this.time_since_last_ps>2) {
        // particle system will delete itself when done
        var p=new truffle.particles_entity(
            this.world,
            new truffle.vec3(x,y,z),
            img, 10, "one-shot");
        this.time_since_last_ps=0;
    }
}

game.prototype.start_ripple=function(x,y,z) {
    var that=this; // lexical scope in js annoyance

    var effect=new truffle.sprite_entity(
        this.world,
        new truffle.vec3(x,y,z),
        "images/grow.png");

    var len=1; // in seconds

    effect.spr.do_centre_middle_bottom=false;
    effect.finished_time=this.world.time+len;
    effect.needs_update=true; // will be updated every frame
    effect.spr.expand_bb=50; // expand the bbox as we're scaling up
    effect.spr.scale(new truffle.vec2(0.5,0.5)); // start small

    effect.every_frame=function() { 
        // fade out with time
        var a=(effect.finished_time-that.world.time);
        if (a>0) effect.spr.alpha=a; 
   
        // scale up with time
        var sc=1+that.world.delta*2; 
        effect.spr.scale(new truffle.vec2(sc,sc));

        // delete ourselves when done
        if (effect.finished_time<that.world.time) {
            effect.delete_me=true;
        }
    };
}

game.prototype.update_entity=function(entity,from_server,tile) {
    var that=this;
    if (from_server["entity-type"]=="plant") {
        
        // update the mycorrhiza
        if (entity.powering<from_server.powering.length) {
            from_server.powering.forEach(function(powering) {

                that.make_mycorrhiza(
                    entity.logical_pos,
                    that.server_to_client_coords(powering.tile.x,
                                                 powering.tile.y,
                                                 powering.pos.x,
                                                 powering.pos.y));

                that.spawn_particles("images/powering.png",
                                     entity.logical_pos.x,
                                     entity.logical_pos.y,
                                     1);

                entity.powering++;

                // update to the powered texture
                entity.spr.change_bitmap(that.entity_texture(from_server));

            });
        }

        // if the state has changed
        if (from_server.state!=entity.state) {
            entity.state=from_server.state;
//            entity.spr.clear_transform(); // in case of failed grow effect
            entity.spr.change_bitmap(this.entity_texture(from_server));
            entity.needs_update=false; // turn off shaking


/*            if (entity.state=="grow-ready-a" || 
                entity.state=="grow-ready-b" ||
                entity.state=="grow-ready-c" || 
                entity.state=="grow-ready-d") {
                entity.spr.enable_mouse(true);
            }
*/                
            // if we have just grown, spawn a particle system
            if (entity.state=="grow-a" || 
                entity.state=="grow-b" ||
                entity.state=="grow-c" || 
                entity.state=="grow-d") {

//                entity.spr.enable_mouse(false);

                this.start_ripple(entity.logical_pos.x,
                                  entity.logical_pos.y,
                                  -0.25);
            }
            
            if (entity.state=="spore") {
                this.spawn_particles("images/spawning.png",
                                     entity.logical_pos.x,
                                     entity.logical_pos.y,
                                     -1);
            }
        }
    }
    if (from_server["entity-type"]=="avatar") {
       // log(JSON.stringify(from_server));
        var pos=this.server_to_client_coords(
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
   //         entity.update(this.world,0);
        }

        if (entity.chat_active &&
            this.world.time>entity.chat_time+10) {
            entity.chat_text.set_text("");
            entity.chat_active=false;
        }

    }

    if (from_server["entity-type"]=="ushahidi") {
        entity.neighbours=from_server.power;

        if (entity.neighbours==0) {
            entity.power_state="low";
            entity.spr.change_bitmap("images/boskoi-"+entity.layer+"-c4"+".png");
        } else if (entity.neighbours>0 && entity.neighbours<=4) {
            entity.power_state="med"; 
            entity.spr.change_bitmap("images/boskoi-"+entity.layer+"-c1"+".png");
        } else if (entity.neighbours>4) {
            entity.spr.change_bitmap("images/boskoi-"+entity.layer+".png");
            entity.power_state="high";
        }    
    }
}

game.prototype.move_player=function(to,on_reached_dest) {
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
    
    that.avatar.speed=1;
    that.avatar.move_to(that.world,new truffle.vec3(px,sy,0));
    that.avatar.on_reached_dest=function() {
        if (sy!=py) {
            if (sy<py) that.avatar.spr.change_bitmap('images/'+that.player["avatar-type"]+'-south.png');
            else that.avatar.spr.change_bitmap('images/'+that.player["avatar-type"]+'-north.png');
        }
        that.avatar.move_to(that.world,new truffle.vec3(px,py,0));
        
        that.avatar.on_reached_dest=function() {
            that.world.redraw();

            on_reached_dest();

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
        var power="";
        if (entity.powering.length>0) power="power-";
        if (entity.type=="knobbly")
            return "images/knobbly-"+power+this.state_to_texture(entity.state)+".png";
        else if (entity.type=="bobbly")
            return "images/bobbly-"+power+this.state_to_texture(entity.state)+".png";
        else
            return "images/pointy-"+power+this.state_to_texture(entity.state)+".png";
    }
    if (entity["entity-type"]=="avatar") {
        return "images/"+entity["avatar-type"]+"-west.png";
    }
    return "none";
}

game.prototype.state_to_texture=function(state) {
    if (state=="grow-a" || state=="grow-a-ready" || state=="decayed") return "a";
    if (state=="grow-b" || state=="grow-b-ready") return "b";
    if (state=="grow-c" || state=="grow-c-ready") return "c";
    if (state=="grow-d" || state=="grow-d-ready" || 
        state=="spore" || state=="spore-ready") return "d";
    if (state=="decay-a") return "d";
    if (state=="decay-b") return "c";
    if (state=="decay-c") return "b";
    if (state=="decay-d") return "a";
    else log("unmatched state:"+state);
}

game.prototype.shift_entities=function(x,y) {
    

}

//////////////////////////////////////////////////////////////////////////

game.prototype.update_zizim=function() {
    var that=this;
    var zizim=[];

    this.entities.forEach(function(entity) {
        if (entity.game_type=="ushahidi" &&
            entity.power_state!="high") {
            zizim.push(entity);
        }
    });

    if (zizim.length>0) {
        // pick a random one
        var z=truffle.choose(zizim);
        z.fizzing_stop=this.world.time+2;
        z.needs_update=true;
        z.every_frame=function() {
            
            if (z.power_state=="low") {
                if (Math.random()>0.5) {
                    z.spr.change_bitmap("images/boskoi-"+z.layer+"-c"+
                                        Math.floor(Math.random()*3+1)+".png");
                } else {
                    z.spr.change_bitmap("images/empty.png");
                }
            } else { 
                if (z.power_state="med") {
                    z.spr.change_bitmap("images/boskoi-"+z.layer+"-c"+
                                        Math.floor(Math.random()*3+1)+".png");
                }
            }
            
            if (z.fizzing_stop<that.world.time) {
                if (z.power_state=="low") {
                    z.spr.change_bitmap("images/boskoi-"+z.layer+"-c4.png");
                } else if (z.power_state=="med") {
                    z.spr.change_bitmap("images/boskoi-"+z.layer+"-c2.png");
                }
                z.every_frame=null;
                z.needs_update=false;
            }
        };
    }
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
            "Fungi has reached "+d+" km from Vooruit, created by "+dist.player+"</br>"+
            "You have grown "+data.player["plant-count"]+" helpful fungi, helping "+data.player["has-picked"].length+" earth plants";

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

game.prototype.server_to_client_coords=function(tx,ty,px,py) {
    var wtx=this.player.tile.x;
    var wty=this.player.tile.y;
    return new truffle.vec2(((tx-wtx)+1)*5+px,
                            ((ty-wty)+1)*5+py);
}

////////////////////////////////////////////////////////////////////////////


game.prototype.update=function(time,delta) {

    // render some frame to make sure! :(
    if (this.map_update_frame_count>5) {
        this.updating_text.hide(true);
        this.map_update_frame_count=0;
        this.world.do_render=true;
        this.avatar.hide(false);
        var cam=this.world.screen_transform(this.avatar.logical_pos);
        this.world.move_world_to(cam.x,cam.y);
        this.world.redraw();
    }

    if (this.map_update_frame_count>0) {
        this.map_update_frame_count++;
    }

    if (this.next_pull_time<time)
    {
        this.update_tile();
        this.next_pull_time=time+1;
    }

    if (this.check_zizim_time<time)
    {
        this.update_zizim();        
        this.check_zizim_time=time+5;
    }

    this.time_since_last_ps+=delta;
}

////////////////////////////////////////////////////////////////////////////

// state machine please...

var game_html='<canvas id="canvas" width="880" height="500"></canvas>\
<input \
     id="chat"\
     type="text"\
     name="chat" \
     style="font-family:patafont"\
     size="10"\
     onkeydown="if (event.keyCode==13) chat();"/>\
<input\
     type="button"\
     style="font-size:25"\
     value="Say something"\
     onclick="chat();" />\
<input\
     type="button"\
     style="font-size:25"\
     value="Help me"\
     onclick="help();"/><br/>\
<div id="fps"></div> <a href="http://git.fo.am/?p=borrowed-scenery;a=summary">source</a>';

var reading_html='\
<h1>Contacting patabotanists in your local parallel reality</h1>\
please be patient<br/>\
<progress value="0%" max="200">progress bar</progress>';

var reading_ready_html='\
<h1>Success! Patabotanist invoked</h1>\
<input\
     type="button"\
     style="font-size:50"\
     value="See who..."\
     onclick="reading_done();" /><br/>';

var characters={"magician":"Trismegisto Herbert Taraxi",
                "high-priestess":"Alchemilla Lily Umiliata",
                "hierophant":"Eleuz Ashton Querlano",
                "hermit":"Castuus Larch Absinthian"};

var tarot={"Trismegisto Herbert Taraxi":"organo-linguistic engineer Transdisciplinary craftsman, building machinery for cross-species (mis)communication. Master in hybrid techniques of esoteric magic and ritual science. Interests: systems and interface design, illusionism, biotechnology and shoemaking. Personality traits: willpower, virtuoso manual skills, trickster.",
           "Alchemilla Lily Umiliata":"principal patabotanist, investigator of non-human sentiences, atmosphere diffuser and wrangler of pataphors. Interests: atemporality, reconnecting with the vegetal mind, empirical divination. Personality traits: introverted, persevering, intuitive, otherworldly.",
           "Eleuz Ashton Querlano":"translator, medium and cross-species thalience linguist, in charge of channeling and communicating with non-human sentiences. Interests: linguistics, science fiction, the planetary Other, artificial intelligence, vegetal cognition. Personality traits: enlightened, irreverent, wise, pillar of the group, indulges in alcoholic beverages.",
	       "Castuus Larch Absinthian":"resident mystic One of the few people able to have a direct experience of Viriditas. Invokes Viriditas to open up communication channels between humans and plants. Interests: direct experience, introspection, alternative mind-states, collective consciousness, cognitive science, obscure literature. Personality traits: asocial, meditative, dissociated, wise old man."};

function reading_done_html(type) {
    return '\
<h1>Patabotanist invoked...</h1>\
<div class="tarot">\
Your avatar is: '+characters[type]+'<br/>\
<img src="images/'+type+'-west.png"><br/>\
<p>'+characters[type]+", "+tarot[characters[type]]+'</p></div>\
<input\
     type="button"\
     style="font-size:50"\
     value="Start game"\
     onclick="enter_game();" /><br/>';
}

var g;
var player;
var server;

function help() {
    window.open("help.html", "Aniziz Help",
                "status = 1, height = 550, width = 475, resizable = 0" );
}

function login_form() {
    var name=document.getElementById('player_name').value;
    if (name!="" && name!="What are you called?") {
        var element=document.getElementById("input_form");
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        connect_and_login(name);
    }
    else
    {
        alert("Type in your name...");
    }
}

function connect_and_login(name) {
    server=new truffle.server('ws://borrowed-scenery.org:8002/borrowed-scenery',
                              function () {
                                  server.call("login",[name,0,0]);
                              });
    server.listen("login", function(data) {
        player=data.player;
        log(player.name+" has logged in");
        do_reading(data.status);
    });
}

function do_reading(status) {
    // if we are a new player
    if (status=="registered") {
        document.getElementById('game-goes-here').innerHTML = reading_html;
        setTimeout(reading_ready,5000);
    } else {
        enter_game();
    }
}

function reading_ready() {
    document.getElementById('game-goes-here').innerHTML = reading_ready_html;
}

function reading_done() {
    document.getElementById('game-goes-here').innerHTML = reading_done_html(player["avatar-type"]);
}

function enter_game() {
    document.getElementById('game-goes-here').innerHTML = game_html;
    truffle.main.init(game_create,game_update);
}

function chat() {
    var text=document.getElementById('chat').value;
    g.chat(text);    
}

function game_create() {
    g=new game(truffle.main.world);
    g.server=server;
    g.logged_in=true;
    g.tile_change=true;
    g.player=player;
}

function game_update(time,delta) {
    g.update(time,delta);
}
