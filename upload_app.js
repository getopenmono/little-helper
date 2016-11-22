
const {app, BrowserWindow, dialog, ipcMain, ipcRenderer} = require('electron')
const child = require("child_process")
const Promise = require("promise")

exports.openElfFile = function(evnt, arg)
{
    return new Promise((fulfill, reject) => {
        dialog.showOpenDialog({
            title: "Open Mono Application (ELF file)",
            filters: [ { name: "Mono Applications", extensions: ["elf"]} ],
            properties: ["openFile"]
        }, (files) => {
            if (files == null || files.length <= 0)
                reject()
            else {
                fulfill(files)
            }
        })
    })
}

exports.detectMono = function() {
    return new Promise((fulfill, reject) => {
        var hasEnded = false
        var returnCode = 0;
        var mp = child.exec("monomake monoprog -d", (err, stdout, stderr) => {
            if (err && hasEnded == false)
            {
                hasEnded = true
                console.error(err)
                reject(err)
            }
            else if (returnCode == 0) {
                fulfill(parseResponse(stdout.toString()))
            }
            else {
                fulfill("notConnected")
            }
        })

        var parseResponse = function(response) {
            if (response.match(/bootloader/))
                return "bootloader"
            else if (response.match(/app/))
                return "app"
            else
                return "unknown"
        }

        mp.on("exit", (code, signal) => {
            hasEnded = true
            returnCode = code;
        })

        //mp.stdout.pipe(process.stdout)
    });
}

exports.uploadFile = function(file) {
    return new Promise((fulfill, reject) => {
        console.log("programming file!");
        var pross = child.exec("monomake monoprog -p \""+file+"\"", (error, stdout, stderr) => {
            if (error) {
                console.error("could not run monoprog: "+error);
                reject(error)
            }
            else {
                fulfill(stdout, stderr)
            }
        })
        pross.stdout.pipe(process.stdout);
    });
}

exports.uploadCommand = function(evnt, args) {
    var uploadPromise = exports.openElfFile().then((files) => {
        if (files == null) {
            evnt.sender.send(args, "cancel");
            return;
        }

        console.log("loading ELF file: "+files[0])

        return exports.uploadFile(files[0]).then((stdout, stderr) => {
            console.log("Upload completed with:\n"+stdout);
            evnt.sender.send(args, "complete")
            return;
        }, (err) => { console.log("upload promise rejected, cb is: "+args); evnt.sender.send(args, "error: "+err) })
    }, (err) => { evnt.sender.send(args, "error: "+err) });

}

exports.attachHandlers = function() {
    ipcMain.on("uploadCommand", exports.uploadCommand);
    ipcMain.on("detectCommand", (evnt, arg) => {
        exports.detectMono().then((state) => {
            evnt.sender.send(arg, state);
        })
    })
}
