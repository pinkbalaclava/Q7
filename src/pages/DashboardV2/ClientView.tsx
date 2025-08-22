import React, { useState, useMemo } from 'react';
import { ArrowLeft, User, Building2, Mail, Phone, MapPin, Calendar, Shield, FileText, Clock, StickyNote, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import type { Period, Client } from './types';
import { getClientById } from './data';
import { StatusPill } from './StatusPill';
import { ServiceBadge } from './ServiceBadge';
import { InfoBox } from './InfoBox';

interface ClientViewProps {
  clientId: string;
  periods: Period[];
  onBack: () => void;
  onUpdate: (period: Period) => void;
  initialServiceFilter?: string;
  initialPeriodId?: string;
}

const ClientView: React.FC<ClientViewProps> = ({
  clientId,
  periods,
  onBack,
  onUpdate,
  initialServiceFilter,
  initialPeriodId
}) => {
  const client = getClientById(clientId);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Get client's periods
  const clientPeriods = useMemo(() => {
    return periods.filter(p => p.clientId === clientId);
  }, [periods, clientId]);

  // Generate history from all periods
  const history = useMemo(() => {
    const events: Array<{
      id: string;
      timestamp: string;
      type: 'status_change' | 'submission' | 'communication' | 'document';
      description: string;
      periodLabel?: string;
      service?: string;
    }> = [];

    clientPeriods.forEach(period => {
      // Add status changes from history
      if (period.history) {
        period.history.forEach(h => {
          events.push({
            id: `${period.id}-history-${h.at}`,
            timestamp: h.at,
            type: 'status_change',
            description: h.summary,
            periodLabel: period.periodLabel,
            service: period.service
          });
        });
      }

      // Add submissions
      if (period.submittedAt) {
        events.push({
          id: `${period.id}-submitted`,
          timestamp: period.submittedAt,
          type: 'submission',
          description: `${period.service} ${period.periodLabel} submitted`,
          periodLabel: period.periodLabel,
          service: period.service
        });
      }

      if (period.filedAt) {
        events.push({
          id: `${period.id}-filed`,
          timestamp: period.filedAt,
          type: 'submission',
          description: `${period.service} ${period.periodLabel} filed`,
          periodLabel: period.periodLabel,
          service: period.service
        });
      }

      // Add communications
      if (period.comms) {
        period.comms.forEach(comm => {
          events.push({
            id: `${period.id}-comm-${comm.at}`,
            timestamp: comm.at,
            type: 'communication',
            description: comm.summary,
            periodLabel: period.periodLabel,
            service: period.service
          });
        });
      }

      // Add document uploads
      if (period.documents) {
        period.documents.forEach(doc => {
          events.push({
            id: `${period.id}-doc-${doc.id}`,
            timestamp: doc.uploadedAt,
            type: 'document',
            description: `Document uploaded: ${doc.name}`,
            periodLabel: period.periodLabel,
            service: period.service
          });
        });
      }
    });

    // Sort by timestamp, newest first
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [clientPeriods]);

  // Mock notes data (in real app, this would come from the client data)
  const [notes, setNotes] = useState<Array<{
    id: string;
    text: string;
    createdAt: string;
    updatedAt?: string;
  }>>([
    {
      id: 'note-1',
      text: 'Client prefers email communication over phone calls.',
      createdAt: '2024-08-15T10:30:00Z'
    },
    {
      id: 'note-2', 
      text: 'VAT returns typically require additional documentation due to complex business structure.',
      createdAt: '2024-08-10T14:20:00Z'
    }
  ]);

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Client not found</p>
          </div>
        </div>
      </div>
    );
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note = {
      id: `note-${Date.now()}`,
      text: newNote.trim(),
      createdAt: new Date().toISOString()
    };
    
    setNotes(prev => [note, ...prev]);
    setNewNote('');
  };

  const handleEditNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setEditingNoteText(note.text);
    }
  };

  const handleSaveEdit = () => {
    if (!editingNoteText.trim()) return;
    
    setNotes(prev => prev.map(note => 
      note.id === editingNoteId 
        ? { ...note, text: editingNoteText.trim(), updatedAt: new Date().toISOString() }
        : note
    ));
    
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'submission':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'communication':
        return <Mail className="w-4 h-4 text-purple-600" />;
      case 'document':
        return <FileText className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-md bg-cyan-400 ring-2 ring-cyan-700/60" />
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{clientPeriods.length} active periods</span>
            <span>•</span>
            <span>Client since {client.startedAt ? new Date(client.startedAt).getFullYear() : '—'}</span>
          </div>
        </div>

        {/* Client Information Panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
          
          {/* Contact & Company details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <InfoBox label="Primary Contact" value={client.name} />
            <InfoBox label="Email" value={client.email || "—"} />
            <InfoBox label="Phone" value={client.phone || "—"} />
            
            <InfoBox label="Company No." value={client.companyNo || "—"} />
            <InfoBox label="VAT Reg No." value={client.vatNo || "—"} />
            <InfoBox label="Year End" value={client.yearEnd || "—"} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <InfoBox label="Address">
              <div className="whitespace-pre-line">{client.address || "—"}</div>
            </InfoBox>
            <InfoBox label="Tags">
              {client.tags?.length ? (
                <div className="flex flex-wrap gap-1">
                  {client.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              ) : "—"}
            </InfoBox>
          </div>

          {/* Service & Risk info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoBox label="Active Services" value={client.activeServices?.join(" • ") || "—"} />
            <InfoBox label="Risk Level" value={client.risk || "—"} />
            <InfoBox label="AML/KYC Status" 
              value={client.amlVerifiedAt ? `Verified — ${new Date(client.amlVerifiedAt).toLocaleDateString()}` : "—"} 
            />
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b border-gray-200 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Periods</h3>
                    {clientPeriods.length > 0 ? (
                      <div className="space-y-3">
                        {clientPeriods.map(period => (
                          <div key={period.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <ServiceBadge service={period.service} />
                              <div>
                                <div className="font-medium text-gray-900">{period.periodLabel}</div>
                                <div className="text-sm text-gray-600">
                                  Due: {new Date(period.dueDate).toLocaleDateString()}
                                  {period.assignee && ` • Assigned to ${period.assignee}`}
                                </div>
                              </div>
                            </div>
                            <StatusPill status={period.status} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No active periods</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-0">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                  {history.length > 0 ? (
                    <div className="space-y-4">
                      {history.map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          {/* Timeline line */}
                          <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300">
                              {getEventIcon(event.type)}
                            </div>
                            {index < history.length - 1 && (
                              <div className="w-px h-8 bg-gray-300 mt-2" />
                            )}
                          </div>
                          
                          {/* Event content */}
                          <div className="flex-1 pb-8">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {event.description}
                              </span>
                              {event.service && event.periodLabel && (
                                <Badge variant="outline" className="text-xs">
                                  {event.service} • {event.periodLabel}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(event.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No history yet – key events will appear here once work begins.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="mt-0">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  
                  {/* Add new note */}
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-start gap-3">
                      <Plus className="w-5 h-5 text-gray-400 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <Textarea
                          placeholder="Add a note about this client..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="mb-3"
                          rows={3}
                        />
                        <Button 
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                          size="sm"
                        >
                          Add Note
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Existing notes */}
                  {notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map(note => (
                        <div key={note.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              {editingNoteId === note.id ? (
                                <div>
                                  <Textarea
                                    value={editingNoteText}
                                    onChange={(e) => setEditingNoteText(e.target.value)}
                                    className="mb-3"
                                    rows={3}
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSaveEdit}>
                                      Save Changes
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => {
                                        setEditingNoteId(null);
                                        setEditingNoteText('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-gray-900 mb-2">{note.text}</p>
                                  <div className="text-xs text-gray-500">
                                    Created {formatDateTime(note.createdAt)}
                                    {note.updatedAt && (
                                      <span> • Updated {formatDateTime(note.updatedAt)}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {editingNoteId !== note.id && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditNote(note.id)}
                                  className="p-2"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No notes yet – use the field above to add your first note.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ClientView;