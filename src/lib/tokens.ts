import type { LaneId } from '@/pages/DashboardV2/lanes5';
import { laneForStatus } from '@/pages/DashboardV2/lanes5';

// Lane colors matching your existing theme
export const laneColors: Record<string, string> = {
  'To Do': '#f59e0b',        // amber
  'In Progress': '#3b82f6',   // blue  
  'With Client': '#db2777',   // rose
  'Ready for Review': '#6366f1', // indigo
  'Completed': '#10b981',     // emerald
};

// Map status to lane name (using existing lane logic)
export function statusToLane(status: string): string {
  const laneId = laneForStatus(status);
  
  switch (laneId) {
    case 'TODO': return 'To Do';
    case 'INPROG': return 'In Progress';
    case 'WITHCLIENT': return 'With Client';
    case 'READY': return 'Ready for Review';
    case 'DONE': return 'Completed';
    default: return 'In Progress';
  }
}