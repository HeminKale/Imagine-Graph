import React, { useRef, useEffect, useCallback } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { GraphData, GraphNode, EvidenceFile } from '../types';
import { GRAPH_COLORS } from '../constants';

interface Props {
  data: GraphData;
  width: number;
  height: number;
  selectedFileId: string | null;
  files: EvidenceFile[];
  highlightedNodeId: string | null;
  onNodeClick: (node: GraphNode) => void;
}

export const KnowledgeGraph: React.FC<Props> = ({ 
  data, 
  width, 
  height, 
  selectedFileId, 
  files, 
  highlightedNodeId,
  onNodeClick 
}) => {
  const fgRef = useRef<any>();

  // Adjust camera/zoom when highlight changes
  useEffect(() => {
    if (highlightedNodeId && fgRef.current) {
      const node = data.nodes.find(n => n.id === highlightedNodeId);
      if (node) {
        // Center and zoom
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(4, 2000);
      }
    }
  }, [highlightedNodeId, data.nodes]);

  const getNodeColor = useCallback((node: GraphNode) => {
    // Priority 1: Custom Color (e.g., Smart Create Yellow)
    if (node.properties?.custom_color) {
        return node.properties.custom_color;
    }

    // Check if highlighted explicitly or by file association
    const selectedFile = files.find(f => f.id === selectedFileId);
    
    let isFileMatch = false;
    if (selectedFile) {
      // Robust matching: Case insensitive, checking containment both ways
      const sourceVal = node.properties?.source_file || '';
      const srcLower = sourceVal.toLowerCase().trim();
      const fileLower = selectedFile.name.toLowerCase().trim();

      const matchesSource = sourceVal && (srcLower.includes(fileLower) || fileLower.includes(srcLower));
      
      const matchesAttachment = Array.isArray(node.properties?.attached_files) && node.properties.attached_files.includes(selectedFile.id);
      
      isFileMatch = !!(matchesSource || matchesAttachment);
    }
    
    const isIdMatch = highlightedNodeId === node.id;

    if (highlightedNodeId && !isIdMatch && !isFileMatch) {
        return '#334155'; // Dim others
    }
    
    if (selectedFileId && !isFileMatch && !isIdMatch) {
         return '#334155'; // Dim if filtering by file
    }

    if (isIdMatch || isFileMatch) return GRAPH_COLORS.selected;
    
    if (node.type === 'CONFLICT' || node.type === 'DISCREPANCY') return GRAPH_COLORS.conflict;
    if (node.type === 'EVENT') return GRAPH_COLORS.event;
    
    return GRAPH_COLORS.entity;
  }, [selectedFileId, files, highlightedNodeId]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const n = node as GraphNode;
    const color = getNodeColor(n);
    const label = n.label;
    // Get first letter for icon
    const typeLabel = n.type === 'ENTITY' ? 'Entity' : n.type === 'EVENT' ? 'Event' : n.type === 'CONFLICT' ? 'Conflict' : 'Unknown';
    const letter = (typeLabel).charAt(0).toUpperCase();
    
    const r = 6; // Node radius

    // Draw Glow if highlighted or custom color (yellow)
    if (highlightedNodeId === n.id || color === GRAPH_COLORS.selected || node.properties?.custom_color) {
       ctx.beginPath();
       ctx.arc(node.x, node.y, r * 2.5, 0, 2 * Math.PI, false);
       ctx.fillStyle = node.properties?.custom_color ? 'rgba(250, 204, 21, 0.2)' : 'rgba(34, 211, 238, 0.15)'; 
       ctx.fill();
    }

    // Draw Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Draw Border
    ctx.strokeStyle = '#0f172a'; // dark border
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Letter inside
    const fontSize = 7;
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = (color === GRAPH_COLORS.suggestion) ? '#000000' : '#ffffff'; // Black text on yellow
    ctx.fillText(letter, node.x, node.y + 0.5);

    // Label below
    // Show label if zoomed in enough or if this node is important
    const showLabel = globalScale > 1.5 || highlightedNodeId === n.id || color === GRAPH_COLORS.selected || node.properties?.custom_color || data.nodes.length < 20;
    
    if (showLabel) {
        const labelSize = 3.5;
        ctx.font = `${labelSize}px Inter, sans-serif`;
        
        ctx.fillStyle = (highlightedNodeId === n.id || color === GRAPH_COLORS.selected) ? '#22d3ee' : (node.properties?.custom_color ? '#facc15' : '#cbd5e1');
        ctx.fillText(label, node.x, node.y + r + labelSize + 1);
    }
  }, [getNodeColor, highlightedNodeId, data.nodes.length]);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const start = link.source;
      const end = link.target;
      
      if (typeof start !== 'object' || typeof end !== 'object') return;

      const text = link.label;
      if (!text) return;

      // Only show link labels if zoomed in
      if (globalScale < 2) return;

      const midX = start.x + (end.x - start.x) / 2;
      const midY = start.y + (end.y - start.y) / 2;

      const fontSize = 2.5;
      ctx.font = `${fontSize}px Inter, sans-serif`;
      
      // Draw background
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = '#020617';
      ctx.fillRect(midX - textWidth / 2 - 1, midY - fontSize / 2 - 1, textWidth + 2, fontSize + 2);

      ctx.fillStyle = '#64748b'; // Slate 500
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, midX, midY);
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-full w-full">
      <ForceGraph2D
        ref={fgRef}
        width={width}
        height={height}
        graphData={data}
        nodeLabel="label"
        nodeCanvasObject={paintNode}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={paintLink}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkWidth={1}
        linkColor={() => '#334155'} // Slate 700 lines
        onNodeClick={(node) => onNodeClick(node as GraphNode)}
        backgroundColor="#020617"
        d3VelocityDecay={0.1}
        cooldownTicks={100}
      />
      
      {/* 2D Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-800 text-xs text-slate-300 pointer-events-none select-none shadow-xl z-10">
        <h4 className="font-bold text-slate-400 mb-2 uppercase tracking-wider text-[10px]">Entity Types</h4>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{background: GRAPH_COLORS.entity}}>E</span> 
          <span>Entity</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{background: GRAPH_COLORS.event}}>E</span> 
          <span>Event</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{background: GRAPH_COLORS.conflict}}>C</span> 
          <span>Conflict</span>
        </div>
         <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-black" style={{background: GRAPH_COLORS.suggestion}}>?</span> 
          <span>Suggestion</span>
        </div>
      </div>
    </div>
  );
};
