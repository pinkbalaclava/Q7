import { Service, PeriodStatus } from "./types";

export type ClusterId = "INTAKE" | "WORK" | "APPROVAL" | "READY" | "SUBMITTED" | "COMPLETED";
export const CLUSTER_ORDER: ClusterId[] = ["INTAKE","WORK","APPROVAL","READY","SUBMITTED","COMPLETED"];
export const CLUSTER_TITLES: Record<ClusterId,string> = {
  INTAKE: "Intake",
  WORK: "Work",
  APPROVAL: "Approval",
  READY: "Ready",
  SUBMITTED: "Submitted / Filed",
  COMPLETED: "Completed",
};

// Map each exact status to a compact cluster (by service)
export function statusToCluster(service: Service, status: PeriodStatus): ClusterId {
  switch (service) {
    case "VAT": {
      if (status==="Awaiting Docs") return "INTAKE";
      if (status==="In Progress") return "WORK";
      if (status==="Awaiting Approval") return "APPROVAL";
      if (status==="Ready to Submit") return "READY";
      if (status==="Submitted") return "SUBMITTED";
      if (status==="Paid" || status==="Closed") return "COMPLETED";
      // fallback
      return "WORK";
    }
    case "ACCOUNTS": {
      if (status==="Awaiting Docs") return "INTAKE";
      if (status==="In Progress" || status==="Draft Sent") return "WORK";
      if (status==="Awaiting Approval") return "APPROVAL";
      if (status==="Ready to File") return "READY";
      if (status==="Filed") return "SUBMITTED";
      if (status==="Closed") return "COMPLETED";
      return "WORK";
    }
    case "SA": {
      if (status==="Awaiting Questionnaire" || status==="Reminders Sent") return "INTAKE";
      if (status==="In Progress") return "WORK";
      if (status==="Awaiting Approval") return "APPROVAL";
      // SA usually goes from Approval -> Submitted (no "Ready")
      if (status==="Submitted") return "SUBMITTED";
      if (status==="Done") return "COMPLETED";
      return "WORK";
    }
  }
}

// Default exact status to use when dropping into a cluster
export function defaultStatusForCluster(service: Service, cluster: ClusterId): PeriodStatus {
  if (service==="VAT") {
    if (cluster==="INTAKE") return "Awaiting Docs";
    if (cluster==="WORK") return "In Progress";
    if (cluster==="APPROVAL") return "Awaiting Approval";
    if (cluster==="READY") return "Ready to Submit";
    if (cluster==="SUBMITTED") return "Submitted";
    if (cluster==="COMPLETED") return "Paid";
  }
  if (service==="ACCOUNTS") {
    if (cluster==="INTAKE") return "Awaiting Docs";
    if (cluster==="WORK") return "In Progress";
    if (cluster==="APPROVAL") return "Awaiting Approval";
    if (cluster==="READY") return "Ready to File";
    if (cluster==="SUBMITTED") return "Filed";
    if (cluster==="COMPLETED") return "Closed";
  }
  // SA
  if (cluster==="INTAKE") return "Awaiting Questionnaire";
  if (cluster==="WORK") return "In Progress";
  if (cluster==="APPROVAL") return "Awaiting Approval";
  if (cluster==="READY") return "Awaiting Approval"; // rarely used in SA
  if (cluster==="SUBMITTED") return "Submitted";
  return "Done";
}

// Get all exact statuses that belong to a cluster for a service
export function clusterToStatuses(service: Service, cluster: ClusterId): PeriodStatus[] {
  if (service==="VAT") {
    if (cluster==="INTAKE") return ["Awaiting Docs"];
    if (cluster==="WORK") return ["In Progress"];
    if (cluster==="APPROVAL") return ["Awaiting Approval"];
    if (cluster==="READY") return ["Ready to Submit"];
    if (cluster==="SUBMITTED") return ["Submitted"];
    if (cluster==="COMPLETED") return ["Paid", "Closed"];
  }
  if (service==="ACCOUNTS") {
    if (cluster==="INTAKE") return ["Awaiting Docs"];
    if (cluster==="WORK") return ["In Progress", "Draft Sent"];
    if (cluster==="APPROVAL") return ["Awaiting Approval"];
    if (cluster==="READY") return ["Ready to File"];
    if (cluster==="SUBMITTED") return ["Filed"];
    if (cluster==="COMPLETED") return ["Closed"];
  }
  // SA
  if (cluster==="INTAKE") return ["Awaiting Questionnaire", "Reminders Sent"];
  if (cluster==="WORK") return ["In Progress"];
  if (cluster==="APPROVAL") return ["Awaiting Approval"];
  if (cluster==="READY") return []; // rarely used in SA
  if (cluster==="SUBMITTED") return ["Submitted"];
  return ["Done"];
}