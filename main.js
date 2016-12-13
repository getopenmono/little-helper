
const {app, BrowserWindow, ipcMain, ipcRenderer, dialog, crashReporter} = require('electron')
const Path = require('path')
const Fs = require("fs")
const url = require('url')
const Promise = require("promise")
const Access = Promise.denodeify(Fs.access)

crashReporter.start({
  productName: 'MonoMake-UI',
  companyName: 'Monolit ApS',
  submitURL: "http://localhost:8080/",
  autoSubmit: true
})

console.log("Temp Dir: ",app.getPath("temp"))

const upload = require("./upload_app")
const project = require("./projects")
const Settings = require("./settings")

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
var winPrmFulfill = null;
var winPrm = new Promise((fulfill, reject) => {
    winPrmFulfill = fulfill;
})

upload.attachHandlers();
project.attachCommands();

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({title: "Monomake", width: 820, height: 660, minWidth: 800, minHeight: 520})

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: Path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    //win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })

    ipcMain.once("domReady", () => {
        console.log("DOM is ready!");
        if (winPrmFulfill)
            winPrmFulfill();
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

    createWindow();

    app.setAsDefaultProtocolClient("openmono", null, ["--url"]);
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    // if (process.platform != 'darwin') {
    app.quit();
    //}
})

app.on('activate', () => {

    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

app.on("open-file", (evnt, path) => {

    if (win == null)
    {
        console.log("window not ready, call when ready!")
        winPrm.then(() => {
            console.log("Open file: "+path);
            if (path.match(/\.elf$/))
            {
                upload.uploadElfFile(path, win.webContents);
            }
            else {
                project.openPath({sender: win.webContents}, path);
            }
        });
    }
    else
    {
        console.log("Open file: "+path);
        if (path.match(/\.elf$/))
        {
            upload.uploadElfFile(path, win.webContents);
        }
        else
        {
            project.openPath({sender: win.webContents}, path);
        }
    }

    evnt.preventDefault();
})

app.on("open-url", (evnt, url) => {
    console.log("open url ", url)
    if (win == null)
    {
        console.log("window not ready, call when ready!")
        winPrm.then(() => {
            upload.installFromUrl(url, win.webContents)
        })
    }
    else
    {
         upload.installFromUrl(url, win.webContents)
    }
    
    evnt.preventDefault();
})

process.on('uncaughtException', function (error) {
    // Handle the error
    console.error(error);
    process.crash();
})

winPrm.then(() => {
    //var chunk = consoleStream.read()
    //win.webContents.send("consoleOutput", chunk)

    // consoleStream.on("data", (data) => {
    //     if (win)
    //         win.webContents.send("consoleOutput", data)
    // })

    //consoleStream.eventNames()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
