export function teachersModule() {
    return {
        // ─── Utilitaire sécurité ──────────────────────────────────────────────────

        /** Hache un PIN avec SHA-256 via Web Crypto (disponible dans Electron/Chromium) */
        async _hashPin(pin) {
            const data = new TextEncoder().encode(String(pin));
            const buf  = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(buf))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        },

        /** Vérifie un PIN saisi face à un hash stocké (+ fallback migration plain-text) */
        async _verifyPin(input, teacher) {
            if (teacher.pinHash) {
                const hash = await this._hashPin(input);
                return hash === teacher.pinHash;
            }
            // Migration : ancien PIN en clair — compare directement
            return input === teacher.pin;
        },

        // ─── Getters ─────────────────────────────────────────────────────────────

        get canSwitchToSolo() {
            return !(this.appMode === 'multi' && this.teachers.length > 0);
        },

        // ─── Mode de l'application ───────────────────────────────────────────────

        chooseSoloMode() {
            if (!this.canSwitchToSolo) return;
            this.appMode = 'solo';
            this.showModeSelection = false;
            this.saveLocal();
            if (this.students.length === 0) this._startWelcomeFlow();
        },

        chooseMultiMode() {
            this.appMode = 'multi';
            this.showModeSelection = false;
            this.sessionLocked = true;
            this.currentTeacherId = null;
            this.saveLocal();
        },

        // ─── Getters calculés ────────────────────────────────────────────────────

        get currentTeacher() {
            return this.teachers.find(t => t.id === this.currentTeacherId) || null;
        },

        get visibleClasses() {
            if (this.appMode === 'multi' && this.currentTeacherId) {
                return this.classes.filter(c => c.teacherId === this.currentTeacherId);
            }
            return this.classes;
        },

        // ─── Session / verrouillage ──────────────────────────────────────────────

        lockSession() {
            this.syncClassData();
            this.saveLocal();
            this.currentTeacherId = null;
            this.sessionLocked = true;
            this._clearAutoLock();
        },

        openPinModal(teacher) {
            this.pinTarget = teacher;
            this.pinInput  = '';
            this.pinError  = '';
            this.showPinModal = true;
        },

        /** Soumission du PIN — async pour le hachage SHA-256 */
        async submitPin() {
            if (!this.pinTarget) return;

            const isValid = await this._verifyPin(this.pinInput, this.pinTarget);

            if (isValid) {
                // Migration transparente : si le PIN était en clair, on le hache maintenant
                if (!this.pinTarget.pinHash) {
                    const teacher = this.teachers.find(t => t.id === this.pinTarget.id);
                    if (teacher) {
                        teacher.pinHash = await this._hashPin(this.pinInput);
                        delete teacher.pin;
                    }
                }

                this.currentTeacherId = this.pinTarget.id;
                this.sessionLocked    = false;
                this.showPinModal     = false;
                this.pinInput = ''; this.pinError = ''; this.pinTarget = null;

                const mine = this.classes.filter(c => c.teacherId === this.currentTeacherId);
                if (mine.length && !mine.find(c => c.id === this.currentClassId)) {
                    this.currentClassId = mine[0].id;
                    this.loadClassData(mine[0]);
                } else if (!mine.length) {
                    this._createDefaultClassForTeacher(this.currentTeacherId);
                }
                this._startAutoLock();
                this.saveLocal();
                if (this.students.length === 0) this._startWelcomeFlow();
            } else {
                this.pinError = 'PIN incorrect ❌';
                this.pinInput = '';
            }
        },

        // ─── Création / édition / suppression d'enseignant ───────────────────────

        /** Création d'un enseignant — async pour le hachage SHA-256 du PIN */
        async createTeacher() {
            const f = this.newTeacherForm;
            if (!f.name.trim()) return;
            if (!/^\d{6}$/.test(f.pin)) return;
            if (f.pin !== f.pinConfirm) return;

            const pinHash = await this._hashPin(f.pin);
            const teacher = {
                id: 't_' + crypto.randomUUID(),
                name: f.name.trim(),
                pinHash,          // stocke uniquement le hash, jamais le PIN brut
                color: f.color,
            };

            this.teachers.push(teacher);
            this.showCreateTeacherModal = false;
            this.newTeacherForm = { name: '', pin: '', pinConfirm: '', color: '#6366f1' };
            this.currentTeacherId = teacher.id;
            this.sessionLocked    = false;
            this._createDefaultClassForTeacher(teacher.id);
            this._startAutoLock();
            this.saveLocal();
            if (this.students.length === 0) this._startWelcomeFlow();
        },

        _createDefaultClassForTeacher(teacherId) {
            this.syncClassData();
            const cls = {
                id: 'c_' + crypto.randomUUID(),
                teacherId,
                name: 'Ma Classe', level: '', year: this._currentSchoolYear(),
                rows: 5, cols: 9,
                students: [], aisles: [], blockedSeats: [], fixedSeats: [], manualSeats: [],
                plans: [{ id: crypto.randomUUID(), name: 'Plan 01', assignments: [] }],
                currentPlanIndex: 0,
            };
            this.classes.push(cls);
            this.currentClassId = cls.id;
            this.loadClassData(cls);
            this.editMode = true;
        },

        openEditTeacher(teacher) {
            if (teacher.id !== this.currentTeacherId) return;
            this.editTeacherForm = {
                id: teacher.id, name: teacher.name, color: teacher.color,
                pinOld: '', pinNew: '', pinConfirm: '',
                pinOldError: '', pinNewError: '',
            };
            this.showEditTeacherModal = true;
        },

        /** Sauvegarde de l'édition — async pour la vérification/hachage des PINs */
        async saveEditTeacher() {
            const f = this.editTeacherForm;
            const t = this.teachers.find(t => t.id === f.id);
            if (!t) return;
            f.pinOldError = ''; f.pinNewError = '';

            if (f.pinNew) {
                // Vérification du PIN actuel
                const isOldValid = await this._verifyPin(f.pinOld, t);
                if (!isOldValid) { f.pinOldError = 'PIN actuel incorrect'; return; }
                if (!/^\d{6}$/.test(f.pinNew)) { f.pinNewError = 'PIN : 6 chiffres requis'; return; }
                if (f.pinNew !== f.pinConfirm)  { f.pinNewError = 'Les PINs ne correspondent pas'; return; }

                // Stocke le nouveau hash, supprime l'éventuel PIN en clair (migration)
                t.pinHash = await this._hashPin(f.pinNew);
                delete t.pin;
            }

            t.name  = f.name.trim() || t.name;
            t.color = f.color;
            this.showEditTeacherModal = false;
            this.saveLocal();
        },

        deleteTeacher(teacherId) {
            if (teacherId !== this.currentTeacherId) return;
            const t = this.teachers.find(t => t.id === teacherId);
            if (!confirm(`Supprimer le profil "${t?.name}" ? Toutes ses classes seront également supprimées.`)) return;
            this.teachers = this.teachers.filter(t => t.id !== teacherId);
            this.classes  = this.classes.filter(c => c.teacherId !== teacherId);
            if (!this.classes.find(c => c.id === this.currentClassId)) {
                const first = this.classes[0];
                this.currentClassId = first?.id || null;
                if (first) this.loadClassData(first);
            }
            this.saveLocal();
        },

        // ─── Auto-verrouillage ───────────────────────────────────────────────────

        _startAutoLock() {
            this._clearAutoLock();
            if (this.appMode !== 'multi' || !this.autoLockMinutes) return;
            this._autoLockTimer = setTimeout(
                () => this.lockSession(),
                this.autoLockMinutes * 60 * 1000
            );
        },

        _clearAutoLock() {
            if (this._autoLockTimer) {
                clearTimeout(this._autoLockTimer);
                this._autoLockTimer = null;
            }
        },

        _resetAutoLock() {
            if (this.appMode === 'multi' && this.currentTeacherId && !this.sessionLocked) {
                this._startAutoLock();
            }
        },
    };
}
