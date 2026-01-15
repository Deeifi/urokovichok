import { useState, useEffect } from 'react';
import type { Lesson } from './types';
import { generateSchedule } from './api';
import { Calendar, Minimize2, CircleAlert, CheckCircle2 } from 'lucide-react';
import { DataEntry } from './components/DataEntry';
import { ScheduleGrid } from './components/ScheduleGrid';
import { SettingsView } from './components/SettingsView';
import { ConfirmationModal } from './components/ConfirmationModal';
import { cn } from './utils/cn';
import { getUnscheduledLessons, removeExcessLessons } from './utils/scheduleHelpers';
import { UnscheduledPanel } from './components/UnscheduledPanel';
import { HoverProvider } from './context/HoverContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { useDataStore } from './store/useDataStore';
import { useScheduleStore } from './store/useScheduleStore';
import { useUIStore } from './store/useUIStore';
import { ErrorBoundary } from './components/ErrorBoundary';


function App() {
  // Store Hooks
  const data = useDataStore(s => s.data);
  const setData = useDataStore(s => s.setData);
  const resetData = useDataStore(s => s.resetData);

  const schedule = useScheduleStore(s => s.schedule);
  const setSchedule = useScheduleStore(s => s.setSchedule);
  const pushToHistory = useScheduleStore(s => s.pushToHistory);


  const activeTab = useUIStore(s => s.activeTab);
  const setActiveTab = useUIStore(s => s.setActiveTab);
  const viewType = useUIStore(s => s.viewType);
  const setViewType = useUIStore(s => s.setViewType);
  const isCompact = useUIStore(s => s.isCompact);
  // setIsCompact removed as it's not used in App component anymore
  const isFullScreen = useUIStore(s => s.isFullScreen);

  const setIsFullScreen = useUIStore(s => s.setIsFullScreen);
  const isEditMode = useUIStore(s => s.isEditMode);
  const setIsEditMode = useUIStore(s => s.setIsEditMode);
  const perfSettings = useUIStore(s => s.perfSettings);
  const setPerfSettings = useUIStore(s => s.setPerfSettings);
  const userRole = useUIStore(s => s.userRole);
  const selectedLessonIds = useUIStore(s => s.selectedLessonIds);
  const clearSelection = useUIStore(s => s.clearSelection);
  const setUserRole = useUIStore(s => s.setUserRole);
  const selectedTeacherId = useUIStore(s => s.selectedTeacherId);
  const setSelectedTeacherId = useUIStore(s => s.setSelectedTeacherId);
  const isHeaderCollapsed = useUIStore(s => s.isHeaderCollapsed);
  const setIsHeaderCollapsed = useUIStore(s => s.setIsHeaderCollapsed);


  // Local UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<{ schedule: Lesson[], violations: string[] } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [panelMode, setPanelMode] = useState<'docked' | 'floating'>('docked');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const effectiveIsCompact = isCompact && (viewType === 'matrix' || viewType === 'teachers');

  // Business Logic: Remove excess lessons
  useEffect(() => {
    if (schedule && !useScheduleStore.getState().history.present) {
      useScheduleStore.setState(s => ({ history: { ...s.history, present: schedule } }));
    }

    if (schedule && schedule.status === 'success') {
      const cleanedSchedule = removeExcessLessons(data.plan, schedule.schedule);
      if (cleanedSchedule.length !== schedule.schedule.length) {
        setSchedule({ ...schedule, schedule: cleanedSchedule });
      }
    }
  }, [data, schedule, setSchedule]);

  // Reset header collapse when switching views or tabs
  useEffect(() => {
    if (viewType !== 'dashboard' || activeTab !== 'schedule') {
      setIsHeaderCollapsed(false);
    }
  }, [viewType, activeTab, setIsHeaderCollapsed]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab: Toggle between Data and Schedule
      if (e.key === 'Tab') {
        e.preventDefault();
        setActiveTab(activeTab === 'schedule' ? 'data' : 'schedule');
      }

      // Esc: Clear selection or close modals (local modals handled locally, but we can clear selection here)
      if (e.key === 'Escape') {
        if (activeTab === 'schedule' && selectedLessonIds.length > 0) {
          clearSelection();
          // We also might want to close modals if any are open, but they usually capture Esc themselves.
          // If we want a global "Close All", we'd need a modal store. 
          // For now, clearing selection is the primary global action for Esc in this context.
        }
        // Also handling local modal closure via state if they don't capture it? 
        // Ideally modals render specifically, so let's stick to selection clearing for now.
        if (showResetConfirm) setShowResetConfirm(false);
        if (conflictData) setConflictData(null);
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey)) {
        // Use e.code OR e.key to support all keyboard layouts (e.g. Cyrillic)
        const isZ = e.code === 'KeyZ' || e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'я';
        const isY = e.code === 'KeyY' || e.key.toLowerCase() === 'y' || e.key.toLowerCase() === 'н';

        if (isZ) {
          e.preventDefault();
          if (e.shiftKey) {
            useScheduleStore.getState().redo();
          } else {
            useScheduleStore.getState().undo();
          }
        }
        if (isY) {
          e.preventDefault();
          useScheduleStore.getState().redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, setActiveTab, selectedLessonIds, clearSelection, showResetConfirm, conflictData]);

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    resetData();
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

  const unscheduledLessons = (schedule?.status === 'success' && schedule.schedule)
    ? getUnscheduledLessons(data.plan, schedule.schedule)
    : [];

  return (
    <div
      className="flex h-screen bg-[#0f0f11] text-white"
      data-perf-animations={(!perfSettings.disableAnimations).toString()}
      data-perf-blur={(!perfSettings.disableBlur).toString()}
      data-perf-shadows={(!perfSettings.disableShadows).toString()}
    >
      <HoverProvider disableHoverEffects={perfSettings.disableHoverEffects}>
        <Sidebar />

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300",
          isFullScreen ? "p-0" : effectiveIsCompact ? 'px-2 py-1' : (viewType === 'dashboard' ? 'px-4 py-4 md:px-8' : 'px-2 py-3 lg:px-4 lg:py-4'),
          panelMode === 'docked' && isPanelOpen ? "pb-[400px]" : ""
        )}>
          {/* Header */}
          {!isFullScreen ? (
            <Header
              handleGenerate={handleGenerate}
              loading={loading}
            />
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
                <ErrorBoundary>
                  <DataEntry
                    data={data}
                    onChange={setData}
                    schedule={schedule}
                    onScheduleChange={setSchedule}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                    isPerformanceMode={perfSettings.disableAnimations}
                  />
                </ErrorBoundary>
              </div>
            ) : activeTab === 'schedule' ? (
              <div className="flex-1 flex flex-col min-h-0">
                {schedule ? (
                  <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 flex-1 min-h-0">
                    <ErrorBoundary>
                      <ScheduleGrid
                        schedule={schedule!}
                        data={data}
                        onScheduleChange={pushToHistory}
                        isEditMode={isEditMode}
                        setIsEditMode={setIsEditMode}
                        isCompact={isCompact}
                        viewType={viewType}
                        setViewType={setViewType}
                        perfSettings={perfSettings}
                        userRole={userRole}
                        selectedTeacherId={selectedTeacherId}
                        isHeaderCollapsed={isHeaderCollapsed}
                        setIsHeaderCollapsed={setIsHeaderCollapsed}
                      />
                    </ErrorBoundary>
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
                  userRole={userRole}
                  setUserRole={setUserRole}
                  selectedTeacherId={selectedTeacherId}
                  setSelectedTeacherId={setSelectedTeacherId}
                  teachers={data.teachers}
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

        {activeTab === 'schedule' && userRole === 'admin' && (
          <ErrorBoundary>
            <UnscheduledPanel
              items={unscheduledLessons}
              subjects={data.subjects}
              teachers={data.teachers}
              classes={data.classes}
              isOpen={isPanelOpen}
              onToggle={() => setIsPanelOpen(!isPanelOpen)}
              mode={panelMode}
              setMode={setPanelMode}
            />
          </ErrorBoundary>
        )}

      </HoverProvider>
    </div >
  );
}

export default App;
