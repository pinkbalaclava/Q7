import React, { useState } from 'react';
import { MoreHorizontal, X, Mail, Upload, CheckCircle2, StickyNote } from 'lucide-react';
import type { Period } from './types';

type Props = {
  period: Period;
  onChange(next: Period): void;
};

export function ContextualActionsMenu({ period, onChange }: Props) {
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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Actions menu"
      >
        <MoreHorizontal className="w-4 h-4 text-gray-600" />
      </button>
      
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
            onMouseLeave={() => setOpen(false)}
          />
          
          {/* Menu */}
          <div 
            className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
            onMouseLeave={() => setOpen(false)}
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-500">Quick Actions</div>
            </div>
            
            <button
              onClick={handleEmailReminder}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Email reminder sent</span>
            </button>
            
            <button
              onClick={handleUploadWorking}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4 text-green-600" />
              <span>Upload working file</span>
            </button>
            
            <button
              onClick={handleRequestApproval}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>Approval requested</span>
            </button>
            
            <button
              onClick={handleAddNote}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
            >
              <StickyNote className="w-4 h-4 text-gray-600" />
              <span>Add note...</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}