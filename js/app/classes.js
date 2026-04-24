export function classesModule() {
    return {
        addNewClass() {
            if (!this.newClassForm.name.trim()) return;
            this.syncClassData();
            const cls = {
                id: 'c_' + Date.now(),
                teacherId: this.appMode === 'multi' ? this.currentTeacherId : null,
                name: this.newClassForm.name.trim(),
                level: this.newClassForm.level.trim(),
                year: this.newClassForm.year.trim() || this._currentSchoolYear(),
                rows: 5, cols: 9, students: [], aisles: [], blockedSeats: [],
                fixedSeats: [], manualSeats: [],
                plans: [{ id: Date.now(), name: 'Plan 01', assignments: [] }],
                currentPlanIndex: 0,
            };
            this.classes.push(cls);
            this.currentClassId = cls.id;
            this.loadClassData(cls);
            this.showAddClassModal = false;
            this.newClassForm = { name: '', level: '', year: '' };
            this.editMode = true;
            this.saveLocal();
        },

        openEditClass(cls) {
            this.editClassForm = { id: cls.id, name: cls.name, level: cls.level || '', year: cls.year || '' };
            this.showEditClassModal = true;
        },

        saveEditClass() {
            const f = this.editClassForm;
            if (!f.name.trim()) return;
            const cls = this.classes.find(c => c.id === f.id);
            if (!cls) return;
            cls.name  = f.name.trim();
            cls.level = f.level.trim();
            cls.year  = f.year.trim() || this._currentSchoolYear();
            this.showEditClassModal = false;
            this.saveLocal();
        },

        deleteClass(classId) {
            const cls = this.classes.find(c => c.id === classId);
            if (!cls) return;
            const msg = cls.students?.length
                ? `Supprimer "${cls.name}" ? Elle contient ${cls.students.length} élève(s). Cette action est irréversible.`
                : `Supprimer "${cls.name}" ?`;
            if (!confirm(msg)) return;
            this.classes = this.classes.filter(c => c.id !== classId);
            if (this.currentClassId === classId) {
                const next = this.visibleClasses[0];
                if (next) { this.currentClassId = next.id; this.loadClassData(next); }
            }
            this.saveLocal();
        },
    };
}
