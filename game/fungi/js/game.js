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
    this.connect_and_login("dave");
    this.entities=[];
    this.next_pull_time=0;
    this.player=null;
    this.tile_change=false;
    this.loading_spr=null;
    this.particle_systems_this_frame=0;
    this.max_particle_systems_per_frame=1;

    //centre=new truffle.vec2(51.05057,3.72729); // becomes 0,0 in world tile space
    centre=new truffle.vec2(51.04672,3.73121); // becomes 0,0 in world tile space
    zoom=17;
    var that=this;

    // make the avatar
    this.avatar = new truffle.sprite_entity(
        that.world,
        new truffle.vec3(5,5,0),
        'images/magician-south.png');
    this.avatar.needs_update=true;
    this.avatar.speed=0.025;

/*    this.pstest = new truffle.particles_entity(
        world,
        new truffle.vec3(2,2,-1),
        "images/particle.png",
        20,"continuous");
    this.pstest.needs_update=true;
*/
    var camera_pos=world.screen_transform(new truffle.vec3(5,5,1));
    world.canvas_state.snap_world_to(camera_pos.x,camera_pos.y);

    this.map=new map(centre,zoom);
    this.map.do_create_tile=function(world_x,world_y,sub_image) {
        var s=new truffle.sprite_entity(
            that.world,
            new truffle.vec3(world_x+sub_image[0],
                             world_y+sub_image[1],0),
            "images/empty_map.png");
        

        //s.spr.draw_bb=true;
        s.spr.set_bitmap(sub_image[2]); 
        s.depth_offset=100;
        // crudely set the iso projection
        var t=new truffle.mat23();
        t.translate(40,0);
        t.scale(1.65,0.42*1.65);
        t.rotate(31*Math.PI/180);
        t.scale(1,1.2);
        t.translate(-10,-10);
        t.rotate(270*Math.PI/180);

        s.spr.parent_transform=t;
        s.spr.expand_bb=20; // enable larger clipping region
        s.spr.do_transform=true;

        s.spr.mouse_down(function() {
            
            var sx=that.avatar.logical_pos.x;
            var sy=that.avatar.logical_pos.y;
            var px=s.logical_pos.x;
            var py=s.logical_pos.y;
            var tcx=0;
            var tcy=0;

            //if (px==9) { that.player.tile.x+=2; that.update_tile() }
            //if (py==9) { that.player.tile.y+=2; that.update_tile() }

            var cam=world.screen_transform(new truffle.vec3(px,py,0));
            world.move_world_to(cam.x,cam.y);
            
            if (sx!=px) {
                if (sx<px) that.avatar.spr.change_bitmap('images/magician-east.png');
                else that.avatar.spr.change_bitmap('images/magician-west.png');
            }
            
            that.avatar.speed=0.025;
            that.avatar.move_to(that.world,new truffle.vec3(px,sy,0));
            that.avatar.on_reached_dest=function() {
                if (sy!=py) {
                    if (sy<py) that.avatar.spr.change_bitmap('images/magician-south.png');
                    else that.avatar.spr.change_bitmap('images/magician-north.png');
                }
                that.avatar.move_to(that.world,new truffle.vec3(px,py,0));
                
                that.avatar.on_reached_dest=function() {
                    world.redraw();
                    
                    if (px>12) { 
                        that.player.tile.x+=1;
                        that.tile_change=true;
                        tcx=-5;
                    }
                    if (px<2) { 
                        that.player.tile.x-=1;
                        that.tile_change=true;
                        tcx=5;
                    }  
                    if (py>12) { 
                        that.player.tile.y+=1;
                        that.tile_change=true;
                        tcy=-5;
                    }  
                    if (py<2) { 
                        that.player.tile.y-=1;
                        that.tile_change=true;
                        tcy=5;
                    }  

                    if (that.tile_change) {
                        that.avatar.speed=0;
                        that.avatar.move_to(that.world,new truffle.vec3(px+tcx,py+tcy,0));
                    }
                    
                };
            };
        });
        return s;        
    }
    
    this.map.do_update_tile=function(world_x,world_y,sub_image,entity) {
        entity.spr.set_bitmap(sub_image[2],true); 
    }
}

