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

## 🛠️ Guide de Développement

### Prérequis

* **Node.js (v18+)** : [Télécharger ici](https://nodejs.org/)
* Vérifiez votre installation : `node -v` et `npm -v`

### Installation & Lancement

1.  **Cloner le projet** :
    ```bash
    git clone [https://github.com/cparfait/classmanager.git](https://github.com/cparfait/classmanager.git)
    cd ClassManager
    ```

2.  **Installer les dépendances** :
    ```bash
    npm install
    ```

3.  **Démarrer en mode Développement** :
    ```bash
    npm start
    ```

### Structure du projet
Pour garantir le fonctionnement hors-ligne, assurez-vous que les bibliothèques sont présentes :
* `js/tailwind.min.js`
* `js/alpine.min.js`
* `js/xlsx.full.min.js`

---

## 📦 Compilation & Distribution

Générez vos exécutables dans le dossier `/dist` via les scripts `package.json` :

| Format | Commande | Résultat |
| :--- | :--- | :--- |
| **Installateur Windows** | `npm run build` | `.exe` avec assistant d'installation |
| **Version Portable** | `npm run build-portable` | Un seul fichier `.exe` autonome |

> [!TIP]
> **Icône personnalisée** : Placez un fichier `icon.ico` (256x256) à la racine du projet avant de lancer la compilation.

---

## 💾 Gestion des Données

Le logiciel utilise un système de persistance locale via le fichier `classmanager-data.json`.

* **Emplacement** : Le fichier se crée automatiquement dans le répertoire de l'exécutable.
* **Confidentialité** : Ce fichier est listé dans le `.gitignore`. Vos données personnelles ne sont jamais envoyées sur un serveur.
* **Sauvegarde** : Utilisez le bouton **"Tout Exporter"** pour un backup manuel en format JSON.

---

## ❓ FAQ

**L'application fonctionne-t-elle vraiment hors-ligne ?**
Oui. Contrairement aux versions précédentes, toutes les ressources sont embarquées localement dans le dossier `/js`. L'application ne fait aucun appel réseau.

**Comment transférer mes données ?**
Copiez simplement le fichier `classmanager-data.json` et placez-le au même endroit que votre nouvel exécutable sur une autre machine.

---
Développé avec ❤️ par **Cris Tof**