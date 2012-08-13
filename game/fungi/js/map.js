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

function map(centre,zoom) {
    this.centre=centre;
    this.zoom=zoom;
    this.tile_entities=[];
    this.centre_tile=this.latlon_to_tile(centre.x,centre.y,zoom);
    this.current_tile=new truffle.vec2(0,0);
    this.do_create_tile=null;
    this.do_update_tile=null;
    this.load_count=0;
    this.loaded_count=0;
}

map.prototype.latlon_to_tile=function(lat,lon,zoom) {
    var m=Math.pow(2,zoom);
    var lat_rad=lat*Math.PI/180.0;
    return new truffle.vec2(
        Math.floor((lon+180)/360.0*m),
        Math.floor((1-Math.log(
            Math.tan(lat_rad) + 
                1/Math.cos(lat_rad))/Math.PI)/2.0*m));
}

map.prototype.tile_url=function(x,y,zoom) {
    return "http://a.tile.openstreetmap.org/"+zoom+"/"+x+"/"+y+".png";
}


map.prototype.split_image=function(image,nx,ny) {
    var w = image.width;
    var h = image.height;
    var subx=w/nx;
    var suby=h/ny;
    var ret=[];

    var canvas = document.createElement("canvas");
    canvas.width  = subx;
    canvas.height = suby;
    var ctx = canvas.getContext("2d");

    for (var x=0; x<nx; x++) {
        for(var y=0; y<ny; y++) {
            ctx.drawImage(image,
                          x*subx,y*suby,subx,suby,
                          0,0,subx,suby);
            var ni=new Image();
            ni.src=canvas.toDataURL();
            ret.push([x,y,ni]);
        }
    }
    return ret;
}

map.prototype.find_tile_entity=function(x,y) {
    for (var i=0; i<this.tile_entities.length; i++) {
        if (this.tile_entities[i].x==x &&
            this.tile_entities[i].y==y)
            return this.tile_entities[i];
    }
    return false;
}

map.prototype.load_map_tile_and_split=function(lx,ly,x,y,z) {
    var that=this;
    this.load_count++;
    var image=new Image();
    image.crossOrigin = "anonymous";
    image.onload = function(){
        var splits=5; // number of splits
        // also change game-tile-div in ushahidi.clj
        var sub_images=that.split_image(image,splits,splits);
        var world_x=5+ly*splits; // base world coord
        var world_y=5+lx*splits;
        sub_images.forEach(function(sub_image){
            var entity=that.find_tile_entity(world_x+sub_image[0],
                                             world_y+sub_image[1]);
            if (entity) {
                that.do_update_tile(world_x,world_y,sub_image,entity.entity);
            }
            else that.tile_entities.push(
                {x:world_x+sub_image[0],
                 y:world_y+sub_image[1],
                 entity: that.do_create_tile(world_x,world_y,sub_image)});
        });
        that.loaded_count++;
        if (that.loaded_count==that.load_count) {
            that.on_load_end();
        }
    };
    image.src=this.tile_url(x,y,z);
    //alert("loading "+this.tile_url(x,y,z));
}

map.prototype.game_to_map=function(tile_pos) {
/*    // convert tile_pos to global world pos:
    var global_game=[tile_pos.x*5,
                     tile_pos.y*5];

    // get the map tile required
    var map_tile=[global_game[0]/5,
                  global_game[1]/5];
*/
    return new truffle.vec2(
        Math.round(this.centre_tile.x+tile_pos.x),
        Math.round(this.centre_tile.y+tile_pos.y));
}

map.prototype.update=function(tile_pos,on_load_start,on_load_end) {
    var tile=this.game_to_map(tile_pos);
    if (this.current_tile.x!=tile.x ||
        this.current_tile.y!=tile.y) {
        this.current_tile=tile;

        on_load_start();
        this.loaded_count=0;
        this.load_count=0;
        this.on_load_end=on_load_end;

        // coords in local/global osm space
        for (var x = -1; x<=1; x++) {
            for (var y = -1; y<=1; y++) {
                this.load_map_tile_and_split(x,y,
                                             y+this.current_tile.x,
                                             x+this.current_tile.y,
                                             this.zoom);       
            }
        } 
    } 
}
