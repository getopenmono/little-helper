
const {app, BrowserWindow, dialog, ipcMain, ipcRenderer} = require('electron')
const child = require("child_process")
const Promise = require("promise")
const Fs = require("fs")
const Path = require("path")

exports.openElfFile = function(evnt, arg)
{
    return new Promise((fulfill, reject) => {
        dialog.showOpenDialog({
            title: "Open Mono Application (ELF file)",
            filters: [ { name: "Mono Applications", extensions: ["elf"]} ],
            properties: ["openFile"]
        }, (files) => {
            fulfill(files)
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

        mp.stdout.pipe(process.stdout)
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

exports.downloadMonoFile = function(url, targetFileName = null)
{
    return new Promise((fulfill, reject) => {
        const https = require("https")
        const Url = require("url")
        var parsedUrl = Url.parse(url.replace("openmono://", "https://"))
        console.log("Downloading URL: "+parsedUrl.href)
        var req = https.get(parsedUrl.href, (res) => {
            var tmpFile;

            if (res.statusCode == 302) {
                console.log("Redirecting...")
                exports.downloadMonoFile(res.headers["location"], targetFileName || Path.basename(parsedUrl.pathname)).then(fulfill, reject)
                return
            }

            Fs.mkdtemp("tmp", (err, tmpPath) => {
                tmpFile = Path.join(tmpPath, targetFileName || Path.basename(parsedUrl.pathname))
                
                res.on("data", (data) => {
                    Fs.appendFile(tmpFile, data)
                })
            })

            res.on("end", () => {
                if (res.statusCode != 200)
                    reject("Invalid status code!");
                else
                    fulfill(tmpFile);
            })

            res.on("error", (err) => {
                reject(err)
            })
        })
    })
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

exports.installFromUrl = function(url, webContents = null)
{
    if (webContents != null)
        webContents.send("urlUploadTrigger")
    
    exports.downloadMonoFile(url).then((path) => {
        exports.uploadFile(path).then(() => {
            RmTmpFile(path)
            if (webContents != null)
                webContents.send("uploadCommandComplete")
        }, (err) => {
            RmTmpFile(path)
            if (webContents != null)
                webContents.send("uploadCommandComplete", "error: "+err)
        });
    }, (err) => {
        console.error(err);
    })
}

exports.attachHandlers = function() {
    ipcMain.on("uploadCommand", exports.uploadCommand);
    ipcMain.on("detectCommand", (evnt, arg) => {
        exports.detectMono().then((state) => {
            evnt.sender.send(arg, state);
        })
    })
}
