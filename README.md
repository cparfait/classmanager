# 🎓 ClassManager Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Framework-Electron-blue.svg)](https://www.electronjs.org/)

**ClassManager Pro** est une solution légère et performante conçue pour la gestion scolaire simplifiée. Développée avec Electron, elle permet de centraliser les données des élèves avec une sauvegarde locale automatique, sans fioritures complexes.

---

## 🚀 Fonctionnalités clés

* **🎨 Interface Moderne** : Une expérience utilisateur fluide propulsée par **Tailwind CSS** et **Alpine.js**.
* **⚙️ Zéro Configuration** : Base de données locale JSON intégrée. Pas de serveur à configurer, pas de SQL à installer.
* **🏃 Haute Portabilité** : Utilisez la version installable ou emportez votre gestionnaire partout avec le format portable (.exe unique).
* **📊 Export Excel** : Générez vos rapports et listes d'élèves en un clic pour une utilisation administrative.

---

## 🛠️ Guide de Développement

### Prérequis

* **Node.js (v18+)** : [Télécharger ici](https://nodejs.org/)
* Vérifiez votre installation :
    ```bash
    node -v
    npm -v
    ```

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

---

## 📦 Compilation & Distribution

Utilisez les scripts configurés dans le `package.json` pour générer vos exécutables dans le dossier `/dist` :

| Format | Commande | Résultat |
| :--- | :--- | :--- |
| **Installateur Windows** | `npm run build` | `.exe` avec assistant d'installation |
| **Version Portable** | `npm run build-portable` | Un seul fichier `.exe` autonome |

> [!TIP]
> **Icône personnalisée** : Placez un fichier `icon.ico` (256x256) à la racine du projet avant de lancer la compilation pour personnaliser votre application.

---

## 💾 Gestion des Données

Le logiciel utilise un système de persistance locale via le fichier `classmanager-data.json`.

* **Emplacement** : Le fichier se crée automatiquement dans le répertoire de l'exécutable.
* **Confidentialité** : Ce fichier est listé dans le `.gitignore`. Vos données personnelles restent sur votre machine et ne sont jamais envoyées sur GitHub.
* **Sauvegarde** : Utilisez le bouton **"Tout Exporter"** dans l'application pour générer un backup manuel.

---

## ❓ FAQ

**L'application fonctionne-t-elle hors-ligne ?**
Au premier lancement, une connexion est requise pour charger les bibliothèques via CDN (Tailwind, Alpine). Pour un usage 100% offline, les scripts devront être intégrés localement au projet.

**Comment transférer mes données ?**
Il suffit de copier le fichier `classmanager-data.json` et de le placer dans le même dossier que votre exécutable portable (sur une clé USB, par exemple).

---
Développé avec ❤️ par [Cris Tof]