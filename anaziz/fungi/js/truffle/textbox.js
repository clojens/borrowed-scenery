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

    this.its_a_tb=true;
    this.font = font;
    this.pos = pos;
    this.width = w;
    this.height = h;
    this.draw_bb = false;
    this.text_height = 20;
    this.last_pos=new truffle.vec2(this.pos.x,this.pos.y);
    this.last_parent_pos=new truffle.vec2(this.pos.x,this.pos.y);
    this.text_colour="#000000";
    this.ready_to_draw=true;
    this.hidden=false;

    this.set_pos(pos);
    this.set_text(text);
}

truffle.textbox.prototype=inherits_from(truffle.drawable,truffle.textbox);

truffle.textbox.prototype.update=function(frame, tx) {
    this.ready_to_draw=true;
    this.hidden=false;
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
            if (lastPhrase!="") phraseArray.push(lastPhrase);
            lastPhrase=w;
        }
        if (i===wa.length-1) {
            if (lastPhrase!="") phraseArray.push(lastPhrase);
            break;
        }
    }
    return phraseArray;
}

truffle.textbox.prototype.set_text=function(text) {
    var that=this;
    var canvas=document.getElementById('canvas')
    var ctx=canvas.getContext('2d');
    ctx.font = this.font;
    this.text=this.wrap_text(ctx,text,this.width);
    this.width=0;
    this.text.forEach(function(str) {
        var w=ctx.measureText(str).width;
        if (that.width<w) {
            that.width=w;
        }
    });
    this.draw_me=true;
    this.height=this.text.length*this.text_height;
    this.centre.x=this.width/2;
}

truffle.textbox.prototype.get_last_bbox=function() {
    var l=this.last_pos.x;
    var t=this.last_pos.y;
    if (this.parent_transform) {
        l+=this.last_parent_pos.x;
        t+=this.last_parent_pos.y;
    }
    l+=-this.centre.x;
    t+=-this.centre.y-this.text_height/1.7;
    return [l,t,l+this.width,t+this.height]; 
}

truffle.textbox.prototype.get_bbox=function() {
    var l=this.pos.x;
    var t=this.pos.y;
    if (this.parent_transform) {
        l+=this.parent_transform.m[4];
        t+=this.parent_transform.m[5];
    }
    l+=-this.centre.x;
    t+=-this.centre.y-this.text_height/1.7;
    return [l,t,l+this.width,t+this.height]; 
}


truffle.textbox.prototype.draw=function(ctx) {
    if (this.text.length==0) {
        this.last_pos.x=this.pos.x;
        this.last_pos.y=this.pos.y;    
        this.draw_me=false;
        return;
    }

    // two render paths
    if (this.complex_transform || this.parent_transform) {
        ctx.save();
/*        ctx.transform(this.transform.m[0],
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
        }*/

        ctx.font = this.font;
        var y=0;
        var that=this;

        ctx.translate(this.parent_transform.m[4]+this.pos.x,
                      this.parent_transform.m[5]+this.pos.y);

        this.last_parent_pos.x=this.parent_transform.m[4];
        this.last_parent_pos.y=this.parent_transform.m[5];


        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha=0.75;
        ctx.fillRect(-this.centre.x, -this.centre.y-this.text_height/1.8, 
                     this.width,this.height); 
        ctx.globalAlpha=1;

        ctx.fillStyle = this.text_colour;
        ctx.textAlign = "left";
        this.text.forEach(function(text) {
            ctx.fillText(text,-that.centre.x,y-that.centre.y);
            y+=that.text_height;
        });

        ctx.restore();
    }
    else // simple render path
    {
        ctx.font = this.font;
        var y=0;
        var that=this;

        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha=0.75;
        ctx.fillRect(this.pos.x-this.centre.x, 
                     this.pos.x-this.centre.y-this.text_height/1.7, 
                     this.width,this.height); 
        ctx.globalAlpha=1;

        ctx.fillStyle = "#ff00ff";
        ctx.textAlign = "left";
        this.text.forEach(function(text) {
            ctx.fillText(text,
                         that.pos.x-that.centre.x,
                         (that.pos.y-that.centre.y)+y);
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

