import React, { useState } from 'react';
import { X, Mail, Upload, CheckCircle2, StickyNote } from 'lucide-react';
import type { Period } from './types';

type Props = {
  period: Period;
  onChange(next: Period): void;
};

export function LogActionSheet({ period, onChange }: Props) {
  const [open, setOpen] = useState(false);
  
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Log action"
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium bg-rose-100 text-rose-800 border border-rose-200/50 hover:bg-rose-200 transition-colors"
      >
        Log Action
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50" 
        onClick={() => setOpen(false)}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Log Action</h3>
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={handleEmailReminder}
            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Send email reminder</span>
          </button>
          
          <button
            onClick={handleAddNote}
            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
          >
            <StickyNote className="w-4 h-4 text-gray-600" />
            <span>Note…</span>
          </button>
        </div>
      </div>
    </>
  );
}