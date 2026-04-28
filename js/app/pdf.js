function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":"&#39;",'"':'&quot;'}[tag]));
}

function splitName(name) {
    const parts = (name || '').split(' ');
    const isUpper = w => w.length > 1 && w === w.toUpperCase();
    const nomParts    = parts.filter(w => isUpper(w));
    const prenomParts = parts.filter(w => !isUpper(w));
    if (nomParts.length && prenomParts.length) return { nom: nomParts.join(' '), prenom: prenomParts.join(' ') };
    return { nom: parts.slice(1).join(' ') || parts[0], prenom: parts.length > 1 ? parts[0] : '' };
}

/** Ouvre une nouvelle fenêtre avec le contenu HTML via Blob (remplace document.write déprécié) */
function openHtmlWindow(htmlContent) {
    const blob   = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const w = window.open(blobUrl, '_blank');
    if (w) {
        // Libère la mémoire blob dès que la fenêtre a chargé son contenu
        w.addEventListener('load', () => URL.revokeObjectURL(blobUrl), { once: true });
        // Fallback si l'événement load ne se déclenche pas (fenêtre bloquée)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } else {
        URL.revokeObjectURL(blobUrl);
    }
    return w;
}

export function pdfModule() {
    return {
        exportPDF(format = 'both') {
            const planName = this._isAlphaPlan() ? 'Plan Alphabétique' : (this.plans[this.currentPlanIndex]?.name || 'Plan');
            const studentMap = {};
            this.students.forEach(s => studentMap[s.id] = s);

            const nRows = Number(this.rows);
            const nCols = Number(this.cols);

            const assignments = this._getAssignments();
            const placedStudents = assignments.map(a => studentMap[a.studentId]).filter(Boolean);
            const hasAnyBavard  = placedStudents.some(s => s.bavard);
            const hasAnyPap     = placedStudents.some(s => s.pap);
            const hasAnyVision  = placedStudents.some(s => s.vision);
            const hasAnyAisle   = placedStudents.some(s => s.aisle);
            const hasAnyManual  = assignments.some(a => this.manualSeats.includes(`${a.row}-${a.col}`));
            const hasAnyBlocked = this.blockedSeats.length > 0;
            const hasAnyAislCol = this.aisles.length > 0;
            const totalPlaced   = assignments.length;
            const totalStudents = this.students.length;

            let gridHTML = `<div class="grid" style="grid-template-columns: repeat(${nCols}, 1fr);">`;
            for (let r = nRows; r >= 1; r--) {
                for (let c = 1; c <= nCols; c++) {
                    if (this.aisles.includes(c)) {
                        gridHTML += '<div class="cell aisle"></div>';
                        continue;
                    }
                    if (this.blockedSeats.includes(`${r}-${c}`)) {
                        gridHTML += '<div class="cell blocked">✕</div>';
                        continue;
                    }
                    const occupant = this.getOccupant(r, c);
                    if (occupant) {
                        const s = studentMap[occupant];
                        if (!s) { gridHTML += '<div class="cell empty"></div>'; continue; }
                        const { nom, prenom } = splitName(s.name);
                        const maxLen = Math.max(nom.length, prenom.length);
                        const nameFontSize = maxLen > 12 ? '10px' : maxLen > 9 ? '11px' : '12px';
                        const isManualCell = this.manualSeats.includes(`${r}-${c}`);
                        let iconsHTML = '';
                        if (s.bavard || s.pap || s.vision || s.aisle) {
                            iconsHTML += '<div class="icons">';
                            if (s.bavard) iconsHTML += '<span class="ico ico-bavard">🗣️</span>';
                            if (s.pap)    iconsHTML += '<span class="ico ico-pap">📋</span>';
                            if (s.vision) iconsHTML += '<span class="ico ico-vision">👓</span>';
                            if (s.aisle)  iconsHTML += '<span class="ico ico-aisle">🚶</span>';
                            iconsHTML += '</div>';
                        }
                        gridHTML += `<div class="cell occupied${isManualCell ? ' manual' : ''}">`;
                        gridHTML += iconsHTML;
                        let nameMarkup;
                        if (format === 'nom-prenom') {
                            nameMarkup = `<span class="name" style="font-size:${nameFontSize}">${escapeHTML(nom)}${prenom ? '<br><span class="secondary">' + escapeHTML(prenom) + '</span>' : ''}</span>`;
                        } else {
                            nameMarkup = `<span class="name" style="font-size:${nameFontSize}">${prenom ? escapeHTML(prenom) + '<br>' : ''}<span class="secondary">${escapeHTML(nom)}</span></span>`;
                        }
                        gridHTML += nameMarkup;
                        gridHTML += '</div>';
                    } else {
                        gridHTML += '<div class="cell empty"></div>';
                    }
                }
            }
            gridHTML += '</div>';

            const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plan de classe</title>
    <style>
        @page { size: A4 landscape; margin: 8mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif; padding: 8px 14px 4px; color: #1e293b; background: #f8fafc; display: flex; flex-direction: column; min-height: calc(100vh - 16mm); }
        .header { text-align: center; margin-bottom: 8px; }
        .header h1 { font-size: 15px; font-weight: 900; color: #1e293b; margin-bottom: 1px; }
        .header h1 span { color: #10b981; font-style: italic; }
        .grid { display: grid; gap: 3px; max-width: 100%; flex: 1; padding: 6px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
        .cell { border-radius: 7px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 48px; padding: 2px 2px 1px; position: relative; }
        .cell.aisle { background: transparent; position: relative; }
        .cell.aisle::before, .cell.aisle::after { content: ''; position: absolute; top: -3px; bottom: -3px; width: 2px; background: #cbd5e1; }
        .cell.aisle::before { left: 0; }
        .cell.aisle::after { right: 0; }
        .cell.blocked { background: repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9 5px,#e2e8f0 5px,#e2e8f0 10px); border: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; font-weight: 700; }
        .cell.empty { border: 1.5px dashed #e2e8f0; background: #fafbfc; }
        .cell.occupied { border: 1.5px solid #34d399; background: linear-gradient(145deg,#ecfdf5,#d1fae5); }
        .cell.occupied.manual { border: 1.5px solid #f59e0b; background: linear-gradient(145deg,#fffbeb,#fef3c7); }
        .icons { display: flex; gap: 2px; justify-content: center; margin-bottom: 2px; flex-wrap: wrap; }
        .ico { font-size: 8px; width: 13px; height: 13px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; line-height: 1; }
        .ico-bavard { background: #fee2e2; }
        .ico-pap    { background: #d1fae5; }
        .ico-vision { background: #fef3c7; }
        .ico-aisle  { background: #e0e7ff; }
        .name { font-weight: 900; text-align: center; line-height: 1.2; color: #1e293b; }
        .secondary { font-weight: 600; color: #475569; font-size: 0.85em; }
        .teacher-area { display: flex; flex-direction: column; align-items: center; margin-top: 8px; gap: 2px; }
        .teacher-emoji { font-size: 28px; line-height: 1; transform: scaleY(-1); display: inline-block; }
        .board { width: 280px; height: 28px; background: white; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 6px rgba(15,23,42,0.06); padding: 0 12px; }
        .board-label { font-size: 9px; font-weight: 900; color: #4338ca; letter-spacing: 0.18em; text-transform: uppercase; }
        .board-foot { width: 14px; height: 5px; background: #6366f1; border-radius: 2px; opacity: 0.5; }
        .preview-toolbar { position: fixed; top: 0; left: 0; right: 0; background: #1e293b; color: white; padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; z-index: 9999; box-shadow: 0 2px 12px rgba(0,0,0,0.2); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .preview-toolbar .pt-title { font-size: 12px; font-weight: 700; letter-spacing: 0.05em; }
        .preview-toolbar .pt-actions { display: flex; gap: 8px; }
        .preview-toolbar button { font-size: 12px; font-weight: 700; padding: 7px 14px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
        .pt-print { background: #6366f1; color: white; }
        .pt-print:hover { background: #4f46e5; }
        .pt-close { background: rgba(255,255,255,0.15); color: white; }
        .pt-close:hover { background: rgba(255,255,255,0.25); }
        body.with-toolbar { padding-top: 56px !important; }
        @media print { .preview-toolbar { display: none !important; } body.with-toolbar { padding-top: 8px !important; } }
    </style></head><body class="with-toolbar">
        <div class="preview-toolbar">
            <span class="pt-title">📄 Aperçu — ${escapeHTML(planName)}</span>
            <div class="pt-actions">
                <button class="pt-print" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
                <button class="pt-close" onclick="window.close()">✕ Fermer</button>
            </div>
        </div>
        <div class="header">
            <h1><span>ClassManager</span> — ${escapeHTML(planName)}</h1>
        </div>
        ${gridHTML}
        <div class="teacher-area">
            <span class="teacher-emoji">👨‍🏫</span>
            <div class="board">
                <span class="board-foot"></span>
                <span class="board-label">Tableau</span>
                <span class="board-foot"></span>
            </div>
        </div>
    </body></html>`;

            if (this._pdfWindow && !this._pdfWindow.closed) this._pdfWindow.close();
            const w = openHtmlWindow(htmlContent);
            if (!w) { this.showToast("L'ouverture de la fenêtre d'aperçu a été bloquée.", 'error'); return; }
            this._pdfWindow = w;
        },

        generateAlphaPreview() {
            if (this.students.length === 0) {
                this.showToast('Aucun élève dans la liste !', 'warning');
                return;
            }

            const nRows = Number(this.rows);
            const nCols = Number(this.cols);

            const availableCols = [];
            for (let c = 1; c <= nCols; c++) {
                if (!this.aisles.includes(c)) availableCols.push(c);
            }

            const seats = [];
            for (let r = 1; r <= nRows; r++) {
                for (const c of availableCols) {
                    const key = `${r}-${c}`;
                    if (!this.blockedSeats.includes(key)) seats.push({ r, c });
                }
            }

            const sorted = [...this.students].sort((a, b) =>
                a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
            );

            const alphaMap = {};
            sorted.forEach((student, i) => {
                if (i < seats.length) alphaMap[`${seats[i].r}-${seats[i].c}`] = student;
            });

            let gridHTML = `<div class="grid" style="grid-template-columns: repeat(${nCols}, 1fr);">`;
            for (let r = nRows; r >= 1; r--) {
                for (let c = 1; c <= nCols; c++) {
                    if (this.aisles.includes(c)) { gridHTML += '<div class="cell aisle"></div>'; continue; }
                    if (this.blockedSeats.includes(`${r}-${c}`)) { gridHTML += '<div class="cell blocked">✕</div>'; continue; }
                    const student = alphaMap[`${r}-${c}`];
                    if (student) {
                        const { nom, prenom } = splitName(student.name);
                        const maxLen = Math.max(nom.length, prenom.length);
                        const nameFontSize = maxLen > 12 ? '11px' : maxLen > 9 ? '12px' : '13px';
                        gridHTML += `<div class="cell occupied">`;
                        gridHTML += `<span class="name" style="font-size:${nameFontSize}">${escapeHTML(nom)}${prenom ? '<br>' + escapeHTML(prenom) : ''}</span>`;
                        gridHTML += '</div>';
                    } else {
                        gridHTML += '<div class="cell empty"></div>';
                    }
                }
            }
            gridHTML += '</div>';

            let listHTML = '<ol class="alpha-list">';
            sorted.forEach((s, i) => {
                const placed = i < seats.length;
                const seat = placed ? seats[i] : null;
                listHTML += `<li>${escapeHTML(s.name)}${placed ? ` <span class="seat-ref">→ R${seat.r} C${seat.c}</span>` : ' <span class="seat-ref" style="color:#ef4444">⚠ Pas de place</span>'}</li>`;
            });
            listHTML += '</ol>';

            const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plan de rentrée — Alphabétique</title>
    <style>
        @page { size: A4 landscape; margin: 8mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif; padding: 10px 16px; color: #1e293b; background: #f8fafc; }
        .header { text-align: center; margin-bottom: 10px; }
        .header h1 { font-size: 16px; font-weight: 900; color: #1e293b; margin-bottom: 2px; }
        .header h1 span { color: #7c3aed; font-style: italic; }
        .header .badge { display: inline-block; background: #ede9fe; color: #7c3aed; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 20px; border: 1px solid #c4b5fd; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.1em; }
        .header .date { font-size: 8px; color: #94a3b8; font-weight: 600; }
        .grid { display: grid; gap: 3px; max-width: 100%; margin: 0 auto; padding: 8px; background: white; border-radius: 16px; border: 1px solid #e2e8f0; }
        .cell { border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 52px; padding: 2px 1px; }
        .cell.aisle { background: #f1f5f9; border-radius: 6px; opacity: 0.4; }
        .cell.blocked { background: repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9 5px,#e2e8f0 5px,#e2e8f0 10px); border: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; font-weight: 700; }
        .cell.empty { border: 1.5px dashed #e2e8f0; background: #fafbfc; }
        .cell.occupied { border: 1.5px solid #a78bfa; background: linear-gradient(145deg,#f5f3ff,#ede9fe); }
        .name { font-weight: 800; text-align: center; line-height: 1.25; color: #1e293b; }
        .tableau { width: 60%; margin: 0 auto 8px; background: #1e293b; color: white; text-align: center; font-size: 9px; font-weight: 800; padding: 4px; border-radius: 6px 6px 0 0; letter-spacing: 0.15em; text-transform: uppercase; }
        @media print { .page-break { page-break-before: always; } }
        .alpha-section { margin-top: 20px; padding-top: 16px; border-top: 2px dashed #e2e8f0; }
        .alpha-section h2 { font-size: 13px; font-weight: 900; color: #7c3aed; margin-bottom: 8px; }
        .alpha-list { columns: 3; column-gap: 24px; list-style: decimal; padding-left: 16px; }
        .alpha-list li { font-size: 10px; font-weight: 700; color: #1e293b; margin-bottom: 3px; break-inside: avoid; }
        .seat-ref { font-weight: 600; color: #94a3b8; font-size: 9px; }
    </style></head><body>
        <div class="header">
            <div class="badge">🔤 Plan de rentrée — Ordre alphabétique</div>
            <h1><span>ClassManager</span> — PLAN DE CLASSE</h1>
            <div class="date">${today}</div>
        </div>
        <div class="tableau" style="display:none">TABLEAU — DEVANT DE LA CLASSE</div>
        ${gridHTML}
        <div class="alpha-section">
            <h2>📋 Liste alphabétique complète</h2>
            ${listHTML}
        </div>
    </body></html>`;

            if (this._alphaPdfWindow && !this._alphaPdfWindow.closed) this._alphaPdfWindow.close();
            const w = openHtmlWindow(htmlContent);
            if (!w) { this.showToast("L'ouverture de la fenêtre d'aperçu a été bloquée.", 'error'); return; }
            this._alphaPdfWindow = w;
        },
    };
}
