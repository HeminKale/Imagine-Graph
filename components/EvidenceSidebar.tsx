import React from 'react';
import { EvidenceFile } from '../types';
import { FileAudio, FileImage, FileText, Video, CheckCircle, AlertCircle } from 'lucide-react';
import { FILE_COLORS } from '../constants';

interface Props {
  files: EvidenceFile[];
  selectedFileId: string | null;
  onFileSelect: (id: string | null) => void;
}

export const EvidenceSidebar: React.FC<Props> = ({ files, selectedFileId, onFileSelect }) => {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'audio': return <FileAudio size={16} />;
      case 'video': return <Video size={16} />;
      case 'pdf': return <FileText size={16} />;
      default: return <FileImage size={16} />;
    }
  };

  return (
    <div className="w-full bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <h2 className="text-slate-200 font-semibold flex items-center gap-2">
          Evidence Log
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{files.length}</span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {files.length === 0 && (
          <div className="text-center p-4 text-slate-600 text-sm">
            No evidence ingested yet.
          </div>
        )}
        
        {files.map((file, idx) => {
          const isSelected = selectedFileId === file.id;
          return (
            <div
              key={file.id}
              onClick={() => onFileSelect(isSelected ? null : file.id)}
              className={`
                group flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all duration-200
                ${isSelected 
                  ? 'bg-slate-800 border-cyan-500/50 shadow-md' 
                  : 'bg-slate-900 border-transparent hover:bg-slate-800 hover:border-slate-700'
                }
              `}
            >
              <div 
                className={`p-2 rounded-md ${isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-950 text-slate-400 group-hover:text-slate-200'}`}
              >
                {getIcon(file.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-cyan-400' : 'text-slate-300'}`}>
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                   {file.status === 'processed' ? (
                     <span className="flex items-center gap-1 text-emerald-500"><CheckCircle size={10} /> Processed</span>
                   ) : (
                     <span className="flex items-center gap-1 text-amber-500"><AlertCircle size={10} /> {file.status}</span>
                   )}
                </p>
              </div>

              {/* Color indicator for visual tracking */}
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: file.color || FILE_COLORS[idx % FILE_COLORS.length] }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
