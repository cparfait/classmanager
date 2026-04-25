export function teachersModule() {
    return {
        get canSwitchToSolo() {
            return !(this.appMode === 'multi' && this.teachers.length > 0);
        },

        chooseSoloMode() {
            if (!this.canSwitchToSolo) return;
            this.appMode = 'solo';
            this.showModeSelection = false;
            this.saveLocal();
            if (this.students.length === 0 && !localStorage.getItem('cmOnboardingDone')) {
                this.$nextTick(() => { this.showOnboarding = true; this.onboardingStep = 0; });
            } else if (this.students.length === 0) {
                this.$nextTick(() => { this.showImportHelpModal = true; });
            }
        },

        chooseMultiMode() {
            this.appMode = 'multi';
            this.showModeSelection = false;
            this.sessionLocked = true;
            this.currentTeacherId = null;
            this.saveLocal();
        },

        get currentTeacher() {
            return this.teachers.find(t => t.id === this.currentTeacherId) || null;
        },

        get visibleClasses() {
            if (this.appMode === 'multi' && this.currentTeacherId) {
                return this.classes.filter(c => c.teacherId === this.currentTeacherId);
            }
            return this.classes;
        },

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

        submitPin() {
            if (!this.pinTarget) return;
            if (this.pinInput === this.pinTarget.pin) {
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
            } else {
                this.pinError = 'PIN incorrect ❌';
                this.pinInput = '';
            }
        },

        createTeacher() {
            const f = this.newTeacherForm;
            if (!f.name.trim()) return;
            if (!/^\d{4}$/.test(f.pin)) return;
            if (f.pin !== f.pinConfirm) return;
            const teacher = { id: 't_' + Date.now(), name: f.name.trim(), pin: f.pin, color: f.color };
            this.teachers.push(teacher);
            this.showCreateTeacherModal = false;
            this.newTeacherForm = { name: '', pin: '', pinConfirm: '', color: '#6366f1' };
            this.currentTeacherId = teacher.id;
            this.sessionLocked    = false;
            this._createDefaultClassForTeacher(teacher.id);
            this._startAutoLock();
            this.saveLocal();
        },

        _createDefaultClassForTeacher(teacherId) {
            this.syncClassData();
            const cls = {
                id: 'c_' + Date.now(), teacherId,
                name: 'Ma Classe', level: '', year: this._currentSchoolYear(),
                rows: 5, cols: 9, students: [], aisles: [], blockedSeats: [], fixedSeats: [], manualSeats: [],
                plans: [{ id: Date.now(), name: 'Plan 01', assignments: [] }],
                currentPlanIndex: 0,
            };
            this.classes.push(cls);
            this.currentClassId = cls.id;
            this.loadClassData(cls);
            this.editMode = true;
        },

        openEditTeacher(teacher) {
            if (teacher.id !== this.currentTeacherId) return;
            this.editTeacherForm = { id: teacher.id, name: teacher.name, color: teacher.color, pinOld: '', pinNew: '', pinConfirm: '', pinOldError: '', pinNewError: '' };
            this.showEditTeacherModal = true;
        },

        saveEditTeacher() {
            const f = this.editTeacherForm;
            const t = this.teachers.find(t => t.id === f.id);
            if (!t) return;
            f.pinOldError = ''; f.pinNewError = '';
            if (f.pinNew) {
                if (f.pinOld !== t.pin) { f.pinOldError = 'PIN actuel incorrect'; return; }
                if (!/^\d{4}$/.test(f.pinNew)) { f.pinNewError = 'PIN : 4 chiffres'; return; }
                if (f.pinNew !== f.pinConfirm)  { f.pinNewError = 'Les PINs ne correspondent pas'; return; }
                t.pin = f.pinNew;
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

        _startAutoLock() {
            this._clearAutoLock();
            if (this.appMode !== 'multi' || !this.autoLockMinutes) return;
            this._autoLockTimer = setTimeout(() => this.lockSession(), this.autoLockMinutes * 60 * 1000);
        },

        _clearAutoLock() {
            if (this._autoLockTimer) { clearTimeout(this._autoLockTimer); this._autoLockTimer = null; }
        },

        _resetAutoLock() {
            if (this.appMode === 'multi' && this.currentTeacherId && !this.sessionLocked) this._startAutoLock();
        },
    };
}
