# ClassManager Pro - Guide de compilation

## Structure du projet

```
classmanager-app/
  main.js          -> Processus principal Electron (gestion fichier)
  preload.js       -> Pont securise entre Electron et l'interface
  index.html       -> L'application complete
  package.json     -> Configuration du projet et du build
  icon.ico         -> (optionnel) Icone de l'application
```

## Prerequis

1. Node.js (version 18 ou superieure)
   Telecharger sur https://nodejs.org/ (version LTS recommandee)

2. Verifier l'installation dans un terminal :
   ```
   node --version
   npm --version
   ```

## Lancement en mode developpement

Ouvrir un terminal dans le dossier classmanager-app/ puis :

```bash
# 1. Installer les dependances
npm install

# 2. Lancer l'application en mode dev
npm start
```

## Compiler en .exe (Windows)

### Option A : Installateur classique (.exe avec installation)
```bash
npm run build
```
Le fichier .exe sera dans le dossier dist/

### Option B : Version portable (un seul .exe, rien a installer)
```bash
npm run build-portable
```
Le fichier ClassManager-Pro-Portable.exe sera dans dist/

## Ou sont stockees les donnees ?

Les donnees sont sauvegardees automatiquement dans un fichier
classmanager-data.json situe A COTE du .exe (dans le dossier d'installation).

- Sauvegarde automatique a chaque modification
- Persistance : les donnees restent apres fermeture/redemarrage
- Reinitialisation : le bouton "Reinitialiser" supprime le fichier
- Export/Import : fonctionne normalement via les boutons dedies

## Ajouter une icone personnalisee

1. Creer ou telecharger une image .ico (256x256 pixels)
2. La nommer icon.ico
3. La placer dans le dossier classmanager-app/
4. Recompiler avec npm run build

## FAQ

Q : L'application a besoin d'internet ?
R : Oui au premier lancement pour charger Tailwind CSS, Alpine.js et
    la lib Excel depuis les CDN. Pour une version 100% hors-ligne,
    il faudrait telecharger ces fichiers et les inclure localement.

Q : Je peux copier l'application sur une cle USB ?
R : Oui ! Avec la version portable, copier le .exe + le fichier
    classmanager-data.json sur la cle.

Q : Comment sauvegarder mes donnees ?
R : C'est automatique ! Le bouton "Tout Exporter" cree aussi un .json
    de sauvegarde. Ou copier directement classmanager-data.json.
