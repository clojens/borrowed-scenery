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

function map(centre,zoom,tiles_from,tiles_to,fn) {
    var centre_tile=this.latlon_to_tile(centre[0],centre[1],zoom);
    // coords in local/global osm space
    for (x = tiles_from; x<tiles_to; x++) {
        for (y = tiles_from; y<tiles_to; y++) {     
            this.load_map_tile_and_split(x,y,
                                         x+centre_tile[0],
                                         (2-y)+centre_tile[1],
                                         zoom,fn);       
        }
    }
}

map.prototype.latlon_to_tile=function(lat,lon,zoom) {
    with(Math){
        var m=pow(2,zoom);
        var lat_rad=lat*PI/180;
        return [floor((lon+180)/360*m),
                floor((1-Math.log(tan(lat_rad) + 1/cos(lat_rad))/PI)/2*m)];
    }
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

map.prototype.load_map_tile_and_split=function(lx,ly,x,y,z,fn) {

    var that=this;
    var image=new Image();
    image.crossOrigin = "anonymous";
    image.onload = function(){
        var sx=4; // number of splits
        var sy=4;
        var sub_images=that.split_image(image,sx,sy);
        var world_offset_x=4; // map tile -> world tile
        var world_offset_y=3;
        var world_x=world_offset_x+ly*sx; // base world coord
        var world_y=world_offset_y+lx*sy;
        sub_images.forEach(function(sub_image){
            fn(world_x,world_y,sub_image);
        });            
    };
    image.src=this.tile_url(x,y,z);
}

