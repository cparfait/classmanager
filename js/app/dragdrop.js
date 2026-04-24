export function dragdropModule() {
    return {
        onDragStartCell(e, r, c) {
            if (this._isAlphaPlan()) { e.preventDefault(); return; }
            const sid = this.getOccupant(r, c);
            if (!sid) { e.preventDefault(); return; }
            this.dragState = { studentId: sid, fromRow: r, fromCol: c, fromList: false };
            e.dataTransfer.effectAllowed = 'move';
            e.currentTarget.classList.add('dragging');
        },

        onDragStartList(e, studentId) {
            if (this._isAlphaPlan()) { e.preventDefault(); return; }
            this.dragState = { studentId, fromRow: null, fromCol: null, fromList: true };
            e.dataTransfer.effectAllowed = 'move';
        },

        onDragEnd(e) {
            e.currentTarget.classList.remove('dragging');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        },

        onDragOver(e, r, c) {
            if (this._isAlphaPlan()) return;
            if (this.aisles.includes(c) || this.blockedSeats.includes(`${r}-${c}`)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            e.currentTarget.classList.add('drag-over');
        },

        onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); },

        onDrop(e, toRow, toCol) {
            e.currentTarget.classList.remove('drag-over');
            if (this._isAlphaPlan()) return;
            if (this.aisles.includes(toCol) || this.blockedSeats.includes(`${toRow}-${toCol}`)) return;
            const { studentId, fromRow, fromCol, fromList } = this.dragState;
            if (!studentId) return;
            const targetOccupant = this.getOccupant(toRow, toCol);
            const toKey = `${toRow}-${toCol}`;

            this.pushUndo();

            if (!fromList && fromRow !== null) {
                const fromKey = `${fromRow}-${fromCol}`;
                this.manualSeats = this.manualSeats.filter(k => k !== fromKey && k !== toKey);
                this.fixedSeats  = this.fixedSeats.filter(k => k !== fromKey && k !== toKey);
                let arr = this._getAssignments().filter(a => !(a.row === fromRow && a.col === fromCol));
                if (targetOccupant) {
                    arr = arr.filter(a => !(a.row === toRow && a.col === toCol));
                    arr.push({ studentId: targetOccupant, row: fromRow, col: fromCol });
                }
                arr.push({ studentId, row: toRow, col: toCol });
                this._setAssignments(arr);
            } else if (fromList) {
                const oldA = this._getAssignments().find(a => a.studentId === studentId);
                if (oldA) {
                    const oldKey = `${oldA.row}-${oldA.col}`;
                    this.manualSeats = this.manualSeats.filter(k => k !== oldKey);
                    this.fixedSeats  = this.fixedSeats.filter(k => k !== oldKey);
                }
                this.manualSeats = this.manualSeats.filter(k => k !== toKey);
                this.fixedSeats  = this.fixedSeats.filter(k => k !== toKey);
                let arr = this._getAssignments().filter(a => a.studentId !== studentId && !(a.row === toRow && a.col === toCol));
                arr.push({ studentId, row: toRow, col: toCol });
                this._setAssignments(arr);
            }
            this.dragState = { studentId: null, fromRow: null, fromCol: null, fromList: false };
            // Defer save so Alpine re-renders before the synchronous JSON serialisation
            setTimeout(() => this.saveLocal(), 0);
        },
    };
}
