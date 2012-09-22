// Naked on Pluto Copyright (C) 2010 Aymeric Mansoux, Marloes de Valk, Dave Griffiths
//                                       
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

// code to provide the "readme" sliding popup on the site
// It can be commented out from index.html or repurposed when we release NOP

function readme_setup() {
    var popup = $("#readme");
    var content = popup.children("#readme-content");
    var img = content.children("img");
    
    popup.css("display", "block").data("showing", false);
    
    // slide in and out...
    img.click(function ()
    {
        if (popup.data("showing") === true)
        {
            popup.data("showing", false).animate(
            {
                marginLeft: "-655px"
            }, 500);
            $(this).attr("src", "images/info.png").css("top", "0px");
        } 
        else
        {     
            popup.data("showing", true).animate(
            {
                marginLeft: "0"
            }, 500);
            $(this).attr("src", "images/close.png").css("top", "0px");
        }
    });
};

function help_setup() {
    var popup = $("#help");
    var content = popup.children("#help-content");
    var img = content.children("img");
    
    popup.css("display", "block").data("showing", false);
    
    // slide in and out...
    img.click(function ()
    {
        if (popup.data("showing") === true)
        {
            popup.data("showing", false).animate(
            {
                marginLeft: "-655px"
            }, 500);
            $(this).attr("src", "images/help.png").css("top", "0px");
        } 
        else
        {     
            popup.data("showing", true).animate(
            {
                marginLeft: "0"
            }, 500);
            $(this).attr("src", "images/close.png").css("top", "0px");
        }
    });
};
