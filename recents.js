

var newRecentDiv = function(name, path)
{
    var aTag = $('<a>');
    var header = $("<h5>");
    var para = $("<p>");
    var small = $("<small>");

    header.text(name);
    small.text(path);

    para.append(small);
    aTag.append(header);
    aTag.append(para);

    return aTag;
}

var recentsChangedHandler = function(newRecents) {
    var recntsEls = [];
    for (var r in newRecents) {
        recntsEls.push( newRecentDiv(r.name, r.path) );
    }

    $("#recentsList").empty().append(recntsEls);
}
