export type Service = "VAT" | "ACCOUNTS" | "SA";

export type PeriodDoc = { 
  id: string; 
  name: string; 
  url?: string; 
  kind: "Working"|"Output"; 
  uploadedAt: string; 
  by?: string 
};

export type PeriodComms = { 
  at: string; 
  type: "email"|"note"; 
  summary: string 
};

export type Approval = { 
  link?: string; 
  requestedAt?: string 
};

export type Client = {
  id: string; 
  name: string; 
  email?: string; 
  phone?: string;
  address?: string; 
  companyNo?: string; 
  vatNo?: string; 
  yearEnd?: string;
  tags?: string[]; 
  startedAt?: string; 
  activeServices?: Service[]; 
  risk?: "Low"|"Med"|"High";
  engagementSignedAt?: string;
  amlVerifiedAt?: string;
};

export type VATStatus = 
  | "Awaiting Docs" 
  | "In Progress" 
  | "Awaiting Approval" 
  | "Ready to Submit" 
  | "Submitted" 
  | "Paid" 
  | "Closed";

export type AccountsStatus = 
  | "Awaiting Docs" 
  | "In Progress" 
  | "Draft Sent" 
  | "Awaiting Approval" 
  | "Ready to File" 
  | "Filed" 
  | "Closed";

export type SAStatus = 
  | "Awaiting Questionnaire" 
  | "Reminders Sent" 
  | "In Progress" 
  | "Awaiting Approval" 
  | "Submitted" 
  | "Done";

export type PeriodStatus = VATStatus | AccountsStatus | SAStatus;

export interface Period {
  id: string;
  clientId: string;
  clientName: string;
  service: Service;
  periodLabel: string;
  dueDate: string;
  status: PeriodStatus;
  assignee?: string;
  amount?: number;
  notes?: string;
  reminderCount?: number;
  submittedAt?: string;
  filedAt?: string;
  documents?: PeriodDoc[];
  comms?: PeriodComms[];
  approval?: Approval;
  history?: { at: string; summary: string }[];
}