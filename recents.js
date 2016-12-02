

exports.newRecentDiv = function(name, path)
{
    var aTag = $('<a>');
    aTag.addClass("list-group-item");
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
}
