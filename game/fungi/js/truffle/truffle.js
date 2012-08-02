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

function canvas_init()
{
}

///////////////////////////////////////////

function vec2(x,y) 
{
    this.x=x;
    this.y=y;
}

vec2.prototype.add=function(other)
{
	return new vec2(x+other.x,y+other.y);
}

vec2.prototype.sub=function(other)
{
	return new vec2(x-other.x,y-other.y);
}

vec2.prototype.div=function(v)
{
	return new vec2(x/v,y/v);
}

vec2.prototype.mul=function(v)
{
	return new vec2(x*v,y*v);
}

vec2.prototype.mag=function()
{
	return Math.sqrt(x*x+y*y);
}
	
vec2.prototype.lerp=function(other,t)
{
	return new vec2(x*(1-t) + other.x*t,
					y*(1-t) + other.y*t);
}

vec2.prototype.eq=function(other)
{
	return x==other.x && y==other.y;
}

vec2.prototype.as_str=function()
{
    return str(x)+", "+str(y);
}

/////////////////////////////////////////////

function matrix() {
    this.identity();
}

matrix.prototype.identity = function() {
    this.m = [1,0,0,1,0,0];
};

matrix.prototype.clone = function() {
    ret=new matrix();
    ret.m = [this.m[0],this.m[1],
             this.m[2],this.m[3],
             this.m[4],this.m[5]];
    return ret;
};

matrix.prototype.concat = function(matrix) {
    var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
    var m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];
    
    var m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
    var m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];
    
    var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
    var dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];
    
    this.m[0] = m11;
    this.m[1] = m12;
    this.m[2] = m21;
    this.m[3] = m22;
    this.m[4] = dx;
    this.m[5] = dy;
};

matrix.prototype.invert = function() {
    var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
    var m0 = this.m[3] * d;
    var m1 = -this.m[1] * d;
    var m2 = -this.m[2] * d;
    var m3 = this.m[0] * d;
    var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
    var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
    this.m[0] = m0;
    this.m[1] = m1;
    this.m[2] = m2;
    this.m[3] = m3;
    this.m[4] = m4;
    this.m[5] = m5;
};

matrix.prototype.rotate = function(rad) {
    var c = Math.cos(rad);
    var s = Math.sin(rad);
    var m11 = this.m[0] * c + this.m[2] * s;
    var m12 = this.m[1] * c + this.m[3] * s;
    var m21 = this.m[0] * -s + this.m[2] * c;
    var m22 = this.m[1] * -s + this.m[3] * c;
    this.m[0] = m11;
    this.m[1] = m12;
    this.m[2] = m21;
    this.m[3] = m22;
};

matrix.prototype.translate = function(x, y) {
    this.m[4] += this.m[0] * x + this.m[2] * y;
    this.m[5] += this.m[1] * x + this.m[3] * y;
};

matrix.prototype.scale = function(sx, sy) {
    this.m[0] *= sx;
    this.m[1] *= sx;
    this.m[2] *= sy;
    this.m[3] *= sy;
};

matrix.prototype.transform_point = function(v) {
    var x = v.x;
    var y = v.y;
    px = x * this.m[0] + y * this.m[2] + this.m[4];
    py = x * this.m[1] + y * this.m[3] + this.m[5];
    return new vec2(px, py);
};

///////////////////////////////////////////////////

truffle = {} 
truffle.canvas = {}

///////////////////////////////////////////////////

truffle.canvas.sprite=function(pos, tex, midbot, viz) 
{	
    if (midbot==null) midbot=false;
    if (viz==null) viz=true;

    this.id=null;
    this.hidden=false;
    this.pos=pos;
    this.angle=0;
    this.depth=-1;
    this.scale = new vec2(1,1);
    this.draw_me=true;
    this.pretransform = new matrix();
    this.transform = new matrix();
    this.posttransform = new matrix();
    this.width=64;
    this.height=112;
    this.centre=new vec2(0,0);
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
    this.last_pos=new vec2(this.Pos.x,this.Pos.y);
    this.do_transform=false;
}

truffle.canvas.sprite.prototype.get_id=function()
{
    return this.id;
}

truffle.canvas.sprite.prototype.set_id=function(s)
{
    this.id=s;
}

