import React, { useRef } from 'react';
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  User, 
  Mail, 
  Upload, 
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Eye
} from 'lucide-react';
import type { Period, Service } from './types';
import { nextAllowedTransitions, daysUntil } from './status';
import { StatusPill } from './StatusPill';
import { MoveMenu } from './MoveMenu';
import { LogActionSheet } from './LogActionSheet';
import { ServiceBadge } from './ServiceBadge';
import PeriodModal from './PeriodModal';

interface ListProps {
  periods: Period[];
  serviceFilter?: Service;
  onOpen: (period: Period) => void;
  onUpdate: (next: Period) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const List: React.FC<ListProps> = ({ periods, serviceFilter, onOpen, onUpdate, onToast }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPeriodId, setUploadingPeriodId] = React.useState<string | null>(null);
  const [pendingMove, setPendingMove] = React.useState<null | { period: Period; target: string }>(null);
  const [opened, setOpened] = React.useState<Period | null>(null);

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

  function requestMove(period: Period, targetStatus: string) {
    setPendingMove({ period, target: targetStatus });
  }

  function applyPendingMove() {
    if (!pendingMove) return;
    const p = pendingMove.period;
    const updatedPeriod: Period = {
      ...p,
      status: pendingMove.target as any,
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
  }

  function cancelPending() { 
    setPendingMove(null); 
  }

  function handleChange(next: Period) {
    handleUpdate(next);
  }

  function flagsFor(p: Period): string[] {
    const out: string[] = [];
    const isIntake = ["Awaiting Docs","Awaiting Questionnaire","Reminders Sent"].includes(p.status);
    if (isIntake && (p.reminderCount || 0) > 0) {
      out.push(`⚠️ ${p.reminderCount} reminder${(p.reminderCount||0) > 1 ? "s" : ""}`);
    }
    if (p.service === "VAT" && p.status === "Submitted") {
      // No HMRC API; if not explicitly marked Paid yet, show outstanding
      out.push("💰 Payment outstanding");
    }
    return out;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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

  // Hidden file input for uploads
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingPeriodId) return;

    const period = periods.find(p => p.id === uploadingPeriodId);
    if (!period) return;

    const newDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      url: '#', // Simulated
      uploadedAt: new Date().toISOString(),
      kind: 'Working' as const
    };

    const updatedPeriod: Period = {
      ...period,
      documents: [...period.documents, newDocument],
      comms: [
        {
          at: new Date().toISOString(),
          type: 'note',
          summary: `Working file uploaded: ${file.name}`
        },
        ...period.comms
      ]
    };

    onUpdate(updatedPeriod);
    onToast(`File "${file.name}" uploaded successfully`, 'success');
    
    // Reset
    setUploadingPeriodId(null);
    event.target.value = '';
  };

  if (periods.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center w-full">
        <div className="text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No periods found</h3>
          <p>Try adjusting your filters to see more results.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
      />

      <div className="w-full overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr className="border-b border-gray-200">
              <th className="text-left p-4 font-medium">Client</th>
              <th className="text-left p-4 font-medium">Service</th>
              <th className="text-left p-4 font-medium">Period</th>
              <th className="text-left p-4 font-medium">Due</th>
              <th className="text-left p-4 font-medium">Assignee</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Flags</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {periods.map((period) => (
              <tr key={period.id} className="hover:bg-gray-50 transition-colors">
                {/* Client */}
                <td className="p-4">
                  <button
                    onClick={() => handleOpen(period)}
                    className="text-left"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleOpen(period);
                      }
                    }}
                  >
                    <div className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {period.clientName}
                    </div>
                    {period.amount && (
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {formatCurrency(period.amount)}
                      </div>
                    )}
                  </button>
                </td>

                {/* Service */}
                <td className="p-4">
                  <ServiceBadge service={period.service} />
                </td>

                {/* Period */}
                <td className="p-4 text-gray-900">
                  {period.periodLabel}
                </td>

                {/* Due */}
                <td className="p-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className={`text-sm ${getDueDateColor(period.dueDate)}`}>
                      {formatDate(period.dueDate)}
                    </span>
                  </div>
                  {daysUntil(period.dueDate) < 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      {Math.abs(daysUntil(period.dueDate))} days overdue
                    </div>
                  )}
                </td>

                {/* Assignee */}
                <td className="p-4">
                  {period.assignee ? (
                    <div className="flex items-center space-x-1 text-gray-600">
                      <User className="w-3 h-3" />
                      <span>{period.assignee}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <StatusPill status={period.status} />
                    <MoveMenu period={period} onRequest={(target) => requestMove(period, target)} />
                  </div>
                </td>

                {/* Flags */}
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {flagsFor(period).map((flag, i) => (
                      <span key={i} className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                        {flag}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Actions */}
                <td className="p-4">
                  <div className="flex items-center justify-end">
                    <LogActionSheet period={period} onChange={handleChange} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      {pendingMove && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50 bg-black/50" onClick={cancelPending} />
          
          {/* Dialog */}
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Status Change</h3>
              <p className="text-sm text-gray-600 mt-2">
                Move "{pendingMove.period.clientName}" from <strong>{pendingMove.period.status}</strong> to <strong>{pendingMove.target}</strong>?
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={cancelPending}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyPendingMove}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </>
      )}

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

export default List;