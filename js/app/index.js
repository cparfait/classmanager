import { state }             from './state.js';
import { initModule }        from './init.js';
import { classesModule }     from './classes.js';
import { teachersModule }    from './teachers.js';
import { plansModule }       from './plans.js';
import { gridModule }        from './grid.js';
import { diagnosticsModule } from './diagnostics.js';
import { dragdropModule }    from './dragdrop.js';
import { persistenceModule } from './persistence.js';
import { studentsModule }    from './students.js';

// Lazy-loaded modules (chargés à la première utilisation)
const lazy = {
    algorithm: { loaded: false, promise: null, methods: ['generateAutoPlan'] },
    pdf:       { loaded: false, promise: null, methods: ['exportPDF', 'generateAlphaPreview'] },
};

function loadLazy(self, name) {
    const entry = lazy[name];
    if (entry.loaded) return Promise.resolve();
    if (entry.promise) return entry.promise;
    entry.promise = import(`./${name}.js`).then(mod => {
        const factory = mod[name + 'Module'];
        Object.assign(self, factory());
        entry.loaded = true;
    });
    return entry.promise;
}

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
            dragdropModule,
            persistenceModule,
            studentsModule,
        ];
        for (const factory of modules) {
            Object.defineProperties(composed, Object.getOwnPropertyDescriptors(factory()));
        }
        // Stubs pour les méthodes lazy : importent le module au premier appel
        for (const [name, entry] of Object.entries(lazy)) {
            for (const method of entry.methods) {
                composed[method] = function (...args) {
                    return loadLazy(this, name).then(() => this[method](...args));
                };
            }
        }
        return composed;
    });
});
