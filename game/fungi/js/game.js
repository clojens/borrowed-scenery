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
    this.build(world);
    this.entities=[];
    this.cubes=[];
    this.next_pull_time=0;
    this.player=null;

    var that=this;

    this.map=new map([51.05057,3.72729],17,-1,2,function(world_x,world_y,sub_image) {
        var s=new truffle.sprite_entity(
            that.world,
            new truffle.vec3(world_x+(4-sub_image[1]),
                             world_y+sub_image[0],0),"");
        
        s.spr.set_bitmap(sub_image[2]); 
        // crudely set the iso projection
        var t=new truffle.mat23();
        t.translate(25,30);
        t.scale(1.35,0.42*1.35);
        t.rotate(31*Math.PI/180);
        t.scale(1,1.2);
        t.translate(-10,-10);
        s.spr.parent_transform=t;
        s.spr.expand_bb=1; // enable larger clipping region
        s.spr.do_transform=true;

        s.spr.mouse_down(function() {

            var sx=that.avatar.logical_pos.x;
            var sy=that.avatar.logical_pos.y;
            var px=s.logical_pos.x;
            var py=s.logical_pos.y;
            
            //if (px==0) { that.player.tile.x-=2; that.update_tile() }
            //if (py==0) { that.player.tile.y-=2; that.update_tile() }
            //if (px==9) { that.player.tile.x+=2; that.update_tile() }
            //if (py==9) { that.player.tile.y+=2; that.update_tile() }

                  
            if (sx!=px) {
                if (sx<px) that.avatar.spr.change_bitmap('images/magician-east.png');
                else that.avatar.spr.change_bitmap('images/magician-west.png');
            }

            that.avatar.set_logical_pos(that.world,new truffle.vec3(px,sy,0));
            that.avatar.on_reached_dest=function() {
                if (sy!=py) {
                    if (sy<py) that.avatar.spr.change_bitmap('images/magician-south.png');
                    else that.avatar.spr.change_bitmap('images/magician-north.png');
                }
                that.avatar.set_logical_pos(that.world,new truffle.vec3(px,py,0));
            };

        });

        that.cubes.push(s);
    });
        
/*
        cubes.forEach(function(cube) {
        });
    }); 
*/

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
        that.update_tile()
    });
}

///////////////////////////////////////////////////////////////////////////////

game.prototype.build=function() {
    var that=this;

    // make the avatar
    this.avatar = new truffle.sprite_entity(
        that.world,
        new truffle.vec3(5,5,1),
        'images/magician-south.png');
    this.avatar.needs_update=true;
    this.avatar.speed=0.025;

    // make the cubes
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
    if (from_server.state!=entity.state)
    {
        entity.state=from_server.state;
        entity.spr.change_bitmap(this.entity_texture(from_server));
    }
}

game.prototype.entity_texture=function(entity) {
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
    if (entity["entity-type"]=="plant") {
        var e=new truffle.sprite_entity(
            this.world,
            new truffle.vec3(gamepos[0],gamepos[1],2),
            //                    'images/pointy-grow-a'
            this.entity_texture(entity))
        //e.spr.depth_offset=-100;
        e.state=entity.state;
        e.id=entity.id;
//        e.spr.draw_bb=true;

        e.spr.mouse_down(function() {
            that.avatar.set_logical_pos(that.world,new truffle.vec3(e.logical_pos.x,
                                                                    e.logical_pos.y,0));
            that.avatar.on_reached_dest=function(){
                that.server.call("grow",[tilepos.x,
                                         tilepos.y,
                                         entity.id,
                                         that.player.id,
                                         0]);
            };
        });

        e.needs_update=true;
        e.update_freq=Math.floor(10+Math.random()*5);
        e.every_frame=function() {
            if (e.state=="grow-a-ready" || e.state=="grow-b-ready" ||
                e.state=="grow-c-ready" || e.state=="spore-ready")
                e.spr.set_rotate((Math.random()-0.5)*0.05);
        };
        
        this.entities.push(e);
    }
}


//////////////////////////////////////////////////////////////////////////

game.prototype.update_tile=function(tile_x, tile_y) {
    if (!this.player) return;

    var that=this;
    this.server.call("pull",[this.player.id,
                             this.player.tile.x,
                             this.player.tile.y,0]);


    this.server.listen("pull", function(data) {
        data.tiles.forEach(function(tile) {
            var tilepos=tile.pos;
            tile.entities.forEach(function(entity) {
                var gamepos=that.server_to_client_coords(0,0,
                                                         tilepos.x,tilepos.y,
                                                         entity.pos.x,entity.pos.y);
                
                var existing=that.find_entity(entity.id);
                if (existing) that.update_entity(existing,entity);
                else that.make_new_entity(gamepos,tilepos,entity);
            });
        });
    });
}

/////////////////////////////////////////////////////////////////////////////

game.prototype.server_to_client_coords=function(wtx,wty,tx,ty,px,py) {
    return [((tx-wtx)+1)*5+px,
            ((ty-wty)+1)*5+py];
    
}

////////////////////////////////////////////////////////////////////////////

game.prototype.update=function() {
    var time=(new Date).getTime();
    if (this.next_pull_time<time)
    {
        this.update_tile(0,0);
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