import type { Period } from './types';
import { generateAdditionalClients } from './data';

// Helper to generate multiple periods per client based on their active services
function generatePeriodsForClient(client: any, baseId: number): Period[] {
  const periods: Period[] = [];
  
  client.activeServices.forEach((service: "VAT" | "ACCOUNTS" | "SA", serviceIndex: number) => {
    const periodId = `p${String(baseId + serviceIndex).padStart(3, '0')}`;
    const status = generateStatus(service);
    const amount = generateAmount(service);
    const periodLabel = generatePeriodLabel(service);
    
    // Generate service-specific due date
    let dueDate: string;
    if (service === "VAT") {
      const dueDates = ["2025-01-31", "2025-04-30", "2025-07-31", "2025-10-31", "2024-10-31"];
      dueDate = randomChoice(dueDates);
    } else if (service === "ACCOUNTS") {
      const dueDates = ["2025-03-31", "2025-06-30", "2025-09-30", "2025-12-31"];
      dueDate = randomChoice(dueDates);
    } else {
      const dueDates = ["2025-01-31", "2025-04-30", "2025-07-31", "2025-10-31"];
      dueDate = randomChoice(dueDates);
    }
    
    const reminderCount = ["Awaiting Docs", "Awaiting Questionnaire", "Reminders Sent"].includes(status) 
      ? randomInt(0, 4) : undefined;
    
    const submittedAt = ["Submitted", "Filed", "Paid", "Done", "Closed"].includes(status)
      ? randomDate(new Date('2024-01-01'), new Date()).split('T')[0] + 'T' + 
        String(randomInt(9, 17)).padStart(2, '0') + ':' + 
        String(randomInt(0, 59)).padStart(2, '0') + ':00Z'
      : undefined;
    
    const filedAt = ["Filed", "Closed"].includes(status) ? submittedAt : undefined;
    
    const approval = status === "Awaiting Approval" ? {
      link: `https://approval.example.com/${service.toLowerCase()}/${client.id}-${periodId}`,
      requestedAt: randomDate(new Date('2024-01-01'), new Date()).split('T')[0] + 'T' + 
                   String(randomInt(9, 17)).padStart(2, '0') + ':' + 
                   String(randomInt(0, 59)).padStart(2, '0') + ':00Z'
    } : undefined;
    
    periods.push({
      id: periodId,
      clientId: client.id,
      clientName: client.name,
      service,
      periodLabel,
      dueDate,
      status: status as any,
      assignee: randomChoice(ASSIGNEES),
      amount,
      reminderCount,
      submittedAt,
      filedAt,
      documents: generateDocuments(service, status),
      comms: generateComms(status),
      approval,
      notes: Math.random() > 0.7 ? `${randomChoice(['Priority client', 'Complex case', 'New client', 'Recurring work', 'Special requirements'])} - ${service}` : undefined
    });
  });
  
  return periods;
}

const COMPANY_SUFFIXES = ["Ltd", "Pty", "Corp", "Inc", "Group", "Co", "LLC", "LLP"];

// Helper functions for generating realistic data
const CLIENT_NAMES = [
  "Apex Solutions Ltd", "Bright Horizons Group", "Cedar Point Industries", "Dynamic Systems Corp",
  "Elite Ventures Pty", "Fusion Technologies", "Global Reach Partners", "Horizon Capital Ltd",
  "Innovative Designs Co", "Keystone Holdings", "Lighthouse Consulting", "Metro Business Group",
  "Northern Star Enterprises", "Oceanic Trading Ltd", "Premier Services Corp", "Quantum Solutions",
  "Riverside Holdings", "Summit Strategies", "Titan Industries", "Unity Business Partners",
  "Vertex Consulting", "Westfield Group", "Zenith Corporation", "Alpha Dynamics",
  "Beta Technologies", "Gamma Enterprises", "Delta Solutions", "Epsilon Holdings",
  "Zeta Consulting", "Eta Industries", "Theta Partners", "Iota Systems",
  "Kappa Ventures", "Lambda Corp", "Mu Holdings", "Nu Technologies",
  "Xi Solutions", "Omicron Group", "Pi Enterprises", "Rho Consulting",
  "Sigma Industries", "Tau Partners", "Upsilon Corp", "Phi Holdings",
  "Chi Technologies", "Psi Solutions", "Omega Enterprises", "Acme Corp",
  "Pinnacle Group", "Sterling Solutions", "Meridian Holdings", "Catalyst Partners"
];