///////////////////////////////////////////////////////////////////////////////

game.prototype.connect_and_login=function(name) {
    var that=this;
    this.server=new truffle.server('ws://be.fo.am:8002/borrowed-scenery',
                                   function () {
                                       that.server.call("login",["dave",0,0]);
                                   });
    this.server.listen("login", function(player) {
        that.player=player;
        that.player.tile.x=-1;
        that.player.tile.y=0;
        that.update_tile()
    });
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

game.prototype.update_entity=function(entity,from_server) {
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
                        20, "one-shot");
                    this.particle_systems_this_frame++;
                }
            }
        }
    }
}

game.prototype.entity_texture=function(entity) {
    if (entity.type=="knobbly")
    return "images/knobbly-"+this.state_to_texture(entity.state)+".png";
    else
    return "images/pointy-"+this.state_to_texture(entity.state)+".png";
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

    if (entity["entity-type"]=="plant") {
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


/*        e.needs_update=true;
        e.update_freq=Math.floor(40+Math.random()*15);
        e.every_frame=function() {
            if (e.state=="grow-a-ready" || e.state=="grow-b-ready" ||
                e.state=="grow-c-ready" || e.state=="spore-ready")
                e.spr.set_rotate((Math.random()-0.5)*0.05);
        };*/
        
        this.entities.push(e);
    }
    else if (entity["entity-type"]=="ushahidi") {

        log("making boskoi plant at "+gamepos.x+" "+gamepos.y);
//        log(JSON.stringify(entity));

        var e=new truffle.sprite_entity(
            this.world,
            new truffle.vec3(gamepos.x,gamepos.y,0),
            "images/boskoi-"+entity.layer+".png")
        e.id=entity.id;
//        e.spr.draw_bb=true;

        var t=new truffle.textbox(new truffle.vec2(-100,-200),
                                  entity.incident.incidentdescription+" "+
                                  entity.incident.locationname+" "+
                                  entity.incident.incidentdate,
                                  300,300,"15pt patafont");
        t.text_height=25;
        e.add_child(this.world,t);

        this.entities.push(e);
    }
}

game.prototype.shift_entities=function(x,y) {
    

}

//////////////////////////////////////////////////////////////////////////

game.prototype.update_tile=function() {
    var that=this;
    if (!this.player) return;

    this.map.update(this.player.tile,function() {
        //that.loading_spr=new truffle.sprite(
        //    new truffle.vec2(100,100),
       //     "images/bbot-east.png");
       // that.world.add_sprite(that.loading_spr);
        //that.world.redraw();
    }, function() {
        //that.world.remove_sprite(that.loading_spr);
        //that.loading_spr=null;
        //that.world.redraw();
    });

    if (this.tile_change) {
        this.clear_entities();
        this.tile_change=false;
    }

    this.server.call("pull",[this.player.id,
                             this.player.tile.x,
                             this.player.tile.y,0]);

    this.server.listen("pull", function(data) {
        //alert(data.tiles.length);
        data.tiles.forEach(function(tile) {
            var tilepos=tile.pos;
            tile.entities.forEach(function(entity) {
                var gamepos=that.server_to_client_coords(
                    that.player.tile.x,
                    that.player.tile.y,
                    tilepos.x,tilepos.y,
                    entity.pos.x,entity.pos.y);
                
                var existing=that.find_entity(entity.id);
                if (existing) that.update_entity(existing,entity);
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

    if (this.next_pull_time<time)
    {
        this.update_tile();
        this.next_pull_time=time+1000;
    }
}

////////////////////////////////////////////////////////////////////////////


var g;

function game_create() {
    g=new game(truffle.main.world);
}

function game_update() {
    g.update();
}