truffle.canvas.sprite.prototype.hide=function(s)
{
    this.draw_me=true;
    this.hidden=s;
}

truffle.canvas.sprite.prototype.mouse_down=function(f)
{
    this.enable_mouse(true);
    this.mousedown_func=f;
}

truffle.canvas.sprite.prototype.mouse_up=function(f)
{
    this.enable_mouse(true);
    this.mouseup_func=f;
}

truffle.canvas.sprite.prototype.mouse_over=function(f)
{
    this.enable_mouse(true);
    this.mouseover_func=f;
}

truffle.canvas.sprite.prototype.mouse_out=function(f)
{
    this.enable_mouse(true);
    this.mouseout_func=f;
}

truffle.canvas.sprite.prototype.set_depth=function(s)
{
//    parent.setChildIndex(this,s);
    this.depth=s;
}
    
truffle.canvas.sprite.prototype.get_depth=function() 
{
    return this.depth;
}

truffle.canvas.sprite.prototype.centre_middle_bottom=function(s)
{
    this.do_centre_middle_bottom=s;
}

truffle.canvas.sprite.prototype.set_size=function(x,y)
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

truffle.canvas.sprite.prototype.enable_mouse=function(s)
{
    this.mouse_enabled=s;
}

truffle.canvas.sprite.prototype.is_mouse_enabled=function()
{
    return this.mouse_enabled;
}

truffle.canvas.sprite.prototype.change_bitmap=function(t)
{
    if (this.image==null || 
        t.name!=this.image.src)
    {
        this.load_from_url(t.name);
    }
}

truffle.canvas.sprite.prototype.load_from_url=function(url)
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
    this.image.src = url;  
}

truffle.canvas.sprite.prototype.set_pos=function(s) { this.pos=s; this.draw_me=true; }
truffle.canvas.sprite.prototype.set_scale=function(s) { this.my_scale=s; this.do_transform=true; this.draw_me=true; }
truffle.canvas.sprite.prototype.set_rotate=function(angle) { this.angle=angle; this.do_transform=true; this.draw_me=true; }
truffle.canvas.sprite.prototype.get_tx=function() { return this.transform; }

truffle.canvas.sprite.prototype.set_colour=function(s) 
{
    this.colour=s;
}

truffle.canvas.sprite.prototype.set_offset_colour=function(s) 
{
    this.offset_colour=s;
    if (this.ready_to_draw)
    {
        this.add_tint(s);
    }
}

truffle.canvas.sprite.prototype.get_colour=function() 
{
    return this.colour;
}

truffle.canvas.sprite.prototype.get_offset_colour=function() 
{
    return this.offset_colour;
}

truffle.canvas.sprite.prototype.transformed_pos=function()
{
    return this.transform.transform_point(0,0);
}

// tint the image pixel by pixel
truffle.canvas.sprite.prototype.add_tint=function(col)
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

truffle.canvas.sprite.prototype.get_last_bbox=function()
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

truffle.canvas.sprite.prototype.get_bbox=function()
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

truffle.canvas.sprite.prototype.intersect=function(ob)
{
    var tb=this.get_bbox();
    return !(ob[0] > tb[2] || ob[2] < tb[0] ||
             ob[1] > tb[3] || ob[3] < tb[1]);
}

truffle.canvas.sprite.prototype.update_mouse=function(canvas_state)
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
            if (this.mouse_over_func!=null) this.mouse_over_func();
            this.is_mouse_over=true;
            return true;
        }

        if (canvas_state.mouse_changed)
        {
            if (canvas_state.mouse_down)
            {
                if (this.mouse_down_func!=null) this.mouse_down_func();
                return true;
            }
            else
            {
                if (this.mouse_up_func!=null) this.mouse_up_func();
                return true;
            }
        }
    }
    else
    {
        if (this.is_mouse_over)
        {
            if (this.mouse_out_func!=null) this.mouse_out_func();
            this.is_mouse_over=false;
            return true;
        }
    }

    return false;
}

truffle.canvas.sprite.prototype.update=function(frame, tx)
{
    this.draw_me=true;
    this.parent_transform=tx;
}

