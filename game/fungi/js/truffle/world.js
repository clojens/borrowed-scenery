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

truffle.world=function() {
    this.clear();
}

truffle.world.prototype.clear=function() {
    this.scene=[];
    this.sprites=[];
    this.current_depth=1000;
    this.current_id=0;
    this.canvas_state=new truffle.canvas_state();
    this.current_tile_pos=new truffle.vec2(0,0); // perhaps
    this.screen_scale=new truffle.vec2(1,1);
    this.screen_centre=new truffle.vec2(-500,400);
//    this.screen_offset=new truffle.vec2(this.screen_centre.x,
//                                        this.screen_centre.y);
    this.screen_offset=new truffle.vec2(0,0);
    this.debug_text="hello world\n";

    // iso rotation values
    this.theta = 66*Math.PI/180;
    this.alpha = 59*Math.PI/180;

    this.cos_theta = Math.cos(this.theta);
    this.sin_theta = Math.sin(this.theta);
    this.cos_alpha = Math.cos(this.alpha);
    this.sin_alpha = Math.sin(this.alpha);
    this.scale = new truffle.vec3(103,84,80);

    var canvas=document.getElementById('canvas')
    var ctx=canvas.getContext('2d');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,canvas.width,canvas.height);
}

truffle.world.prototype.screenspace_transform=function(pos) {
    var ox=pos.x*this.scale.x;
    var oy=pos.y*this.scale.y;
    var oz=pos.z*this.scale.z;
    
    var zp=oz;
    var xp=ox*this.cos_alpha+oy*this.sin_alpha;
    var yp=oy*this.cos_alpha-ox*this.sin_alpha;
    
    var r= new truffle.vec3(
        xp,
        yp*this.cos_theta+zp*this.sin_theta,
        zp*this.cos_theta-yp*this.sin_theta
    );
    return r; 
}

truffle.world.prototype.screen_transform=function(pos) {
    var r=this.screenspace_transform(pos);
    r.x+=this.screen_offset.x;
    r.y+=this.screen_offset.y;
    return r;
}

truffle.world.prototype.inverse_screen_transform=function(pos) {
    var ox=pos.x-this.screen_offset.x;
    var oy=pos.y-this.screen_offset.y;
    var xp=ox/this.cos_alpha+oy/this.sin_alpha;
    var yp=oy/this.cos_alpha-ox/this.sin_alpha;
    var r= new truffle.vec2(xp,yp/this.cos_theta);
    r.x/=this.scale.x;
    r.y/=this.scale.y;
    return r;
}

truffle.world.prototype.add=function(e) {
    this.scene.push(e);
}

truffle.world.prototype.remove=function(e) {
    e.destroy(this);
    remove(this.scene,e);
}

truffle.world.prototype.get=function(type, pos) {
    this.scene.forEach(function(e) {
        if (pos.x==e.logical_pos.x &&
            pos.y==e.logical_pos.y &&
            typeof e==type)
        {
            return e;
        }
    });
    return null;
}

truffle.world.prototype.get_other=function(me, type, pos) {
    this.scene.forEach(function (e) {
        if (pos.x==e.logical_pos.x &&
            pos.y==e.logical_pos.y &&
            typeof e==type &&
            e.id!=me.id)
        {
            return e;
        }
    });
    return null;
}

truffle.world.prototype.set_current_tile_pos=function(s) {
    this.current_tile_pos=s;
}

truffle.world.prototype.set_scale=function(amount) {
    this.screen_scale=amount;
    this.scene.forEach(function (e) {
        e.get_root().set_scale(amount);
        e.update(0,this);
    });
}

truffle.world.prototype.set_translate=function(amount) {
    this.screen_offset=amount;
    this.scene.forEach(function (e) {
        e.set_logical_pos(this,e.logical_pos);
        e.update(0,this);
    });
}

// override for things on top
truffle.world.prototype.post_sort_scene=function(depth) {
}

truffle.world.prototype.sort_scene=function() {        
    this.scene.sort(function(a, b) {                       
        if (a.get_depth()<b.get_depth()) return -1;
        else return 1;
    });
    var i=0;
    this.scene.forEach(function (e) {
        i=e.on_sort_scene(this,i);
    });
    
    this.post_sort_scene(i);
}

