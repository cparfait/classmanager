export function state() {
    return {
        rows: 5, cols: 9, bulkList: '', students: [], aisles: [], blockedSeats: [], fixedSeats: [],
        manualSeats: [],
        plans: [], currentPlanIndex: 0, editMode: false, selectedStudent: null,
        searchQuery: '', mainGenderFilter: 'ALL', neighborFilter: 'ALL', forceFilter: 'ALL', avoidFilter: 'ALL', profileSortOrder: 'nomPrenom',
        _pdfWindow: null, _alphaPdfWindow: null, openDropdown: null, showOnlyUnplaced: false,
        isCalculating: false, calculationProgress: 0, saveStatus: '',
        showDiagnosticModal: false, showUnplacedModal: false, diagnosticIssues: [],
        perfectScoreMsg: false, viewFlipped: false,
        dragState: { studentId: null, fromRow: null, fromCol: null, fromList: false },

        showContactModal: false, showConfigModal: false, showStatsModal: false, showClassConfig: false,
        appVersion: '',
        confirmModal: {
            show: false, title: '', message: '', suggestion: '',
            nextPlanIndex: -1, nextPlanName: '', onConfirm: null,
            confirmLabel: 'Confirmer', createNewPlan: false,
        },
        darkMode: false,
        sidebarVisible: true,
        undoStack: [],
        showOnboarding: false, onboardingStep: 0,

        // === v2 : Multi-classes & profils ===
        appMode: '',
        showModeSelection: false,
        classes: [],
        currentClassId: null,
        teachers: [],
        showAddClassModal: false,
        newClassForm: { name: '', level: '', year: '' },
        showEditClassModal: false,
        editClassForm: { id: '', name: '', level: '', year: '' },

        // Mode Multi — session
        sessionLocked: false,
        currentTeacherId: null,
        showPinModal: false,
        pinTarget: null,
        pinInput: '',
        pinError: '',
        showCreateTeacherModal: false,
        newTeacherForm: { name: '', pin: '', pinConfirm: '', color: '#6366f1' },
        showEditTeacherModal: false,
        editTeacherForm: { id: '', name: '', color: '', pinOld: '', pinNew: '', pinConfirm: '', pinOldError: '', pinNewError: '' },
        autoLockMinutes: 15,
        _autoLockTimer: null,
        TEACHER_COLORS: ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'],
    };
}
