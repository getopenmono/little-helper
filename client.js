
window.$ = window.jQuery = require("./bower_components/jquery/dist/jquery.js");
const recents = require("./recents");
const {shell, crashReporter} = require("electron");

crashReporter.start({
  productName: 'MonoMake-UI',
  companyName: 'Monolit ApS',
  submitURL: "http://localhost:8080/",
  autoSubmit: true
})

const ipcRenderer = require("electron").ipcRenderer;
var connectTimer = null;

ipcRenderer.on("consoleOutput", (data) => {
    data
    //console.log(data)
})

const toggleMonoEnableMenus = function (enabled) {
    if (enabled) {
        $("#uploadCommand").removeClass("disabled");
    }
    else {
        $("#uploadCommand").addClass("disabled");
    }
}

const toggleProjectMenus = function(enabled)
{
    if (enabled)
        $(".projectCommand").removeClass("disabled");
    else
        $(".projectCommand").addClass("disabled");
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
        connectTimer = setTimeout(() => { ipcRenderer.send("detectCommand", "updateMonoState") }, 200)
    })

    ipcRenderer.on("atomPresent", (evnt, message) => {
        if (!message.present)
        {
            toggleProjectMenus(false);
            $("#atomAlert").removeClass("hidden")
        }
    })
    ipcRenderer.send("atomPresent")

    console.log("setting up command listeners...");

    $("#uploadCommand").click(() => {
        if ($("#uploadCommand").hasClass("disabled"))
            return;

        clearTimeout(connectTimer)
        updateMonoState("upload")
        ipcRenderer.send("uploadCommand", "uploadCommandComplete")
        $("#uploadProgressBar").addClass("active").css("width","100%")
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

    ipcRenderer.on("urlUploadTrigger", (evnt, message) => {
        clearTimeout(connectTimer)
        updateMonoState("upload")
        $("#uploadProgressBar").addClass("active").css("width","100%")
        $("#uploadModal").modal({show: true, keyboard: false})
    })

    $("#createCommand").click(() => {
        $("#createModal").modal("show");
    });
    $("#createConfirm").click(() => {
        console.error("this method is deprecated, use submit event!")
        var projName = $("#createProjectName").val()
        projName = projName.trim().replace(/\s/g,"-");
        $("#createProjectName").val(projName);
        ipcRenderer.send("createCommand", [projName, $("#createNotBare").prop("checked"), $("#createOpenAtom").prop("checked"), "createCommandComplete"]);
    })
    ipcRenderer.on("createCommandComplete", (evnt, message) => {
        console.log("main returned: "+message)
        if (message.match(/^ok$/)) {
            $("#createModal").modal("hide")
            $("#createProjectName").val("")
        }
    })
    ipcRenderer.on("uploadProgress", (evnt, message) => {
        $("#uploadProgressBar").css("width",message+"%").removeClass("active").attr("aria-valuenow",message)
        $("#uploadProgressBar > span").text(message+"%")
        console.log(message+"%")
    })

    $("#openCommand").click(() => {
        if (!$("#openCommand").hasClass("disabled"))
            ipcRenderer.send("openCommand");
    });
    $("#createForm").submit((evnt) => {
        evnt.preventDefault();
        evnt.stopPropagation();

        var projName = $("#createProjectName").val()
        projName = projName.trim().replace(/\s/g,"-");
        $("#createProjectName").val(projName);
        ipcRenderer.send("createCommand", [projName, $("#createNotBare").prop("checked"), $("#createOpenAtom").prop("checked"), "createCommandComplete"]);
    })

    ipcRenderer.on("recentsChanged", recents.recentsChangedHandler);
    ipcRenderer.send("getRecents");

    $("#docsLink").click(() => {shell.openExternal("http://developer.openmono.com") })
    $("#communityLink").click(() => {shell.openExternal("https://community.openmono.com") })
    $("#kioskLink").click(() => {shell.openExternal("https://monokiosk.com") })

    $(".atomLink").click(() => { shell.openExternal("https://atom.io") })
});
