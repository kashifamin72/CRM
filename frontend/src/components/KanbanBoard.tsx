import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragStartEvent,
  DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import { Lead, LeadStatus, LeadStatusLabels, LeadStatusColors } from '../types';
import { MessageSquare, Clock, User, Calendar, Pencil, Briefcase, Lock } from 'lucide-react';
import { renderSourcePill } from '../lib/icons';
import clsx from 'clsx';

const STATUS_ORDER = [
  LeadStatus.New,
  LeadStatus.Contacted,
  LeadStatus.Qualified,
  LeadStatus.Proposal,
  LeadStatus.ClosedWon,
  LeadStatus.ClosedLost,
];

const statusBarColors: Record<LeadStatus, string> = {
  [LeadStatus.New]: 'bg-amber-500',
  [LeadStatus.Contacted]: 'bg-cyan-500',
  [LeadStatus.Qualified]: 'bg-blue-500',
  [LeadStatus.Proposal]: 'bg-slate-500',
  [LeadStatus.ClosedWon]: 'bg-green-500',
  [LeadStatus.ClosedLost]: 'bg-red-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function Column({ status, leads }: { status: LeadStatus; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'flex flex-col rounded-xl border transition-colors min-h-[400px]',
        isOver ? 'border-primary-400 bg-primary-50/50' : 'border-slate-200 bg-slate-50/50'
      )}
    >
      <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-200 bg-white rounded-t-xl">
        <div className={clsx('w-2.5 h-2.5 rounded-full', statusBarColors[status])} />
        <span className="text-sm font-semibold text-slate-800">{LeadStatusLabels[status]}</span>
        <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-slate-400 italic">
            Drop leads here
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lead-${lead.id}`,
    data: { lead },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx(
        'bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <div className={clsx('h-1 rounded-t-lg', statusBarColors[lead.status])} />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1">
          {(lead.status === LeadStatus.ClosedWon || lead.status === LeadStatus.ClosedLost) && (
            <Lock className="h-3 w-3 text-slate-400 flex-shrink-0" />
          )}
          <Link
            to={`/leads/${lead.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium text-slate-900 hover:text-primary-600 line-clamp-1 block flex-1"
          >
            {lead.title}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
            {getInitials(lead.customerName)}
          </div>
          <span className="text-xs text-slate-600 truncate">{lead.customerName}</span>
        </div>
        {lead.contactPerson && (
          <div className="text-[11px] text-slate-500 pl-8 space-y-0.5">
            <div className="truncate">
              <span className="font-medium text-slate-700">{lead.contactPerson}</span>
              {lead.contactDesignation && <span className="text-slate-400"> · {lead.contactDesignation}</span>}
            </div>
            {lead.contactMobile && (
              <a
                href={`tel:${lead.contactMobile}`}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-primary-600 hover:underline"
              >
                {lead.contactMobile}
              </a>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          {lead.leadDate && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded">
              <Calendar className="h-3 w-3" />
              {new Date(lead.leadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
          {lead.estimatedValue && (
            <span className="text-xs font-medium text-slate-700">
              ${lead.estimatedValue.toLocaleString()}
            </span>
          )}
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {daysSince(lead.createdAt)}d
          </span>
        </div>
        {(lead.leadSourceName || lead.businessTypeName) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {lead.businessTypeName && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                style={{
                  backgroundColor: `${lead.businessTypeColor || '#6366f1'}20`,
                  color: lead.businessTypeColor || '#6366f1',
                }}
              >
                <Briefcase className="h-2.5 w-2.5" />
                {lead.businessTypeName}
              </span>
            )}
            {lead.leadSourceName && renderSourcePill({
              name: lead.leadSourceName,
              icon: lead.leadSourceIcon,
              color: lead.leadSourceColor || '#6366f1',
            })}
          </div>
        )}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.assignedToName || 'Unassigned'}</span>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Link
              to={`/leads/${lead.id}`}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={`Edit ${lead.title}`}
              title="Edit lead"
              className="p-1 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            {lead.customerPhone && (
              <a
                href={`https://wa.me/${lead.customerPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DragCard({ lead }: { lead: Lead }) {
  return (
    <div className="bg-white rounded-lg border-2 border-primary-400 shadow-xl w-[260px]">
      <div className={clsx('h-1 rounded-t-lg', statusBarColors[lead.status])} />
      <div className="p-3 space-y-2">
        <p className="text-sm font-medium text-slate-900 line-clamp-1">{lead.title}</p>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-[10px] font-semibold flex items-center justify-center">
            {getInitials(lead.customerName)}
          </div>
          <span className="text-xs text-slate-600 truncate">{lead.customerName}</span>
        </div>
        {lead.estimatedValue && (
          <p className="text-xs font-medium text-slate-700">${lead.estimatedValue.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({
  leads,
  onStatusChange,
  isAdmin = false,
}: {
  leads: Lead[];
  onStatusChange: (leadId: number, status: LeadStatus) => void;
  isAdmin?: boolean;
}) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const groupedLeads = useMemo(() => {
    const groups: Record<number, Lead[]> = {};
    STATUS_ORDER.forEach((s) => (groups[s] = []));
    leads.forEach((lead) => {
      if (groups[lead.status]) groups[lead.status].push(lead);
    });
    return groups;
  }, [leads]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    if (id.startsWith('lead-')) {
      const lead = event.active.data.current?.lead as Lead;
      // Prevent drag for closed leads unless admin
      if ((lead.status === LeadStatus.ClosedWon || lead.status === LeadStatus.ClosedLost) && !isAdmin) {
        return;
      }
      setActiveLead(lead);
    }
  }, [isAdmin]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveLead(null);
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      if (!activeId.startsWith('lead-')) return;

      const leadId = Number(activeId.replace('lead-', ''));
      const overId = over.id as string;

      let newStatus: LeadStatus | null = null;

      if (overId.startsWith('column-')) {
        newStatus = Number(overId.replace('column-', '')) as LeadStatus;
      } else if (overId.startsWith('lead-')) {
        const overLead = leads.find((l) => l.id === Number(overId.replace('lead-', '')));
        if (overLead) newStatus = overLead.status;
      }

      const activeLeadData = leads.find((l) => l.id === leadId);
      if (newStatus !== null && activeLeadData && newStatus !== activeLeadData.status) {
        onStatusChange(leadId, newStatus);
      }
    },
    [leads, onStatusChange]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {STATUS_ORDER.map((status) => (
          <Column key={status} status={status} leads={groupedLeads[status] || []} />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <DragCard lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
