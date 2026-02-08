import React, { useState, useEffect, useMemo } from 'react';
import { GraphNode, GraphLink, EvidenceFile } from '../types';
import { X, Edit2, Trash2, Save, Plus, Minus, Link as LinkIcon, FileText, Paperclip } from 'lucide-react';

interface Props {
  node: GraphNode | null;
  allNodes: GraphNode[];
  allLinks: GraphLink[];
  availableFiles: EvidenceFile[];
  onClose: () => void;
  onSave: (updatedNode: GraphNode) => void;
  onDelete: (nodeId: string) => void;
  onAddLink: (sourceId: string, targetId: string, label: string) => void;
  onRemoveLink: (link: GraphLink) => void;
}

export const NodeInspector: React.FC<Props> = ({ 
  node, 
  allNodes,
  allLinks,
  availableFiles,
  onClose, 
  onSave, 
  onDelete,
  onAddLink,
  onRemoveLink
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<GraphNode | null>(null);
  const [properties, setProperties] = useState<{ key: string; value: string }[]>([]);
  
  // Link State
  const [newLinkTarget, setNewLinkTarget] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');

  // Sync state with selected node
  useEffect(() => {
    if (node) {
      setFormData(JSON.parse(JSON.stringify(node))); // Deep copy
      setIsEditing(false);
      
      const propsArray = Object.entries(node.properties || {})
        .filter(([k]) => k !== 'attached_files') // Handle attached files separately
        .map(([key, value]) => ({
          key,
          value: String(value)
        }));
      setProperties(propsArray);
    }
  }, [node]);

  // Derived state for existing connections
  const connectedLinks = useMemo(() => {
    if (!node) return [];
    return allLinks.filter(l => {
      const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      return sId === node.id;
    });
  }, [node, allLinks]);

  // Derived state for attached files (Combines manual attachments + inferred source_file)
  const attachedFileIds = useMemo(() => {
    const ids = new Set<string>();
    
    // 1. Manual attachments
    if (formData?.properties?.attached_files && Array.isArray(formData.properties.attached_files)) {
      formData.properties.attached_files.forEach((id: string) => ids.add(id));
    }

    // 2. Inferred from 'source_file' property (Gemini output)
    if (formData?.properties?.source_file) {
      const sourceName = String(formData.properties.source_file).toLowerCase().trim();
      
      // Attempt to find a matching file in availableFiles
      // We check if the source name contains the file name OR if the file name contains the source name
      // This handles cases like "audio.mp3" vs "Audio" or "Report" vs "Report_Final.pdf"
      const matchingFile = availableFiles.find(f => {
        const fName = f.name.toLowerCase();
        return sourceName.includes(fName) || fName.includes(sourceName);
      });

      if (matchingFile) {
        ids.add(matchingFile.id);
      }
    }
    
    return Array.from(ids);
  }, [formData, availableFiles]);

  if (!node || !formData) return null;

  const handleSave = () => {
    // Reconstruct properties object
    const newProperties = properties.reduce((acc, curr) => {
      if (curr.key.trim()) {
        acc[curr.key] = curr.value;
      }
      return acc;
    }, {} as Record<string, any>);

    // Preserve attached files from formData
    if (formData.properties?.attached_files) {
        newProperties.attached_files = formData.properties.attached_files;
    }
    // Preserve source_file if it wasn't removed explicitly
    if (formData.properties?.source_file && !newProperties.source_file) {
        newProperties.source_file = formData.properties.source_file;
    }

    onSave({
      ...formData,
      properties: newProperties
    });
    setIsEditing(false);
  };

  const handleAddProperty = () => {
    setProperties([...properties, { key: '', value: '' }]);
  };

  const handleRemoveProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  const handlePropertyChange = (index: number, field: 'key' | 'value', text: string) => {
    const newProps = [...properties];
    newProps[index][field] = text;
    setProperties(newProps);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling to graph background
    if (window.confirm("Are you sure you want to delete this node? This action cannot be undone.")) {
      onDelete(node.id);
    }
  };

  const handleAddConnection = () => {
    if (newLinkTarget && newLinkLabel) {
      onAddLink(node.id, newLinkTarget, newLinkLabel);
      setNewLinkTarget('');
      setNewLinkLabel('');
    }
  };

  const handleAttachFile = (fileId: string) => {
    if (!fileId) return;
    const currentFiles = (formData.properties?.attached_files as string[]) || [];
    if (!currentFiles.includes(fileId)) {
      setFormData({
        ...formData,
        properties: {
          ...formData.properties,
          attached_files: [...currentFiles, fileId]
        }
      });
    }
  };

  const handleDetachFile = (fileId: string) => {
    const file = availableFiles.find(f => f.id === fileId);
    if (!file) return;

    const newProps = { ...formData.properties };
    let propertiesListChanged = false;

    // 1. If this file came from 'source_file', remove that property
    if (newProps.source_file) {
       const srcLower = String(newProps.source_file).toLowerCase();
       const fNameLower = file.name.toLowerCase();
       
       if (srcLower.includes(fNameLower) || fNameLower.includes(srcLower)) {
          delete newProps.source_file;
          propertiesListChanged = true;
       }
    }

    // 2. Remove from 'attached_files' array if present
    if (newProps.attached_files && Array.isArray(newProps.attached_files)) {
      newProps.attached_files = newProps.attached_files.filter((id: string) => id !== fileId);
    }

    setFormData({
      ...formData,
      properties: newProps
    });

    // 3. Update the visual properties list if we removed source_file
    if (propertiesListChanged) {
      setProperties(prev => prev.filter(p => p.key !== 'source_file'));
    }
  };

  return (
    <div 
      className="absolute top-4 right-4 w-80 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl animate-in fade-in slide-in-from-right-10 duration-200 z-20 flex flex-col max-h-[calc(100vh-2rem)]"
      onMouseDown={(e) => e.stopPropagation()} // Stop graph interaction
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
           {!isEditing ? (
             <span className="text-[10px] font-mono text-cyan-500 uppercase border border-cyan-900 bg-cyan-950/30 px-1.5 py-0.5 rounded">
               {node.type}
             </span>
           ) : (
             <span className="text-xs font-bold text-slate-400">EDIT MODE</span>
           )}
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <>
              <button 
                onClick={handleDelete}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                title="Delete Node"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={() => setIsEditing(true)} 
                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors"
                title="Edit Node"
              >
                <Edit2 size={16} />
              </button>
            </>
          )}
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        
        {/* Label & Type */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Label</label>
            {isEditing ? (
              <input 
                type="text" 
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm"
              />
            ) : (
              <h3 className="font-bold text-lg text-white leading-tight break-words">{node.label}</h3>
            )}
          </div>
          
          {isEditing && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-sm appearance-none"
              >
                <option value="ENTITY">ENTITY</option>
                <option value="EVENT">EVENT</option>
                <option value="CONFLICT">CONFLICT</option>
                <option value="DISCREPANCY">DISCREPANCY</option>
              </select>
            </div>
          )}
        </div>

        {/* Properties */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] text-slate-500 uppercase font-bold">Properties</label>
            {isEditing && (
              <button 
                onClick={handleAddProperty}
                className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-medium"
              >
                <Plus size={12} /> Add Field
              </button>
            )}
          </div>

          <div className="space-y-2">
            {properties.length === 0 && !isEditing && (
              <p className="text-xs text-slate-600 italic">No custom properties.</p>
            )}

            {isEditing ? (
              // Edit Mode Properties
              properties.map((prop, idx) => (
                <div key={idx} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2 duration-150">
                  <input
                    type="text"
                    placeholder="Key"
                    value={prop.key}
                    onChange={(e) => handlePropertyChange(idx, 'key', e.target.value)}
                    className="w-1/3 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-400 focus:border-cyan-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={prop.value}
                    onChange={(e) => handlePropertyChange(idx, 'value', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                  <button 
                    onClick={() => handleRemoveProperty(idx)}
                    className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              ))
            ) : (
              // View Mode Properties
              properties.map((prop) => (
                <div key={prop.key} className="flex flex-col border-b border-slate-800 pb-2 last:border-0">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mb-0.5">{prop.key.replace('_', ' ')}</span>
                  <span className="text-sm text-slate-300 break-words">{prop.value}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Evidence Attachments */}
        <div>
           <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Paperclip size={12}/> Evidence</label>
          </div>
          
          <div className="space-y-2">
             {attachedFileIds.map(fileId => {
               const file = availableFiles.find(f => f.id === fileId);
               if (!file) return null;
               return (
                 <div key={fileId} className="flex items-center justify-between bg-slate-800/50 p-2 rounded border border-slate-700">
                    <span className="text-xs text-slate-300 truncate flex items-center gap-2">
                      <FileText size={12} className="text-cyan-500" />
                      {file.name}
                    </span>
                    {isEditing && (
                       <button onClick={() => handleDetachFile(fileId)} className="text-rose-400 hover:text-rose-300"><X size={12}/></button>
                    )}
                 </div>
               );
             })}
             
             {attachedFileIds.length === 0 && !isEditing && (
                <p className="text-xs text-slate-600 italic">No attached evidence.</p>
             )}

             {isEditing && (
               <div className="mt-2">
                 <select 
                   className="w-full bg-slate-950 border border-slate-700 rounded text-xs p-2 text-slate-400 focus:outline-none focus:border-cyan-500"
                   onChange={(e) => { handleAttachFile(e.target.value); e.target.value = ''; }}
                 >
                   <option value="">+ Attach Evidence File...</option>
                   {availableFiles.map(f => (
                     <option key={f.id} value={f.id}>{f.name}</option>
                   ))}
                 </select>
               </div>
             )}
          </div>
        </div>

        {/* Connections (Edit Mode Only for Creation, View for Listing) */}
        <div>
           <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><LinkIcon size={12}/> Connections (Outgoing)</label>
          </div>
          
          <div className="space-y-2 mb-2">
             {connectedLinks.map((link, idx) => {
               const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
               const targetNode = allNodes.find(n => n.id === targetId);
               return (
                 <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded px-2 py-1.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                       <span className="text-[10px] text-cyan-500 font-mono bg-cyan-950 px-1 rounded">{link.label}</span>
                       <span className="text-xs text-slate-300 truncate">→ {targetNode?.label || targetId}</span>
                    </div>
                    {isEditing && (
                      <button onClick={() => onRemoveLink(link)} className="text-slate-600 hover:text-rose-400"><Minus size={12}/></button>
                    )}
                 </div>
               );
             })}
             {connectedLinks.length === 0 && !isEditing && <p className="text-xs text-slate-600 italic">No outgoing connections.</p>}
          </div>

          {isEditing && (
            <div className="p-3 bg-slate-800/30 rounded border border-slate-700/50 space-y-2">
               <p className="text-[10px] text-slate-500 font-bold uppercase">Add Connection</p>
               <select 
                 className="w-full bg-slate-950 border border-slate-700 rounded text-xs p-2 text-slate-300 focus:outline-none"
                 value={newLinkTarget}
                 onChange={(e) => setNewLinkTarget(e.target.value)}
               >
                 <option value="">Select Target Node...</option>
                 {allNodes.filter(n => n.id !== node.id).map(n => (
                   <option key={n.id} value={n.id}>{n.label}</option>
                 ))}
               </select>
               <input 
                 type="text" 
                 placeholder="Relationship (e.g. OWNS)" 
                 className="w-full bg-slate-950 border border-slate-700 rounded text-xs p-2 text-slate-300 focus:outline-none"
                 value={newLinkLabel}
                 onChange={(e) => setNewLinkLabel(e.target.value)}
               />
               <button 
                 onClick={handleAddConnection}
                 disabled={!newLinkTarget || !newLinkLabel}
                 className="w-full py-1 bg-slate-700 hover:bg-cyan-600 text-xs text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 Add Link
               </button>
            </div>
          )}
        </div>

      </div>

      {/* Footer Actions (Edit Mode Only) */}
      {isEditing && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex flex-col gap-3">
          <button 
            onClick={handleSave}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={16} /> Save Changes
          </button>
          
          <div className="flex gap-3">
             <button 
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/50 text-rose-400 hover:text-rose-300 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
