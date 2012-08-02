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

truffle.sprite=function(pos, tex, midbot, viz) 
{	
    truffle.drawable.call(this);
    if (midbot==null) midbot=false;
    if (viz==null) viz=true;

    this.id=null;
    this.hidden=false;
    this.pos=pos;
    this.angle=0;
    this.depth=-1;
    this.depth_offset=0;
    this.scale = new truffle.vec2(1,1);
    this.draw_me=true;
    this.transform = new truffle.mat23();
    this.width=64;
    this.height=112;
    this.centre=new truffle.vec2(0,0);
    this.do_centre_middle_bottom=midbot;
    this.image=null;
    this.draw_image=null;
    this.ready_to_draw=false;
    this.colour=null;
    this.offset_colour=null;

    this.change_bitmap(tex);
    this.enable_mouse(false);

    this.is_mouseover=false;
    this.mousedown_func=null;
    this.mouseup_func=null;
    this.mouseover_func=null;
    this.mouseout_func=null;
    
    this.parent_transform=null;
    this.last_pos=new truffle.vec2(this.pos.x,this.pos.y);
    this.do_transform=false;
}

truffle.sprite.prototype.get_id=function()
{
    return this.id;
}

truffle.sprite.prototype.set_id=function(s)
{
    this.id=s;
}

truffle.sprite.prototype.hide=function(s)
{
    this.draw_me=true;
    this.hidden=s;
}

truffle.sprite.prototype.get_depth=function() {
    return this.depth+this.depth_offset;
}

truffle.sprite.prototype.mouse_down=function(f)
{
    this.enable_mouse(true);
    this.mousedown_func=f;
}

truffle.sprite.prototype.mouse_up=function(f)
{
    this.enable_mouse(true);
    this.mouseup_func=f;
}

truffle.sprite.prototype.mouse_over=function(f)
{
    this.enable_mouse(true);
    this.mouseover_func=f;
}

truffle.sprite.prototype.mouse_out=function(f)
{
    this.enable_mouse(true);
    this.mouseout_func=f;
}

truffle.sprite.prototype.set_depth=function(s)
{
    this.depth=s;
}
    
truffle.sprite.prototype.get_depth=function() 
{
    return this.depth;
}

truffle.sprite.prototype.centre_middle_bottom=function(s)
{
    this.do_centre_middle_bottom=s;
}

truffle.sprite.prototype.set_size=function(x,y)
{
    this.width=x;
    this.height=y;
    if (this.do_centre_middle_bottom)
    {
        this.centre.x=this.width/2;
        this.centre.y=this.height;            
    }
    else
    {
        this.centre.x=this.width/2;
        this.centre.y=this.height/2;
    }
}

truffle.sprite.prototype.enable_mouse=function(s)
{
    this.mouse_enabled=s;
}

truffle.sprite.prototype.is_mouse_enabled=function()
{
    return this.mouse_enabled;
}

truffle.sprite.prototype.set_bitmap=function(b)
{
    this.image=b;
    this.ready_to_draw=true;
    this.set_size(this.image.width,this.image.height);
    this.draw_me=true;
    this.draw_image=b;
}

truffle.sprite.prototype.change_bitmap=function(t)
{
    if (this.image==null || 
        t.name!=this.image.src)
    {
        this.load_from_url(t);
    }
}

truffle.sprite.prototype.load_from_url=function(url)
{
    var c=this;
    this.image=new Image();
    this.image.onload = function(){
        c.ready_to_draw=true;
        c.set_size(c.image.width,c.image.height);
        if (c.offset_colour!=null)
        {
            c.add_tint(c.offset_colour);
        }
        c.draw_image = c.image;
        c.draw_me=true;
    };
//    this.image.onerror = function(e) {
//        alert("could't load "+url);
//    }
    this.image.src = url;  
}

truffle.sprite.prototype.set_pos=function(s) { this.pos=s; this.draw_me=true; }
truffle.sprite.prototype.set_scale=function(s) { this.scale=s; this.do_transform=true; this.draw_me=true; }
truffle.sprite.prototype.set_rotate=function(angle) { this.angle=angle; this.do_transform=true; this.draw_me=true; }
truffle.sprite.prototype.get_tx=function() { return this.transform; }

truffle.sprite.prototype.set_colour=function(s) 
{
    this.colour=s;
}

truffle.sprite.prototype.set_offset_colour=function(s) 
{
    this.offset_colour=s;
    if (this.ready_to_draw)
    {
        this.add_tint(s);
    }
}

truffle.sprite.prototype.get_colour=function() 
{
    return this.colour;
}

truffle.sprite.prototype.get_offset_colour=function() 
{
    return this.offset_colour;
}

truffle.sprite.prototype.transformed_pos=function()
{
    return this.transform.transform_point(0,0);
}

