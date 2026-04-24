export function algorithmModule() {
    return {
        generateAutoPlan() {
            if (this._isAlphaPlan()) { this.currentPlanIndex = 0; }
            const currentPlan = this.plans[this.currentPlanIndex];
            if (currentPlan.assignments && currentPlan.assignments.length > 0) {
                const nextPlanIndex = this.plans.findIndex((p, i) => i !== this.currentPlanIndex && (!p.assignments || p.assignments.length === 0));
                const nextPlan = nextPlanIndex !== -1 ? this.plans[nextPlanIndex] : null;
                const newPlanName = `Plan ${String(this.plans.length + 1).padStart(2, '0')}`;
                this.confirmModal = {
                    show: true,
                    title: 'Plan déjà utilisé',
                    message: `Le plan "${currentPlan.name}" contient déjà ${currentPlan.assignments.length} élève(s) placé(s). Voulez-vous le remplacer ?`,
                    suggestion: nextPlan
                        ? `💡 Le plan "${nextPlan.name}" est vide et disponible.`
                        : `💡 Tous les plans sont utilisés — créer "${newPlanName}" automatiquement ?`,
                    nextPlanIndex,
                    nextPlanName: nextPlan ? nextPlan.name : newPlanName,
                    createNewPlan: !nextPlan,
                    confirmLabel: '↺ Remplacer',
                    onConfirm: () => this._runGenerateAutoPlan(),
                };
                return;
            }
            this._runGenerateAutoPlan();
        },

        _runGenerateAutoPlan() {
            let validSeats = [];
            for (let r = 1; r <= this.rows; r++)
                for (let c = 1; c <= this.cols; c++)
                    if (!this.aisles.includes(c) && !this.blockedSeats.includes(`${r}-${c}`)) validSeats.push({r, c});

            let fixedAssigned = this._getAssignments().filter(a => this.fixedSeats.includes(`${a.row}-${a.col}`));

            this.manualSeats.forEach(key => {
                if (fixedAssigned.some(a => `${a.row}-${a.col}` === key)) return;
                for (let i = 0; i < this.plans.length; i++) {
                    const found = this.plans[i].assignments.find(a => `${a.row}-${a.col}` === key);
                    if (found && this.students.some(s => s.id === found.studentId)) {
                        if (!fixedAssigned.some(a => a.studentId === found.studentId))
                            fixedAssigned.push({ studentId: found.studentId, row: found.row, col: found.col });
                        break;
                    }
                }
            });

            let unassigned = this.students.filter(s => !fixedAssigned.some(a => a.studentId === s.id));
            if (unassigned.length > validSeats.length - fixedAssigned.length) return alert('Pas assez de places !');

            this.isCalculating = true;
            this.calculationProgress = 0;
            this.perfectScoreMsg = false;

            setTimeout(() => {
                let historyMap = {};
                this.students.forEach(s => historyMap[s.id] = new Set());
                for (let i = 0; i < this.currentPlanIndex; i++)
                    this.plans[i].assignments.forEach(a => { if (historyMap[a.studentId]) historyMap[a.studentId].add(`${a.row}-${a.col}`); });

                let currentPlacement = [...fixedAssigned];
                let shuffledStudents = [...unassigned].sort(() => Math.random() - 0.5);
                let availableSeats = validSeats.filter(vs => !fixedAssigned.some(a => a.row === vs.r && a.col === vs.c)).sort(() => Math.random() - 0.5);
                for (let i = 0; i < shuffledStudents.length; i++) currentPlacement.push({ studentId: shuffledStudents[i].id, row: availableSeats[i].r, col: availableSeats[i].c });

                const studentMap = {}; this.students.forEach(s => studentMap[s.id] = s);
                const calculateScore = (placement) => {
                    let score = 0;
                    let grid = {}; placement.forEach(p => grid[`${p.row}-${p.col}`] = studentMap[p.studentId]);
                    placement.forEach(p => {
                        let s = studentMap[p.studentId]; if (!s) return;
                        if ((s.pap || s.vision) && p.row > 2) score += 100000;
                        if (s.aisle && !this.aisles.includes(p.col-1) && !this.aisles.includes(p.col+1)) score += 100000;
                        if (historyMap[s.id] && historyMap[s.id].has(`${p.row}-${p.col}`)) score += 50000;
                        let lS = grid[`${p.row}-${p.col-1}`], rS = grid[`${p.row}-${p.col+1}`];
                        if (((p.col > 1 && !this.aisles.includes(p.col-1)) || (p.col < this.cols && !this.aisles.includes(p.col+1))) && !lS && !rS) score += 100000;
                        if (s.force && s.force.length > 0) s.force.forEach(tid => { if ((!lS || lS.id !== tid) && (!rS || rS.id !== tid)) score += 100000; });
                        if (s.avoid && s.avoid.length > 0) {
                            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
                                if (dr === 0 && dc === 0) continue;
                                let nb = grid[`${p.row+dr}-${p.col+dc}`];
                                if (nb && s.avoid.includes(nb.id)) score += 100000;
                            }
                            for (const dc of [-1, 1]) {
                                const adjCol = p.col + dc;
                                if (this.aisles.includes(adjCol)) {
                                    const beyondNb = grid[`${p.row}-${p.col + dc * 2}`];
                                    if (beyondNb && s.avoid.includes(beyondNb.id)) score += 100000;
                                }
                            }
                        }
                        if (s.bavard) {
                            for (const q of placement) {
                                if (q.studentId === s.id) continue;
                                const nb = studentMap[q.studentId]; if (!nb || !nb.bavard) continue;
                                if (q.row === p.row) {
                                    const dist = Math.abs(q.col - p.col);
                                    if (dist === 1) score += 100000;
                                    else if (dist === 2) { const midCol = (p.col + q.col) / 2; if (this.aisles.includes(midCol)) score += 100000; }
                                }
                                if (q.col === p.col && Math.abs(q.row - p.row) === 1) score += 100000;
                                if (Math.abs(q.row - p.row) === 1 && Math.abs(q.col - p.col) === 1) score += 100000;
                            }
                        }
                        if (s.height === 'petit') { for (let r = 1; r < p.row; r++) if (grid[`${r}-${p.col}`] && grid[`${r}-${p.col}`].height === 'grand') score += 5000; }
                        if (p.row > 1 && !grid[`${p.row-1}-${p.col}`] && !this.aisles.includes(p.col) && !this.blockedSeats.includes(`${p.row-1}-${p.col}`)) score += 200000;
                        score += p.row * 100;
                        if (lS && lS.gender === s.gender) score += 50;
                    });
                    return score;
                };

                let temperature = 10000;
                const total = 150000, chunk = 2500;
                let bestP = JSON.parse(JSON.stringify(currentPlacement)), bestS = calculateScore(bestP), curS = bestS;
                let mut = []; currentPlacement.forEach((p,i) => { if (!fixedAssigned.some(f=>f.studentId===p.studentId)) mut.push({type:'student',idx:i,r:p.row,c:p.col}); });
                let occ = new Set(currentPlacement.map(p=>`${p.row}-${p.col}`)); validSeats.forEach(vs => { if(!occ.has(`${vs.r}-${vs.c}`)) mut.push({type:'empty',r:vs.r,c:vs.c}); });

                let iter = 0;
                const processChunk = () => {
                    let end = Math.min(iter + chunk, total);
                    for (let i = iter; i < end; i++) {
                        let idx1 = Math.floor(Math.random()*mut.length), idx2 = Math.floor(Math.random()*mut.length);
                        if (idx1===idx2) continue;
                        let pos1 = mut[idx1], pos2 = mut[idx2], p1 = pos1.type==='student'?currentPlacement[pos1.idx]:null, p2 = pos2.type==='student'?currentPlacement[pos2.idx]:null;
                        let r1=pos1.r, c1=pos1.c, r2=pos2.r, c2=pos2.c;
                        if(p1){p1.row=r2; p1.col=c2;} if(p2){p2.row=r1; p2.col=c1;} pos1.r=r2; pos1.c=c2; pos2.r=r1; pos2.c=c1;
                        let newS = calculateScore(currentPlacement);
                        if (newS <= curS || Math.exp((curS - newS) / temperature) > Math.random()) {
                            curS=newS;
                            if(newS < bestS){ bestS=newS; bestP=JSON.parse(JSON.stringify(currentPlacement)); }
                        } else {
                            if(p1){p1.row=r1; p1.col=c1;} if(p2){p2.row=r2; p2.col=c2;}
                            pos1.r=r1; pos1.c=c1; pos2.r=r2; pos2.c=c2;
                        }
                        temperature *= 0.9999;
                    }
                    iter = end;
                    this.calculationProgress = Math.round((iter/total)*100);
                    if (iter < total) {
                        requestAnimationFrame(processChunk);
                    } else {
                        this._setAssignments(bestP);
                        this.isCalculating = false;
                        this.saveLocal();
                        if (bestS >= 100000) {
                            this.diagnosticIssues = this.getPlacementIssues(this._getAssignments());
                            this.showDiagnosticModal = true;
                        } else {
                            this.perfectScoreMsg = true;
                            setTimeout(() => this.perfectScoreMsg = false, 4000);
                        }
                    }
                };
                processChunk();
            }, 100);
        },
    };
}
