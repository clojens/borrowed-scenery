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

truffle.canvas_state=function() 
{
    this.mouse_changed=false;
    this.mouse_down=false;
    this.mouse_x=0;
    this.mouse_y=0;
    this.canvas=document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');         

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

truffle.canvas_state.prototype.begin_scene=function()
{
    //this.Ctx.clearRect(0,0,720,576);
    this.ctx.save();
    this.ctx.fillStyle = "#000000";
    this.ctx.strokeStyle = "#000000";  
}

truffle.canvas_state.prototype.end_scene=function()
{
    this.ctx.restore();
}

truffle.canvas_state.prototype.clear_rects=function(bboxes)
{
    this.ctx.fillStyle = "#ffffff";
    var that=this;
    bboxes.forEach(function(box) {
        that.ctx.fillRect(~~(box[0]+0.5),~~(box[1]+0.5),
                          ~~(0.5+(box[2]-box[0])),
                          ~~(0.5+(box[3]-box[1])));
    });
}

truffle.canvas_state.prototype.set_clip=function(bboxes)
{
    this.ctx.save();

    // Set the clipping area
    this.ctx.beginPath();
    var that=this;
    bboxes.forEach(function(box) {
        that.ctx.rect(~~(box[0]+0.5),~~(box[1]+0.5),
                      ~~(0.5+(box[2]-box[0])),
                      ~~(0.5+(box[3]-box[1])));
    });
    this.ctx.clip();
}

truffle.canvas_state.prototype.unclip=function()
{
    this.ctx.restore();
}

truffle.canvas_state.prototype.update=function()
{
    this.mouse_changed=false;
}

// Creates an object with x and y defined,
// set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky,
// we have to worry about padding and borders
truffle.canvas_state.prototype.update_mouse = function(e) 
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

truffle.canvas_state.prototype.stats=function(num)
{
    this.ctx.fillStyle="#000000";
    this.ctx.fillRect(10,10,100,10);

    this.ctx.fillStyle="#ff0000";
    var s=num*100;
    this.ctx.fillRect(11,11,s,8);
}

////////////////////////////////////////////

