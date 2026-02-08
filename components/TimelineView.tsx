import React, { useMemo } from 'react';
import { GraphNode, EvidenceFile } from '../types';
import { AlertTriangle, CheckCircle, Circle } from 'lucide-react';
import { GRAPH_COLORS } from '../constants';

interface Props {
  nodes: GraphNode[];
  selectedFileId: string | null;
  files: EvidenceFile[];
  highlightedNodeId: string | null;
  onEventClick: (nodeId: string) => void;
}

export const TimelineView: React.FC<Props> = ({ nodes, selectedFileId, files, highlightedNodeId, onEventClick }) => {
  // Filter nodes that have timestamps
  const timelineEvents = useMemo(() => {
    return nodes
      .filter(n => n.properties?.timestamp)
      .map(n => ({
        ...n,
        date: new Date(n.properties!.timestamp!),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [nodes]);

  if (timelineEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800 p-8">
        <p>No temporal data found in evidence.</p>
      </div>
    );
  }

  // Group by Month/Year for the "Full Calendar" feel
  const groupedEvents: { [key: string]: typeof timelineEvents } = {};
  timelineEvents.forEach(event => {
    const key = event.date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groupedEvents[key]) groupedEvents[key] = [];
    groupedEvents[key].push(event);
  });

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="space-y-8">
        {Object.entries(groupedEvents).map(([month, events]) => (
          <div key={month} className="relative">
            <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur py-2 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-cyan-500 tracking-wider uppercase">{month}</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {events.map((event) => {
                const isConflict = event.type === 'DISCREPANCY' || event.type === 'CONFLICT';
                
                // Determine highlight based on node selection or file filter
                const isNodeSelected = highlightedNodeId === event.id;
                let isFileSelected = false;

                if (selectedFileId) {
                   const file = files.find(f => f.id === selectedFileId);
                   if (file) {
                       const sourceVal = event.properties?.source_file || '';
                       const srcLower = sourceVal.toLowerCase().trim();
                       const fileLower = file.name.toLowerCase().trim();
                       
                       // Robust check
                       if (sourceVal && (srcLower.includes(fileLower) || fileLower.includes(srcLower))) {
                           isFileSelected = true;
                       }
                       
                       // Check manual attachment
                       if (Array.isArray(event.properties?.attached_files) && event.properties.attached_files.includes(selectedFileId)) {
                           isFileSelected = true;
                       }
                   }
                }

                const isHighlighted = isNodeSelected || isFileSelected;
                
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event.id)}
                    className={`
                      relative p-4 rounded-lg border transition-all duration-200 cursor-pointer
                      ${isHighlighted 
                        ? 'bg-slate-800 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                        : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Date Box */}
                      <div className="flex flex-col items-center justify-center bg-slate-950 rounded p-2 min-w-[60px] border border-slate-800">
                        <span className="text-xl font-bold text-slate-200">{event.date.getDate()}</span>
                        <span className="text-xs text-slate-500 uppercase">{event.date.toLocaleString('default', { weekday: 'short' })}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isConflict ? (
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                          ) : (
                            <Circle className="w-3 h-3 text-cyan-500 fill-cyan-500" />
                          )}
                          <h4 className={`font-semibold ${isConflict ? 'text-rose-400' : 'text-slate-200'}`}>
                            {event.label}
                          </h4>
                        </div>
                        
                        <p className="text-sm text-slate-400 line-clamp-2">
                           {event.properties?.description || event.properties?.name || "Event detected from evidence."}
                        </p>

                        {/* Metadata Tags */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {event.properties?.source_file && (
                            <span className="text-xs px-2 py-1 rounded bg-slate-950 text-slate-500 border border-slate-800">
                              {event.properties.source_file}
                            </span>
                          )}
                           <span className="text-xs px-2 py-1 rounded bg-slate-950 text-slate-500 border border-slate-800 uppercase">
                              {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
