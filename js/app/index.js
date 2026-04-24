import { state }             from './state.js';
import { initModule }        from './init.js';
import { classesModule }     from './classes.js';
import { teachersModule }    from './teachers.js';
import { plansModule }       from './plans.js';
import { gridModule }        from './grid.js';
import { diagnosticsModule } from './diagnostics.js';
import { algorithmModule }   from './algorithm.js';
import { dragdropModule }    from './dragdrop.js';
import { persistenceModule } from './persistence.js';
import { studentsModule }    from './students.js';
import { pdfModule }         from './pdf.js';

document.addEventListener('alpine:init', () => {
    Alpine.data('classApp', () => {
        const composed = {};
        const modules = [
            state,
            initModule,
            classesModule,
            teachersModule,
            plansModule,
            gridModule,
            diagnosticsModule,
            algorithmModule,
            dragdropModule,
            persistenceModule,
            studentsModule,
            pdfModule,
        ];
        for (const factory of modules) {
            Object.defineProperties(composed, Object.getOwnPropertyDescriptors(factory()));
        }
        return composed;
    });
});