truffle.world.prototype.add_sprite=function(s) {
    s.set_depth(this.current_depth++); // hack to emulate flash draw order
    s.set_id(this.current_id++);
    this.sprites.push(s);
}

truffle.world.prototype.remove_sprite=function(s){
    remove(this.sprites,s);
}

truffle.world.prototype.set_child_index=function(sprite,depth) {
    sprite.set_depth(depth);
}

truffle.world.prototype.mouse_down=function(f) {
}

truffle.world.prototype.mouse_up=function(f) {
}

truffle.world.prototype.mouse_move=function(f) {
}

truffle.world.prototype.add_to_draw_list=function(spr,bbox,draw_list) {
    draw_list.forEach(function(d) {
        if (spr.get_id()==d.spr.get_id()) {
            d.bbox.push(bbox);
            return draw_list;
        }
    });

    draw_list.push({spr:spr,bbox:[bbox]});
    return draw_list;
}

truffle.world.prototype.debug=function(txt) {
    this.debug_text+=txt+"\n";

    var canvas=document.getElementById('canvas')
    var ctx=canvas.getContext('2d');

    ctx.fillText(this.debug_text, 10, 10, 100);
}

truffle.world.prototype.update=function(time) {
    var that=this;
    this.sort_scene();

    this.scene.forEach(function(e) {
        if (e.tile_pos!=null)
        {
            // the current tile pos is surrounded by 8 other
            // visible ones, so see if we are in one of those
            var diff=e.tile_pos.sub(that.current_tile_pos);
            e.hide(Math.abs(diff.x)>1 || Math.abs(diff.y)>1);
        }

        if (e.needs_update && !e.hidden &&
            (e.update_freq==0 ||
             (time % e.update_freq)==0))
        {
            e.update(time,that);
        }
    });

    // draw the sprites
    this.sprites.sort(function(a, b) {                       
        if (a.get_depth()>b.get_depth()) return -1;
        else return 1;
    });

    var draw_list=[];

    // do check for overlapping sprites
    this.sprites.forEach(function(sprite) {
        // if this sprite needs redrawing
        if (!sprite.hidden &&
            sprite.ready_to_draw &&
            sprite.draw_me) {
            var bbox=sprite.get_last_bbox();

            // look through the other sprites
            that.sprites.forEach(function(other) {
                // if the other is visible
                // and we intersect it
                if (!other.hidden &&
                    other.ready_to_draw &&
                    other!=sprite &&
                    other.intersect(bbox)) {
                    // redraw other
                    draw_list=that.add_to_draw_list(other,bbox,draw_list);
                }

                // add other now - attempt to maintain the order
                if (other==sprite) {
                    draw_list=that.add_to_draw_list(other,bbox,draw_list);
                }
            });
        }
    });

    this.canvas_state.begin_scene();
    
    draw_list.forEach(function(d) {
        that.canvas_state.clear_rects(d.bbox);
    });

    // force the order to be the same
//    this.sprites.forEach(function(s) {
        draw_list.forEach(function(d) {
        //    if (s.get_id()==d.spr.get_id()) {
                that.canvas_state.set_clip(d.bbox);
                d.spr.draw(that.canvas_state.ctx);
                that.canvas_state.unclip();
         //   }
        });
  //  });

//    this.canvas_state.stats(draw_list.length/this.sprites.length);
    this.canvas_state.end_scene();
    this.update_input();
}

truffle.world.prototype.redraw=function() {
    var that=this;

    this.canvas_state.clear_screen();

    // sort the sprites
    this.sprites.sort(function(a, b) {                       
        if (a.get_depth()>b.get_depth()) return -1;
        else return 1;
    });

    this.canvas_state.begin_scene();

    this.sprites.forEach(function(s) {
        s.draw_me=true;
        s.draw(that.canvas_state.ctx);
    });
    
    this.canvas_state.end_scene();
}

truffle.world.prototype.move_world_to=function(x,y) {
    this.canvas_state.move_world_to(x,y);
}

truffle.world.prototype.update_input=function() {
    // update input (runs sprite closures)
    var found_sprite=false;
    // reverse order so topmost are checked first
    for (var n=0; n<this.sprites.length; n++)
    {
        var i=this.sprites.length-n;
        i--;
        if (!found_sprite && this.sprites[i].is_mouse_enabled())
        {
            found_sprite=this.sprites[i].update_mouse(this.canvas_state);
        }
    }
    
    this.canvas_state.update();
}