const BUSINESS_TYPES = [
  "Tech", "Consulting", "Manufacturing", "Retail", "Healthcare", "Finance", 
  "Construction", "Education", "Hospitality", "Transport", "Energy", "Media",
  "Legal", "Real Estate", "Agriculture", "Automotive", "Aerospace", "Biotech"
];

const ASSIGNEES = ["Erika", "Daniel", "Aisha", "Nomsa", "Thabo", "Marta", "James", "Sarah", "Michael", "Lisa"];

const SERVICES: Array<"VAT" | "ACCOUNTS" | "SA"> = ["VAT", "ACCOUNTS", "SA"];

const VAT_STATUSES = ["Awaiting Docs", "In Progress", "Awaiting Approval", "Ready to Submit", "Submitted", "Paid", "Closed"];
const ACCOUNTS_STATUSES = ["Awaiting Docs", "In Progress", "Draft Sent", "Awaiting Approval", "Ready to File", "Filed", "Closed"];
const SA_STATUSES = ["Awaiting Questionnaire", "Reminders Sent", "In Progress", "Awaiting Approval", "Submitted", "Done"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateClientName(): string {
  const base = randomChoice(CLIENT_NAMES);
  const suffix = Math.random() > 0.7 ? ` ${randomChoice(BUSINESS_TYPES)}` : '';
  return base + suffix;
}

function generatePeriodLabel(service: "VAT" | "ACCOUNTS" | "SA"): string {
  if (service === "VAT") {
    const quarters = ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2024", "Q1 2024"];
    return randomChoice(quarters);
  } else if (service === "ACCOUNTS") {
    const years = ["Year End 2024", "Year End 2023", "Year End 2025"];
    return randomChoice(years);
  } else {
    const taxYears = ["Tax Year 2023/24", "Tax Year 2022/23", "Tax Year 2024/25"];
    return randomChoice(taxYears);
  }
}

function generateStatus(service: "VAT" | "ACCOUNTS" | "SA"): string {
  if (service === "VAT") return randomChoice(VAT_STATUSES);
  if (service === "ACCOUNTS") return randomChoice(ACCOUNTS_STATUSES);
  return randomChoice(SA_STATUSES);
}

function generateAmount(service: "VAT" | "ACCOUNTS" | "SA"): number {
  if (service === "VAT") return randomInt(2000, 25000);
  if (service === "ACCOUNTS") return randomInt(1500, 8000);
  return randomInt(500, 3000);
}

function generateDocuments(service: "VAT" | "ACCOUNTS" | "SA", status: string): any[] {
  const docs = [];
  const docCount = randomInt(0, 4);
  
  for (let i = 0; i < docCount; i++) {
    const isWorking = Math.random() > 0.4;
    const docTypes = {
      VAT: isWorking ? ["VAT Return Draft.pdf", "Bank Statements.xlsx", "Purchase Invoices.pdf"] 
                     : ["VAT Return Final.pdf", "HMRC Confirmation.pdf"],
      ACCOUNTS: isWorking ? ["Trial Balance.xlsx", "Bank Reconciliation.pdf", "Adjustments.xlsx"]
                          : ["Final Accounts.pdf", "Companies House Filing.pdf"],
      SA: isWorking ? ["SA Questionnaire.pdf", "P60 Forms.pdf", "Expense Receipts.pdf"]
                    : ["SA302 Calculation.pdf", "HMRC Confirmation.pdf"]
    };
    
    docs.push({
      id: `doc-${Date.now()}-${i}`,
      name: randomChoice(docTypes[service]),
      url: `#doc-${i}`,
      uploadedAt: randomDate(new Date('2024-01-01'), new Date()).split('T')[0] + 'T' + 
                  String(randomInt(9, 17)).padStart(2, '0') + ':' + 
                  String(randomInt(0, 59)).padStart(2, '0') + ':00Z',
      kind: isWorking ? "Working" : "Output"
    });
  }
  
  return docs;
}

function generateComms(status: string): any[] {
  const comms = [];
  const commCount = randomInt(1, 5);
  
  const commTypes = [
    "Initial contact made with client",
    "Documents requested from client", 
    "Reminder sent for missing information",
    "Draft prepared and reviewed internally",
    "Client approval requested",
    "Submission completed successfully",
    "Payment confirmation received",
    "File archived and closed"
  ];
  
  for (let i = 0; i < commCount; i++) {
    comms.push({
      at: randomDate(new Date('2024-01-01'), new Date()).split('T')[0] + 'T' + 
          String(randomInt(9, 17)).padStart(2, '0') + ':' + 
          String(randomInt(0, 59)).padStart(2, '0') + ':00Z',
      type: Math.random() > 0.3 ? "email" : "note",
      summary: randomChoice(commTypes)
    });
  }
  
  return comms.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

// Generate additional periods
function generateAdditionalPeriods(): Period[] {
  const periods: Period[] = [];
  
  // First, generate periods for each client based on their active services
  const clients = generateAdditionalClients();
  let periodId = 100;
  
  clients.forEach((client, clientIndex) => {
    // Generate 1-3 periods per client based on their active services
    const periodsPerClient = randomInt(1, 3);
    
    for (let p = 0; p < periodsPerClient; p++) {
      // Pick a service from the client's active services
      const service = randomChoice(client.activeServices);
      const status = generateStatus(service);
      const amount = generateAmount(service);
      const periodLabel = generatePeriodLabel(service);
      
      // Generate due date based on service and period
      let dueDate: string;
      if (service === "VAT") {
        const dueDates = ["2025-01-31", "2025-04-30", "2025-07-31", "2025-10-31", "2024-10-31"];
        dueDate = randomChoice(dueDates);
      } else if (service === "ACCOUNTS") {
        const dueDates = ["2025-03-31", "2025-06-30", "2025-09-30", "2025-12-31"];
        dueDate = randomChoice(dueDates);
      } else {
        const dueDates = ["2025-01-31", "2025-04-30", "2025-07-31", "2025-10-31"];
        dueDate = randomChoice(dueDates);
      }
      
      const reminderCount = ["Awaiting Docs", "Awaiting Questionnaire", "Reminders Sent"].includes(status) 
        ? randomInt(0, 4) : undefined;
      
      const submittedAt = ["Submitted", "Filed", "Paid", "Done", "Closed"].includes(status)
        ? randomDate(new Date('2024-01-01'), new Date()).split('T')[0] + 'T' + 
          String(randomInt(9, 17)).padStart(2, '0') + ':' + 
          String(randomInt(0, 59)).padStart(2, '0') + ':00Z'
        : undefined;
      
      const filedAt = ["Filed", "Closed"].includes(status) ? submittedAt : undefined;
      
      const approval = status === "Awaiting Approval" ? {
        link: `https://approval.example.com/${service.toLowerCase()}/${client.id}-${periodId}`,
        requestedAt: randomDate(new Date('2024-01-01'), new Date()).split('T')[0] + 'T' + 
                     String(randomInt(9, 17)).padStart(2, '0') + ':' + 
                     String(randomInt(0, 59)).padStart(2, '0') + ':00Z'
      } : undefined;
      
      periods.push({
        id: `p${String(periodId).padStart(3, '0')}`,
        clientId: client.id,
        clientName: client.name,
        service,
        periodLabel,
        dueDate,
        status: status as any,
        assignee: randomChoice(ASSIGNEES),
        amount,
        reminderCount,
        submittedAt,
        filedAt,
        documents: generateDocuments(service, status),
        comms: generateComms(status),
        approval,
        notes: Math.random() > 0.7 ? `${randomChoice(['Priority client', 'Complex case', 'New client', 'Recurring work', 'Special requirements'])}` : undefined
      });
      
      periodId++;
    }
  });
  
  // Generate some additional random periods to fill out the dataset
  for (let i = 0; i < 50; i++) {
    const service = randomChoice(SERVICES);
    const status = generateStatus(service);
    const clientName = `${randomChoice(["Apex", "Bright", "Cedar", "Dynamic", "Elite"])} ${randomChoice(["Solutions", "Technologies", "Consulting"])} ${randomChoice(COMPANY_SUFFIXES)}`;
    const assignee = randomChoice(ASSIGNEES);
    const amount = generateAmount(service);
    const periodLabel = generatePeriodLabel(service);
    
    // Generate due date based on service and period
    let dueDate: string;
    if (service === "VAT") {
      const dueDates = ["2025-01-31", "2025-04-30", "2025-07-31", "2025-10-31", "2024-10-31"];
      dueDate = randomChoice(dueDates);
    } else if (service === "ACCOUNTS") {
      const dueDates = ["2025-03-31", "2025-06-30", "2025-09-30", "2025-12-31"];
      dueDate = randomChoice(dueDates);
    } else {
      const dueDates = ["2025-01-31", "2025-04-30", "2025-07-31", "2025-10-31"];
      dueDate = randomChoice(dueDates);
    }
    
    const reminderCount = ["Awaiting Docs", "Awaiting Questionnaire", "Reminders Sent"].includes(status) 
      ? randomInt(0, 4) : undefined;
    
    const submittedAt = ["Submitted", "Filed", "Paid", "Done", "Closed"].includes(status)
      ? randomDate(new Date('2024-01-01'), new Date()).split('T')[0] + 'T' + 
        String(randomInt(9, 17)).padStart(2, '0') + ':' + 
        String(randomInt(0, 59)).padStart(2, '0') + ':00Z'
      : undefined;
    
    const filedAt = ["Filed", "Closed"].includes(status) ? submittedAt : undefined;
    
    const approval = status === "Awaiting Approval" ? {
      link: `https://approval.example.com/${service.toLowerCase()}/${9000 + i}-${i}`,
      requestedAt: randomDate(new Date('2024-01-01'), new Date()).split('T')[0] + 'T' + 
                   String(randomInt(9, 17)).padStart(2, '0') + ':' + 
                   String(randomInt(0, 59)).padStart(2, '0') + ':00Z'
    } : undefined;
    
    periods.push({
      id: `p${String(periodId).padStart(3, '0')}`,
      clientId: `c-${String(9000 + i).padStart(4, '0')}`, // Use high numbers to avoid conflicts
      clientName,
      service,
      periodLabel,
      dueDate,
      status: status as any,
      assignee,
      amount,
      reminderCount,
      submittedAt,
      filedAt,
      documents: generateDocuments(service, status),
      comms: generateComms(status),
      approval,
      notes: Math.random() > 0.7 ? `${randomChoice(['Priority client', 'Complex case', 'New client', 'Recurring work', 'Special requirements'])}` : undefined
    });
    
    periodId++;
  }
  
  return periods;
}

export const demoPeriods: Period[] = [
  // Bright Tech Solutions Ltd - Multiple Services
  {
    id: "p001",
    clientId: "c-0001",
    clientName: "Bright Tech Solutions Ltd",
    service: "VAT",
    periodLabel: "Q3 2025",
    dueDate: "2025-08-30",
    status: "Awaiting Docs",
    assignee: "Erika",
    amount: 12500,
    reminderCount: 2,
    documents: [
      {
        id: "d001",
        name: "VAT Return Q3 Draft.pdf",
        url: "/docs/vat-q3-draft.pdf",
        uploadedAt: "2025-08-15T10:30:00Z",
        kind: "Working"
      }
    ],
    comms: [
      {
        at: "2025-08-20T14:20:00Z",
        type: "email",
        summary: "Reminder sent for missing bank statements"
      },
      {
        at: "2025-08-18T09:15:00Z",
        type: "note",
        summary: "Client confirmed they will send docs by Friday"
      }
    ]
  },
  {
    id: "p001b",
    clientId: "c-0001",
    clientName: "Bright Tech Solutions Ltd",
    service: "ACCOUNTS",
    periodLabel: "Year End 2024",
    dueDate: "2025-09-30",
    status: "In Progress",
    assignee: "Daniel",
    amount: 4500,
    documents: [
      {
        id: "d001b",
        name: "Trial Balance 2024.xlsx",
        url: "/docs/trial-balance-2024.xlsx",
        uploadedAt: "2025-08-22T16:45:00Z",
        kind: "Working"
      }
    ],
    comms: [
      {
        at: "2025-08-22T10:00:00Z",
        type: "note",
        summary: "Started preparing accounts for Bright Tech"
      }
    ]
  },
  // Harbor Consulting Group - Multiple Services
  {
    id: "p002",
    clientId: "c-0002",
    clientName: "Harbor Consulting Group",
    service: "ACCOUNTS",
    periodLabel: "Year End 2024",
    dueDate: "2025-09-15",
    status: "In Progress",
    assignee: "Daniel",
    amount: 4500,
    documents: [
      {
        id: "d002",
        name: "Trial Balance 2024.xlsx",
        url: "/docs/trial-balance-2024.xlsx",
        uploadedAt: "2025-08-22T16:45:00Z",
        kind: "Working"
      },
      {
        id: "d003",
        name: "Bank Reconciliation.pdf",
        url: "/docs/bank-recon.pdf",
        uploadedAt: "2025-08-21T11:20:00Z",
        kind: "Working"
      }
    ],
    comms: [
      {
        at: "2025-08-22T10:00:00Z",
        type: "note",
        summary: "Started preparing accounts, awaiting final adjustments"
      }
    ]
  },
  {
    id: "p002b",
    clientId: "c-0002",
    clientName: "Harbor Consulting Group",
    service: "SA",
    periodLabel: "Tax Year 2023/24",
    dueDate: "2025-08-31",
    status: "Awaiting Questionnaire",
    assignee: "Aisha",
    amount: 1200,
    documents: [],
    comms: [
      {
        at: "2025-08-21T09:30:00Z",
        type: "email",
        summary: "SA questionnaire sent to Harbor Consulting"
      }
    ]
  },
  // Vista Energy Partners - All Services
  {
    id: "p003",
    clientId: "c-0003",
    clientName: "Vista Energy Partners",
    service: "SA",
    periodLabel: "Tax Year 2023/24",
    dueDate: "2025-08-25",
    status: "Reminders Sent",
    assignee: "Aisha",
    reminderCount: 3,
    documents: [],
    comms: [
      {
        at: "2025-08-23T15:30:00Z",
        type: "email",
        summary: "Final reminder sent for SA questionnaire"
      },
      {
        at: "2025-08-20T12:00:00Z",
        type: "email",
        summary: "Second reminder sent"
      }
    ]
  },
  {
    id: "p003b",
    clientId: "c-0003",
    clientName: "Vista Energy Partners",
    service: "VAT",
    periodLabel: "Q3 2025",
    dueDate: "2025-08-31",
    status: "Ready to Submit",
    assignee: "Erika",
    amount: 25000,
    documents: [
      {
        id: "d003b",
        name: "VAT Return Q3 Final.pdf",
        url: "/docs/vat-q3-final.pdf",
        uploadedAt: "2025-08-24T14:20:00Z",
        kind: "Output"
      }
    ],
    comms: [
      {
        at: "2025-08-24T14:25:00Z",
        type: "email",
        summary: "VAT return approved and ready for submission"
      }
    ]
  },
  {
    id: "p003c",
    clientId: "c-0003",
    clientName: "Vista Energy Partners",
    service: "ACCOUNTS",
    periodLabel: "Year End 2024",
    dueDate: "2025-12-31",
    status: "Awaiting Approval",
    assignee: "Daniel",
    amount: 8500,
    approval: {
      link: "https://approval.example.com/accounts/p003c",
      requestedAt: "2025-08-20T09:00:00Z"
    },
    documents: [
      {
        id: "d003c",
        name: "Draft Accounts 2024.pdf",
        url: "/docs/draft-accounts-2024.pdf",
        uploadedAt: "2025-08-20T08:45:00Z",
        kind: "Output"
      }
    ],
    comms: [
      {
        at: "2025-08-20T09:05:00Z",
        type: "email",
        summary: "Draft accounts sent to Vista Energy for approval"
      }
    ]
  },
  {
    id: "p004",
    clientId: "c-0001",
    clientName: "Quartz Holdings Inc",
    service: "VAT",
    periodLabel: "Q2 2025",
    dueDate: "2025-07-31",
    status: "Submitted",
    assignee: "Erika",
    amount: 8750,
    submittedAt: "2025-07-28T14:15:00Z",
    documents: [
      {
        id: "d004",
        name: "VAT Return Q2 Final.pdf",
        url: "/docs/vat-q2-final.pdf",
        uploadedAt: "2025-07-28T14:10:00Z",
        kind: "ClientOutput"
      }
    ],
    comms: [
      {
        at: "2025-07-28T14:20:00Z",
        type: "email",
        summary: "VAT return submitted successfully to HMRC"
      }
    ]
  },
  {
    id: "p005",
    clientId: "c-0002",
    clientName: "Cedar Studios Ltd",
    service: "ACCOUNTS",
    periodLabel: "Year End 2024",
    dueDate: "2025-08-28",
    status: "Awaiting Approval",
    assignee: "Nomsa",
    amount: 3200,
    approval: {
      link: "https://approval.example.com/accounts/p005",
      requestedAt: "2025-08-24T09:00:00Z"
    },
    documents: [
      {
        id: "d005",
        name: "Draft Accounts 2024.pdf",
        url: "/docs/draft-accounts-2024.pdf",
        uploadedAt: "2025-08-24T08:45:00Z",
        kind: "ClientOutput"
      }
    ],
    comms: [
      {
        at: "2025-08-24T09:05:00Z",
        type: "email",
        summary: "Draft accounts sent to client for approval"
      }
    ]
  },
  {
    id: "p006",
    clientId: "c-0003",
    clientName: "Summit Logistics Pty",
    service: "VAT",
    periodLabel: "Q1 2025",
    dueDate: "2025-04-30",
    status: "Paid",
    assignee: "Thabo",
    amount: 15600,
    submittedAt: "2025-04-25T11:30:00Z",
    documents: [
      {
        id: "d006",
        name: "VAT Return Q1 Final.pdf",
        url: "/docs/vat-q1-final.pdf",
        uploadedAt: "2025-04-25T11:25:00Z",
        kind: "ClientOutput"
      }
    ],
    comms: [
      {
        at: "2025-05-15T10:00:00Z",
        type: "note",
        summary: "Payment confirmed by HMRC"
      }
    ]
  },
  {
    id: "p007",
    clientId: "c-0001",
    clientName: "Orion Health Services",
    service: "SA",
    periodLabel: "Tax Year 2023/24",
    dueDate: "2025-09-01",
    status: "In Progress",
    assignee: "Marta",
    documents: [
      {
        id: "d007",
        name: "SA Questionnaire Completed.pdf",
        url: "/docs/sa-questionnaire.pdf",
        uploadedAt: "2025-08-20T13:15:00Z",
        kind: "Working"
      }
    ],
    comms: [
      {
        at: "2025-08-20T13:20:00Z",
        type: "note",
        summary: "Questionnaire received, starting SA preparation"
      }
    ]
  },
  {
    id: "p008",
    clientId: "c-0002",
    clientName: "Atlas Finance Group",
    service: "ACCOUNTS",
    periodLabel: "Year End 2024",
    dueDate: "2025-08-20",
    status: "Filed",
    assignee: "Daniel",
    amount: 5800,
    filedAt: "2025-08-18T16:20:00Z",
    documents: [
      {
        id: "d008",
        name: "Filed Accounts 2024.pdf",
        url: "/docs/filed-accounts-2024.pdf",
        uploadedAt: "2025-08-18T16:15:00Z",
        kind: "ClientOutput"
      },
      {
        id: "d009",
        name: "Companies House Confirmation.pdf",
        url: "/docs/ch-confirmation.pdf",
        uploadedAt: "2025-08-18T16:25:00Z",
        kind: "ClientOutput"
      }
    ],
    comms: [
      {
        at: "2025-08-18T16:30:00Z",
        type: "email",
        summary: "Accounts successfully filed with Companies House"
      }
    ]
  },
  {
    id: "p009",
    clientId: "c-0003",
    clientName: "Juniper Retail Co",
    service: "VAT",
    periodLabel: "Q3 2025",
    dueDate: "2025-08-31",
    status: "Ready to Submit",
    assignee: "Erika",
    amount: 9200,
    approval: {
      link: "https://approval.example.com/vat/p009",
      requestedAt: "2025-08-23T10:30:00Z",
      approvedAt: "2025-08-24T14:15:00Z"
    },
    documents: [
      {
        id: "d010",
        name: "VAT Return Q3 Approved.pdf",
        url: "/docs/vat-q3-approved.pdf",
        uploadedAt: "2025-08-24T14:20:00Z",
        kind: "ClientOutput"
      }
    ],
    comms: [
      {
        at: "2025-08-24T14:25:00Z",
        type: "email",
        summary: "Client approved VAT return, ready for submission"
      }
    ]
  },
  {
    id: "p010",
    clientId: "c-0001",
    clientName: "Vertex Solutions Ltd",
    service: "SA",
    periodLabel: "Tax Year 2023/24",
    dueDate: "2025-08-15",
    status: "Done",
    assignee: "Aisha",
    submittedAt: "2025-08-10T12:45:00Z",
    documents: [
      {
        id: "d011",
        name: "SA302 Tax Calculation.pdf",
        url: "/docs/sa302-calculation.pdf",
        uploadedAt: "2025-08-10T12:50:00Z",
        kind: "ClientOutput"
      }
    ],
    comms: [
      {
        at: "2025-08-10T13:00:00Z",
        type: "email",
        summary: "Self Assessment submitted and accepted by HMRC"
      }
    ]
  },
  {
    id: "p011",
    clientId: "c-0002",
    clientName: "River Industries Pty",
    service: "VAT",
    periodLabel: "Q3 2025",
    dueDate: "2025-08-26",
    status: "Awaiting Docs",
    assignee: "Thabo",
    amount: 18900,
    reminderCount: 1,
    documents: [],
    comms: [
      {
        at: "2025-08-24T11:00:00Z",
        type: "email",
        summary: "First reminder sent for Q3 VAT documentation"
      }
    ]
  },
  {
    id: "p012",
    clientId: "c-0003",
    clientName: "Lyra Consulting Partners",
    service: "ACCOUNTS",
    periodLabel: "Year End 2024",
    dueDate: "2025-09-10",
    status: "Draft Sent",
    assignee: "Nomsa",
    amount: 4100,
    documents: [
      {
        id: "d012",
        name: "Draft Management Accounts.pdf",
        url: "/docs/draft-mgmt-accounts.pdf",
        uploadedAt: "2025-08-23T15:40:00Z",
        kind: "ClientOutput"
      }
    ],
    comms: [
      {
        at: "2025-08-23T15:45:00Z",
        type: "email",
        summary: "Draft management accounts sent to client for review"
      }
    ]
  },
  {
    id: "p013",
    clientId: "c-0001",
    clientName: "Nimbus Tech Labs",
    service: "SA",
    periodLabel: "Tax Year 2023/24",
    dueDate: "2025-08-22",
    status: "Awaiting Questionnaire",
    assignee: "Marta",
    documents: [],
    comms: [
      {
        at: "2025-08-21T09:30:00Z",
        type: "email",
        summary: "SA questionnaire sent to client"
      }
    ]
  }
  // Add the generated periods
  , ...generateAdditionalPeriods()
];