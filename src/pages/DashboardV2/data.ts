import type { Client } from './types';

// Helper functions for generating client data
const COMPANY_SUFFIXES = ["Ltd", "Pty", "Corp", "Inc", "Group", "Holdings", "Partners", "Solutions", "Enterprises", "Industries"];
const BUSINESS_SECTORS = ["Technology", "Consulting", "Manufacturing", "Retail", "Healthcare", "Finance", "Construction", "Education"];
const RISK_LEVELS: Array<"Low" | "Med" | "High"> = ["Low", "Low", "Low", "Med", "Med", "High"]; // Weighted toward Low
const SERVICES_COMBINATIONS = [
  ["VAT"], ["ACCOUNTS"], ["SA"], 
  ["VAT", "ACCOUNTS"], ["VAT", "SA"], ["ACCOUNTS", "SA"],
  ["VAT", "ACCOUNTS", "SA"]
];

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

function generateEmail(companyName: string): string {
  const domains = ["gmail.com", "outlook.com", "company.co.uk", "business.com", "enterprise.net"];
  const prefixes = ["info", "admin", "contact", "finance", "accounts"];
  const cleanName = companyName.toLowerCase().replace(/[^a-z]/g, '');
  
  if (Math.random() > 0.5) {
    return `${randomChoice(prefixes)}@${cleanName.substring(0, 8)}.${randomChoice(["co.uk", "com", "net"])}`;
  } else {
    return `${randomChoice(prefixes)}@${randomChoice(domains)}`;
  }
}

function generatePhone(): string {
  const areaCodes = ["011", "021", "031", "041", "051", "061"];
  const areaCode = randomChoice(areaCodes);
  const number = String(randomInt(100, 999)) + " " + String(randomInt(1000, 9999));
  return `+27 ${areaCode} ${number}`;
}

function generateAddress(): string {
  const streetNumbers = randomInt(1, 999);
  const streetNames = [
    "Business Park", "Industrial Road", "Commerce Street", "Trade Avenue", "Enterprise Way",
    "Corporate Drive", "Innovation Hub", "Technology Lane", "Professional Plaza", "Executive Square"
  ];
  const cities = [
    "Johannesburg, 2000", "Cape Town, 8001", "Durban, 4001", "Pretoria, 0001", 
    "Port Elizabeth, 6001", "Bloemfontein, 9300", "East London, 5200", "Nelspruit, 1200"
  ];
  
  return `${streetNumbers} ${randomChoice(streetNames)}, ${randomChoice(cities)}`;
}

function generateCompanyNo(): string {
  const year = randomInt(2015, 2024);
  const number = String(randomInt(100000, 999999));
  const suffix = randomChoice(["07", "23", "08"]);
  return `${year}/${number}/${suffix}`;
}

function generateVatNo(): string {
  return "4" + String(randomInt(100000000, 999999999));
}

function generateYearEnd(): string {
  const months = ["02-28", "03-31", "06-30", "09-30", "12-31"];
  return `2025-${randomChoice(months)}`;
}

function generateTags(): string[] {
  const allTags = [
    "High Growth", "Established", "Start-up", "Family Business", "Listed Company",
    "Tech", "Manufacturing", "Retail", "Professional Services", "Healthcare",
    "Priority Client", "Complex Structure", "International", "Group Company", "SME"
  ];
  
  const tagCount = randomInt(1, 3);
  const selectedTags = [];
  
  for (let i = 0; i < tagCount; i++) {
    const availableTags = allTags.filter(tag => !selectedTags.includes(tag));
    if (availableTags.length > 0) {
      selectedTags.push(randomChoice(availableTags));
    }
  }
  
  return selectedTags;
}

