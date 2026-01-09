import { useState, useEffect } from 'react';
import type { ScheduleRequest, ScheduleResponse } from './types';
import { generateSchedule } from './api';
import {
  Calendar,
  LayoutDashboard,
  Loader2,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Bell,
  RotateCcw
} from 'lucide-react';
import { DataEntry } from './components/DataEntry';
import { ScheduleGrid } from './components/ScheduleGrid';
import { TeacherDetails } from './components/TeacherDetails';
import { cn } from './utils/cn';

// Tabs
type Tab = 'data' | 'schedule' | 'teachers';

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

  const pushToHistory = (currentState: ScheduleResponse) => {
    setHistory(prev => [JSON.parse(JSON.stringify(currentState)), ...prev].slice(0, 10));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const nextState = history[0];
    setSchedule(nextState);
    setHistory(prev => prev.slice(1));
  };

  // Persistence
  useEffect(() => {
    localStorage.setItem('school_os_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (schedule) {
      localStorage.setItem('school_os_schedule', JSON.stringify(schedule));
    }
  }, [schedule]);

  const handleReset = () => {
    if (window.confirm('Ви впевнені, що хочете скинути всі дані до початкових?')) {
      setData(INITIAL_DATA);
      setSchedule(null);
      localStorage.removeItem('school_os_data');
      localStorage.removeItem('school_os_schedule');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateSchedule(data);
      if (result.status === 'success') {
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
    { id: 'teachers', label: 'Вчителі', icon: Users },
    { id: 'homework', label: 'Домашка', icon: BookOpen },
    { id: 'settings', label: 'Налаштування', icon: Settings },
  ];

  const formattedDate = new Date().toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="flex h-screen bg-[#0f0f11] text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#18181b] border-r border-white/5 flex flex-col p-6 m-4 rounded-[24px]">
        <div className="mb-10 pl-2">
          <div className="text-2xl font-black bg-gradient-to-br from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent tracking-tighter">
            УРОКОВИЧОК
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200",
                activeTab === item.id
                  ? "bg-white/5 text-white"
                  : "text-[#a1a1aa] hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all duration-200 mt-auto">
          <LogOut size={20} />
          Вийти
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden px-4 py-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 px-2">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Привіт👋</h1>
            <div className="text-[#a1a1aa] font-medium mt-1">{formattedDate}</div>
          </div>

          <div className="flex items-center gap-4">
            {activeTab === 'schedule' && schedule && (
              <button
                onClick={handleUndo}
                disabled={history.length === 0 || !isEditMode}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#18181b] border border-white/5 rounded-xl text-[#a1a1aa] hover:text-white transition-all disabled:opacity-20 active:scale-95 group"
                title={!isEditMode ? "Увімкніть редагування для скасування" : "Скасувати останню дію"}
              >
                <RotateCcw size={18} className="group-hover:-rotate-45 transition-transform" />
                <span className="font-bold text-sm">Скасувати {history.length > 0 && `(${history.length})`}</span>
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
            <button className="p-2.5 rounded-xl bg-[#18181b] border border-white/5 text-[#a1a1aa] hover:text-white transition-colors">
              <Bell size={22} />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/10 shadow-lg shadow-indigo-500/10"></div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
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
              <DataEntry data={data} onChange={setData} />
            </div>
          ) : activeTab === 'schedule' ? (
            <div className="flex-1 flex flex-col min-h-0">
              {schedule ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <ScheduleGrid
                    schedule={schedule!}
                    data={data}
                    onScheduleChange={(newSchedule) => {
                      if (schedule) pushToHistory(schedule);
                      setSchedule(newSchedule);
                    }}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
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
          ) : activeTab === 'teachers' ? (
            <TeacherDetails data={data} />
          ) : (
            <div className="text-center py-20 text-[#a1a1aa]">
              Розділ у розробці 🛠️
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
