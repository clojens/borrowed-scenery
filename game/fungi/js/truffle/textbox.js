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

truffle.textbox=function(pos, text, w, h, font) {	
    truffle.drawable.call(this);

    this.font = font;
    this.pos = pos;
    this.depth = -1;
    this.draw_me = true;
    this.transform = new truffle.mat23();
    this.hide = false;
    this.width = w;
    this.height = h;
    this.centre = new truffle.vec2(0,0);
    this.colour = null;
    this.draw_bb = false;
    this.text_height = 20;

    this.enable_mouse(false);
    this.is_mouseover=false;
    this.mousedown_func=null;
    this.mouseup_func=null;
    this.mouseover_func=null;
    this.mouseout_func=null;
    
    this.parent_transform=null;
    this.last_pos=new truffle.vec2(this.pos.x,this.pos.y);
    this.set_pos(pos);
    this.set_text(text);
    this.complex_transform=false;
}

truffle.textbox.prototype.get_id=function() {
    return this.id;
}

truffle.textbox.prototype.set_id=function(s) {
    this.id=s;
}

truffle.textbox.prototype.hide=function(s) {
    this.draw_me=true;
    this.hidden=s;
}

truffle.textbox.prototype.get_depth=function() {
    return this.depth;
}

truffle.textbox.prototype.mouse_down=function(f) {
    this.enable_mouse(true);
    this.mousedown_func=f;
}

truffle.textbox.prototype.mouse_up=function(f) {
    this.enable_mouse(true);
    this.mouseup_func=f;
}

truffle.textbox.prototype.mouse_over=function(f) {
    this.enable_mouse(true);
    this.mouseover_func=f;
}

truffle.textbox.prototype.mouse_out=function(f) {
    this.enable_mouse(true);
    this.mouseout_func=f;
}

truffle.textbox.prototype.set_depth=function(s) {
    this.depth=s;
}
    
truffle.textbox.prototype.get_depth=function() {
    return this.depth;
}

truffle.textbox.prototype.set_size=function(x,y) {
    this.width=x;
    this.height=y;
    this.centre.x=this.width/2;
    this.centre.y=this.height/2;
}

truffle.textbox.prototype.enable_mouse=function(s) {
    this.mouse_enabled=s;
}

truffle.textbox.prototype.is_mouse_enabled=function() {
    return this.mouse_enabled;
}

truffle.textbox.prototype.set_pos=function(s) { this.transform.m[4]=s.x; this.transform.m[5]=s.y; this.pos=s; this.draw_me=true; }
truffle.textbox.prototype.set_scale=function(s) { this.transform.scale(s.x,s.y); this.complex_transform=true; this.draw_me=true; }
truffle.textbox.prototype.set_rotate=function(angle) { this.transform.rotate(angle); this.complex_transform=true; this.draw_me=true; }
truffle.textbox.prototype.get_tx=function() { return this.transform; }

truffle.textbox.prototype.set_colour=function(s) {
    this.colour=s;
}

truffle.textbox.prototype.get_colour=function() {
    return this.colour;
}

truffle.textbox.prototype.transformed_pos=function() {
    return this.transform.transform_point(0,0);
}

truffle.textbox.prototype.get_last_bbox=function() {
    var l=this.last_pos.x-this.centre.x;
    var t=this.last_pos.y-this.centre.y;
    return [l,t,l+this.width,t+this.height]; 
}

truffle.textbox.prototype.get_bbox=function() {
    var l=this.pos.x-this.centre.x;
    var t=this.pos.y-this.centre.y;
    return [l,t,l+this.width,t+this.height]; 
}

truffle.textbox.prototype.intersect=function(ob) {
    var tb=this.get_bbox();
    return !(ob[0] > tb[2] || ob[2] < tb[0] ||
             ob[1] > tb[3] || ob[3] < tb[1]);
}

truffle.textbox.prototype.update_mouse=function(canvas_state) {
    // assume check for mouseenabled is done already
    var x=canvas_state.mouse_x+this.centre.x;
    var y=canvas_state.mouse_y+this.centre.y;

    // todo - correct for transform
    if (x>this.pos.x && x<this.pos.x+this.width &&
        y>this.pos.y && y<this.pos.y+this.height) {
        if (!this.is_mouse_over) {
            if (this.mouseover_func!=null) this.mouseover_func();
            this.is_mouse_over=true;
            return true;
        }

        if (canvas_state.mouse_changed) {
            if (canvas_state.mouse_down) {
                if (this.mousedown_func!=null) this.mousedown_func();
                return true;
            }
            else {
                if (this.mouseup_func!=null) this.mouseup_func();
                return true;
            }
        }
    }
    else {
        if (this.is_mouse_over) {
            if (this.mouseout_func!=null) this.mouseout_func();
            this.is_mouse_over=false;
            return true;
        }
    }

    return false;
}

truffle.textbox.prototype.update=function(frame, tx) {
    this.draw_me=true;
    this.parent_transform=tx;
}

truffle.textbox.prototype.wrap_text=function(ctx,phrase,maxPxLength) {
    var wa=phrase.split(" "),
    phraseArray=[],
    lastPhrase="",
    l=maxPxLength,
    measure=0;
    for (var i=0;i<wa.length;i++) {
        var w=wa[i];
        measure=ctx.measureText(lastPhrase+w).width;
        if (measure<l) {
            if (lastPhrase!="") {
                lastPhrase+=(" "+w);
            }
            else {
                lastPhrase+=w;
            }
        } else {
            phraseArray.push(lastPhrase);
            lastPhrase=w;
        }
        if (i===wa.length-1) {
            phraseArray.push(lastPhrase);
            break;
        }
    }
    return phraseArray;
}

truffle.textbox.prototype.set_text=function(text) {
    var canvas=document.getElementById('canvas')
    var ctx=canvas.getContext('2d');
    ctx.font = this.font;
    this.text=this.wrap_text(ctx,text,this.width);
    this.draw_me=true;
}

truffle.textbox.prototype.draw=function(ctx) {
    if (!this.ready_to_draw) return;

    // two render paths
    if (this.complex_transform || this.parent_transform) {
        ctx.save();
        ctx.transform(this.transform.m[0],
                      this.transform.m[1],
                      this.transform.m[2],
                      this.transform.m[3],
                      this.transform.m[4],
                      this.transform.m[5]);
        
        if (this.parent_transform!=null) {
            ctx.transform(this.parent_transform.m[0],
                          this.parent_transform.m[1],
                          this.parent_transform.m[2],
                          this.parent_transform.m[3],
                          this.parent_transform.m[4],
                          this.parent_transform.m[5]);
        }

        ctx.font = this.font;
        var y=0;
        var that=this;
        this.text.forEach(function(text) {
            ctx.fillText(text,0,y);
            y+=that.text_height;
        });

        ctx.restore();
    }
    else // simple render path
    {
        ctx.font = this.font;
        var y=0;
        var that=this;
        this.text.forEach(function(text) {
            ctx.fillText(text,
                         this.pos.x-this.centre.x,
                         (this.pos.y-this.centre.y)+y);
            y+=that.text_height;
        });
    }

    if (this.draw_bb) {
        // draw bbox
        ctx.strokeStyle = "#00ffff";
        var bb=this.get_bbox();
        ctx.rect(bb[0], bb[1], bb[2]-bb[0], bb[3]-bb[1]); 
        ctx.stroke();
    }
    
    this.last_pos.x=this.pos.x;
    this.last_pos.y=this.pos.y;
    
    this.draw_me=false;
}