// Generate additional clients
function generateAdditionalClients(): Client[] {
  const clients: Client[] = [];
  
  const baseNames = [
    "Apex", "Bright", "Cedar", "Dynamic", "Elite", "Fusion", "Global", "Horizon",
    "Innovative", "Keystone", "Lighthouse", "Metro", "Northern", "Oceanic", "Premier", "Quantum",
    "Riverside", "Summit", "Titan", "Unity", "Vertex", "Westfield", "Zenith", "Alpha",
    "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota",
    "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho",
    "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega", "Acme",
    "Pinnacle", "Sterling", "Meridian", "Catalyst", "Phoenix", "Nexus", "Vortex", "Matrix"
  ];
  
  const businessTypes = [
    "Solutions", "Technologies", "Consulting", "Industries", "Holdings", "Partners",
    "Enterprises", "Systems", "Ventures", "Group", "Corporation", "Services"
  ];
  
  for (let i = 0; i < 300; i++) {
    const baseName = randomChoice(baseNames);
    const businessType = randomChoice(businessTypes);
    const suffix = randomChoice(COMPANY_SUFFIXES);
    const companyName = `${baseName} ${businessType} ${suffix}`;
    
    const startYear = randomInt(2018, 2024);
    const startMonth = randomInt(1, 12);
    const startDay = randomInt(1, 28);
    const startedAt = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    
    // Engagement and AML dates should be before or around started date
    const engagementDate = new Date(startedAt);
    engagementDate.setDate(engagementDate.getDate() - randomInt(1, 14));
    
    const amlDate = new Date(startedAt);
    amlDate.setDate(amlDate.getDate() - randomInt(0, 7));
    
    // Ensure active services match what we'll generate periods for
    const activeServices = randomChoice(SERVICES_COMBINATIONS) as any;
    
    clients.push({
      id: `c-${String(i + 4).padStart(4, '0')}`,
      name: companyName,
      email: generateEmail(companyName),
      phone: generatePhone(),
      address: generateAddress(),
      companyNo: generateCompanyNo(),
      vatNo: generateVatNo(),
      yearEnd: generateYearEnd(),
      tags: generateTags(),
      startedAt,
      activeServices,
      risk: randomChoice(RISK_LEVELS),
      engagementSignedAt: engagementDate.toISOString().split('T')[0],
      amlVerifiedAt: amlDate.toISOString().split('T')[0]
    });
  }
  
  return clients;
}

// Export the function so it can be used by demo-data.ts
export { generateAdditionalClients };

// Mock client data - in a real app this would come from your database
const CLIENTS: Client[] = [
  {
    id: "c-0001",
    name: "Bright Tech Solutions Ltd",
    email: "contact@brighttech.example",
    phone: "+27 11 123 4567",
    address: "123 Business Park, Johannesburg, 2000",
    companyNo: "2019/123456/07",
    vatNo: "4123456789",
    yearEnd: "2025-02-28",
    tags: ["Tech", "High Growth"],
    startedAt: "2022-03-15",
    activeServices: ["VAT", "ACCOUNTS"],
    risk: "Low",
    engagementSignedAt: "2022-03-10",
    amlVerifiedAt: "2022-03-12"
  },
  {
    id: "c-0002", 
    name: "Harbor Consulting Group",
    email: "admin@harbor.example",
    phone: "+27 21 987 6543",
    address: "456 Waterfront Ave, Cape Town, 8001",
    companyNo: "2020/789012/07",
    vatNo: "4987654321",
    yearEnd: "2025-03-31",
    tags: ["Consulting", "Professional Services"],
    startedAt: "2021-06-01",
    activeServices: ["ACCOUNTS", "SA"],
    risk: "Med",
    engagementSignedAt: "2021-05-28",
    amlVerifiedAt: "2021-06-02"
  },
  {
    id: "c-0003",
    name: "Vista Energy Partners", 
    email: "finance@vista.example",
    phone: "+27 31 555 0123",
    address: "789 Industrial Rd, Durban, 4001",
    companyNo: "2018/345678/07",
    vatNo: "4345678901",
    yearEnd: "2025-12-31",
    tags: ["Energy", "Large Corp"],
    startedAt: "2020-01-10",
    activeServices: ["VAT", "ACCOUNTS", "SA"],
    risk: "High",
    engagementSignedAt: "2020-01-05",
    amlVerifiedAt: "2020-01-08"
  }
  // Add generated clients
  , ...generateAdditionalClients()
];

export function getClientById(id: string): Client | undefined {
  return CLIENTS.find(c => c.id === id);
}