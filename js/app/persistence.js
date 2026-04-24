export function persistenceModule() {
    return {
        saveLocal() {
            this.syncClassData();
            const payload = {
                version: 2,
                appMode: this.appMode,
                teachers: this.teachers || [],
                classes: this.classes,
                currentClassId: this.currentClassId,
            };
            const cleanPayload = JSON.parse(JSON.stringify(payload));
            if (this._isElectron) {
                window.electronAPI.saveData(cleanPayload);
            } else {
                localStorage.setItem('classManagerData_v10', JSON.stringify(cleanPayload));
            }
            this.saveStatus = '✓';
            setTimeout(() => this.saveStatus = '', 1500);
        },

        hardReset() {
            if (confirm('Tout effacer ? Toutes les données seront supprimées.')) {
                if (this._isElectron) {
                    window.electronAPI.deleteData().then(() => { window.location.reload(); });
                } else {
                    localStorage.clear(); sessionStorage.clear();
                    window.location.href = window.location.href.split('?')[0] + '?reset=' + Date.now();
                }
            }
        },

        _getExportPayload() {
            return JSON.stringify({
                rows: this.rows, cols: this.cols, students: this.students,
                plans: this.plans, currentPlanIndex: this.currentPlanIndex,
                aisles: this.aisles, blockedSeats: this.blockedSeats,
                fixedSeats: this.fixedSeats, manualSeats: this.manualSeats,
            });
        },

        exportData() {
            const blob = new Blob([this._getExportPayload()], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Classe_${new Date().toLocaleDateString()}.json`;
            a.click();
        },

        exportStudentsOnly() {
            const blob = new Blob([JSON.stringify({ type: 'students_only', students: this.students })], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Eleves_${new Date().toLocaleDateString()}.json`;
            a.click();
        },

        importData(e) {
            const f = e.target.files[0]; if (!f) return;
            const r = new FileReader();
            r.onload = (ev) => {
                const d = JSON.parse(ev.target.result);
                if (d.type === 'students_only') { this.students = d.students; this.initEmptyPlans(); }
                else { Object.assign(this, d); if (!this.manualSeats) this.manualSeats = []; }
                this.saveLocal(); this.editMode = false; e.target.value = '';
            };
            r.readAsText(f);
        },

        importExcel(e) {
            const file = e.target.files[0]; if (!file) return;

            const NOM_ALIASES    = ['nom', 'name', 'élève', 'eleve', 'nom de l\'élève', 'nom complet', 'étudiant', 'apprenant', 'identité', 'identite'];
            const PRENOM_ALIASES = ['prénom', 'prenom', 'first name', 'firstname', 'first_name'];
            const SEXE_ALIASES   = ['sexe', 'sex', 'genre', 'gender', 'civilité', 'civilite'];
            const FEMININ  = ['f', 'fille', 'female', 'femme', 'mme', 'mme.', 'féminin', 'feminin'];
            const MASCULIN = ['m', 'garçon', 'garcon', 'male', 'homme', 'm.', 'mr', 'mr.', 'masculin'];

            const match = (cell, aliases) => aliases.includes(String(cell).trim().toLowerCase());

            const reader = new FileReader();
            reader.onload = (ev) => {
                const data = new Uint8Array(ev.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                let headerRow = -1, nomCol = -1, prenomCol = -1, sexeCol = -1;
                for (let i = 0; i < Math.min(rows.length, 20); i++) {
                    rows[i].forEach((cell, j) => {
                        if (match(cell, NOM_ALIASES))    { nomCol = j;    headerRow = i; }
                        if (match(cell, PRENOM_ALIASES)) { prenomCol = j; headerRow = i; }
                        if (match(cell, SEXE_ALIASES))     sexeCol = j;
                    });
                    if (headerRow !== -1) break;
                }

                if (headerRow === -1) {
                    alert('⚠️ Aucune colonne "Nom" ou "Prénom" reconnue dans ce fichier.\n\nColonnes attendues : Nom, Prénom, Élève, Sexe, Genre, Civilité…');
                    e.target.value = ''; return;
                }

                let added = 0;
                for (let i = headerRow + 1; i < rows.length; i++) {
                    const row = rows[i];
                    let name = '';
                    if (nomCol !== -1 && prenomCol !== -1) {
                        const prenom = String(row[prenomCol] || '').trim();
                        const nom    = String(row[nomCol]    || '').trim();
                        name = [prenom, nom].filter(Boolean).join(' ');
                    } else if (nomCol !== -1) {
                        name = String(row[nomCol] || '').trim();
                    } else {
                        name = String(row[prenomCol] || '').trim();
                    }
                    if (!name) continue;

                    const sexeRaw = sexeCol !== -1 ? String(row[sexeCol] || '').trim().toLowerCase() : '';
                    const gender = FEMININ.includes(sexeRaw) ? 'F' : MASCULIN.includes(sexeRaw) ? 'M' : '';

                    if (!this.students.find(s => s.name === name)) {
                        this.students.push({ id: Date.now() + Math.random(), name, gender, bavard: false, pap: false, vision: false, aisle: false, height: '', force: [], avoid: [], notes: '' });
                        added++;
                    }
                }

                if (added === 0) alert('⚠️ Aucun nouvel élève importé (déjà présents ou fichier vide).');
                else { this.editMode = false; this._selectAlphaPlan(); }
                this.saveLocal(); e.target.value = '';
            };
            reader.readAsArrayBuffer(file);
        },

        importStudentsText() {
            const lines = this.bulkList.split('\n').map(l => l.trim()).filter(Boolean);
            lines.forEach(name => {
                if (!this.students.find(s => s.name === name)) {
                    this.students.push({ id: Date.now() + Math.random(), name, gender: '', bavard: false, pap: false, vision: false, aisle: false, height: '', force: [], avoid: [], notes: '' });
                }
            });
            this.bulkList = '';
            this._selectAlphaPlan();
            this.saveLocal();
        },

        // Sidebar toggle (rebuild.py patch #14)
        toggleSidebar() {
            this.sidebarVisible = !this.sidebarVisible;
            localStorage.setItem('cmSidebarVisible', this.sidebarVisible);
        },

        pushUndo() {
            this.undoStack.push({
                assignments: JSON.parse(JSON.stringify(this._getAssignments())),
                manualSeats: JSON.parse(JSON.stringify(this.manualSeats || [])),
                fixedSeats:  JSON.parse(JSON.stringify(this.fixedSeats  || [])),
            });
            if (this.undoStack.length > 20) this.undoStack.shift();
        },

        undo() {
            if (this.undoStack.length === 0) return;
            const snap = this.undoStack.pop();
            this._setAssignments(snap.assignments);
            this.manualSeats = snap.manualSeats;
            this.fixedSeats  = snap.fixedSeats;
            this.saveLocal();
        },
    };
}
