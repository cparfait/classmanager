# 🎓 ClassManager Pro

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Framework-Electron-blue.svg)](https://www.electronjs.org/)

**ClassManager Pro** est une application de bureau légère et performante pour les enseignants, permettant de gérer les profils élèves et de générer des plans de classe optimisés. Développée avec Electron, elle fonctionne intégralement hors-ligne avec sauvegarde locale automatique.

---

## 🚀 Fonctionnalités clés

* **🎨 Interface moderne** : UX fluide avec **Tailwind CSS** (build purgé, sans CDN) et **Alpine.js**.
* **🔌 100 % Offline** : Aucune dépendance réseau au lancement. Toutes les ressources sont embarquées.
* **⚙️ Zéro configuration serveur** : Données stockées en JSON local, aucun backend requis.
* **🏃 Haute portabilité** : Disponible en installateur NSIS ou en `.exe` portable (clé USB).
* **🧠 Placement intelligent** : Algorithme automatique respectant les contraintes (bavards, PAP, vision, allées, taille).
* **🖐️ Placement manuel** : Glisser-déposer ou assignation directe depuis la liste élèves.
* **📄 Export PDF** : Aperçu en fenêtre dédiée avec impression navigateur (format Prénom/Nom ou Nom/Prénom).
* **📊 Export Excel & JSON** : Export de la liste élèves ou sauvegarde complète des données.
* **🔄 Mise à jour automatique** : Via `electron-updater`, avec confirmation utilisateur avant téléchargement.

---

## 🛠️ Guide de développement

### Prérequis

* **Node.js (v18+)** : [Télécharger ici](https://nodejs.org/)
* Vérifiez votre installation : `node -v` et `npm -v`

### 1. Installation

```bash
# Cloner le projet
git clone https://github.com/cparfait/classmanager.git
cd classmanager

# Installer les dépendances (Electron, electron-builder, tailwindcss…)
npm install
```

### 2. Compiler le CSS (Tailwind purgé)

Le CSS Tailwind est généré à partir de `css/tailwind-input.css` et purgé en analysant `index.html` et `js/app/**/*.js`. Le fichier `css/tailwind.css` produit doit être compilé avant le premier lancement ou après toute modification des classes utilisées.

```bash
# Compilation unique (minifiée)
npm run build:css

# Mode watch (recompile à chaque modification)
npm run watch:css
```

### 3. Démarrer en mode développement

```bash
npm start
```

### Structure du projet

```
classmanager/
├── main.js               # Processus principal Electron
├── preload.js            # Bridge IPC sécurisé
├── index.html            # Shell de l'application
├── css/
│   ├── tailwind-input.css   # Source Tailwind (@tailwind base/components/utilities)
│   ├── tailwind.css         # CSS purgé généré — NE PAS ÉDITER MANUELLEMENT
│   └── app.css              # Styles personnalisés (animations, overrides)
├── js/
│   ├── alpine.min.js        # Alpine.js (embarqué)
│   ├── alpine-collapse.min.js
│   ├── xlsx.full.min.js     # Chargé à la demande (import Excel uniquement)
│   └── app/
│       ├── index.js         # Point d'entrée Alpine — compose tous les modules
│       ├── state.js         # État réactif initial
│       ├── students.js      # Gestion de la liste élèves
│       ├── classroom.js     # Configuration de la salle
│       ├── placement.js     # Logique de placement (manuel et drag)
│       ├── algorithm.js     # Algorithme auto (chargé à la demande)
│       ├── pdf.js           # Export PDF/aperçu (chargé à la demande)
│       ├── persistence.js   # Sauvegarde / import / export
│       └── diagnostics.js   # Alertes contraintes en temps réel
├── tailwind.config.js    # Config Tailwind (darkMode: 'class', content purge)
└── package.json
```

> **Note :** `xlsx.full.min.js`, le module `pdf.js` et le module `algorithm.js` sont **chargés à la demande** (lazy-load) pour accélérer le démarrage. Ils ne sont téléchargés en mémoire qu'à la première utilisation.

---

## ⚠️ Dépannage (réseau restrictif / proxy d'établissement)

Si `npm install` ou la compilation échoue avec une erreur SSL (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`) ou `403` (blocage de `winCodeSign`), c'est probablement le pare-feu ou l'antivirus qui bloque les serveurs de téléchargement Electron.

**1. Nettoyage :** Supprimez `node_modules/` et `package-lock.json` à la racine du projet.

**2. Configuration des miroirs :** Dans une invite de commandes `cmd` (pas PowerShell) :

```cmd
npm config set strict-ssl false
set NODE_TLS_REJECT_UNAUTHORIZED=0
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

*(Sous PowerShell : remplacez `set VAR=val` par `$env:VAR="val"`)*

**3. Relancez :**

```bash
npm install
npm run build:css
npm run build-portable
```

---

## 📦 Compilation & distribution

Les exécutables sont générés dans le dossier `dist/` (ignoré par Git).

| Format | Commande | Résultat |
| :--- | :--- | :--- |
| **Installateur Windows** | `npm run build` | Setup `.exe` NSIS |
| **Version Portable** | `npm run build-portable` | Fichier `.exe` autonome |

> L'icône de l'application est `icon.ico` (256×256) à la racine du projet.

---

## 💾 Gestion des données

* **Fichier de données** : `classmanager-data.json`, créé automatiquement dans le répertoire de l'exécutable (version portable) ou dans `AppData` (version installée).
* **Confidentialité** : Ce fichier est dans `.gitignore`. Aucune donnée n'est transmise à un serveur.
* **Sauvegarde** : Utilisez **"Tout Exporter"** dans l'application pour un backup JSON, ou **"Exporter Excel"** pour la liste élèves.

---

## ❓ FAQ

**L'application fonctionne-t-elle vraiment hors-ligne ?**
Oui. Toutes les ressources (Alpine.js, xlsx, CSS purgé) sont embarquées localement. Aucun appel réseau n'est effectué au lancement.

**Comment transférer mes données sur un autre ordinateur ?**
Copiez le fichier `classmanager-data.json` à côté de votre nouvel exécutable.

**Comment modifier les classes Tailwind sans tout reconstruire ?**
Utilisez `npm run watch:css` pendant le développement. Toute modification dans `index.html` ou `js/app/**/*.js` recompile le CSS automatiquement.

---

## 🤝 Contribution & licence

Ce projet est sous licence **GPL-3.0**. Vous êtes libre de l'utiliser, de le modifier et de le redistribuer, à condition de publier vos modifications sous la même licence.

Les *Pull Requests* sont les bienvenues !

---
Développé avec ❤️ par **Cris Tof**
