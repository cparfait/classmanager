🎓 ClassManager Pro

ClassManager Pro est une application de bureau performante développée avec Electron pour la gestion scolaire. Elle permet de centraliser les données des élèves avec une sauvegarde locale automatique et sécurisée.

🚀 Fonctionnalités clés

Interface moderne : Interface fluide propulsée par Tailwind CSS et Alpine.js.

Gestion des élèves : Ajout, modification, suppression et recherche facilitée.

Zéro Configuration : Base de données locale JSON sans serveur requis.

Haute Portabilité : Disponible en version installable ou portable (.exe unique).

Export/Import : Génération de rapports Excel et sauvegardes JSON en un clic.

📂 Structure du Projet

Voici l'organisation des fichiers sources que vous trouverez dans ce dépôt :

main.js : Processus principal Electron (gestion des fenêtres et du système de fichiers).

preload.js : Pont sécurisé isolant les fonctions Node.js de l'interface web.

index.html : L'interface utilisateur complète (HTML/JS/CSS).

package.json : Configuration du projet, dépendances et scripts de compilation.

classmanager-data.json : (Exclu via .gitignore) Fichier où sont stockées vos données.

🛠️ Guide de Développement (Pour les Devs)

Prérequis

Node.js (version 18 ou supérieure) : Télécharger sur nodejs.org.

Vérifiez l'installation dans un terminal :

node --version
npm --version


Lancement en mode développement

Ouvrez un terminal dans le dossier du projet, puis :

# 1. Installer les dépendances (crée le dossier node_modules)
npm install

# 2. Lancer l'application pour test
npm start


📦 Compilation en .exe (Windows)

Une fois votre développement terminé, vous pouvez générer les exécutables dans le dossier /dist :

Format

Commande

Résultat

Installateur Classique

npm run build

.exe avec assistant d'installation standard.

Version Portable

npm run build-portable

ClassManager-Pro-Portable.exe (un seul fichier).

Ajouter une icône personnalisée

Créez une image .ico (256x256 pixels conseillé).

Nommez-la icon.ico.

Placez-la à la racine du projet avant de lancer la commande de build.

💾 Gestion et Sécurité des Données

Le logiciel utilise un système de persistance locale via le fichier classmanager-data.json.

Emplacement : Le fichier est stocké automatiquement à côté de l'exécutable (ou dans le dossier d'installation).

Sécurité GitHub : Ce fichier est listé dans le .gitignore. Vos données personnelles ne sont jamais publiées sur GitHub.

Persistance : Les données restent sauvegardées après fermeture ou redémarrage.

Réinitialisation : Le bouton "Reinitialiser" dans l'app supprime le fichier de données.

❓ FAQ

Q : L'application a-t-elle besoin d'Internet ?
R : Oui au premier lancement pour charger Tailwind CSS, Alpine.js et la bibliothèque Excel depuis les serveurs (CDN). Pour une version 100% hors-ligne, il faudrait inclure ces scripts localement.

Q : Puis-je copier l'application sur une clé USB ?
R : Oui ! C'est l'avantage de la version portable. Copiez simplement le fichier .exe et votre fichier classmanager-data.json sur la clé pour retrouver vos données partout.

Q : Comment sauvegarder mes données manuellement ?
R : C'est automatique ! Cependant, le bouton "Tout Exporter" crée aussi un fichier .json de sauvegarde que vous pouvez stocker ailleurs.

📝 Licence

Projet libre d'utilisation. N'hésitez pas à proposer des améliorations via les Pull Requests !