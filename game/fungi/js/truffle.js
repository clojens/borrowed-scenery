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

truffle.main={}
truffle.main.world=null;
truffle.main.time=0;

var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||  
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

var update_fn;

truffle.main.init=function(game_create,game_update) {
    var canvas=document.getElementById('canvas')
    var ctx=canvas.getContext('2d');

    truffle.main.world=new truffle.world();
    game_create();
    update_fn=game_update;
    requestAnimationFrame(truffle.main.loop);
}

truffle.main.loop=function(timestamp) {
    var canvas=document.getElementById('canvas')
    var ctx=canvas.getContext('2d');

    update_fn();
    truffle.main.world.update(truffle.main.time);
    truffle.main.time++;

    if (ctx.canvas.width!=window.innerWidth ||
        ctx.canvas.height!=window.innerHeight) {
        truffle.main.world.canvas_state.resize(
            window.innerWidth,
            window.innerHeight);
        truffle.main.world.redraw();
    }

    requestAnimationFrame(truffle.main.loop);
}

