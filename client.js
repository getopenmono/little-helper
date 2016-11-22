
window.$ = window.jQuery = require("./bower_components/jquery/dist/jquery.js");
const {shell} = require("electron");

const ipcRenderer = require("electron").ipcRenderer;
var connectTimer = null;

const toggleMonoEnableMenus = function (enabled) {
    if (enabled) {
        $("#uploadCommand").removeClass("disabled");
    }
    else {
        $("#uploadCommand").addClass("disabled");
    }
}

const displayError = function (title, message) {
    $("#errorModalHeading").text(title);
    $("#errroModalBody").text(message);
    $("#errorModal").modal("show");
}

const updateMonoState = function (state) {
    var para = $("#mono-state-par");
    var icon = $("#mono-state-icon");
    var text = $("#mono-state-text");

    switch (state) {
        case "bootloader":
            text.text("Mono is in bootloader");
            icon.removeClass("glyphicon-remove glyphicon-hourglass").addClass("glyphicon-ok");
            para.removeClass("text-warning").addClass("text-success");
            toggleMonoEnableMenus(true);
            break;
        case "app":
            text.text("Mono is running an app.");
            icon.removeClass("glyphicon-remove glyphicon-hourglass").addClass("glyphicon-ok")
            para.removeClass("text-warning").addClass("text-success")
            toggleMonoEnableMenus(true)
            break;
        case "upload":
            text.text("Mono is busy...")
            icon.removeClass("glyphicon-remove").addClass("glyphicon-hourglass")
            para.removeClass("text-warning text-success")
            toggleMonoEnableMenus(false)
            break;
        default:
            text.text("Mono is not connected")
            icon.removeClass("glyphicon-ok glyphicon-hourglass").addClass("glyphicon-remove")
            para.removeClass("text-success").addClass("text-warning")
            toggleMonoEnableMenus(false)
            break;
    }
}

$(window).ready(() => {

    updateMonoState("unknown");
    ipcRenderer.send("detectCommand", "updateMonoState")
    ipcRenderer.on("updateMonoState", (evnt, message) => {
        updateMonoState(message);
        connectTimer = setTimeout(() => { ipcRenderer.send("detectCommand", "updateMonoState") }, 1000)
    })

    console.log("setting up command listeners...");

    $("#uploadCommand").click(() => {
        clearTimeout(connectTimer)
        updateMonoState("upload")
        ipcRenderer.send("uploadCommand", "uploadCommandComplete")
        $("#uploadModal").modal({show: true, keyboard: false})
    });
    ipcRenderer.on("uploadCommandComplete", (evnt, message) => {
        console.log("upload completed: "+message);
        $("#uploadModal").modal("hide")
        if (message.match(/error:/)) {
            displayError("Upload Error", message)
        }

        ipcRenderer.send("detectCommand", "updateMonoState")
    })


    $("#createCommand").click(() => {
        $("#createModal").modal("show");
    });
    $("#createConfirm").click(() => {
        ipcRenderer.send("createCommand", [$("#createProjectName").val(), $("#createNotBare").prop("checked"), $("#createOpenAtom").prop("checked"), "createCommandComplete"]);
    })
    ipcRenderer.on("createCommandComplete", (evnt, message) => {
        console.log("main returned: "+message)
        if (message.match(/^ok$/)) {
            $("#createModal").modal("hide")
            $("#createProjectName").val("")
        }
    })

    $("#openCommand").click(() => {
        ipcRenderer.send("openCommand");
    });
    $("#createForm").submit((evnt) => {
        evnt.preventDefault();
        evnt.stopPropagation();
        
        ipcRenderer.send("createCommand", [$("#createProjectName").val(), $("#createNotBare").prop("checked"), $("#createOpenAtom").prop("checked"), "createCommandComplete"]);
    })

    $("#docsLink").click(() => {shell.openExternal("http://developer.openmono.com") })
    $("#communityLink").click(() => {shell.openExternal("https://community.openmono.com") })
    $("#kioskLink").click(() => {shell.openExternal("https://monokiosk.com") })
});
