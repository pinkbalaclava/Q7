import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, ArrowLeftRight } from 'lucide-react';
import type { Period } from './types';
import { nextAllowedTransitions, prevAllowedTransitions } from './status';

type Props = {
  period: Period;
  onRequest: (targetStatus: string) => void;
};

export function MoveMenu({ period, onRequest }: Props) {
  const [open, setOpen] = useState(false);
  const forward = nextAllowedTransitions(period.service, period.status);
  const back = prevAllowedTransitions(period.service, period.status);
  
  function choose(s: string) { 
    onRequest(s); 
    setOpen(false); 
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Move"
        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ArrowLeftRight className="w-4 h-4 text-gray-600" />
      </button>
      
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          
          {/* Popover */}
          <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="space-y-3">
              {forward.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-2">Move forward</div>
                  <div className="space-y-1">
                    {forward.map(s => (
                      <button
                        key={s}
                        onClick={() => choose(s)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <ArrowRight className="w-3 h-3 text-green-600" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {back.length > 0 && (
                <div className={forward.length > 0 ? "pt-2 border-t border-gray-200" : ""}>
                  <div className="text-xs font-medium text-gray-500 mb-2">Move back</div>
                  <div className="space-y-1">
                    {back.map(s => (
                      <button
                        key={s}
                        onClick={() => choose(s)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3 text-orange-600" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {forward.length === 0 && back.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  No moves available
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}