const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Détermine le chemin de stockage du fichier de données JSON.
 * Gère dynamiquement le mode développement, le mode installé et le mode portable.
 */
function getDataPath() {
    if (app.isPackaged) {
        // 1. Mode PORTABLE : Sauvegarde à côté du .exe (ex: sur une clé USB)
        if (process.env.PORTABLE_EXECUTABLE_DIR) {
            return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'classmanager-data.json');
        } 
        // 2. Mode INSTALLÉ : Utilise le dossier AppData standard de Windows
        else {
            return path.join(app.getPath('userData'), 'classmanager-data.json');
        }
    } 
    // 3. Mode DÉVELOPPEMENT : À côté du fichier main.js
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
        autoHideMenuBar: true, // Cache la barre de menu Alt
        backgroundColor: '#f1f5f9'
    });

    mainWindow.loadFile('index.html');

    /**
     * Sécurité : Ouvre les liens externes (http, mailto) dans le navigateur par défaut
     * de l'utilisateur. Autorise les autres (comme la génération PDF) à s'ouvrir.
     */
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // 1. Si c'est un lien web classique, on l'ouvre sur Chrome/Edge/Firefox
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
            shell.openExternal(url);
            return { action: 'deny' }; // On refuse l'ouverture dans l'app car le navigateur s'en charge
        }
        
        // 2. Pour tout le reste (notamment ton PDF généré), ON AUTORISE L'OUVERTURE
        return { action: 'allow' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith('mailto:')) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    // Démarre l'application en fenêtre agrandie
    mainWindow.maximize();
}

// === GESTION DES DONNÉES (Communication avec index.html) ===

// Charger les données
ipcMain.handle('load-data', async () => {
    const filePath = getDataPath();
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            try {
                return JSON.parse(raw);
            } catch (jsonErr) {
                console.error('Erreur : Fichier JSON corrompu ou illisible.');
                return null;
            }
        }
    } catch (err) {
        console.error('Erreur lors de la lecture des données:', err);
    }
    return null;
});

// Sauvegarder les données
ipcMain.handle('save-data', async (event, data) => {
    const filePath = getDataPath();
    try {
        // Sauvegarde propre avec indentation pour faciliter la lecture/backup
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('Erreur lors de l\'écriture des données:', err);
        return false;
    }
});

// Réinitialiser (Supprimer le fichier)
ipcMain.handle('delete-data', async () => {
    const filePath = getDataPath();
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return true;
    } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        return false;
    }
});

// Obtenir le chemin réel (utile pour le débogage)
ipcMain.handle('get-data-path', async () => {
    return getDataPath();
});

// === CYCLE DE VIE DE L'APPLICATION ===

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // Sur Windows et Linux, quitter l'application quand toutes les fenêtres sont fermées
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});