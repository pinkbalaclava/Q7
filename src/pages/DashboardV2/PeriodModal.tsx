import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Period, Client } from "./types";
import { nextAllowedTransitions } from "./status";
import { StatusPill } from "./StatusPill";
import { ServiceBadge } from "./ServiceBadge";
import { getClientById } from "./data";
import { ActionTile } from "./ActionTile";
import { InfoBox } from "./InfoBox";
import { Mail, Paperclip, UploadCloud, Link2, Send, Clock, FileCheck, CheckCircle2, Archive } from "lucide-react";

type Props = {
  open: boolean;
  period: Period | null;
  onClose(): void;
  onUpdate(next: Period): void;
};

export default function PeriodModal({ open, period, onClose, onUpdate }: Props) {
  const p = period;
  const client: Client | undefined = p ? getClientById(p.clientId) : undefined;
  const [local, setLocal] = React.useState<Period | null>(p);
  const [confirmMove, setConfirmMove] = React.useState<{from: string; to: string} | null>(null);

  React.useEffect(() => setLocal(p), [p]);
  if (!p || !local) return null;

  function set<K extends keyof Period>(k: K, v: Period[K]) {
    setLocal({ ...local, [k]: v });
  }
  
  function save() { 
    onUpdate(local); 
  }
  
  function addComms(summary: string, type: "email"|"note" = "email") {
    const next: Period = { 
      ...local, 
      comms: [
        { at: new Date().toISOString(), type, summary }, 
        ...(local.comms || [])
      ] 
    };
    onUpdate(next);
    setLocal(next);
  }
  
  function addDoc(name: string, kind: "Working"|"Output") {
    const next: Period = {
      ...local,
      documents: [
        ...(local.documents || []),
        { 
          id: crypto.randomUUID(), 
          name, 
          kind, 
          uploadedAt: new Date().toISOString(), 
          by: local.assignee || "—" 
        }
      ]
    };
    onUpdate(next);
    setLocal(next);
  }
  
  function requestApproval() {
    const next: Period = {
      ...local,
      approval: { 
        ...(local.approval || {}), 
        requestedAt: new Date().toISOString(), 
        link: local.approval?.link || `https://app.local/approve/${local.id}` 
      },
      comms: [
        { at: new Date().toISOString(), type: "email", summary: "Approval requested" }, 
        ...(local.comms || [])
      ],
      status: "Awaiting Approval"
    };
    onUpdate(next); 
    setLocal(next);
  }
  
  function proposeMove(to: string) { 
    setConfirmMove({ from: local.status, to }); 
  }
  
  function applyMove() {
    if (!confirmMove) return;
    const next = { 
      ...local, 
      status: confirmMove.to,
      comms: [
        { at: new Date().toISOString(), type: "note", summary: `Status changed from "${confirmMove.from}" to "${confirmMove.to}"` },
        ...(local.comms || [])
      ]
    };
    onUpdate(next); 
    setLocal(next); 
    setConfirmMove(null);
  }

  const forward = nextAllowedTransitions(local.service, local.status as any);
  const canMarkSubmitted = forward.includes("Submitted" as any);
  const isIntake = ["Awaiting Docs","Awaiting Questionnaire","Reminders Sent"].includes(local.status);
  const showReminderBadge = isIntake && (local.reminderCount || 0) > 0;
  
  // Check if actions are valid for current status
  const canMarkPaid = forward.includes("Paid" as any) || local.status === "Submitted";
  const canClose = forward.includes("Closed" as any) || ["Submitted", "Filed", "Paid", "Done"].includes(local.status);

  function logReminderOrEmail() {
    const next = {
      ...local,
      comms: [{ at: new Date().toISOString(), type: "email" as const, summary: isIntake ? "Reminder sent" : "Email logged" }, ...(local.comms || [])],
      reminderCount: isIntake ? (local.reminderCount || 0) + 1 : local.reminderCount
    };
    onUpdate(next); setLocal(next);
  }
  function addWorkingFile() {
    addDoc(`Working_${local.service}_${local.periodLabel}.xlsx`, "Working");
  }
  function addFinalOutput() {
    addDoc(`${local.service}_Output_${local.periodLabel}.pdf`, "Output");
  }
  function ensureClientLink(): string {
    const link = local.approval?.link || `https://approval.example.com/${local.service.toLowerCase()}/${local.id}`;
    const next = { ...local, approval: { ...(local.approval || {}), link } };
    onUpdate(next); setLocal(next);
    return link;
  }
  function copyClientLink() {
    const link = ensureClientLink();
    navigator.clipboard?.writeText(link);
  }
  function sendClientLink() {
    const link = ensureClientLink();
    addComms(`Client link sent: ${link}`, "email");
  }
  function doRequestApproval() {
    requestApproval();
  }
  function markSubmitted() { proposeMove("Submitted"); }
  function markPaid() { 
    if (canMarkPaid) {
      proposeMove("Paid"); 
    }
  }
  function closePeriod() { 
    if (canClose) {
      proposeMove("Closed"); 
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-[1100px] p-0 bg-white text-gray-900 border border-gray-200 sm:rounded-xl shadow-lg">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-md bg-cyan-400 ring-2 ring-cyan-700/60" />
              <div className="flex flex-col">
                <span className="text-base font-semibold">{local.clientName}</span>
                <span className="text-xs text-muted-foreground">{local.periodLabel}</span>
              </div>
              <ServiceBadge service={local.service} />
              <StatusPill status={local.status} />
              {showReminderBadge && (
                <Badge variant="outline" className="ml-1">Reminders: {local.reminderCount}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-[340px_1fr] border-t">
            {/* LEFT: Overview + Actions */}
            <ScrollArea className="h-[70vh] border-r p-4">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Overview</div>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusPill status={local.status} />
                    {canMarkSubmitted && (
                      <Button variant="secondary" size="sm" onClick={() => proposeMove("Submitted")}>
                        Mark Submitted
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Due Date</Label>
                      <Input 
                        value={new Date(local.dueDate).toLocaleDateString()} 
                        onChange={e => set("dueDate", new Date(e.target.value).toISOString())} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Amount</Label>
                      <Input 
                        value={local.amount ?? ""} 
                        onChange={e => set("amount", Number(e.target.value) || undefined)} 
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Assignee</Label>
                      <Input 
                        value={local.assignee || ""} 
                        onChange={e => set("assignee", e.target.value)} 
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Notes</Label>
                      <Textarea 
                        value={local.notes || ""} 
                        onChange={e => set("notes", e.target.value)} 
                        placeholder="Add notes…" 
                      />
                    </div>
                  </div>
                  <Button className="w-full mt-3" onClick={save}>Save Changes</Button>
                </div>

                <Separator />
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Actions</div>
                  {showReminderBadge && (
                    <div className="text-amber-600 text-xs mb-2">⚠️ {local.reminderCount} reminder{(local.reminderCount||0)>1?"s":""}</div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <ActionTile
                      label={isIntake ? "Send Reminder" : "Log Email"}
                      icon={<Mail size={18} className="text-blue-600" />}
                      variant="blue"
                      onClick={logReminderOrEmail}
                    />
                    <ActionTile
                      label="Generate / View Link"
                      icon={<Link2 size={18} className="text-indigo-700" />}
                      variant="indigo"
                      onClick={copyClientLink}
                    />
                    <ActionTile
                      label="Send Client Link"
                      icon={<Send size={18} className="text-sky-700" />}
                      variant="sky"
                      onClick={sendClientLink}
                    />
                    <ActionTile
                      label="Mark Submitted"
                      icon={<FileCheck size={18} className="text-emerald-800" />}
                      variant="emerald"
                      onClick={markSubmitted}
                    />
                    <ActionTile
                      label="Mark Paid"
                      icon={<CheckCircle2 size={18} className="text-emerald-900" />}
                      variant="emeraldDark"
                      onClick={markPaid}
                      disabled={!canMarkPaid}
                    />
                    <ActionTile
                      label="Close Period"
                      icon={<Archive size={18} className="text-slate-700" />}
                      variant="slate"
                      onClick={closePeriod}
                      disabled={!canClose}
                    />
                  </div>

                  {/* Optional inline link field (read-only) under tiles */}
                  {local.approval?.link && (
                    <div className="mt-3">
                      <label className="text-xs text-muted-foreground mb-1 block">Client Link</label>
                      <input
                        className="w-full rounded-md border px-2 py-1 text-sm"
                        readOnly
                        value={local.approval.link}
                        onFocus={(e)=>e.currentTarget.select()}
                      />
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* RIGHT: Client Details + Tabs */}
            <div className="flex flex-col flex-1">
              {/* Client summary always visible */}
              <div className="p-4">
                {/* Top KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <InfoBox label="Client Since" value={client?.startedAt ? new Date(client.startedAt).getFullYear() : "—"} />
                  <InfoBox label="Active Services" value={client?.activeServices?.join(" • ") || "—"} />
                  <InfoBox label="Risk" value={client?.risk || "—"} />
                </div>

                {/* Contact + Company details as boxed items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoBox label="Primary Contact" value={client?.name || local.clientName} />
                  <InfoBox label="Company No." value={client?.companyNo || "—"} />

                  <InfoBox label="Email" value={client?.email || "—"} />
                  <InfoBox label="VAT Reg No." value={client?.vatNo || "—"} />

                  <InfoBox label="Phone" value={client?.phone || "—"} />
                  <InfoBox label="Year End" value={client?.yearEnd || "—"} />

                  <InfoBox label="Address">
                    <div className="whitespace-pre-line">{client?.address || "—"}</div>
                  </InfoBox>
                  <InfoBox label="Tags">
                    {client?.tags?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {client.tags.map((t) => (
                          <Badge key={t} variant="outline">{t}</Badge>
                        ))}
                      </div>
                    ) : "—"}
                  </InfoBox>
                </div>

                {/* Engagement & KYC */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <InfoBox
                    label="Letter of Engagement"
                    value={client?.engagementSignedAt ? `Signed — ${new Date(client.engagementSignedAt).toLocaleDateString()}` : "—"}
                  />
                  <InfoBox
                    label="AML/KYC"
                    value={client?.amlVerifiedAt ? `Verified — ${new Date(client.amlVerifiedAt).toLocaleDateString()}` : "—"}
                  />
                </div>
              </div>

              <Separator />

              {/* Tabs below the client summary */}
              <Tabs defaultValue="comms" className="flex flex-col flex-1">
                <div className="px-4 pt-2">
                  <TabsList>
                    <TabsTrigger value="comms">Comms</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                </div>
                <Separator />
                <ScrollArea className="h-[56vh] p-4">
                  <TabsContent value="comms" className="m-0">
                    <div className="flex justify-end mb-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => addComms("Reminder sent", "email")}
                      >
                        Send Reminder
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(local.comms || []).map((c, i) => (
                        <div key={i} className="border rounded-md p-2">
                          <div className="text-xs text-muted-foreground mb-1">
                            {new Date(c.at).toLocaleString()} — {c.type}
                          </div>
                          <div className="text-sm">{c.summary}</div>
                        </div>
                      ))}
                      {(!local.comms || local.comms.length === 0) && (
                        <div className="text-sm text-muted-foreground">No communications yet.</div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="m-0">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <InfoBox 
                        label="Working Files" 
                        value={
                          <div className="text-lg font-bold">
                            {(local.documents || []).filter(d => d.kind === "Working").length}
                          </div>
                        } 
                      />
                      <InfoBox 
                        label="Client Outputs" 
                        value={
                          <div className="text-lg font-bold">
                            {(local.documents || []).filter(d => d.kind === "Output").length}
                          </div>
                        } 
                      />
                      <InfoBox 
                        label="Last Updated" 
                        value={<div className="text-lg font-bold">{new Date().toLocaleDateString()}</div>} 
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase mb-1">
                          Working Files (Internal)
                        </div>
                        {(local.documents || []).filter(d => d.kind === "Working").map(d => (
                          <div key={d.id} className="flex items-center justify-between border rounded-md p-2 mb-2">
                            <div>
                              <div className="font-medium">{d.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Uploaded {new Date(d.uploadedAt).toLocaleString()} {d.by ? `by ${d.by}` : ""}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onUpdate({ 
                                ...local, 
                                documents: (local.documents || []).filter(x => x.id !== d.id) 
                              })}
                            >
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase mb-1">
                          Client Outputs (Shareable)
                        </div>
                        {(local.documents || []).filter(d => d.kind === "Output").map(d => (
                          <div key={d.id} className="flex items-center justify-between border rounded-md p-2 mb-2">
                            <div>
                              <div className="font-medium">{d.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Uploaded {new Date(d.uploadedAt).toLocaleString()} {d.by ? `by ${d.by}` : ""}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={() => navigator.clipboard?.writeText(d.url || "")}
                              >
                                Copy Link
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => onUpdate({ 
                                  ...local, 
                                  documents: (local.documents || []).filter(x => x.id !== d.id) 
                                })}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="m-0">
                    <div className="space-y-2">
                      {(local.history || []).map((h, i) => (
                        <div key={i} className="border rounded-md p-2">
                          <div className="text-xs text-muted-foreground">
                            {new Date(h.at).toLocaleString()}
                          </div>
                          <div className="text-sm">{h.summary}</div>
                        </div>
                      ))}
                      {(!local.history || local.history.length === 0) && (
                        <div className="text-sm text-muted-foreground">No history yet.</div>
                      )}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm status change */}
      <AlertDialog open={!!confirmMove} onOpenChange={(o) => !o && setConfirmMove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmMove ? `Move from ${confirmMove.from} → ${confirmMove.to}?` : "Confirm move"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyMove}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}