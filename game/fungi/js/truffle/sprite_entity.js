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

truffle.sprite_entity=function(world, pos, t, viz) {
    truffle.entity.call(this,world,pos);

    this.spr = new truffle.sprite(new truffle.vec2(this.pos.x,this.pos.y),t,true,viz);
    //this.spr.set_depth(this.depth);
    world.add_sprite(this.spr);
    //this.hide(!viz);
}

truffle.sprite_entity.prototype=
    inherits_from(truffle.entity,truffle.sprite_entity);

truffle.sprite_entity.prototype.destroy=function(world) {
    truffle.entity.prototype.destroy.call(this,world);
    world.remove_sprite(this.spr);
}

truffle.sprite_entity.prototype.update=function(frame, world) {
    truffle.entity.prototype.update.call(this,frame,world);
    this.spr.set_pos(new truffle.vec2(this.pos.x,this.pos.y));
    this.spr.update(frame,null);
}

truffle.sprite_entity.prototype.get_root=function() {
    return this.spr;
}



