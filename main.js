const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

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
    const tempPath = filePath + '.tmp';
    
    // Validation minimale pour éviter d'écrire n'importe quoi
    if (!data || typeof data !== 'object') {
        console.error('Données invalides reçues');
        return false;
    }
    if (data.version === 2) {
        if (!Array.isArray(data.classes)) {
            console.error('Structure v2 invalide (classes manquant)');
            return false;
        }
    } else if (!Array.isArray(data.students) || !Array.isArray(data.plans)) {
        console.error('Structure de données invalide (students ou plans manquant)');
        return false;
    }
    
    try {
        // Écriture dans un fichier temporaire
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
        // Renommage atomique (remplace l'ancien fichier)
        fs.renameSync(tempPath, filePath);
        return true;
    } catch (err) {
        console.error('Erreur lors de l\'écriture des données:', err);
        // Nettoyage du temporaire si présent
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
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

// Version de l'application
ipcMain.handle('get-version', () => app.getVersion());

// Générer un vrai PDF via printToPDF (sans dialog d'impression)
ipcMain.handle('print-to-pdf', async (event, htmlContent) => {
    const tmpFile = path.join(app.getPath('temp'), 'classmanager-print.html');
    try {
        fs.writeFileSync(tmpFile, htmlContent, 'utf-8');
        const printWin = new BrowserWindow({
            show: false,
            webPreferences: { contextIsolation: true, nodeIntegration: false }
        });
        await printWin.loadFile(tmpFile);
        const pdfBuffer = await printWin.webContents.printToPDF({
            landscape: true,
            pageSize: 'A4',
            printBackground: true,
            margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 }
        });
        printWin.close();
        fs.unlinkSync(tmpFile);

        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Enregistrer le plan de classe',
            defaultPath: path.join(app.getPath('documents'), 'plan-de-classe.pdf'),
            filters: [{ name: 'PDF', extensions: ['pdf'] }]
        });
        if (filePath) {
            fs.writeFileSync(filePath, pdfBuffer);
            shell.openPath(filePath);
            return { success: true };
        }
        return { success: false, cancelled: true };
    } catch (err) {
        console.error('Erreur génération PDF:', err);
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        return { success: false, error: err.message };
    }
});

// === MISES À JOUR AUTOMATIQUES ===

// Logger minimaliste vers fichier (lisible depuis ⚙️ > Voir les logs)
function createUpdateLogger() {
    const logPath = path.join(app.getPath('userData'), 'update.log');
    return {
        logPath,
        write(msg) {
            const line = `[${new Date().toISOString()}] ${msg}\n`;
            fs.appendFileSync(logPath, line, 'utf-8');
            console.log(msg);
        }
    };
}

function setupAutoUpdater() {
    if (!app.isPackaged) return;

    const log = createUpdateLogger();
    log.write(`Démarrage auto-updater — version actuelle : ${app.getVersion()}`);

    // Assign logger to electron-updater
    autoUpdater.logger = {
        info:  m => log.write(`[INFO] ${m}`),
        warn:  m => log.write(`[WARN] ${m}`),
        error: m => log.write(`[ERROR] ${m}`),
        debug: () => {}
    };

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    setTimeout(() => {
        log.write('Vérification des mises à jour…');
        autoUpdater.checkForUpdates().catch(err => {
            log.write(`checkForUpdates échoué : ${err.message}`);
        });
    }, 3000);

    autoUpdater.on('checking-for-update',   () => log.write('Connexion à GitHub…'));
    autoUpdater.on('update-not-available',  () => log.write('Aucune mise à jour disponible.'));
    autoUpdater.on('download-progress', p  => log.write(`Téléchargement : ${Math.round(p.percent)}%`));

    autoUpdater.on('update-available', (info) => {
        log.write(`Mise à jour disponible : v${info.version} — téléchargement en cours…`);
    });

    autoUpdater.on('update-downloaded', (info) => {
        log.write(`Mise à jour v${info.version} téléchargée — proposition redémarrage`);
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Mise à jour prête',
            message: `ClassManager Pro ${info.version} est prêt à être installé.`,
            detail: 'La mise à jour sera appliquée automatiquement à la prochaine fermeture.\nVoulez-vous redémarrer maintenant ?',
            buttons: ['Redémarrer maintenant', 'Plus tard'],
            defaultId: 0,
            cancelId: 1,
            icon: path.join(__dirname, 'icon.ico')
        }).then(result => {
            if (result.response === 0) autoUpdater.quitAndInstall();
        });
    });

    autoUpdater.on('error', (err) => {
        log.write(`ERREUR : ${err.message}`);
        // Erreur silencieuse — ne pas déranger l'utilisateur pour un problème réseau ou de config
    });
}


// === CYCLE DE VIE DE L'APPLICATION ===

app.whenReady().then(() => {
    createWindow();
    setupAutoUpdater();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});