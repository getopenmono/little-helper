
const {app, BrowserWindow, ipcRenderer} = require('electron')
const path = require('path')
const Fs = require("fs")
const url = require('url')
const Promise = require("promise")
const Access = Promise.denodeify(Fs.access)

const upload = require("./upload_app")
const project = require("./projects")
const Settings = require("./settings")

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

upload.attachHandlers();
project.attachCommands();

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({width: 800, height: 600})

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

    createWindow();

    app.setAsDefaultProtocolClient("openmono", null, ["--url"]);

    let url = "openmono://github.com/getopenmono/clock/releases/download/v0.1.0/clock.elf"
    console.log("OPEN URL: "+url)
    upload.downloadMonoFile(url).then(upload.openElfFile, (err) => {
        console.error(err);
    })

})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    app.quit()
})

app.on('activate', () => {

    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

app.on("open-file", (evnt, path) => {
    console.log("Open file: "+path);
    project.openPath({sender: win.webContent}, path);

    evnt.preventDefault();
})

app.on("open-url", (evnt, url) => {
    console.log("OPEN URL: "+url)
    upload.downloadMonoFile(url).then(upload.openElfFile, (err) => {
        console.error(err);
    })
})

process.on('uncaughtException', function (error) {
    // Handle the error
    console.error(error);
    throw error;
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
