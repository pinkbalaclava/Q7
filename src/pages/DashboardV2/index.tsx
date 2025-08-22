import React, { useState, useEffect, useMemo } from 'react';
import { Search, Grid3X3, List as ListIcon, Filter, MoreHorizontal } from 'lucide-react';
import '@/styles/dashboardV2.css';
import PersonaNav from '../../components/PersonaNav';
import { NAV_OWNER } from '../../persona/nav';
import TopKpi from '@/components/ui/TopKpi';
import { StatusCard } from '@/components/ui/StatusCard';
import { demoPeriods } from './demo-data';
import type { Period, Service, PeriodStatus } from './types';
import { 
  kpiActiveClients,
  kpiOnTimeRateMTD
} from './metrics';
import { laneForStatus, LANES } from './lanes5';
import TopStats from './TopStats';
import Board from './Board';
import List from './List';
import CalendarView from './CalendarView';
import { WideContainer } from './WideContainer';
import { HeaderBlock } from './HeaderBlock';
import ClientView from './ClientView';
import NestedStatusKanbanChart from './NestedStatusKanbanChart';
import { CardKpi } from '@/components/ui/CardKpi';
import { Users, TrendingUp } from 'lucide-react';

// Get unique assignees from demo data
const getUniqueAssignees = (periods: Period[]): string[] => {
  const assignees = new Set<string>();
  periods.forEach(period => {
    if (period.assignee) {
      assignees.add(period.assignee);
    }
  });
  return Array.from(assignees).sort();
};

// Get valid statuses for a service
const getValidStatuses = (service: Service | "ALL"): PeriodStatus[] => {
  if (service === "ALL") {
    // Return all unique statuses from demo data
    const allStatuses = new Set<PeriodStatus>();
    demoPeriods.forEach(period => allStatuses.add(period.status));
    return Array.from(allStatuses).sort();
  }
  
  switch (service) {
    case "VAT":
      return ["Awaiting Docs", "In Progress", "Awaiting Approval", "Ready to Submit", "Submitted", "Paid", "Closed"];
    case "ACCOUNTS":
      return ["Awaiting Docs", "In Progress", "Draft Sent", "Awaiting Approval", "Ready to File", "Filed", "Closed"];
    case "SA":
      return ["Awaiting Questionnaire", "Reminders Sent", "In Progress", "Awaiting Approval", "Submitted", "Done"];
    default:
      return [];
  }
};

