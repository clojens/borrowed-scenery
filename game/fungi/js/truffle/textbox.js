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
    this.width = w;
    this.height = h;
    this.draw_bb = false;
    this.text_height = 20;
    this.last_pos=new truffle.vec2(this.pos.x,this.pos.y);
    this.set_pos(pos);
    this.set_text(text);
}

truffle.textbox.prototype=inherits_from(truffle.drawable,truffle.textbox);

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

