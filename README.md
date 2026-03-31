# 🎓 ClassManager Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Framework-Electron-blue.svg)](https://www.electronjs.org/)

**ClassManager Pro** est une solution légère et performante conçue pour la gestion scolaire simplifiée. Développée avec Electron, elle permet de centraliser les données des élèves avec une sauvegarde locale automatique et une intelligence de placement optimisée.

---

## 🚀 Fonctionnalités clés

* **🎨 Interface Moderne** : Une expérience utilisateur fluide propulsée par **Tailwind CSS** et **Alpine.js**.
* **🔌 100% Offline** : Aucune dépendance externe (CDN). L'application fonctionne sans internet dès le premier lancement.
* **⚙️ Zéro Configuration** : Base de données locale JSON intégrée. Pas de serveur à configurer.
* **🏃 Haute Portabilité** : Disponible en version installable ou portable (un seul fichier `.exe`).
* **📊 Export Excel & PDF** : Générez vos listes et plans de classe professionnels en un clic.

---

## 🛠️ Guide de Développement (Installation & Compilation)

Si vous souhaitez modifier le code ou générer vous-même l'exécutable (`.exe`), voici la marche à suivre.

### Prérequis

* **Node.js (v18+)** : [Télécharger ici](https://nodejs.org/)
* Vérifiez votre installation dans votre terminal : `node -v` et `npm -v`

### 1. Installation

Commencez par récupérer le projet et télécharger les bibliothèques requises (comme le moteur Electron et les outils de compilation) :

\`\`\`bash
# Cloner le projet
git clone https://github.com/cparfait/classmanager.git
cd classmanager

# Télécharger et installer les dépendances (Electron, electron-builder...)
npm install
\`\`\`

### 2. Démarrer en mode Développement

Pour tester vos modifications en direct sans avoir à compiler l'application :

\`\`\`bash
npm start
\`\`\`

### Structure du projet
Pour garantir le fonctionnement hors-ligne, assurez-vous que les bibliothèques front-end sont bien présentes dans votre dossier :
* `js/tailwind.min.js`
* `js/alpine.min.js`
* `js/xlsx.full.min.js`

---

## 📦 Compilation & Distribution

Générez vos exécutables Windows directement dans le dossier `dist/` (qui est ignoré par Git pour ne pas alourdir le dépôt) via les scripts de votre `package.json` :

| Format | Commande | Résultat |
| :--- | :--- | :--- |
| **Installateur Windows** | `npm run build` | Un setup `.exe` classique (NSIS) |
| **Version Portable** | `npm run build-portable` | Un seul fichier `.exe` autonome (idéal clé USB) |

> [!TIP]
> **Icône personnalisée** : L'application utilise le fichier `icon.ico` (256x256) situé à la racine du projet lors de la compilation.

---

## 💾 Gestion des Données

Le logiciel utilise un système de persistance locale extrêmement simple via le fichier `classmanager-data.json`.

* **Emplacement** : En version portable, le fichier se crée automatiquement dans le même répertoire que l'exécutable.
* **Confidentialité** : Ce fichier est listé dans le `.gitignore`. Vos données de classe (noms des élèves, notes) ne sont jamais envoyées sur un serveur ou sur GitHub.
* **Sauvegarde** : Utilisez le bouton **"Tout Exporter"** dans l'application pour un backup manuel en format JSON.

---

## ❓ FAQ

**L'application fonctionne-t-elle vraiment hors-ligne ?**
Oui. Contrairement aux versions précédentes, toutes les ressources sont embarquées localement dans le dossier `/js`. L'application ne fait aucun appel réseau externe.

**Comment transférer mes données sur un autre ordinateur ?**
Copiez simplement votre fichier local `classmanager-data.json` et placez-le au même endroit que votre nouvel exécutable sur l'autre machine.

---
Développé avec ❤️ par **Cris Tof**