// tint the image pixel by pixel
truffle.sprite.prototype.add_tint=function(col)
{
    return;
    if (!this.ready_to_draw) return;

    var w = this.image.width;
    var h = this.image.height;
    var canvas = document.createElement("canvas");
    canvas.width  = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(this.Image,0,0);
    var pixels = ctx.getImageData(0,0,w,h).data;

    var canvas = document.createElement("canvas");
    canvas.width  = w;
    canvas.height = h;
    
    var ctx = canvas.getContext('2d');
    ctx.drawImage( this.image, 0, 0 );
    var to = ctx.getImageData( 0, 0, w, h );
    var to_data = to.data;
    
    for (var i=0, len=pixels.length; i<len; i+=4) 
    {
        to_data[i  ] = pixels[i  ]+col.x;
        to_data[i+1] = pixels[i+1]+col.y;
        to_data[i+2] = pixels[i+2]+col.z;
        to_data[i+3] = pixels[i+3];
    }
    
    ctx.putImageData( to, 0, 0 );
    
    // image is _slightly_ faster then canvas for this, so convert
    this.draw_image = new Image();
    this.draw_image.src = canvas.toDataURL();
}

truffle.sprite.prototype.get_last_bbox=function()
{
    var l=this.last_pos.x-this.centre.x;
    var t=this.last_pos.y-this.centre.y;
    if (this.do_centre_middle_bottom) t=this.last_pos.y-this.height;
    if (this.do_transform) // cater for rotate
    {
        var m=Math.max(this.width,this.height);
        var h=m/2;
        return [l-h,t-h,l+m+h,t+m+h]; 
    }
    else
    {
        return [l,t,l+this.width,t+this.height]; 
    }
}

truffle.sprite.prototype.get_bbox=function()
{
    var l=this.pos.x-this.centre.x;
    var t=this.pos.y-this.centre.y;
    if (this.do_centre_middle_bottom) t=this.pos.y-this.height;
    if (this.do_transform) // cater for rotate
    {
        var m=Math.max(this.width,this.height);
        var h=m/2;
        return [l-h,t-h,l+m+h,t+m+h]; 
    }
    else
    {
        return [l,t,l+this.width,t+this.height]; 
    }
}

truffle.sprite.prototype.intersect=function(ob)
{
    var tb=this.get_bbox();
    return !(ob[0] > tb[2] || ob[2] < tb[0] ||
             ob[1] > tb[3] || ob[3] < tb[1]);
}

truffle.sprite.prototype.update_mouse=function(canvas_state)
{
    // assume check for mouseenabled is done already
    var x=canvas_state.mouse_x+this.centre.x;
    var y=canvas_state.mouse_y+this.centre.y;

    // todo - correct for transform
    if (x>this.pos.x && x<this.pos.x+this.width &&
        y>this.pos.y && y<this.pos.y+this.height)
    {
        if (!this.is_mouse_over)
        {
            if (this.mouseover_func!=null) this.mouseover_func();
            this.is_mouse_over=true;
            return true;
        }

        if (canvas_state.mouse_changed)
        {
            if (canvas_state.mouse_down)
            {
                if (this.mousedown_func!=null) this.mousedown_func();
                return true;
            }
            else
            {
                if (this.mouseup_func!=null) this.mouseup_func();
                return true;
            }
        }
    }
    else
    {
        if (this.is_mouse_over)
        {
            if (this.mouseout_func!=null) this.mouseout_func();
            this.is_mouse_over=false;
            return true;
        }
    }

    return false;
}

truffle.sprite.prototype.update=function(frame, tx)
{
    this.draw_me=true;
    this.parent_transform=tx;
}

truffle.sprite.prototype.draw=function()
{
    if (!this.ready_to_draw || this.hidden) return;
    this.draw_me=false;

    var ctx=document.getElementById('canvas').getContext('2d');

    if (this.parent_transform!=null ||
        this.do_transform)
    {
        ctx.save();
    }

    if (this.do_transform)
    {
        ctx.translate(this.pos.x,this.pos.y);
        ctx.rotate(this.angle);
        ctx.scale(this.scale.x,this.scale.y);
        ctx.translate(-this.centre.x,-this.centre.y);
    }

    if (this.parent_transform!=null)
    {
        ctx.transform(this.parent_transform.m[0],
                      this.parent_transform.m[1],
                      this.parent_transform.m[2],
                      this.parent_transform.m[3],
                      this.parent_transform.m[4],
                      this.parent_transform.m[5]);
    }

    if (this.do_transform)
    {
        ctx.drawImage(this.draw_image,0,0);
/*        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI*2, true); 
        ctx.closePath();
        ctx.fill();*/
    }
    else
    {
        var x=this.pos.x-this.centre.x;
        var y=this.pos.y-this.centre.y;        
        ctx.drawImage(this.draw_image,~~(0.5+x),~~(0.5+y));
/*        ctx.fillStyle = "#00ffff";
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI*2, true); 
        ctx.closePath();
        ctx.fill();*/
    }

    if (this.parent_transform!=null ||
        this.do_transform)
    {
        ctx.restore();
    }

// draw bbox
/*    ctx.strokeStyle = "#00ffff";
    var bb=this.get_bbox;
    ctx.rect(bb[0], bb[1], bb[2]-bb[0], bb[3]-bb[1]); 
    ctx.stroke();
*/

    this.last_pos.x=this.pos.x;
    this.last_pos.y=this.pos.y;
}

