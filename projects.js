
const {app, BrowserWindow, dialog, ipcMain, ipcRenderer, shell} = require('electron')
const child = require("child_process")
const Path = require("path")
const Promise = require("promise")
const Settings = require("./settings")

exports.insertRecent = function(title, path, webSender) {
    var recent = {title: title, path: path};
    console.log("creating recent: ",recent);
    return Settings.get("recents").then((recents) => {
        console.log("Got recnts: ",recents);
        recents = [].concat(recents);

        if (recents.length > 0) {
            recents = recents.filter((r) => { return r["title"] != title || r["path"] != path; });
            console.log("No existing recnts: ",recents);
            while (recents.length >= 4)
            {
                recents.pop()
            }
        }

        console.log("less that 10: ", recents);
        recents.unshift(recent);

        console.log("Save new recent array: ", recents);
        webSender.send("recentsChanged", recents);
        return Settings.set("recents", recents);
    });
}

exports.createDialog = function(title, label) {
    if (title == undefined) {
        title = "Create new Project..."
    }
    if (label == undefined) {
        label = "Create"
    }
    return new Promise((fulfill, reject) => {
        dialog.showOpenDialog({
            title: title,
            buttonLabel: label,
            properties: ["openDirectory", "createDirectory"]
        }, (files) => {
            if (files == null) {
                console.log("cancelled")
                return reject()
            }
            else if (files.length <= 0) {
                console.log("no file(s) selected")
                return reject();
            }
            else {
                return fulfill(files[0])
            }
        })
    })
}

exports.createProject = function(path, isBare) {
    return new Promise((fulfill, reject) => {
        if (isBare == undefined) {
            isBare = false
        }
        const workingDir = Path.dirname(path)
        const name = Path.basename(path)
        const options = { "cwd": workingDir }
        console.log("create project: "+name+", at: "+workingDir)

        function parseOutput(output) {
            if (output.match(/Project target directory already exists/)) {
                    console.log("already exists!")
                    dialog.showMessageBox({
                        type: "error",
                        buttons: ["OK"],
                        title: name+" already exists!",
                        message: "There already exists a directory with the name "+name+" on the choosen directory"
                    })
                    reject("directory exists")
                    return false
                }
                else if (output.match(/Err: /)) {
                    console.error("make error!")
                    reject(output)
                    return false
                }
                else {
                    exports.insertRecent(name, path);
                    return true
                }
        }

        var cp = child.exec("monomake project "+name+(isBare?" --bare":""), options, (err, stdout, stderr) => {
            if (err) {
                console.error("monomake process returned error: "+err)
                if (!parseOutput(stdout.toString())) {
                    reject(err);
                }
            }
            else {
                console.log("parsing process output...")
                const output = stdout.toString()
                if (parseOutput(output)) {
                    fulfill(name)
                }
            }
        })

        cp.stdout.pipe(process.stdout)
    });
}

exports.createProjectCommand = function(evnt, args) {
    console.log(args)
    exports.createDialog().then((path) => {
        console.log("will create: "+path)
        exports.createProject(Path.join(path, args[0]), (args[1]?false:true)).then(() => {
            console.log("done")
            evnt.sender.send(args[3], "ok")
            if (args[2] == true) {
                exports.openProject(Path.join(path, args[0]))
            }
        }, (err) => {
            console.error(err)
            evnt.sender.send(args[3], "Error: "+err)
        })
    })
}

exports.openProject = function(path) {
    console.log("open in external editor: "+path)
    var proc = child.exec("atom \""+path+"\"", (err, stdout, stderr) => {
        if (err) {
            dialog.showErrorBox("Could not open Atom editor", err)
        }
    });

    proc.stdout.pipe(process.stdout)
}

exports.openCommand = function(evnt, args) {
    exports.createDialog("Open project directory", "Open").then((path) => {
        exports.openProject(path);
        console.log("calling recent routine");
        exports.insertRecent(Path.basename(path), path, evnt.sender);
    })
}

exports.getRecents = function(evnt)
{
    console.log("checking settings...", app.getPath("userData"));
    
    Settings.get("recents").then((recents) => {
        console.log("sending recents: ", recents);
        evnt.sender.send("recentsChanged", recents);
    }, (err) => {
        console.log(err);
        Settings.set("recents", []);
        evnt.sender.send("recentsChanged", []);
    });
}

exports.attachCommands = function() {
    ipcMain.on("createCommand", exports.createProjectCommand)
    ipcMain.on("openCommand", exports.openCommand)
    ipcMain.on("getRecents", exports.getRecents)
}
