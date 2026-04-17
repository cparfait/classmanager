; ============================================================
; ClassManager Pro — Script NSIS personnalisé
; Propose la suppression des données utilisateur à la désinstallation
; ============================================================

!macro customUnInstall
  ; Boîte de dialogue de confirmation avant de supprimer les données
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Voulez-vous supprimer vos données ClassManager Pro ?$\n$\n\
    Cela effacera définitivement :$\n\
    • La liste de vos élèves$\n\
    • Vos plans de classe$\n\
    • Tous les profils et placements$\n$\n\
    Si vous réinstallez l'application, choisissez NON$\n\
    pour conserver toutes vos données." \
    IDNO skip_delete

    ; Suppression du dossier userData (AppData\Roaming\ClassManager Pro)
    RMDir /r "$APPDATA\ClassManager Pro"

  skip_delete:
!macroend
