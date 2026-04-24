export function gridModule() {
    return {
        toggleDarkMode() {
            this.darkMode = !this.darkMode;
            document.documentElement.classList.toggle('dark', this.darkMode);
            localStorage.setItem('cmDarkMode', this.darkMode);
        },

        get gridCells() {
            const cells = [];
            const n = Number(this.rows);
            const m = Number(this.cols);
            for (let r = n; r >= 1; r--)
                for (let c = 1; c <= m; c++)
                    cells.push({ r, c, key: `${r}-${c}` });
            return cells;
        },

        getColsDescending() { return Array.from({length: Number(this.cols)}, (_, i) => i + 1).reverse(); },
        getColsAscending()  { return Array.from({length: Number(this.cols)}, (_, i) => i + 1); },

        getRowsDescending() {
            const n = Number(this.rows); const result = [];
            for (let i = n; i >= 1; i--) result.push(i); return result;
        },

        getRowsAscending() {
            const n = Number(this.rows); const result = [];
            for (let i = 1; i <= n; i++) result.push(i); return result;
        },

        toggleBlockedSeat(r, c) {
            const key = `${r}-${c}`;
            if (this.blockedSeats.includes(key)) {
                this.blockedSeats = this.blockedSeats.filter(b => b !== key);
            } else {
                this.blockedSeats.push(key);
                this._setAssignments(this._getAssignments().filter(a => !(a.row === parseInt(r) && a.col === parseInt(c))));
                this.fixedSeats  = this.fixedSeats.filter(k => k !== key);
                this.manualSeats = this.manualSeats.filter(k => k !== key);
            }
            this.saveLocal();
        },

        getUnplacedStudents() {
            const placedIds = new Set(this._getAssignments().map(a => a.studentId));
            return this.students.filter(s => !placedIds.has(s.id));
        },

        isStudentPlaced(studentId) {
            return this._getAssignments().some(a => a.studentId === studentId);
        },

        manualAssign(r, c, sid) {
            if (this._isAlphaPlan()) return;
            const key = `${parseInt(r)}-${parseInt(c)}`;
            this.manualSeats = this.manualSeats.filter(k => k !== key);
            this.fixedSeats  = this.fixedSeats.filter(k => k !== key);
            if (sid) {
                const oldA = this._getAssignments().find(a => a.studentId === sid);
                if (oldA) {
                    const oldKey = `${oldA.row}-${oldA.col}`;
                    this.manualSeats = this.manualSeats.filter(k => k !== oldKey);
                    this.fixedSeats  = this.fixedSeats.filter(k => k !== oldKey);
                }
            }
            let arr = this._getAssignments().filter(a => a.studentId !== sid && !(a.row === parseInt(r) && a.col === parseInt(c)));
            if (sid) arr.push({ studentId: sid, row: parseInt(r), col: parseInt(c) });
            this._setAssignments(arr);
            this.saveLocal();
        },

        isManual(r, c) { return this.manualSeats.includes(`${r}-${c}`) && !!this.getOccupant(r, c); },

        toggleManual(r, c) {
            const key = `${r}-${c}`;
            if (this.manualSeats.includes(key)) {
                this.manualSeats = this.manualSeats.filter(k => k !== key);
                this.fixedSeats  = this.fixedSeats.filter(k => k !== key);
            } else if (this.getOccupant(r, c)) {
                this.manualSeats.push(key);
                this.fixedSeats.push(key);
            }
            this.saveLocal();
        },

        isFixed(r, c) { return this.fixedSeats.includes(`${r}-${c}`); },

        toggleFixed(r, c) {
            const key = `${r}-${c}`;
            if (this.fixedSeats.includes(key)) this.fixedSeats = this.fixedSeats.filter(k => k !== key);
            else this.fixedSeats.push(key);
            this.saveLocal();
        },

        toggleAisle(c) {
            this.aisles.includes(c)
                ? (this.aisles = this.aisles.filter(x => x !== c))
                : this.aisles.push(c);
            this.plans.forEach(p => p.assignments = p.assignments.filter(a => a.col !== c));
            this.saveLocal();
        },

        assign(r, c, sid) {
            if (this._isAlphaPlan()) return;
            let arr = this._getAssignments().filter(a => a.studentId !== sid && !(a.row === parseInt(r) && a.col === parseInt(c)));
            if (sid) arr.push({ studentId: sid, row: parseInt(r), col: parseInt(c) });
            this._setAssignments(arr);
            this.saveLocal();
        },

        getOccupant(r, c) {
            return this._getAssignments().find(a => a.row === parseInt(r) && a.col === parseInt(c))?.studentId || null;
        },

        clearGrid() {
            if (this._isAlphaPlan()) return;
            this._setAssignments([]);
            this.manualSeats = [];
            this.fixedSeats  = [];
            this.saveLocal();
        },
    };
}
