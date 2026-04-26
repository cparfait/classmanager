export function initModule() {
    return {
        initApp() {
            this._isElectron = !!window.electronAPI;

            if (window.electronAPI?.getVersion) {
                window.electronAPI.getVersion().then(v => this.appVersion = v);
            }

            this.darkMode = localStorage.getItem('cmDarkMode') === 'true';
            if (this.darkMode) document.documentElement.classList.add('dark');

            this.sidebarVisible = localStorage.getItem('cmSidebarVisible') !== 'false';
            this.configHintDismissed = localStorage.getItem('cmConfigHintDismissed') === 'true';

            const _resetLock = () => this._resetAutoLock();
            document.addEventListener('mousemove', _resetLock, { passive: true });
            document.addEventListener('keydown',   _resetLock, { passive: true });
            document.addEventListener('click',     _resetLock, { passive: true });

            const _afterLoad = () => {
                if (this.students.length === 0) {
                    this.editMode = true;
                    this.importDrawerOpen = true;
                    if (!this.showModeSelection && !localStorage.getItem('cmOnboardingDone')) {
                        this.$nextTick(() => { this.showOnboarding = true; this.onboardingStep = 0; });
                    } else if (this.appMode === 'solo' && !this.showModeSelection) {
                        this.$nextTick(() => { this.showImportHelpModal = true; });
                    }
                }
            };

            const _newEmptyClass = () => {
                const cls = { id: 'c_' + Date.now(), teacherId: null, name: 'Ma Classe', level: '', year: this._currentSchoolYear(), rows: 5, cols: 9, students: [], aisles: [], blockedSeats: [], fixedSeats: [], manualSeats: [], plans: [], currentPlanIndex: 0 };
                this.initEmptyPlans();
                cls.plans = this.plans;
                return cls;
            };

            const _loadV2 = (data) => {
                this.appMode    = data.appMode || '';
                this.teachers   = data.teachers || [];
                this.classes    = data.classes  || [];
                // Si mode multi mais aucun profil enseignant, on revient au choix de mode
                if (this.appMode === 'multi' && this.teachers.length === 0) {
                    this.appMode = '';
                }
                this.currentClassId = data.currentClassId || (this.classes[0]?.id ?? null);
                const cls = this.classes.find(c => c.id === this.currentClassId);
                if (cls) { this.loadClassData(cls); } else { this.initEmptyPlans(); }
                if (!this.appMode) this.showModeSelection = true;
            };

            if (this._isElectron) {
                window.electronAPI.loadData().then(data => {
                    if (data) {
                        if (data.version === 2) { _loadV2(data); }
                        else { this._migrateFromV1(data); }
                    } else {
                        const cls = _newEmptyClass();
                        this.classes = [cls];
                        this.currentClassId = cls.id;
                        this.showModeSelection = true;
                    }
                    _afterLoad();
                });
            } else {
                if (!localStorage.getItem('classManagerData_v10') && localStorage.getItem('classManagerData_v9'))
                    localStorage.setItem('classManagerData_v10', localStorage.getItem('classManagerData_v9'));
                if (!localStorage.getItem('classManagerData_v10') && localStorage.getItem('classManagerData_v8'))
                    localStorage.setItem('classManagerData_v10', localStorage.getItem('classManagerData_v8'));
                const saved = localStorage.getItem('classManagerData_v10');
                if (saved) {
                    const data = JSON.parse(saved);
                    if (data.version === 2) { _loadV2(data); }
                    else { this._migrateFromV1(data); }
                } else {
                    const cls = _newEmptyClass();
                    this.classes = [cls];
                    this.currentClassId = cls.id;
                    this.showModeSelection = true;
                }
                _afterLoad();
            }
        },

        initEmptyPlans() {
            this.plans = [{ id: Date.now(), name: 'Plan 01', assignments: [] }];
        },

        _currentSchoolYear() {
            const y = new Date().getFullYear();
            return new Date().getMonth() >= 8 ? `${y}-${y+1}` : `${y-1}-${y}`;
        },

        _migrateFromV1(data) {
            const cls = {
                id: 'c_legacy', teacherId: null, name: 'Ma Classe', level: '',
                year: this._currentSchoolYear(),
                rows: data.rows || 5, cols: data.cols || 9,
                students: data.students || [], aisles: data.aisles || [],
                blockedSeats: data.blockedSeats || [], fixedSeats: data.fixedSeats || [],
                manualSeats: data.manualSeats || [],
                plans: data.plans || [], currentPlanIndex: data.currentPlanIndex || 0,
            };
            if (!cls.plans.length) { this.initEmptyPlans(); cls.plans = this.plans; }
            this.classes = [cls];
            this.currentClassId = 'c_legacy';
            this.loadClassData(cls);
            this.showModeSelection = true;
        },

        loadClassData(cls) {
            this.rows = cls.rows || 5; this.cols = cls.cols || 9;
            this.students = cls.students || []; this.aisles = cls.aisles || [];
            this.blockedSeats = cls.blockedSeats || []; this.fixedSeats = cls.fixedSeats || [];
            this.manualSeats = cls.manualSeats || [];
            if (cls.plans?.length) {
                this.plans = cls.plans;
                // Start on the last numbered plan if plans exist
                this.currentPlanIndex = cls.plans.length - 1;
            } else {
                this.initEmptyPlans();
                this.currentPlanIndex = -1;
            }
        },

        syncClassData() {
            const cls = this.classes.find(c => c.id === this.currentClassId);
            if (!cls) return;
            cls.rows = this.rows; cls.cols = this.cols;
            cls.students = this.students; cls.aisles = this.aisles;
            cls.blockedSeats = this.blockedSeats; cls.fixedSeats = this.fixedSeats;
            cls.manualSeats = this.manualSeats;
            cls.plans = this.plans; cls.currentPlanIndex = this.currentPlanIndex;
        },

        switchClass(classId) {
            if (classId === this.currentClassId) return;
            this.syncClassData();
            this.currentClassId = classId;
            const cls = this.classes.find(c => c.id === classId);
            if (cls) this.loadClassData(cls);
            this.saveLocal();
        },
    };
}