const DashboardV2: React.FC = () => {
  // State management
  const [service, setService] = useState<Service | "ALL">("ALL");
  const [status, setStatus] = useState<"ALL" | PeriodStatus>("ALL");
  const [assignee, setAssignee] = useState<"ALL" | string>("ALL");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"board" | "list" | "calendar">("list");
  const [periods, setPeriods] = useState<Period[]>(demoPeriods);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // One-time cleanup of old localStorage keys
  useEffect(() => {
    localStorage.removeItem("q7.grouping");
    localStorage.removeItem("q7.hideEmpty");
    localStorage.removeItem("q7.exactStatus");
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const savedService = localStorage.getItem('dashboardV2_service') as Service | "ALL" | null;
    const savedStatus = localStorage.getItem('dashboardV2_status') as "ALL" | PeriodStatus | null;
    const savedAssignee = localStorage.getItem('dashboardV2_assignee') as "ALL" | string | null;
    const savedView = localStorage.getItem('dashboardV2_view') as "board" | "list" | "calendar" | null;
    
    if (savedService) setService(savedService);
    if (savedStatus) setStatus(savedStatus);
    if (savedAssignee) setAssignee(savedAssignee);
    if (savedView) setView(savedView);
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    localStorage.setItem('dashboardV2_service', service);
  }, [service]);

  useEffect(() => {
    localStorage.setItem('dashboardV2_status', status);
  }, [status]);

  useEffect(() => {
    localStorage.setItem('dashboardV2_assignee', assignee);
  }, [assignee]);

  useEffect(() => {
    localStorage.setItem('dashboardV2_view', view);
  }, [view]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // / focuses search (if not in input already)
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  // Reset status when service changes (if current status is not valid for new service)
  useEffect(() => {
    if (status !== "ALL") {
      const validStatuses = getValidStatuses(service);
      if (!validStatuses.includes(status)) {
        setStatus("ALL");
      }
    }
  }, [service, status]);

  // Get unique assignees
  const uniqueAssignees = useMemo(() => getUniqueAssignees(demoPeriods), []);

  // Compute filtered periods
  const visiblePeriods = useMemo(() => {
    let filtered = periods;

    // Filter by service
    if (service !== "ALL") {
      filtered = filtered.filter(period => period.service === service);
    }

    // Filter by status
    if (status !== "ALL") {
      filtered = filtered.filter(period => period.status === status);
    }

    // Filter by assignee
    if (assignee !== "ALL") {
      filtered = filtered.filter(period => period.assignee === assignee);
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(period => 
        period.clientName.toLowerCase().includes(searchLower) ||
        period.periodLabel.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [periods, service, status, assignee, search, refreshKey]);

  // Get valid statuses for current service
  const validStatuses = useMemo(() => getValidStatuses(service), [service]);

  // Calculate stats for KPIs
  const stats = useMemo(() => ({
    activeClients: kpiActiveClients(visiblePeriods),
    onTimeRate: kpiOnTimeRateMTD(visiblePeriods)
  }), [visiblePeriods]);

  // Prepare groups for status cards
  const groups = useMemo(() => {
    const laneGroups = LANES.reduce((acc, lane) => {
      const lanePeriods = visiblePeriods.filter(p => laneForStatus(p.status) === lane.id);
      
      // Get status breakdown for this lane
      const statusCounts = new Map<string, number>();
      lanePeriods.forEach(period => {
        const count = statusCounts.get(period.status) || 0;
        statusCounts.set(period.status, count + 1);
      });
      
      const items = Array.from(statusCounts.entries())
        .map(([status, count]) => ({ label: status, count }))
        .sort((a, b) => b.count - a.count);
      
      acc[lane.id.toLowerCase()] = {
        total: lanePeriods.length,
        items
      };
      
      return acc;
    }, {} as Record<string, { total: number; items: Array<{ label: string; count: number }> }>);
    
    return laneGroups;
  }, [visiblePeriods]);

  // Toast management
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Period handlers
  const handleUpdatePeriod = (updatedPeriod: Period) => {
    setPeriods(prev => prev.map(p => p.id === updatedPeriod.id ? updatedPeriod : p));
    setRefreshKey(prev => prev + 1); // Force re-computation of analytics
  };

  // Client handlers
  const handleOpenClient = (period: Period) => {
    setSelectedClientId(period.clientId);
    setClientViewContext({ serviceFilter: period.service, periodId: period.id });
  };

  const handleCloseClient = () => {
    setSelectedClientId(null);
    setClientViewContext(null);
  };

  // Client view context state
  const [clientViewContext, setClientViewContext] = useState<{
    serviceFilter?: Service;
    periodId?: string;
  } | null>(null);

  return (
    <>
      {selectedClientId ? (
        <ClientView
          clientId={selectedClientId}
          periods={periods}
          onBack={handleCloseClient}
          onUpdate={handleUpdatePeriod}
          initialServiceFilter={clientViewContext?.serviceFilter}
          initialPeriodId={clientViewContext?.periodId}
        />
      ) : (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <WideContainer className="py-4">
          <HeaderBlock className="mb-3">
            {/* Title row */}
            <div className="flex items-center gap-2 md:gap-3 justify-start">
              <img 
                src="/src/assets/image copy copy copy copy.png" 
                alt="Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold text-gray-900">TAX & ACCOUNTANCY</span>
            </div>
          </HeaderBlock>
        </WideContainer>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <WideContainer>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard V2</h1>
            <p className="text-gray-600 mt-2">Enhanced practice overview with detailed insights</p>
          </div>

          {/* DashboardV2 Grid Layout */}
          <div className="dashboardV2 mb-8">
            {/* KPI 1 */}
            <section className="card card--pad area--kpi1">
              <TopKpi title="Active Clients" value={stats.activeClients} subtitle="With action needed" />
            </section>

            {/* KPI 2 */}
            <section className="card card--pad area--kpi2">
              <TopKpi title="On-Time Rate" value={`${stats.onTimeRate}%`} variant={stats.onTimeRate>=90?'good':stats.onTimeRate>=70?'warn':'bad'} />
            </section>

            {/* Donut (left, spans two rows) */}
            <section className="card area--donut">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status</h3>
                <NestedStatusKanbanChart periods={visiblePeriods} />
              </div>
            </section>

            {/* Right-side status cards, exact slots */}
            <section className="card card--pad area--todo">
              <StatusCard title="To Do" total={groups.todo?.total || 0} items={groups.todo?.items || []} />
            </section>

            <section className="card card--pad area--inprog">
              <StatusCard title="In Progress" total={groups.inprog?.total || 0} items={groups.inprog?.items || []} />
            </section>

            <section className="card card--pad area--withcl">
              <StatusCard title="With Client" total={groups.withclient?.total || 0} items={groups.withclient?.items || []} />
            </section>

            <section className="card card--pad area--ready">
              <StatusCard title="Ready for Review" total={groups.ready?.total || 0} items={groups.ready?.items || []} />
            </section>

            {/* Completed (tall, spans both rows by area definition) */}
            <section className="card card--pad area--done">
              <StatusCard title="Completed" total={groups.done?.total || 0} items={groups.done?.items || []} />
            </section>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 sticky top-4 z-20">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                {/* Service Filter - Different for Board vs Other Views */}
                {view === "board" ? (
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setService("VAT")}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          service === "VAT"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-white text-gray-600 border border-gray-300 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                        aria-label="Filter by VAT"
                        aria-pressed={service === "VAT"}
                      >
                        VAT
                      </button>
                      <button
                        onClick={() => setService("ACCOUNTS")}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          service === "ACCOUNTS"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-white text-gray-600 border border-gray-300 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                        aria-label="Filter by Accounts"
                        aria-pressed={service === "ACCOUNTS"}
                      >
                        Accounts
                      </button>
                      <button
                        onClick={() => setService("SA")}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          service === "SA"
                            ? "bg-violet-100 text-violet-800 border border-violet-200"
                            : "bg-white text-gray-600 border border-gray-300 hover:bg-violet-50 hover:text-violet-700"
                        }`}
                        aria-label="Filter by Self Assessment"
                        aria-pressed={service === "SA"}
                      >
                        Self Assessment
                      </button>
                      {service !== "ALL" && (
                        <button
                          onClick={() => setService("ALL")}
                          className="px-2 py-2 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Clear service filter"
                          title="Show all services"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <div className="relative">
                      <select
                        className={`filter px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px] ${
                          service !== "ALL" ? "is-filtered" : ""
                        }`}
                        value={service}
                        onChange={(e) => setService(e.target.value as Service | "ALL")}
                        aria-label="Filter by service type"
                      >
                        <option value="ALL">All Services</option>
                        <option value="VAT">VAT</option>
                        <option value="ACCOUNTS">Accounts</option>
                        <option value="SA">Self Assessment</option>
                      </select>
                      {service !== "ALL" && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <span className="filter-lozenge">Filtered</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Filter */}
                <div className="relative">
                  <select
                    className={`filter px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] ${
                      status !== "ALL" ? "is-filtered" : ""
                    }`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "ALL" | PeriodStatus)}
                    aria-label="Filter by status"
                  >
                    <option value="ALL">All Statuses</option>
                    {validStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {status !== "ALL" && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span className="filter-lozenge">Filtered</span>
                    </div>
                  )}
                </div>

                {/* Assignee Filter */}
                <div className="relative">
                  <select
                    className={`filter px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px] ${
                      assignee !== "ALL" ? "is-filtered" : ""
                    }`}
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value as "ALL" | string)}
                    aria-label="Filter by assignee"
                  >
                    <option value="ALL">All Assignees</option>
                    {uniqueAssignees.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  {assignee !== "ALL" && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <span className="filter-lozenge">Filtered</span>
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <div className={`filter relative flex-1 min-w-[200px] ${search.trim() ? "is-filtered" : ""}`}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search clients or periods..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Search clients or periods"
                  />
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center space-x-4">
                {/* View Toggle */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView("list")}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === "list"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  aria-label="Switch to list view"
                  aria-pressed={view === "list"}
                >
                  <ListIcon className="w-4 h-4" />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setView("board")}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === "board"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  aria-label="Switch to board view"
                  aria-pressed={view === "board"}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span>Board</span>
                </button>
                <button
                  onClick={() => setView("calendar")}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === "calendar"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  aria-label="Switch to calendar view"
                  aria-pressed={view === "calendar"}
                >
                  <span>📅</span>
                  <span>Calendar</span>
                </button>
              </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{visiblePeriods.length}</span> of{' '}
                <span className="font-medium">{demoPeriods.length}</span> periods
                {search && (
                  <span> matching "<span className="font-medium">{search}</span>"</span>
                )}
                <span className="text-gray-400 ml-4">Press Escape to close drawer, / to search</span>
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          {view === "list" ? (
            <List
              periods={visiblePeriods}
              serviceFilter={service === "ALL" ? undefined : service}
              onOpen={(clientId) => {
                // Find the period that was clicked to get service context
                const period = visiblePeriods.find(p => p.clientId === clientId);
                handleOpenClient(clientId, period?.service, period?.id);
              }}
              onUpdate={handleUpdatePeriod}
              onToast={showToast}
            />
          ) : view === "board" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <Board
                periods={visiblePeriods}
                serviceFilter={service === "ALL" ? undefined : service}
                onOpen={handleOpenClient}
                onUpdate={handleUpdatePeriod}
                onToast={showToast}
              />
            </div>
          ) : (
            <CalendarView
              periods={visiblePeriods}
              onUpdate={handleUpdatePeriod}
            />
          )}
        </WideContainer>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
      )}
    </>
  );
};

export default DashboardV2;