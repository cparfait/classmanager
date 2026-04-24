export function plansModule() {
    return {
        _isAlphaPlan() { return this.currentPlanIndex === -1; },

        _alphaAssignments() {
            const sorted = [...this.students].sort((a, b) => a.name.localeCompare(b.name));
            const seats = [];
            for (let r = 1; r <= Number(this.rows); r++) {
                for (let c = 1; c <= Number(this.cols); c++) {
                    if (!this.aisles.includes(c) && !this.blockedSeats.includes(`${r}-${c}`))
                        seats.push({ r, c });
                }
            }
            return sorted.slice(0, seats.length).map((s, i) => ({
                studentId: s.id, row: seats[i].r, col: seats[i].c
            }));
        },

        _selectAlphaPlan() {
            this.currentPlanIndex = -1;
            this.saveLocal();
        },

        _getAssignments() {
            if (this._isAlphaPlan()) return this._alphaAssignments();
            return this.plans[this.currentPlanIndex]?.assignments ?? [];
        },

        _setAssignments(val) {
            if (this._isAlphaPlan()) return;
            if (this.plans[this.currentPlanIndex]) this.plans[this.currentPlanIndex].assignments = val;
        },

        addPlan() {
            const newIndex = this.plans.length;
            this.plans.push({ id: Date.now(), name: `Plan ${String(newIndex + 1).padStart(2, '0')}`, assignments: [] });
            this.currentPlanIndex = newIndex;
            this.saveLocal();
        },

        deletePlan(index) {
            if (this.plans.length <= 1) return;
            const plan = this.plans[index];
            const doDelete = () => this._doDeletePlan(index);
            if (plan.assignments && plan.assignments.length > 0) {
                this.confirmModal = {
                    show: true,
                    title: 'Supprimer ce plan ?',
                    message: `"${plan.name}" contient ${plan.assignments.length} élève(s) placé(s). Cette suppression est irréversible.`,
                    suggestion: '',
                    nextPlanIndex: -1,
                    nextPlanName: '',
                    confirmLabel: '🗑️ Supprimer',
                    onConfirm: doDelete,
                };
            } else {
                doDelete();
            }
        },

        _doDeletePlan(index) {
            this.plans.splice(index, 1);
            if (this.currentPlanIndex >= this.plans.length) {
                this.currentPlanIndex = this.plans.length - 1;
            } else if (this.currentPlanIndex > index) {
                this.currentPlanIndex--;
            }
            this.saveLocal();
        },

        switchPlan(index) {
            this.currentPlanIndex = index;
            this.saveLocal();
        },
    };
}
