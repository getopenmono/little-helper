const {ipcRenderer} = require("electron")

exports.newRecentDiv = function(name, path)
{
    var aTag = $('<a>');
    aTag.addClass("list-group-item recentLink");
    aTag.attr("data-path",path);
    aTag.attr("href","javascript:void(0);")
    var header = $("<h5>");
    var glyph = $("<i>");
    glyph.addClass("glyphicon glyphicon-file");
    var para = $("<p>");
    var small = $("<small>");

    header.append(glyph);
    header.append(" "+name);
    
    small.text(path);

    para.append(small);
    aTag.append(header);
    aTag.append(para);

    return aTag;
}

exports.recentsChangedHandler = function(evnt, newRecents) {
    var recntsEls = [];
    for (var r in newRecents) {
        recntsEls.push( exports.newRecentDiv(newRecents[r].title, newRecents[r].path) );
    }

    $("#recentsList").empty().append(recntsEls);
    recents.handleRecentLinks();
}

exports.handleRecentLinks = function() {
    console.log($(".recentLink"));
    $(".recentLink").click((evnt) => {
        var path = $(evnt.currentTarget).attr("data-path");
        console.log("path: "+path);
        ipcRenderer.send("openPath", path);
    });
}
