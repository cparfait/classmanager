export function diagnosticsModule() {
    return {
        getPlacementIssues(placement) {
            let issues = [];
            let grid = {}, studentMap = {};
            this.students.forEach(s => studentMap[s.id] = s);
            placement.forEach(p => grid[`${p.row}-${p.col}`] = studentMap[p.studentId]);

            let historySet = new Set();
            for (let i = 0; i < this.currentPlanIndex; i++)
                this.plans[i].assignments.forEach(a => historySet.add(`${a.studentId}-${a.row}-${a.col}`));

            const placedIds = new Set(placement.map(p => p.studentId));
            const unplaced = this.students.filter(s => !placedIds.has(s.id));
            if (unplaced.length > 0)
                issues.push(`${unplaced.length} élève(s) non placé(s) : ${unplaced.map(s => s.name).join(', ')}`);

            placement.forEach(p => {
                let s = studentMap[p.studentId]; if (!s) return;
                if ((s.pap || s.vision) && p.row > 2) issues.push(`${s.name} (PAP/Vue) éloigné du tableau.`);
                if (s.aisle && !this.aisles.includes(p.col-1) && !this.aisles.includes(p.col+1)) issues.push(`${s.name} (Besoin Allée) mal placé.`);
                if (historySet.has(`${s.id}-${p.row}-${p.col}`)) issues.push(`${s.name} remis à une ancienne place.`);
                let leftStudent  = grid[`${p.row}-${p.col - 1}`];
                let rightStudent = grid[`${p.row}-${p.col + 1}`];
                if (s.force && s.force.length > 0)
                    s.force.forEach(tid => { if ((!leftStudent || leftStudent.id !== tid) && (!rightStudent || rightStudent.id !== tid)) issues.push(`${s.name} séparé de son binôme.`); });
                if (s.avoid && s.avoid.length > 0) {
                    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        let neighbor = grid[`${p.row + dr}-${p.col + dc}`];
                        if (neighbor && s.avoid.includes(neighbor.id)) issues.push(`${s.name} trop proche de ${neighbor.name} (à éviter).`);
                    }
                    for (const dc of [-1, 1]) {
                        const adjCol = p.col + dc;
                        if (this.aisles.includes(adjCol)) {
                            const beyondNb = grid[`${p.row}-${p.col + dc * 2}`];
                            if (beyondNb && s.avoid.includes(beyondNb.id)) issues.push(`${s.name} séparé de ${beyondNb.name} (à éviter) par une allée seulement.`);
                        }
                    }
                }
                if (s.bavard) {
                    placement.filter(q => q.studentId !== s.id).forEach(q => {
                        const nb = studentMap[q.studentId]; if (!nb || !nb.bavard) return;
                        if (q.row === p.row) {
                            const dist = Math.abs(q.col - p.col);
                            if (dist === 1) issues.push(`${s.name} (Bavard) adjacent à ${nb.name} (Bavard).`);
                            else if (dist === 2) { const midCol = (p.col + q.col) / 2; if (this.aisles.includes(midCol)) issues.push(`${s.name} (Bavard) séparé de ${nb.name} (Bavard) par une allée seulement.`); }
                        }
                        if (q.col === p.col && Math.abs(q.row - p.row) === 1) issues.push(`${s.name} (Bavard) derrière/devant ${nb.name} (Bavard).`);
                        if (Math.abs(q.row - p.row) === 1 && Math.abs(q.col - p.col) === 1) issues.push(`${s.name} (Bavard) en diagonale de ${nb.name} (Bavard).`);
                    });
                }
            });
            return [...new Set(issues)];
        },

        testCurrentPlan() {
            const asgn = this._getAssignments();
            if (asgn.length === 0) { alert('Le plan est vide, rien à tester.'); return; }
            this.diagnosticIssues = this.getPlacementIssues(asgn);
            if (this.diagnosticIssues.length === 0) {
                this.perfectScoreMsg = true;
                setTimeout(() => this.perfectScoreMsg = false, 4000);
            } else {
                this.showDiagnosticModal = true;
            }
        },
    };
}
