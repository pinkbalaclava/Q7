import React, { useState, useRef, useMemo } from 'react';
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  User, 
  Mail, 
  Upload, 
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  MoreVertical,
  ChevronDown,
  Settings,
  X,
  StickyNote,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import type { Period, Service, PeriodStatus } from './types';
import { nextAllowedTransitions, daysUntil, isTerminal } from './status';
import { LANES, laneForStatus, defaultStatusForLane, statusesForLane, laneStatuses, LaneId } from './lanes5';
import { prevAllowedTransitions } from './status';
import { StatusPill } from './StatusPill';
import { LogActionSheet } from './LogActionSheet';
import { MoveMenu } from './MoveMenu';
import { ServiceBadge } from './ServiceBadge';
import PeriodModal from './PeriodModal';

// Combined Actions Menu Component
const CombinedActionsMenu: React.FC<{
  period: Period;
  onChange: (next: Period) => void;
  onRequest: (target: string) => void;
}> = ({ period, onChange, onRequest }) => {
  const [open, setOpen] = useState(false);
  const forward = nextAllowedTransitions(period.service, period.status);
  const back = prevAllowedTransitions(period.service, period.status);
  
  function nowISO() { 
    return new Date().toISOString(); 
  }
  
  function addComms(summary: string) {
    const next = { 
      ...period, 
      comms: [
        { at: nowISO(), type: "note" as const, summary }, 
        ...(period.comms || [])
      ] 
    };
    onChange(next);
  }
  
  function handleEmailReminder() {
    const next = { ...period };
    next.comms = [
      { at: nowISO(), type: "email" as const, summary: "Reminder sent" }, 
      ...(period.comms || [])
    ];
    next.reminderCount = (period.reminderCount || 0) + 1;
    
    // SA stays in Awaiting Questionnaire/Reminders Sent; VAT/ACCOUNTS remain Awaiting Docs
    if (next.service === "SA" && ["Awaiting Questionnaire", "Reminders Sent"].includes(next.status)) {
      next.status = "Reminders Sent" as any;
    }
    
    onChange(next);
    setOpen(false);
  }
  
  function handleUploadWorking() {
    const next = { ...period };
    next.documents = [
      ...(period.documents || []),
      { 
        id: `doc-${Date.now()}`, 
        name: "Working file", 
        url: "#", 
        uploadedAt: nowISO(), 
        kind: "Working" as const 
      }
    ];
    onChange(next);
    setOpen(false);
  }
  
  function handleRequestApproval() {
    const next = { ...period };
    const link = next.approval?.link || `https://app.local/share/${period.id}`;
    next.approval = { 
      ...(next.approval || {}), 
      link, 
      requestedAt: nowISO() 
    };
    next.comms = [
      { at: nowISO(), type: "email" as const, summary: "Approval requested" }, 
      ...(period.comms || [])
    ];
    next.status = "Awaiting Approval" as any;
    onChange(next);
    setOpen(false);
  }

  function handleAddNote() {
    const note = prompt("Add note");
    if (note) {
      addComms(`Note: ${note}`);
    }
    setOpen(false);
  }

  function choose(s: string) { 
    onRequest(s); 
    setOpen(false); 
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Actions"
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
      >
        <Settings className="w-4 h-4" />
      </button>
      
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          
          {/* Popover */}
          <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Actions</h4>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Log Actions Section */}
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Log Actions</div>
                <div className="space-y-1">
                  <button
                    onClick={handleEmailReminder}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Mail className="w-3 h-3 text-blue-600" />
                    <span>Email reminder sent</span>
                  </button>
                  
                  <button
                    onClick={handleUploadWorking}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Upload className="w-3 h-3 text-green-600" />
                    <span>Upload working file</span>
                  </button>
                  
                  <button
                    onClick={handleRequestApproval}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3 text-purple-600" />
                    <span>Approval requested</span>
                  </button>
                  
                  <button
                    onClick={handleAddNote}
                    className="w-full flex items-center gap-3 px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <StickyNote className="w-3 h-3 text-gray-600" />
                    <span>Add note...</span>
                  </button>
                </div>
              </div>
              
              {/* Move Actions Section */}
              {(forward.length > 0 || back.length > 0) && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-500 mb-2">Move Status</div>
                  <div className="space-y-1">
                    {forward.map(s => (
                      <button
                        key={s}
                        onClick={() => choose(s)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <ArrowRight className="w-3 h-3 text-green-600" />
                        <span>{s}</span>
                      </button>
                    ))}
                    
                    {back.map(s => (
                      <button
                        key={s}
                        onClick={() => choose(s)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3 text-orange-600" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {forward.length === 0 && back.length === 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-500 mb-2">Move Status</div>
                  <div className="text-sm text-gray-500 text-center py-2">
                    No moves available
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

type Props = {
  periods: Period[];
  serviceFilter?: Service;
  onOpen(period: Period): void;
  onUpdate(next: Period): void;
  onToast(message: string, type?: 'success' | 'error' | 'info'): void;
};

const Board: React.FC<Props> = ({ periods, serviceFilter, onOpen, onUpdate, onToast }) => {
  const [draggedPeriod, setDraggedPeriod] = useState<Period | null>(null);
  const [pendingMove, setPendingMove] = useState<null | { period: Period; target: string }>(null);
  const [opened, setOpened] = useState<Period | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LaneId | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [justDragged, setJustDragged] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleOpen = (period: Period) => {
    onOpen(period);
  };

  const handleClose = () => {
    setOpened(null);
  };

  const handleUpdate = (next: Period) => {
    onUpdate(next);
    if (opened && opened.id === next.id) {
      setOpened(next);
    }
  };

  // Group periods by lane
  const periodsByLane = useMemo(() => {
    const grouped = LANES.reduce((acc, lane) => {
      acc[lane.id] = periods.filter(p => laneForStatus(p.status) === lane.id);
      return acc;
    }, {} as Record<LaneId, Period[]>);
    
    // If we just dragged, don't auto-sort to preserve user's chosen position
    if (!justDragged) {
      // Sort by due date within each lane
      Object.keys(grouped).forEach(laneId => {
        grouped[laneId as LaneId].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      });
    }
    
    return grouped;
  }, [periods, justDragged]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDueDateColor = (dueDate: string) => {
    const days = daysUntil(dueDate);
    if (days < 0) return 'text-red-600 font-semibold'; // Overdue
    if (days <= 3) return 'text-orange-600 font-medium'; // Due soon
    if (days <= 7) return 'text-yellow-600'; // Due this week
    return 'text-gray-600'; // Future
  };

  // Helper to propose a move (called by DnD and menu)
  const requestMove = (period: Period, targetStatus: string) => {
    setPendingMove({ period, target: targetStatus });
  };

  const applyPendingMove = () => {
    if (!pendingMove) return;
    const p = pendingMove.period;
    const updatedPeriod: Period = {
      ...p,
      status: pendingMove.target as PeriodStatus,
      comms: [
        {
          at: new Date().toISOString(),
          type: 'note',
          summary: `Status changed from "${p.status}" to "${pendingMove.target}"`
        },
        ...p.comms
      ]
    };
    onUpdate(updatedPeriod);
    onToast(`Moved to ${pendingMove.target}`, 'success');
    setPendingMove(null);
  };

  // When dropping into laneId, pick a target exact status that matches BOTH the lane and allowed transitions (forward OR back)
  const pickTargetStatusForDrop = (period: Period, laneId: LaneId): string | null => {
    const laneOpts = laneStatuses(period.service, laneId);
    const forward = nextAllowedTransitions(period.service, period.status);
    const back = prevAllowedTransitions(period.service, period.status);
    const allowed = new Set<string>([...forward, ...back]);
    
    // Prefer an allowed option that belongs to the lane
    const candidate = laneOpts.find(s => allowed.has(s));
    if (candidate) return candidate;
    
    // If the period is already in a lane status that matches the lane, allow 'no-op' (return same)
    if (laneOpts.includes(period.status)) return period.status;
    
    return null; // not allowed
  };

  const getServicePillColor = (service: Service) => {
    switch (service) {
      case 'VAT':
        return 'bg-blue-100 text-blue-800';
      case 'ACCOUNTS':
        return 'bg-green-100 text-green-800';
      case 'SA':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, period: Period) => {
    setDraggedPeriod(period);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', period.id);
    // Add dragging class to the card
    setTimeout(() => {
      const target = e.target as HTMLElement;
      target.classList.add('is-dragging');
    }, 0);
  };

  const handleDragEnd = () => {
    // Clear drag state and remove all drag classes
    setDraggedPeriod(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
    // Clean up any drag styles
    requestAnimationFrame(() => {
      document.querySelectorAll('.kanban__card').forEach(el => {
        (el as HTMLElement).style.transform = '';
        el.classList.remove('is-dragging');
        el.classList.remove('kanban__card--ghost');
      });
    });
  };

  const handleDragOver = (e: React.DragEvent, laneId: LaneId, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(laneId);
    if (typeof index === 'number') {
      setDragOverIndex(index);
    }
    
    // Auto-scroll logic for long columns
    const column = document.querySelector(`[data-col="${laneId}"] .kanban__scroller`) as HTMLElement;
    if (!column) return;
    
    const { top, bottom } = column.getBoundingClientRect();
    const margin = 80;
    const clientY = e.clientY;
    
    if (clientY < top + margin) {
      column.scrollBy({ top: -20, behavior: 'auto' });
    }
    if (clientY > bottom - margin) {
      column.scrollBy({ top: 20, behavior: 'auto' });
    }
  };

  const handleDrop = (e: React.DragEvent, targetLane: LaneId, dropIndex?: number) => {
    e.preventDefault();
    
    if (!draggedPeriod) return;
    
    const target = pickTargetStatusForDrop(draggedPeriod, targetLane);
    if (!target) {
      onToast('Move not allowed - no valid status in that lane for this item', 'error');
      return;
    }
    
    if (target === draggedPeriod.status) {
      return; // nothing to do
    }
    
    // Mark that we just dragged to prevent auto-sorting
    setJustDragged(true);
    setTimeout(() => setJustDragged(false), 100);
    
    // Update the period with new status
    const updatedPeriod: Period = {
      ...draggedPeriod,
      status: target as PeriodStatus,
      comms: [
        {
          at: new Date().toISOString(),
          type: 'note',
          summary: `Status changed from "${draggedPeriod.status}" to "${target}"`
        },
        ...draggedPeriod.comms
      ]
    };
    
    onUpdate(updatedPeriod);
    onToast(`Moved to ${target}`, 'success');
    
    // Ensure the dropped card is visible
    requestAnimationFrame(() => {
      const cardEl = cardRefs.current[draggedPeriod.id];
      if (cardEl) {
        cardEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  };

  return (
    <>
      <div className="grid gap-4 pb-4 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" style={{ minHeight: '900px' }}>
      {LANES.map(lane => {
        const lanePeriods = periodsByLane[lane.id] || [];
        
        return (
          <div
            key={lane.id}
            className="kanban__column bg-gray-50 rounded-lg p-4 min-w-0 min-w-[280px] flex flex-col relative overflow-visible"
            style={{ minHeight: '900px', height: 'max(900px, 100vh - 200px)' }}
            data-col={lane.id}
            onDragOver={(e) => handleDragOver(e, lane.id)}
            onDrop={(e) => handleDrop(e, lane.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{lane.title}</h3>
              <span className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full">
                {lanePeriods.length}
              </span>
            </div>

            {/* Column Content */}
            <div 
              className="kanban__scroller space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 pr-1" 
              style={{ maxHeight: '900px', minHeight: '900px' }}
              onDragOver={(e) => handleDragOver(e, lane.id)}
              onDrop={(e) => handleDrop(e, lane.id)}
            >
              {lanePeriods.map((period, index) => (
                <div
                  key={period.id}
                  ref={(el) => { cardRefs.current[period.id] = el; }}
                  className={`kanban__card bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-move ${
                    draggedPeriod?.id === period.id ? 'is-dragging' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, period)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => {
                    e.stopPropagation();
                    handleDragOver(e, lane.id, index);
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(e, lane.id, index);
                  }}
                  style={{
                    opacity: 1, // Always full opacity for the actual card
                  }}
                >
                  {/* Compact Card Layout */}
                  <div className="space-y-2">
                    {/* Row 1: Client Name and Service Badge */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleOpen(period)}
                        className="text-left flex-1"
                      >
                        <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm">
                          {period.clientName}
                        </h4>
                      </button>
                      <ServiceBadge service={period.service} />
                    </div>

                    {/* Row 2: Status and Assignee */}
                    <div className="flex items-center justify-between">
                      <StatusPill status={period.status} />
                      {period.assignee && (
                        <div className="flex items-center space-x-1 text-gray-600 text-xs">
                          <User className="w-3 h-3" />
                          <span>{period.assignee}</span>
                        </div>
                      )}
                    </div>

                    {/* Row 3: Period Label and Due Date */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{period.periodLabel}</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span className={getDueDateColor(period.dueDate)}>
                          {formatDate(period.dueDate)}
                        </span>
                      </div>
                    </div>

                    {/* Row 4: Reminders and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {period.reminderCount && period.reminderCount > 0 && ["Awaiting Docs", "Awaiting Questionnaire", "Reminders Sent"].includes(period.status) && (
                          <div className="flex items-center space-x-1 text-xs text-orange-600">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{period.reminderCount} reminders</span>
                          </div>
                        )}
                      </div>
                      <div className="card__actions-popover">
                        <CombinedActionsMenu period={period} onChange={handleUpdate} onRequest={(target) => requestMove(period, target)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Drop zone at the end of the column */}
              <div
                className="min-h-[20px] w-full"
                onDragOver={(e) => {
                  e.stopPropagation();
                  handleDragOver(e, lane.id, lanePeriods.length);
                }}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDrop(e, lane.id, lanePeriods.length);
                }}
              />
              
              {lanePeriods.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-8 flex-1 flex items-center justify-center">
                  No periods in this lane
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>


      {/* Period Modal */}
      <PeriodModal 
        open={!!opened} 
        period={opened} 
        onClose={handleClose} 
        onUpdate={handleUpdate} 
      />
    </>
  );
};

export default Board;