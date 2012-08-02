// t r u f f l e Copyright (C) 2010 FoAM vzw   \_\ __     /\
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

truffle.drawable=function() 
{
    this.ready_to_draw=true;
    this.hidden=false;
    this.draw_me=true;
    this.id=-1;
    this.depth=0;
}

truffle.drawable.set_id=function(s) { this.id=s; }
truffle.drawable.get_id=function() { return this.id; }

truffle.drawable.intersect=function(bb){
    return false;
}

truffle.drawable.set_depth=function(s) {
    this.depth=s;
}

truffle.drawable.get_depth=function() {
    return this.depth;
}
 
truffle.drawable.is_mouse_enabled=function() {
    return false;
}

truffle.drawable.update_input=function(cs) {}

truffle.drawable.draw=function(){
}

