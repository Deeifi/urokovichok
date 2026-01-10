import { useState, useEffect } from 'react';
import type { ScheduleRequest, ScheduleResponse, Lesson } from './types';
import { generateSchedule } from './api';
import { Calendar, LayoutDashboard, Settings, LogOut, Bell, RotateCcw, BookOpen, Loader2, Columns, Table, Users, Lock, Unlock, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { DataEntry } from './components/DataEntry';
import { ScheduleGrid } from './components/ScheduleGrid';
import { SettingsView } from './components/SettingsView';
import type { ViewType } from './components/ScheduleGrid';
import { ConfirmationModal } from './components/ConfirmationModal';
import { cn } from './utils/cn';
import { CircleAlert, CheckCircle2 } from 'lucide-react';
import type { PerformanceSettings } from './types';

// Tabs
type Tab = 'data' | 'schedule' | 'settings';

// Mock Initial Data: 5-11 Grades ONLY
const INITIAL_DATA: ScheduleRequest = {
  teachers: [
    { id: 't1', name: 'Математик О.М.', subjects: ['1'] },
    { id: 't2', name: 'Математик В.П.', subjects: ['1', '6', '7'] },
    { id: 't3', name: 'Алгебраїст Д.Р.', subjects: ['6', '7'] },
    { id: 't4', name: 'Геометр С.Т.', subjects: ['7', '6'] },
    { id: 't5', name: 'Мовознавець В.І.', subjects: ['2'] },
    { id: 't6', name: 'Мовознавець О.А.', subjects: ['2', '3'] },
    { id: 't7', name: 'Літератор А.С.', subjects: ['3', '15'] },
    { id: 't8', name: 'Англієць Д.В.', subjects: ['4'] },
    { id: 't9', name: 'Англієць М.Л.', subjects: ['4'] },
    { id: 't10', name: 'Фізик Л.Д.', subjects: ['5'] },
    { id: 't11', name: 'Фізик К.С.', subjects: ['5'] },
    { id: 't12', name: 'Хімік М.П.', subjects: ['8'] },
    { id: 't13', name: 'Біолог С.В.', subjects: ['9'] },
    { id: 't14', name: 'Історик Я.М.', subjects: ['10', '11'] },
    { id: 't15', name: 'Культуролог В.В.', subjects: ['11', '16'] },
    { id: 't16', name: 'Географ Г.О.', subjects: ['12'] },
    { id: 't17', name: 'Айтішник К.В.', subjects: ['13'] },
    { id: 't18', name: 'Спортсмен Б.А.', subjects: ['14'] },
    { id: 't19', name: 'Спортсмен Ю.Р.', subjects: ['14'] },
    { id: 't20', name: 'Зарубіжник Ю.К.', subjects: ['15'] },
    { id: 't21', name: 'Мистецтвознавець Р.Ф.', subjects: ['16'] },
    { id: 't22', name: 'Медик Т.О.', subjects: ['17'] },
    { id: 't23', name: 'Математик Н.М.', subjects: ['1'] },
    { id: 't24', name: 'Мовознавець Л.П.', subjects: ['2', '3'] },
    { id: 't25', name: 'Англієць Н.В.', subjects: ['4'] },
    { id: 't26', name: 'Історик П.С.', subjects: ['10', '11'] },
    { id: 't27', name: 'Фізрук О.В.', subjects: ['14'] },
    // New Subject Teachers
    { id: 't28', name: 'Інформатик І.І.', subjects: ['13'] },
    { id: 't29', name: 'Мистецтвознавець А.А.', subjects: ['16'] },
    { id: 't30', name: 'Трудовик В.В.', subjects: ['16'] },
    { id: 't31', name: 'Фізрук С.С.', subjects: ['14'] },
    { id: 't32', name: 'Англієць К.К.', subjects: ['4'] },
    // Removed Primary Teachers (t_p1 to t_p8)
  ],
  classes: [
    // Removed 1-4 classes
    { id: '9', name: '5-А' }, { id: '10', name: '5-Б' },
    { id: '11', name: '6-А' }, { id: '12', name: '6-Б' },
    { id: '13', name: '7-А' }, { id: '14', name: '7-Б' },
    { id: '15', name: '8-А' }, { id: '16', name: '8-Б' },
    { id: '17', name: '9-А' }, { id: '18', name: '9-Б' },
    { id: '19', name: '10-А' }, { id: '20', name: '10-Б' },
    { id: '21', name: '11-А' }, { id: '22', name: '11-Б' }
  ],
  subjects: [
    { id: '1', name: 'Математика' },
    { id: '2', name: 'Українська мова' },
    { id: '3', name: 'Українська література' },
    { id: '4', name: 'Англійська мова' },
    { id: '5', name: 'Фізика' },
    { id: '6', name: 'Алгебра' },
    { id: '7', name: 'Геометрія' },
    { id: '8', name: 'Хімія' },
    { id: '9', name: 'Біологія' },
    { id: '10', name: 'Історія України' },
    { id: '11', name: 'Всесвітня історія' },
    { id: '12', name: 'Географія' },
    { id: '13', name: 'Інформатика' },
    { id: '14', name: 'Фізична культура' },
    { id: '15', name: 'Зарубіжна література' },
    { id: '16', name: 'Мистецтво' },
    { id: '17', name: 'Основи здоров\'я' }
  ],
  plan: [
    // --- СЕРЕДНЯ ШКОЛА (5-9 КЛАСИ) ---
    ...[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].flatMap((cid) => {
      // Improved Distribution to avoid overlaps
      // We have 10 classes here: 5A,5B, 6A,6B, 7A,7B, 8A,8B, 9A,9B

      const isA = cid % 2 !== 0;

      // Math: 5h/week. 10 classes * 5 = 50h.
      // Teachers: t1, t2, t23. (Need ~16h each).
      // t1: 5A, 6B, 8A (5+5+5=15)
      // t2: 5B, 7A, 8B (5+5+5=15)
      // t23: 6A, 7B, 9A, 9B (5+5+5+5=20) -> t23 is overloaded (20h). 
      // Let's use t1 for 9B? t1: 15+5=20. OK.

      let m_teacher = 't1';
      if ([10, 13, 16].includes(cid)) m_teacher = 't2'; // 5B, 7A, 8B
      if ([11, 14, 17].includes(cid)) m_teacher = 't23'; // 6A, 7B, 9A
      if ([9, 12, 15, 18].includes(cid)) m_teacher = 't1'; // 5A, 6B, 8A, 9B

      // Ukr Lang: 5h/week. 50h total.
      // Teachers: t5, t24, t6.
      // t5: 5A, 6B, 8A (15)
      // t24: 5B, 7A, 8B (15)
      // t6: 6A, 7B, 9A, 9B (20)
      let u_teacher = 't5';
      if ([10, 13, 16].includes(cid)) u_teacher = 't24';
      if ([11, 14, 17].includes(cid)) u_teacher = 't6';

      // History: 3h/week.
      let h_teacher = isA ? 't14' : 't26';

      return [
        { class_id: String(cid), subject_id: '1', teacher_id: m_teacher, hours_per_week: 5 },
        { class_id: String(cid), subject_id: '2', teacher_id: u_teacher, hours_per_week: 5 },
        { class_id: String(cid), subject_id: '4', teacher_id: isA ? 't9' : 't32', hours_per_week: 4 },
        { class_id: String(cid), subject_id: '14', teacher_id: isA ? 't27' : 't19', hours_per_week: 3 },
        { class_id: String(cid), subject_id: '10', teacher_id: h_teacher, hours_per_week: 3 },
        { class_id: String(cid), subject_id: '12', teacher_id: isA ? 't16' : 't20', hours_per_week: 2 },
        { class_id: String(cid), subject_id: '9', teacher_id: 't13', hours_per_week: 2 },
        { class_id: String(cid), subject_id: '13', teacher_id: isA ? 't17' : 't28', hours_per_week: 2 },
        { class_id: String(cid), subject_id: '16', teacher_id: 't21', hours_per_week: 1 },
      ];
    }),

    // --- СТАРША ШКОЛА (10-11 КЛАСИ) ---
    ...[19, 20, 21, 22].flatMap(cid => {
      const isA = cid % 2 !== 0;
      return [
        { class_id: String(cid), subject_id: '6', teacher_id: isA ? 't3' : 't4', hours_per_week: 4 }, // Alg
        { class_id: String(cid), subject_id: '7', teacher_id: isA ? 't3' : 't4', hours_per_week: 3 }, // Geom
        { class_id: String(cid), subject_id: '2', teacher_id: 't6', hours_per_week: 4 }, // Ukr
        { class_id: String(cid), subject_id: '4', teacher_id: 't25', hours_per_week: 3 }, // Eng
        { class_id: String(cid), subject_id: '5', teacher_id: isA ? 't10' : 't11', hours_per_week: 4 }, // Phys
        { class_id: String(cid), subject_id: '8', teacher_id: 't12', hours_per_week: 3 }, // Chem
        { class_id: String(cid), subject_id: '11', teacher_id: isA ? 't15' : 't14', hours_per_week: 3 }, // Hist
        { class_id: String(cid), subject_id: '14', teacher_id: 't31', hours_per_week: 2 }, // PE
        { class_id: String(cid), subject_id: '13', teacher_id: 't28', hours_per_week: 2 } // CS
      ];
    })
  ]
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [data, setData] = useState<ScheduleRequest>(() => {
    const saved = localStorage.getItem('school_os_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(() => {
    const saved = localStorage.getItem('school_os_schedule');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [history, setHistory] = useState<ScheduleResponse[]>([]);
  const [conflictData, setConflictData] = useState<{ schedule: Lesson[], violations: string[] } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isCompact, setIsCompact] = useState(() => {
    const saved = localStorage.getItem('school_os_compact');
    return saved === 'true';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('school_os_sidebar_collapsed');
    return saved === 'true';
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('dashboard');
  const [perfSettings, setPerfSettings] = useState<PerformanceSettings>(() => {
    const saved = localStorage.getItem('school_os_perf');
    return saved ? JSON.parse(saved) : {
      disableAnimations: false,
      disableBlur: false,
      disableShadows: false,
      hidePhotos: false,
      lowFrequencyClock: false
    };
  });

  const effectiveIsCompact = isCompact && (viewType === 'matrix' || viewType === 'teachers');

  const pushToHistory = (currentState: ScheduleResponse) => {
    setHistory(prev => [JSON.parse(JSON.stringify(currentState)), ...prev].slice(0, 10));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const nextState = history[0];
    setSchedule(nextState);
    setHistory(prev => prev.slice(1));
  };

  // Debounced Persistence
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('school_os_data', JSON.stringify(data));
    }, 1000);
    return () => clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    if (schedule) {
      const timer = setTimeout(() => {
        localStorage.setItem('school_os_schedule', JSON.stringify(schedule));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('school_os_compact', isCompact.toString());
  }, [isCompact]);

  useEffect(() => {
    localStorage.setItem('school_os_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('school_os_perf', JSON.stringify(perfSettings));
    // Apply attributes to body for global CSS targeting
    document.body.setAttribute('data-perf-animations', (!perfSettings.disableAnimations).toString());
    document.body.setAttribute('data-perf-blur', (!perfSettings.disableBlur).toString());
    document.body.setAttribute('data-perf-shadows', (!perfSettings.disableShadows).toString());
  }, [perfSettings]);

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setData(INITIAL_DATA);
    setSchedule(null);
    localStorage.removeItem('school_os_data');
    localStorage.removeItem('school_os_schedule');
    setShowResetConfirm(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setConflictData(null);
    try {
      const result = await generateSchedule(data);

      if (result.status === 'success') {
        setSchedule(result);
        setActiveTab('schedule');
      } else if (result.status === 'conflict') {
        setConflictData({ schedule: result.schedule, violations: result.violations });
        // Show the conflicted schedule in the background
        setSchedule(result);
        setActiveTab('schedule');
      } else {
        setError(result.message || 'Помилка генерації розкладу');
      }
    } catch (err) {
      setError('Помилка мережі або сервер недоступний');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'schedule', label: 'Розклад', icon: Calendar },
    { id: 'data', label: 'База даних', icon: LayoutDashboard },
    { id: 'homework', label: 'Домашка', icon: BookOpen },
    { id: 'settings', label: 'Налаштування', icon: Settings },
  ];

  const formattedDate = new Date().toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div
      className="flex h-screen bg-[#0f0f11] text-white"
      data-perf-animations={(!perfSettings.disableAnimations).toString()}
      data-perf-blur={(!perfSettings.disableBlur).toString()}
      data-perf-shadows={(!perfSettings.disableShadows).toString()}
    >
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#0c0c0e] border-r border-white/5 flex flex-col transition-all duration-300 relative group/sidebar",
        isSidebarCollapsed ? "w-20" : "w-64",
        isFullScreen && "hidden"
      )}>
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#18181b] border border-white/10 rounded-full flex items-center justify-center text-[#a1a1aa] hover:text-white transition-all opacity-0 group-hover/sidebar:opacity-100 z-50 shadow-xl"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={cn("flex flex-col h-full", isSidebarCollapsed ? "p-3" : "p-6")}>
          <div className={cn("flex items-center gap-3 transition-all", isSidebarCollapsed ? "mb-8 justify-center" : "mb-10")}>
            <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Calendar className="text-white" size={24} />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tighter leading-none">УРОКОВИЧОК</span>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">ОСВІТНЯ ПЛАТФОРМА</span>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center transition-all duration-200 group rounded-xl font-bold",
                  isSidebarCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3",
                  activeTab === tab.id
                    ? "bg-indigo-600/10 text-indigo-400"
                    : "text-[#a1a1aa] hover:bg-white/5 hover:text-white"
                )}
              >
                <tab.icon size={22} className={cn(
                  "transition-colors",
                  activeTab === tab.id ? "text-indigo-400" : "group-hover:text-white"
                )} />
                {!isSidebarCollapsed && <span>{tab.label}</span>}
              </button>
            ))}
          </nav>

          <div className={cn("mt-auto transition-all", isSidebarCollapsed ? "p-3" : "p-4")}>
            <div className={cn(
              "bg-[#18181b] rounded-2xl border border-white/5 flex flex-col transition-all",
              isSidebarCollapsed ? "p-2" : "p-4"
            )}>
              {!isSidebarCollapsed && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Довідка</div>
                    <div className="text-[10px] font-bold text-[#a1a1aa]">Вивчіть основи</div>
                  </div>
                </div>
              )}
              <button className={cn(
                "flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors font-bold",
                isSidebarCollapsed ? "justify-center" : "text-xs"
              )}>
                {isSidebarCollapsed ? <BookOpen size={20} /> : (
                  <>
                    <span>Читати гайд</span>
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>

          <button className={cn(
            "flex items-center gap-3 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all duration-200 mt-4",
            isSidebarCollapsed ? "justify-center p-3" : "px-4 py-3"
          )}>
            <LogOut size={22} />
            {!isSidebarCollapsed && "Вийти"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all",
        isFullScreen ? "p-0" : effectiveIsCompact ? 'px-2 py-1' : (viewType === 'dashboard' ? 'px-4 py-6 md:px-8' : 'px-4 py-6')
      )}>
        {/* Header */}
        {!isFullScreen ? (
          <header className={cn("flex justify-between items-center px-2 transition-all",
            effectiveIsCompact ? "mb-1" : (viewType === 'dashboard' ? "mb-8" : "mb-4")
          )}>
            <div className="flex items-center gap-4">
              <div className={cn("transition-all duration-300", (activeTab !== 'schedule' || viewType !== 'dashboard') && "opacity-0 invisible w-0 overflow-hidden")}>
                <h1 className={cn("font-black tracking-tight transition-all", effectiveIsCompact ? "text-xl" : "text-3xl")}>Привіт👋</h1>
                {!effectiveIsCompact && <div className="text-[#a1a1aa] font-medium mt-1 uppercase text-[10px] tracking-widest">{formattedDate}</div>}
              </div>

              {activeTab === 'schedule' && viewType !== 'dashboard' && (
                <div className={cn("flex items-center gap-2 bg-[#18181b] rounded-2xl border border-white/5 transition-all animate-in fade-in slide-in-from-left-4 duration-500", effectiveIsCompact ? "p-1" : "p-1.5")}>
                  {[
                    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
                    { id: 'byClass', label: 'По класах', icon: Columns },
                    { id: 'matrix', label: 'Загальний', icon: Table },
                    { id: 'teachers', label: 'Вчителі', icon: Users },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setViewType(tab.id as ViewType)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl font-bold transition-all duration-200",
                        effectiveIsCompact ? "px-3 py-1 text-[10px]" : "px-4 py-2 text-xs",
                        viewType === tab.id
                          ? "bg-white/10 text-white shadow-lg shadow-black/20"
                          : "text-[#a1a1aa] hover:text-white"
                      )}
                    >
                      <tab.icon size={effectiveIsCompact ? 14 : 16} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {activeTab === 'schedule' && viewType !== 'dashboard' && (
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl font-bold transition-all duration-300 group animate-in fade-in slide-in-from-right-4",
                    effectiveIsCompact ? "px-3 py-1.5 text-[10px]" : "px-4 py-2.5 text-xs",
                    isEditMode
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "bg-[#18181b] border border-white/5 text-[#a1a1aa] hover:text-white"
                  )}
                >
                  {isEditMode ? (
                    <>
                      <Unlock size={effectiveIsCompact ? 14 : 16} className="animate-pulse" />
                      <span>{effectiveIsCompact ? 'РЕДАКТ.: УВІМК.' : 'Редагування УВІМК.'}</span>
                    </>
                  ) : (
                    <>
                      <Lock size={effectiveIsCompact ? 14 : 16} />
                      <span>{effectiveIsCompact ? 'РЕДАКТ.: ВИМК.' : 'Редагування ВИМК.'}</span>
                    </>
                  )}
                </button>
              )}

              {activeTab === 'schedule' && schedule && (
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0 || !isEditMode}
                  className={cn(
                    "flex items-center gap-2 bg-[#18181b] border border-white/5 rounded-xl text-[#a1a1aa] hover:text-white transition-all disabled:opacity-20 active:scale-95 group",
                    isCompact ? "px-3 py-1.5" : "px-4 py-2.5"
                  )}
                  title={!isEditMode ? "Увімкніть редагування для скасування" : "Скасувати останню дію"}
                >
                  <RotateCcw size={isCompact ? 16 : 18} className="group-hover:-rotate-45 transition-transform" />
                  <span className={cn("font-bold", isCompact ? "text-xs" : "text-sm")}>Скасувати {history.length > 0 && `(${history.length})`}</span>
                </button>
              )}
              {activeTab === 'data' && (
                <>
                  <button
                    onClick={handleReset}
                    className="px-6 py-2.5 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all border border-red-500/20 active:scale-95"
                  >
                    Скинути дані
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Calendar size={20} />}
                    {loading ? 'Генерується...' : 'Створити Розклад'}
                  </button>
                </>
              )}

              {/* Full Screen & Notifications Group */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullScreen(true)}
                  className={cn(
                    "rounded-xl bg-[#18181b] border border-white/5 text-[#a1a1aa] hover:text-white transition-all",
                    effectiveIsCompact ? "p-1.5" : "p-2.5"
                  )}
                  title="Повноекранний режим"
                >
                  <Maximize2 size={effectiveIsCompact ? 18 : 22} />
                </button>
                <button className={cn(
                  "rounded-xl bg-[#18181b] border border-white/5 text-[#a1a1aa] hover:text-white transition-all",
                  effectiveIsCompact ? "p-1.5" : "p-2.5"
                )}>
                  <Bell size={effectiveIsCompact ? 18 : 22} />
                </button>
                <div className={cn(
                  "rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/10 shadow-lg shadow-indigo-500/10 transition-all",
                  effectiveIsCompact ? "w-8 h-8" : "w-10 h-10"
                )}></div>
              </div>
            </div>
          </header>
        ) : (
          <button
            onClick={() => setIsFullScreen(false)}
            className="fixed top-4 right-4 z-[100] bg-black/60 hover:bg-black/80 text-white/40 hover:text-white p-2 rounded-full border border-white/10 backdrop-blur-md transition-all shadow-2xl group"
            title="Вийти з повноекранного режиму"
          >
            <Minimize2 size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* Content Container */}
        <div className={cn("flex-1 px-2", activeTab === 'schedule' ? "overflow-hidden flex flex-col" : "overflow-y-auto scrollbar-hide")}>
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="mt-0.5 bg-red-500/20 p-1.5 rounded-full text-red-500">
                <span className="text-lg font-bold">!</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">Помилка Генерації</h3>
                <p className="opacity-90 leading-relaxed whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}

          {activeTab === 'data' ? (
            <div className="space-y-6">
              <DataEntry
                data={data}
                onChange={setData}
                schedule={schedule}
                onScheduleChange={setSchedule}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
              />
            </div>
          ) : activeTab === 'schedule' ? (
            <div className="flex-1 flex flex-col min-h-0">
              {schedule ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 flex-1 min-h-0">
                  <ScheduleGrid
                    schedule={schedule!}
                    data={data}
                    onScheduleChange={(newSchedule) => {
                      if (schedule) pushToHistory(schedule);
                      setSchedule(newSchedule);
                    }}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                    isCompact={isCompact}
                    setIsCompact={setIsCompact}
                    viewType={viewType}
                    setViewType={setViewType}
                    perfSettings={perfSettings}
                  />
                </div>
              ) : (
                <div className="text-center py-20 bg-[#18181b] rounded-[24px] border border-dashed border-white/10">
                  <Calendar size={48} className="mx-auto mb-4 text-[#a1a1aa] opacity-50" />
                  <p className="text-[#a1a1aa] font-medium text-lg">Розклад ще не згенеровано.</p>
                  <p className="text-[#a1a1aa]/60 mt-1">Оберіть "База даних" та натисніть "Створити".</p>
                </div>
              )}
            </div>
          ) : activeTab === 'settings' ? (
            <div className="py-8">
              <SettingsView
                perfSettings={perfSettings}
                setPerfSettings={setPerfSettings}
                handleReset={handleReset}
              />
            </div>
          ) : null}
        </div>

        {/* Conflict Modal */}
        {conflictData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#18181b] border border-red-500/30 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl shadow-red-900/20">
              <div className="p-6 border-b border-white/5 flex items-start gap-4">
                <div className="bg-red-500/10 p-3 rounded-full text-red-500">
                  <CircleAlert size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Знайдено конфлікти у розкладі</h2>
                  <p className="text-[#a1a1aa] mt-1">Ми не змогли створити ідеальний розклад за вашими суворими правилами. <br />Ось причини:</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {conflictData.violations.map((v, i) => (
                  <div key={i} className="flex gap-3 text-red-200 bg-red-500/5 p-3 rounded-lg border border-red-500/10 text-sm font-medium">
                    <span className="text-red-500 mt-0.5">•</span>
                    {v.replace(/^•\s*/, '')}
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#131316] rounded-b-2xl">
                <button
                  onClick={() => setConflictData(null)}
                  className="px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-all"
                >
                  Редагувати дані
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
                >
                  Спробувати ще раз
                </button>
                <button
                  onClick={() => {
                    setSchedule({ status: 'success', schedule: conflictData.schedule });
                    setConflictData(null);
                    setActiveTab('schedule');
                  }}
                  className="px-6 py-3 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Створити журнал (Ігнорувати)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
        title="Скинути всі дані?"
        description="Ви впевнені, що хочете скинути всю базу даних та розклад до початкових значень? Цю дію неможливо скасувати."
      />
    </div >
  );
}

export default App;
