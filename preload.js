const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadData:    ()       => ipcRenderer.invoke('load-data'),
    saveData:    (data)   => ipcRenderer.invoke('save-data', data),
    deleteData:  ()       => ipcRenderer.invoke('delete-data'),
    getDataPath: ()       => ipcRenderer.invoke('get-data-path'),
    openEmail:   ()       => ipcRenderer.invoke('open-email') // <--- NOUVELLE LIGNE
});