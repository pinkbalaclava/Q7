import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, DollarSign, User, AlertTriangle, Building2, Mail, Phone, MapPin, Filter, ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import { Upload, CheckCircle2, StickyNote, ArrowRight, ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Period, Client } from './types';
import { getClientById } from './data';
import { StatusPill } from './StatusPill';
import { ServiceBadge } from './ServiceBadge';
import { daysUntil, nextAllowedTransitions, prevAllowedTransitions } from './status';
import { laneForStatus } from './lanes5';

interface ClientViewProps {
  clientId: string;
  periods: Period[];
  onBack: () => void;
  onUpdate: (period: Period) => void;
  initialServiceFilter?: Service;
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
  const clientPeriods = periods.filter(p => p.clientId === clientId);
  
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    initialPeriodId || (clientPeriods.length > 0 ? clientPeriods[0].id : '')
  );
  
  // Filter and sort state
  const [serviceFilters, setServiceFilters] = useState<Set<Service>>(
    initialServiceFilter ? new Set([initialServiceFilter]) : new Set()
  );
  const [stageFilters, setStageFilters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Track if we're in auto-filter mode
  const [isAutoFiltered, setIsAutoFiltered] = useState(!!initialServiceFilter);
  
  const selectedPeriod = clientPeriods.find(p => p.id === selectedPeriodId);
  const [localPeriod, setLocalPeriod] = useState<Period | null>(selectedPeriod || null);

  // Update local period when selection changes
  React.useEffect(() => {
    if (selectedPeriod) {
      setLocalPeriod(selectedPeriod);
    }
  }, [selectedPeriod]);

  // Map status to stage for filtering
  const statusToStage = (status: string): string => {
    const lane = laneForStatus(status);
    switch (lane) {
      case 'TODO': return 'To Do';
      case 'INPROG': return 'In Progress';
      case 'WITHCLIENT': return 'With Client';
      case 'READY': return 'Ready for Review';
      case 'DONE': return 'Completed';
      default: return 'In Progress';
    }
  };

  // Filter and sort periods
  const filteredAndSortedPeriods = useMemo(() => {
    let filtered = clientPeriods;
    
    // Apply service filters
    if (serviceFilters.size > 0) {
      filtered = filtered.filter(p => serviceFilters.has(p.service));
    }
    
    // Apply stage filters
    if (stageFilters.size > 0) {
      filtered = filtered.filter(p => stageFilters.has(statusToStage(p.status)));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.clientName.toLowerCase().includes(query) ||
        p.periodLabel.toLowerCase().includes(query)
      );
    }
    
    // Sort by due date
    return filtered.sort((a, b) => {
      const aDate = new Date(a.dueDate);
      const bDate = new Date(b.dueDate);
      
      // Handle invalid dates (items with no due date go last)
      const aValid = !isNaN(aDate.getTime());
      const bValid = !isNaN(bDate.getTime());
      
      if (!aValid && !bValid) {
        // Both invalid, sort by client name, then service, then period
        const clientCompare = a.clientName.localeCompare(b.clientName);
        if (clientCompare !== 0) return clientCompare;
        
        const serviceCompare = a.service.localeCompare(b.service);
        if (serviceCompare !== 0) return serviceCompare;
        
        return a.periodLabel.localeCompare(b.periodLabel);
      }
      
      if (!aValid) return 1; // a goes after b
      if (!bValid) return -1; // b goes after a
      
      // Both valid dates
      const dateCompare = sortAscending ? 
        aDate.getTime() - bDate.getTime() : 
        bDate.getTime() - aDate.getTime();
      
      if (dateCompare !== 0) return dateCompare;
      
      // Tie-breaker: client name, then service, then period
      const clientCompare = a.clientName.localeCompare(b.clientName);
      if (clientCompare !== 0) return clientCompare;
      
      const serviceCompare = a.service.localeCompare(b.service);
      if (serviceCompare !== 0) return serviceCompare;
      
      return a.periodLabel.localeCompare(b.periodLabel);
    });
  }, [clientPeriods, serviceFilters, stageFilters, searchQuery, sortAscending]);

  // Check if selected period is still visible after filtering
  React.useEffect(() => {
    if (selectedPeriodId && !filteredAndSortedPeriods.find(p => p.id === selectedPeriodId)) {
      setSelectedPeriodId('');
      setLocalPeriod(null);
    }
  }, [filteredAndSortedPeriods, selectedPeriodId]);

  const nextDue = useMemo(() => {
    const activePeriods = clientPeriods.filter(p => !['Submitted', 'Filed', 'Paid', 'Done', 'Closed'].includes(p.status));
    if (activePeriods.length === 0) return null;
    
    return activePeriods.reduce((earliest, current) => {
      return new Date(current.dueDate) < new Date(earliest.dueDate) ? current : earliest;
    });
  }, [clientPeriods]);

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
    if (days < 0) return 'text-red-600 font-semibold';
    if (days <= 3) return 'text-orange-600 font-medium';
    if (days <= 7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const handleSave = () => {
    if (localPeriod) {
      onUpdate(localPeriod);
    }
  };

  const updateLocalPeriod = <K extends keyof Period>(key: K, value: Period[K]) => {
    if (localPeriod) {
      setLocalPeriod({ ...localPeriod, [key]: value });
    if (localPeriod && localPeriod.id === next.id) {
      setLocalPeriod(next);
    }
    }
  };
  // Action handlers
  const handleEmailReminder = () => {
    if (!localPeriod) return;
    const next = { ...localPeriod };
    next.comms = [
      { at: new Date().toISOString(), type: "email" as const, summary: "Reminder sent" }, 
      ...(localPeriod.comms || [])
    ];
    next.reminderCount = (localPeriod.reminderCount || 0) + 1;
    
    // SA stays in Awaiting Questionnaire/Reminders Sent; VAT/ACCOUNTS remain Awaiting Docs
    if (next.service === "SA" && ["Awaiting Questionnaire", "Reminders Sent"].includes(next.status)) {
      next.status = "Reminders Sent" as any;
    }
    
    handleUpdate(next);
  };

  const handleUploadWorking = () => {
    if (!localPeriod) return;
    const next = { ...localPeriod };
    next.documents = [
      ...(localPeriod.documents || []),
      { 
        id: `doc-${Date.now()}`, 
        name: "Working file", 
        url: "#", 
        uploadedAt: new Date().toISOString(), 
        kind: "Working" as const 
      }
    ];
    handleUpdate(next);
  };

  const handleRequestApproval = () => {
    if (!localPeriod) return;
    const next = { ...localPeriod };
    const link = next.approval?.link || `https://app.local/share/${localPeriod.id}`;
    next.approval = { 
      ...(next.approval || {}), 
      link, 
      requestedAt: new Date().toISOString() 
    };
    next.comms = [
      { at: new Date().toISOString(), type: "email" as const, summary: "Approval requested" }, 
      ...(localPeriod.comms || [])
    ];
    next.status = "Awaiting Approval" as any;
    handleUpdate(next);
  };

  const handleAddNote = () => {
    if (!localPeriod) return;
    const note = prompt("Add note");
    if (note) {
      const next = { 
        ...localPeriod, 
        comms: [
          { at: new Date().toISOString(), type: "note" as const, summary: `Note: ${note}` }, 
          ...(localPeriod.comms || [])
        ] 
      };
      handleUpdate(next);
    }
  };

  const handleMoveStatus = (targetStatus: string) => {
    if (!localPeriod) return;
    const next = {
      ...localPeriod,
      status: targetStatus as any,
      comms: [
        {
          at: new Date().toISOString(),
          type: 'note' as const,
          summary: `Status changed from "${localPeriod.status}" to "${targetStatus}"`
        },
        ...(localPeriod.comms || [])
      ]
    };
    handleUpdate(next);
  };

  const toggleServiceFilter = (service: Service) => {
    const newFilters = new Set(serviceFilters);
    if (newFilters.has(service)) {
      newFilters.delete(service);
    } else {
      newFilters.add(service);
    }
    setServiceFilters(newFilters);
  };

  const toggleStageFilter = (stage: string) => {
    const newFilters = new Set(stageFilters);
    if (newFilters.has(stage)) {
      newFilters.delete(stage);
    } else {
      newFilters.add(stage);
    }
    setStageFilters(newFilters);
  };

  const clearAllFilters = () => {
    setServiceFilters(new Set());
    setStageFilters(new Set());
    setSearchQuery('');
    setIsAutoFiltered(false);
  };

  const clearServiceFilter = () => {
    setServiceFilters(new Set());
    setIsAutoFiltered(false);
  };

  const hasActiveFilters = serviceFilters.size > 0 || stageFilters.size > 0 || searchQuery.trim();

  if (!client || clientPeriods.length === 0) {
    console.log('Debug - ClientView:', { clientId, client, clientPeriodsLength: clientPeriods.length, totalPeriods: periods.length });
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Board
          </Button>
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {!client ? 'Client not found' : 'No active periods'}
            </h3>
            <p className="text-gray-600">
              {!client 
                ? `Client ID "${clientId}" could not be found in the system.`
                : 'This client has no active periods to display.'
              }
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Debug info:</p>
              <p>Client ID: {clientId}</p>
              <p>Client found: {client ? 'Yes' : 'No'}</p>
              <p>Total periods: {periods.length}</p>
              <p>Client periods: {clientPeriods.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb */}
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Board
          </Button>
          
          {/* Client Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span className="font-medium">{clientPeriods.length}</span>
                  <span>active service{clientPeriods.length !== 1 ? 's' : ''}</span>
                </div>
                {nextDue && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Next due:</span>
                    <span className={getDueDateColor(nextDue.dueDate)}>
                      {formatDate(nextDue.dueDate)} ({nextDue.service})
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Client Info Summary */}
            <div className="text-right text-sm text-gray-600">
              {client.email && (
                <div className="flex items-center justify-end space-x-1 mb-1">
                  <Mail className="w-4 h-4" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center justify-end space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Client Information Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Client Information
                </h2>
                <div className="flex items-center gap-2">
                  {client.risk && (
                    <Badge 
                      variant="outline" 
                      className={`${
                        client.risk === 'High' ? 'border-red-200 text-red-700 bg-red-50' :
                        client.risk === 'Med' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                        'border-green-200 text-green-700 bg-green-50'
                      }`}
                    >
                      {client.risk} Risk
                    </Badge>
                  )}
                  {client.tags && client.tags.length > 0 && (
                    <div className="flex gap-1">
                      {client.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {client.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{client.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Contact</h3>
                  <div className="space-y-3">
                    {client.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <a 
                            href={`mailto:${client.email}`}
                            className="text-sm text-blue-600 hover:text-blue-800 break-all"
                          >
                            {client.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <a 
                            href={`tel:${client.phone}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {client.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            {client.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Company Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Company</h3>
                  <div className="space-y-3">
                    {client.companyNo && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Company Number</p>
                        <p className="text-sm font-mono text-gray-900">{client.companyNo}</p>
                      </div>
                    )}
                    {client.vatNo && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">VAT Registration</p>
                        <p className="text-sm font-mono text-gray-900">{client.vatNo}</p>
                      </div>
                    )}
                    {client.yearEnd && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Year End</p>
                        <p className="text-sm text-gray-900">
                          {new Date(client.yearEnd).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Services & Relationship */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Services</h3>
                  <div className="space-y-3">
                    {client.activeServices && client.activeServices.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Active Services</p>
                        <div className="flex flex-wrap gap-1">
                          {client.activeServices.map(service => (
                            <ServiceBadge key={service} service={service} className="text-xs" />
                          ))}
                        </div>
                      </div>
                    )}
                    {client.startedAt && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Client Since</p>
                        <p className="text-sm text-gray-900">
                          {new Date(client.startedAt).toLocaleDateString('en-GB', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Compliance Status */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Compliance</h3>
                  <div className="space-y-3">
                    {client.engagementSignedAt && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <div>
                          <p className="text-xs text-gray-500">Letter of Engagement</p>
                          <p className="text-sm text-green-700 font-medium">Signed</p>
                          <p className="text-xs text-gray-500">
                            {new Date(client.engagementSignedAt).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      </div>
                    )}
                    {client.amlVerifiedAt && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <div>
                          <p className="text-xs text-gray-500">AML/KYC</p>
                          <p className="text-sm text-green-700 font-medium">Verified</p>
                          <p className="text-xs text-gray-500">
                            {new Date(client.amlVerifiedAt).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      </div>
                    )}
                    {(!client.engagementSignedAt || !client.amlVerifiedAt) && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                        <div>
                          <p className="text-sm text-yellow-700 font-medium">Pending</p>
                          <p className="text-xs text-gray-500">
                            {!client.engagementSignedAt && 'Engagement letter required'}
                            {!client.engagementSignedAt && !client.amlVerifiedAt && ' • '}
                            {!client.amlVerifiedAt && 'AML verification required'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Services and Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Left Pane - Service List */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            {/* Header with Filter and Sort Controls */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Services & Periods</h3>
                <div className="flex items-center gap-2">
                  {/* Filter Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-2 rounded-md border transition-colors ${
                        hasActiveFilters 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                      aria-pressed={showFilters}
                      title="Filter services"
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                    
                    {/* Filter Popover */}
                    {showFilters && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowFilters(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">Filters</h4>
                            {hasActiveFilters && (
                              <button
                                onClick={clearAllFilters}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                          
                          {/* Search */}
                          <div className="mb-4">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                              <input
                                type="text"
                                placeholder="Search period or client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          
                          {/* Service Type Filters */}
                          <div className="mb-4">
                            <div className="text-xs font-medium text-gray-700 mb-2">Service Type</div>
                            <div className="space-y-1">
                              {(['VAT', 'ACCOUNTS', 'SA'] as Service[]).map(service => (
                                <label key={service} className="flex items-center text-xs">
                                  <input
                                    type="checkbox"
                                    checked={serviceFilters.has(service)}
                                    onChange={() => toggleServiceFilter(service)}
                                    className="mr-2 w-3 h-3"
                                  />
                                  {service === 'ACCOUNTS' ? 'Accounts' : service === 'SA' ? 'Self-Assessment' : service}
                                </label>
                              ))}
                            </div>
                          </div>
                          
                          {/* Stage Filters */}
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-2">Stage</div>
                            <div className="space-y-1">
                              {['To Do', 'In Progress', 'With Client', 'Ready for Review', 'Completed'].map(stage => (
                                <label key={stage} className="flex items-center text-xs">
                                  <input
                                    type="checkbox"
                                    checked={stageFilters.has(stage)}
                                    onChange={() => toggleStageFilter(stage)}
                                    className="mr-2 w-3 h-3"
                                  />
                                  {stage}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Sort Button */}
                  <button
                    onClick={() => setSortAscending(!sortAscending)}
                    className="flex items-center gap-1 px-2 py-2 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-xs"
                    aria-pressed={!sortAscending}
                    title={`Sort by due date ${sortAscending ? 'ascending' : 'descending'}`}
                  >
                    <Calendar className="w-3 h-3" />
                    {sortAscending ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              
              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {isAutoFiltered && serviceFilters.size > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-800 mb-2">
                      <span>Filtered by: {Array.from(serviceFilters).map(s => 
                        s === 'ACCOUNTS' ? 'Accounts' : s === 'SA' ? 'Self-Assessment' : s
                      ).join(', ')}</span>
                      <button
                        onClick={clearServiceFilter}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {Array.from(serviceFilters).map(service => (
                    <span key={service} className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                      isAutoFiltered ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {service === 'ACCOUNTS' ? 'Accounts' : service === 'SA' ? 'Self-Assessment' : service}
                      {!isAutoFiltered && <button
                        onClick={() => toggleServiceFilter(service)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-2 h-2" />
                      </button>}
                    </span>
                  ))}
                  {Array.from(stageFilters).map(stage => (
                    <span key={stage} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {stage}
                      <button
                        onClick={() => toggleStageFilter(stage)}
                        className="hover:bg-purple-200 rounded-full p-0.5"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </span>
                  ))}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery('')}
                        className="hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Services List */}
            <div className="space-y-2">
              {filteredAndSortedPeriods.map((period) => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriodId(period.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedPeriodId === period.id
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  aria-pressed={selectedPeriodId === period.id}
                >
                  <div className="flex items-center justify-between mb-2">
                    <ServiceBadge service={period.service} />
                    <StatusPill status={period.status} />
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {period.periodLabel}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span className={getDueDateColor(period.dueDate)}>
                        {formatDate(period.dueDate)}
                      </span>
                    </div>
                    {period.assignee && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{period.assignee}</span>
                      </div>
                    )}
                  </div>
                  {period.reminderCount && period.reminderCount > 0 && (
                    <div className="flex items-center space-x-1 mt-2 text-xs text-orange-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{period.reminderCount} reminder{period.reminderCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </button>
              ))}
              
              {filteredAndSortedPeriods.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">
                    {isAutoFiltered && initialServiceFilter ? 
                      `No ${initialServiceFilter === 'ACCOUNTS' ? 'Accounts' : initialServiceFilter === 'SA' ? 'Self-Assessment' : initialServiceFilter} services found` :
                      'No services match your filters'
                    }
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={isAutoFiltered ? clearServiceFilter : clearAllFilters}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                    >
                      {isAutoFiltered ? 'Clear filter' : 'Clear filters'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Pane - Service Details */}
          {localPeriod ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ServiceBadge service={localPeriod.service} />
                    <h2 className="text-xl font-semibold text-gray-900">
                      {localPeriod.periodLabel}
                    </h2>
                    <StatusPill status={localPeriod.status} />
                  </div>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </div>

              <Tabs defaultValue="overview" className="flex flex-col flex-1">
                <div className="px-6 pt-4">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="comms">Comms</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1 px-6 pb-6">
                  <TabsContent value="overview" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={localPeriod.dueDate}
                          onChange={(e) => updateLocalPeriod('dueDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={localPeriod.amount || ''}
                          onChange={(e) => updateLocalPeriod('amount', Number(e.target.value) || undefined)}
                          placeholder="Enter amount"
                        />
                      </div>
                      <div>
                        <Label htmlFor="assignee">Assignee</Label>
                        <Input
                          id="assignee"
                          value={localPeriod.assignee || ''}
                          onChange={(e) => updateLocalPeriod('assignee', e.target.value)}
                          placeholder="Assign to..."
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div className="mt-2">
                          <StatusPill status={localPeriod.status} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions and Move Status Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
                      {/* Actions Section */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-900 mb-3 block">Actions</Label>
                        <div className="space-y-2">
                          <button
                            onClick={handleEmailReminder}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                          >
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span>Send reminder</span>
                          </button>
                          
                          <button
                            onClick={handleUploadWorking}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                          >
                            <Upload className="w-4 h-4 text-green-600" />
                            <span>Upload working file</span>
                          </button>
                          
                          <button
                            onClick={handleRequestApproval}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                          >
                            <CheckCircle2 className="w-4 h-4 text-purple-600" />
                            <span>Request approval</span>
                          </button>
                          
                          <button
                            onClick={handleAddNote}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
                          >
                            <StickyNote className="w-4 h-4 text-gray-600" />
                            <span>Add note</span>
                          </button>
                        </div>
                      </div>

                      {/* Move Status Section */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-900 mb-3 block">Move Status</Label>
                        <div className="space-y-3">
                          {/* Forward moves */}
                          {(() => {
                            const forward = nextAllowedTransitions(localPeriod.service, localPeriod.status);
                            const back = prevAllowedTransitions(localPeriod.service, localPeriod.status);
                            
                            return (
                              <>
                                {forward.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 mb-2">Move forward</div>
                                    <div className="space-y-1">
                                      {forward.map(status => (
                                        <button
                                          key={status}
                                          onClick={() => handleMoveStatus(status)}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-green-50 rounded-md transition-colors border border-gray-200"
                                        >
                                          <ArrowRight className="w-3 h-3 text-green-600" />
                                          <span>{status}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {back.length > 0 && (
                                  <div className={forward.length > 0 ? "pt-2 border-t border-gray-200" : ""}>
                                    <div className="text-xs font-medium text-gray-500 mb-2">Move back</div>
                                    <div className="space-y-1">
                                      {back.map(status => (
                                        <button
                                          key={status}
                                          onClick={() => handleMoveStatus(status)}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-orange-50 rounded-md transition-colors border border-gray-200"
                                        >
                                          <ArrowLeftIcon className="w-3 h-3 text-orange-600" />
                                          <span>{status}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {forward.length === 0 && back.length === 0 && (
                                  <div className="text-sm text-gray-500 text-center py-4 border border-gray-200 rounded-md bg-gray-50">
                                    No moves available
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Flags */}
                    <div>
                      <Label>Flags</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {localPeriod.reminderCount && localPeriod.reminderCount > 0 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            {localPeriod.reminderCount} reminder{localPeriod.reminderCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {daysUntil(localPeriod.dueDate) < 0 && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            Overdue
                          </Badge>
                        )}
                        {daysUntil(localPeriod.dueDate) <= 7 && daysUntil(localPeriod.dueDate) >= 0 && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                            Due soon
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="comms" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Communications</h3>
                        <Button size="sm">Add Communication</Button>
                      </div>
                      <div className="space-y-3">
                        {(localPeriod.comms || []).map((comm, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={comm.type === 'email' ? 'default' : 'secondary'}>
                                {comm.type}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(comm.at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comm.summary}</p>
                          </div>
                        ))}
                        {(!localPeriod.comms || localPeriod.comms.length === 0) && (
                          <p className="text-gray-500 text-center py-8">No communications yet</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Documents</h3>
                        <Button size="sm">Upload Document</Button>
                      </div>
                      <div className="space-y-3">
                        {(localPeriod.documents || []).map((doc) => (
                          <div key={doc.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{doc.name}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={doc.kind === 'Working' ? 'secondary' : 'default'}>
                                    {doc.kind}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </span>
                                  {doc.by && (
                                    <span className="text-sm text-gray-500">by {doc.by}</span>
                                  )}
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">Download</Button>
                            </div>
                          </div>
                        ))}
                        {(!localPeriod.documents || localPeriod.documents.length === 0) && (
                          <p className="text-gray-500 text-center py-8">No documents yet</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">History</h3>
                      <div className="space-y-3">
                        {(localPeriod.history || []).map((entry, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-500">
                                {new Date(entry.at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{entry.summary}</p>
                          </div>
                        ))}
                        {(!localPeriod.history || localPeriod.history.length === 0) && (
                          <p className="text-gray-500 text-center py-8">No history yet</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notes</h3>
                      <div>
                        <Label htmlFor="notes">Service-specific notes</Label>
                        <Textarea
                          id="notes"
                          value={localPeriod.notes || ''}
                          onChange={(e) => updateLocalPeriod('notes', e.target.value)}
                          placeholder="Add notes specific to this service..."
                          rows={6}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a service to view details</h3>
              <p className="text-gray-600">Choose a service from the list to see its overview, communications, documents, and more.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default ClientView;