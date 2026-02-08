import React, { useCallback } from 'react';
import { Upload, FileAudio, FileImage, FileText, Loader2 } from 'lucide-react';
import { EvidenceFile } from '../types';

interface Props {
  onFilesAdded: (files: File[]) => void;
  isProcessing: boolean;
}

export const EvidenceDrop: React.FC<Props> = ({ onFilesAdded, isProcessing }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isProcessing) return;
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesAdded(files);
      }
    },
    [onFilesAdded, isProcessing]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !isProcessing) {
      onFilesAdded(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`
        relative group border-2 border-dashed rounded-xl p-8 transition-all duration-300
        flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
        ${isProcessing 
          ? 'border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed' 
          : 'border-slate-600 hover:border-cyan-400 bg-slate-900/30 hover:bg-slate-800/50'
        }
      `}
    >
      <input
        type="file"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onChange={handleChange}
        disabled={isProcessing}
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center animate-pulse">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          <p className="text-cyan-400 font-semibold">Gemini 3 Pro is analyzing evidence...</p>
        </div>
      ) : (
        <>
          <div className="mb-4 relative">
             <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/30 transition-all"></div>
             <Upload className="w-10 h-10 text-slate-400 group-hover:text-cyan-400 transition-colors relative z-10" />
          </div>
          <h3 className="text-lg font-medium text-slate-200 mb-1">Drop Evidence Files</h3>
          <p className="text-sm text-slate-500 mb-4">Audio, Video, PDF, Images</p>
          <div className="flex gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1"><FileAudio size={12}/> .MP3</span>
            <span className="flex items-center gap-1"><FileText size={12}/> .PDF</span>
            <span className="flex items-center gap-1"><FileImage size={12}/> .PNG</span>
          </div>
        </>
      )}
    </div>
  );
};
