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

truffle.sprite=function(pos, tex, midbot, viz) {	
    truffle.drawable.call(this);
    if (midbot==null) midbot=false;
    if (viz==null) viz=true;

    this.pos=pos;
    this.do_centre_middle_bottom=midbot;
    this.image=null;
    this.draw_image=null;
    this.ready_to_draw=false;
    this.offset_colour=null;
    this.draw_bb=false;
    this.change_bitmap(tex);    
    this.last_pos=new truffle.vec2(this.pos.x,this.pos.y);
    this.set_pos(this.pos);
}

truffle.sprite.prototype=inherits_from(truffle.drawable,truffle.sprite);

truffle.sprite.prototype.set_bitmap=function(b,recalc_bb) {
    this.image=b;
    this.ready_to_draw=true;
    if (recalc_bb==undefined) this.set_size(this.image.width,this.image.height);
    this.draw_me=true;
    this.draw_image=b;
}

truffle.sprite.prototype.change_bitmap=function(t) {
    if (this.image==null || 
        t.name!=this.image.src) {
        this.load_from_url(t);
    }
}

truffle.sprite.prototype.load_from_url=function(url) {
    var c=this;
    this.image=new Image();
    this.image.onload = function() {
        //log("loaded "+c.image.src);
        c.ready_to_draw=true;
        c.set_size(c.image.width,c.image.height);
        if (c.offset_colour!=null) {
            c.add_tint(c.offset_colour);
        }
        c.draw_image = c.image;
        c.draw_me=true;
    };
    this.image.onerror = function(e) {
        log("could't load "+url);
    }
    this.image.src = url;  
}


truffle.sprite.prototype.set_offset_colour=function(s) {
    this.offset_colour=s;
    if (this.ready_to_draw) {
        this.add_tint(s);
    }
}

truffle.sprite.prototype.get_offset_colour=function() {
    return this.offset_colour;
}

// tint the image pixel by pixel
truffle.sprite.prototype.add_tint=function(col) {
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
    
    for (var i=0, len=pixels.length; i<len; i+=4) {
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

truffle.sprite.prototype.update=function(frame, tx) {
    this.draw_me=true;
    this.parent_transform=tx;
}

truffle.sprite.prototype.draw=function(ctx) {
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
        
        ctx.drawImage(this.draw_image,
                      ~~(0.5+(-this.centre.x)),
                      ~~(0.5+(-this.centre.y)));
        ctx.restore();
    }
    else // simple render path
    {
        ctx.drawImage(this.draw_image,
                      ~~(0.5+this.pos.x-this.centre.x),
                      ~~(0.5+this.pos.y-this.centre.y));
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