truffle.canvas.sprite.prototype.draw=function()
{
    if (!this.ready_to_draw || this.hidden) return;
    this.draw_me=false;

    var ctx=document.getElementById('canvas').getContext('2d');

    if (this.parent_transform!=null ||
        this.do_transform)
    {
        ctx.save();
    }

    if (this.parent_transform!=null)
    {
        ctx.transform(this.parent_transform[0],
                      this.parent_transform[1],
                      this.parent_transform[2],
                      this.parent_transform[3],
                      this.parent_transform[4],
                      this.parent_transform[5]);
    }

    if (this.do_transform)
    {
        ctx.translate(this.pos.x,this.pos.y);
        ctx.rotate(this.angle);
        ctx.scale(this.scale.x,this.scale.y);
        ctx.translate(-this.centre.x,-this.centre.y);
        ctx.drawImage(this.draw_image,0,0);
    }
    else
    {
        var x=this.pos.x-this.centre.x;
        var y=this.pos.y-this.centre.y;        
        ctx.drawImage(this.draw_image,~~(0.5+x),~~(0.5+y));
    }

    if (this.parent_transform!=null ||
        this.do_transform)
    {
        ctx.restore();
    }

    this.last_pos.x=this.pos.x;
    this.last_pos.y=this.pos.y;
}

//////////////////////////////////////

truffle.canvas.canvas_state=function() 
{
    this.mouse_changed=false;
    this.mouse_down=false;
    this.mouse_x=0;
    this.mouse_y=0;
    this.canvas=document.getElementById('canvas');
    this.ctx = this.Canvas.getContext('2d');         

    var _this=this;

    this.canvas.addEventListener('mousedown', function(e) {
        _this.mouse_changed=true;
        _this.mouse_down=true;
    });

    this.canvas.addEventListener('mousemove', function(e) {
        _this.update_mouse(e);
    });

    this.canvas.addEventListener('mouseup', function(e) {
        _this.mouse_changed=true;
        _this.mouse_down=false;
    });
}

truffle.canvas.canvas_state.prototype.begin_scene=function()
{
    //this.Ctx.clearRect(0,0,720,576);
    this.ctx.save();
    this.ctx.fillStyle = "#000000";
    this.ctx.strokeStyle = "#000000";  
}

truffle.canvas.canvas_state.prototype.end_scene=function()
{
    this.ctx.restore();
}

truffle.canvas.canvas_state.prototype.clear_rects=function(bboxes)
{
    this.ctx.fillStyle = "#ffffff";

    for (i in bboxes)
    {
        this.ctx.fillRect(~~(bboxes[i][0]+0.5),~~(bboxes[i][1]+0.5),
                          ~~(0.5+(bboxes[i][2]-bboxes[i][0])),
                          ~~(0.5+(bboxes[i][3]-bboxes[i][1])));
    }
}

truffle.canvas.canvas_state.prototype.set_clip=function(bboxes)
{
    this.ctx.save();

    // Set the clipping area
    this.ctx.beginPath();
    for (i in bboxes)
    {
        this.Ctx.rect(~~(bboxes[i][0]+0.5),~~(bboxes[i][1]+0.5),
                      ~~(0.5+(bboxes[i][2]-bboxes[i][0])),
                      ~~(0.5+(bboxes[i][3]-bboxes[i][1])));
    }
    this.ctx.clip();
}

truffle.canvas.canvas_state.prototype.unclip=function()
{
    this.ctx.restore();
}

truffle.canvas.canvas_state.prototype.update=function()
{
    this.mouse_changed=false;
}

// Creates an object with x and y defined,
// set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky,
// we have to worry about padding and borders
truffle.canvas.canvas_state.prototype.update_mouse = function(e) 
{
    var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
 
    // Compute the total offset
    if (element.offsetParent !== undefined) {
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }
    
    // Add padding and border style widths to offset
    // Also add the <html> offsets in case there's a position:fixed bar
    //offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
    //offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;
    
    this.mouse_x = e.pageX - offsetX;
    this.mouse_y = e.pageY - offsetY;
}

truffle.canvas.canvas_state.prototype.stats=function(num)
{
    this.ctx.fillStyle="#000000";
    this.ctx.fillRect(10,10,100,10);

    this.ctx.fillStyle="#ff0000";
    var s=num*100;
    this.ctx.fillRect(11,11,s,8);
}

////////////////////////////////////////////

