const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Le fichier de données est stocké DANS le répertoire de l'application
// En mode dev : à côté de main.js
// En mode packagé : dans le dossier d'installation (resources/)
function getDataPath() {
    if (app.isPackaged) {
        // 1. Détection du mode PORTABLE
        if (process.env.PORTABLE_EXECUTABLE_DIR) {
            // Sauvegarde les données sur la clé USB ou le Bureau, juste à côté du .exe
            return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'classmanager-data.json');
        } 
        // 2. Détection du mode INSTALLÉ (via l'installateur classique)
        else {
            // Utilise le dossier standard de Windows (%APPDATA%) pour éviter les erreurs de permissions
            return path.join(app.getPath('userData'), 'classmanager-data.json');
        }
    } 
    // 3. Mode DÉVELOPPEMENT (quand vous faites npm start)
    else {
        return path.join(__dirname, 'classmanager-data.json');
    }
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        title: 'ClassManager Pro',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true,     // Cache la barre de menu
        backgroundColor: '#f1f5f9'
    });

    mainWindow.loadFile('index.html');

    // Intercepter les liens target="_blank" pour les ouvrir dans le navigateur externe (Chrome, Firefox, etc.)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
            require('electron').shell.openExternal(url);
        }
        return { action: 'deny' }; // Important pour ne pas ouvrir de sous-fenêtre Electron
    });

    // Intercepter les clics normaux sur les liens mailto (sans target="_blank")
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith('mailto:')) {
            event.preventDefault(); // Empêche la fenêtre Electron de changer de page
            require('electron').shell.openExternal(url); // Ouvre le client mail de l'ordinateur
        }
    });

    // Plein écran au démarrage (optionnel, décommente si souhaité)
    mainWindow.maximize();
}

// === GESTION DES DONNÉES (IPC) ===

// Charger les données depuis le fichier JSON
ipcMain.handle('load-data', async () => {
    const filePath = getDataPath();
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('Erreur lecture données:', err);
    }
    return null;  // Pas de données sauvegardées
});

// Sauvegarder les données dans le fichier JSON
ipcMain.handle('save-data', async (event, data) => {
    const filePath = getDataPath();
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('Erreur écriture données:', err);
        return false;
    }
});

// Supprimer le fichier de données (réinitialisation)
ipcMain.handle('delete-data', async () => {
    const filePath = getDataPath();
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return true;
    } catch (err) {
        console.error('Erreur suppression données:', err);
        return false;
    }
});

// Obtenir le chemin du fichier de données (pour info/debug)
ipcMain.handle('get-data-path', async () => {
    return getDataPath();
});

// === CYCLE DE VIE ===

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});