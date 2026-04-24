export function studentsModule() {
    return {
        get filteredMainList() {
            const base = this.students.filter(s =>
                s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
                (this.mainGenderFilter === 'ALL' || s.gender === this.mainGenderFilter)
            );
            if (this.showOnlyUnplaced) {
                const unplaced = base.filter(s => !this.isStudentPlaced(s.id)).sort((a, b) => a.name.localeCompare(b.name));
                const placed   = base.filter(s =>  this.isStudentPlaced(s.id)).sort((a, b) => a.name.localeCompare(b.name));
                return [...unplaced, ...placed];
            }
            return base.sort((a, b) => a.name.localeCompare(b.name));
        },

        get classStats() {
            const total = this.students.length;
            if (total === 0) return null;
            const girls   = this.students.filter(s => s.gender === 'F').length;
            const boys    = this.students.filter(s => s.gender === 'M').length;
            const unknown = total - girls - boys;
            const bavards = this.students.filter(s => s.bavard).length;
            const pap     = this.students.filter(s => s.pap).length;
            const vision  = this.students.filter(s => s.vision).length;
            const aisle   = this.students.filter(s => s.aisle).length;
            const petits  = this.students.filter(s => s.height === 'petit').length;
            const grands  = this.students.filter(s => s.height === 'grand').length;
            const withNotes = this.students.filter(s => s.notes && s.notes.trim()).length;
            const withAvoid = this.students.filter(s => s.avoid && s.avoid.length > 0).length;
            const withForce = this.students.filter(s => s.force && s.force.length > 0).length;
            const placed   = this._getAssignments().length;
            const unplaced = total - placed;
            const pctGirls = total ? Math.round((girls / total) * 100) : 0;
            const pctBoys  = total ? Math.round((boys  / total) * 100) : 0;
            const anyProfile  = bavards + pap + vision + aisle > 0;
            const anyStature  = petits + grands > 0;
            const anyRelation = withAvoid + withForce > 0;
            return { total, girls, boys, unknown, bavards, pap, vision, aisle,
                     petits, grands, withNotes, withAvoid, withForce,
                     placed, unplaced, pctGirls, pctBoys,
                     anyProfile, anyStature, anyRelation };
        },

        get selectedStudentIndex() {
            return this.filteredMainList.findIndex(s => s.id === this.selectedStudent?.id);
        },

        get hasPreviousStudent() { return this.selectedStudentIndex > 0; },

        get hasNextStudent() {
            return this.selectedStudentIndex !== -1 && this.selectedStudentIndex < this.filteredMainList.length - 1;
        },

        openModal(s) {
            this.selectedStudent = s;
            this.neighborFilter = 'ALL';
            this.forceFilter = 'ALL';
            this.avoidFilter = 'ALL';
        },

        closeModal() {
            this.selectedStudent = null;
            this.saveLocal();
        },

        previousStudent() { this.openModal(this.filteredMainList[this.selectedStudentIndex - 1]); },
        nextStudent()     { this.openModal(this.filteredMainList[this.selectedStudentIndex + 1]); },

        getNeighborHistory(studentId) {
            const result = [];
            const studentMap = {};
            this.students.forEach(s => studentMap[s.id] = s);
            this.plans.forEach(plan => {
                const assignment = plan.assignments.find(a => a.studentId === studentId);
                if (!assignment) return;
                const neighbors = plan.assignments.filter(a =>
                    a.row === assignment.row &&
                    Math.abs(a.col - assignment.col) === 1 &&
                    !this.aisles.includes(a.col)
                ).map(a => studentMap[a.studentId]).filter(Boolean);
                if (neighbors.length > 0) {
                    result.push({ planName: plan.name, neighbors });
                }
            });
            return result;
        },

        getStudent(id) { return this.students.find(s => s.id === id); },

        splitStudentName(name) {
            const parts = (name || '').split(' ');
            const isUpper = w => w.length > 1 && w === w.toUpperCase();
            const nomParts    = parts.filter(w => isUpper(w));
            const prenomParts = parts.filter(w => !isUpper(w));
            if (nomParts.length && prenomParts.length)
                return { nom: nomParts.join(' '), prenom: prenomParts.join(' ') };
            return { nom: parts.slice(1).join(' ') || parts[0], prenom: parts.length > 1 ? parts[0] : '' };
        },

        removeStudent(id) {
            this.plans.forEach(p => {
                const seat = p.assignments.find(a => a.studentId === id);
                if (seat) {
                    const key = `${seat.row}-${seat.col}`;
                    this.fixedSeats  = this.fixedSeats.filter(k => k !== key);
                    this.manualSeats = this.manualSeats.filter(k => k !== key);
                }
            });
            this.students = this.students.filter(s => s.id !== id);
            this.plans.forEach(p => p.assignments = p.assignments.filter(a => a.studentId !== id));
            this.saveLocal();
        },
    };
}
