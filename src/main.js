import electron from 'electron'
import fs from 'fs'
const app = electron.app
const bw = electron.BrowserWindow
const ipc = electron.ipcMain

ipc.on('data', (event, arg) => {
  console.log(event,arg)
  event.sender.send('data','gotcha') // reply to message
})

let mainWindow
const homeDir = __dirname.replace('dist','')

function createWindow () {
  mainWindow = new bw({'autoHideMenuBar':true,width: 800, height: 600})
  mainWindow.loadURL('file://'+homeDir+'/static/index.html')
  mainWindow.on('closed', () => { mainWindow = null })
}

app.on('ready', createWindow)

// OSX stuff
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') { app.quit() }
})
app.on('activate', function () { if (mainWindow === null) createWindow() })
