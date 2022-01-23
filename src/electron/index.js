const electron = require('electron');
const usb = require('usb');
const Store = require('electron-store');

const { connectUsb, setColor, waitForSerial, setMute } = require('./usb');

//const SerialPort = require('serialport')
//const Readline = require('@serialport/parser-readline');

//const set = require('serialport')
//const Readline = require('@serialport/parser-readline');

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');
const store = new Store();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

async function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200, 
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
        }
    });

    await connectUsb();

    await waitForSerial();

    // and load the index.html of the app.
    const startUrl = process.env.ELECTRON_START_URL || url.format({
        pathname: path.join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: true
    });
    console.log(startUrl);
    mainWindow.loadURL(startUrl);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// Asynchronous

electron.ipcMain.on('asynchronous-message', async (event, arg) => {
    console.log("asynchronous-message ", arg);
    event.reply('asynchronous-reply', 'pong')
});


// Synchronous

electron.ipcMain.on('set-mute', async (event, value) => {
    console.log(">>");
    setMute(value);
    event.returnValue = "okay";
});

electron.ipcMain.on('get-color', async (event) => {
    const color = store.get('color');
    event.returnValue = color;
});

electron.ipcMain.on('set-color', async (event, color) => {
    console.log("COLOR");
    store.set('color', color);
    setColor(color.rgb.r, color.rgb.g, color.rgb.b);
    event.returnValue = 'okay';
});

electron.ipcMain.on('set-default-color', async (event, color) => {
    setColor(color.red, color.green, color.blue, true);
    event.returnValue = 'okay';
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.