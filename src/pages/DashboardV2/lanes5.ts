export type LaneId = "TODO" | "INPROG" | "WITHCLIENT" | "READY" | "DONE";

export const LANES: { id: LaneId; title: string }[] = [
  { id: "TODO",      title: "To Do" },
  { id: "INPROG",    title: "In Progress" },
  { id: "WITHCLIENT",title: "With Client" },
  { id: "READY",     title: "Ready for Review" },
  { id: "DONE",      title: "Completed" }
];

// exact status → lane
export function laneForStatus(status: string): LaneId {
  if (["Awaiting Docs","Awaiting Questionnaire","Reminders Sent"].includes(status)) return "TODO";
  if (["In Progress","Draft Sent"].includes(status)) return "INPROG";
  if (["Awaiting Approval"].includes(status)) return "WITHCLIENT";
  if (["Ready to Submit","Ready to File"].includes(status)) return "READY";
  if (["Submitted","Filed","Paid","Done","Closed"].includes(status)) return "DONE";
  return "INPROG";
}

// default exact status when dropping into a lane (per service)
export function defaultStatusForLane(service: "VAT"|"ACCOUNTS"|"SA", lane: LaneId): string {
  if (service==="VAT") {
    if (lane==="TODO") return "Awaiting Docs";
    if (lane==="INPROG") return "In Progress";
    if (lane==="WITHCLIENT") return "Awaiting Approval";
    if (lane==="READY") return "Ready to Submit";
    return "Submitted"; // DONE defaults
  }
  if (service==="ACCOUNTS") {
    if (lane==="TODO") return "Awaiting Docs";
    if (lane==="INPROG") return "In Progress";
    if (lane==="WITHCLIENT") return "Awaiting Approval";
    if (lane==="READY") return "Ready to File";
    return "Filed";
  }
  // SA
  if (lane==="TODO") return "Awaiting Questionnaire";
  if (lane==="INPROG") return "In Progress";
  if (lane==="WITHCLIENT") return "Awaiting Approval";
  if (lane==="READY") return "Awaiting Approval"; // rarely used in SA
  return "Submitted";
}

// Get all exact statuses that belong to a lane
export function statusesForLane(lane: LaneId): string[] {
  switch (lane) {
    case "TODO":
      return ["Awaiting Docs","Awaiting Questionnaire","Reminders Sent"];
    case "INPROG":
      return ["In Progress","Draft Sent"];
    case "WITHCLIENT":
      return ["Awaiting Approval"];
    case "READY":
      return ["Ready to Submit","Ready to File"];
    case "DONE":
      return ["Submitted","Filed","Paid","Done","Closed"];
    default:
      return [];
  }
}

// Get exact statuses that belong to a lane for a specific service
export function laneStatuses(service: "VAT"|"ACCOUNTS"|"SA", lane: LaneId): string[] {
  if (service === "VAT") {
    if (lane==="TODO") return ["Awaiting Docs"];
    if (lane==="INPROG") return ["In Progress"];
    if (lane==="WITHCLIENT") return ["Awaiting Approval"];
    if (lane==="READY") return ["Ready to Submit"];
    if (lane==="DONE") return ["Submitted","Paid","Closed"];
  }
  if (service === "ACCOUNTS") {
    if (lane==="TODO") return ["Awaiting Docs"];
    if (lane==="INPROG") return ["In Progress","Draft Sent"];
    if (lane==="WITHCLIENT") return ["Awaiting Approval"];
    if (lane==="READY") return ["Ready to File"];
    if (lane==="DONE") return ["Filed","Closed"];
  }
  // SA
  if (lane==="TODO") return ["Awaiting Questionnaire","Reminders Sent"];
  if (lane==="INPROG") return ["In Progress"];
  if (lane==="WITHCLIENT") return ["Awaiting Approval"];
  if (lane==="READY") return []; // SA usually skips this
  if (lane==="DONE") return ["Submitted","Done"];
  return [];
}