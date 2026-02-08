import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EvidenceDrop } from '../components/EvidenceDrop';
import { KnowledgeGraph } from '../components/KnowledgeGraph';
import { EvidenceSidebar } from '../components/EvidenceSidebar';
import { TimelineView } from '../components/TimelineView';
import { ChatInterface } from '../components/ChatInterface';
import { NodeInspector } from '../components/NodeInspector';
import { processEvidenceFiles } from '../services/geminiService';
import { EvidenceFile, GraphData, GraphNode, GraphLink, ProcessingStatus } from '../types';
import { FILE_COLORS } from '../constants';
import { Layout, Calendar, Network, Search, Menu, Zap, Fingerprint, MessageSquareText, PlusCircle, LogOut, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // --- State ---
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [status, setStatus] = useState<ProcessingStatus>({ isProcessing: false, message: '' });
  const [viewMode, setViewMode] = useState<'graph' | 'dual'>('graph');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Resize handling for graph
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDims = () => {
      if (graphContainerRef.current) {
        setGraphDimensions({
          width: graphContainerRef.current.offsetWidth,
          height: graphContainerRef.current.offsetHeight
        });
      }
    };
    window.addEventListener('resize', updateDims);
    updateDims();
    setTimeout(updateDims, 100); 
    return () => window.removeEventListener('resize', updateDims);
  }, [viewMode, files.length, isChatOpen]);

  // --- Handlers ---
  const handleFilesAdded = async (newFiles: File[]) => {
    setStatus({ isProcessing: true, message: 'Ingesting evidence...' });

    const addedEvidenceFiles: EvidenceFile[] = newFiles.map((f, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name,
      type: f.type.startsWith('image') ? 'image' : f.type.startsWith('audio') ? 'audio' : f.type === 'application/pdf' ? 'pdf' : 'video',
      status: 'processing',
      color: FILE_COLORS[(files.length + i) % FILE_COLORS.length]
    }));

    setFiles(prev => [...prev, ...addedEvidenceFiles]);

    try {
      const newGraphData = await processEvidenceFiles(newFiles);

      setGraphData(prev => {
        const existingNodeIds = new Set(prev.nodes.map(n => n.id));
        const uniqueNewNodes = newGraphData.nodes.filter(n => !existingNodeIds.has(n.id));
        
        const existingLinkKeys = new Set(prev.links.map(l => {
             const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
             const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
             return `${s}-${t}`;
        }));
        
        const uniqueNewLinks = newGraphData.links.filter(l => !existingLinkKeys.has(`${l.source}-${l.target}`));

        return {
          nodes: [...prev.nodes, ...uniqueNewNodes],
          links: [...prev.links, ...uniqueNewLinks]
        };
      });

      setFiles(prev => prev.map(f => 
        addedEvidenceFiles.find(af => af.id === f.id) ? { ...f, status: 'processed' } : f
      ));

      setStatus({ isProcessing: false, message: '' });

    } catch (error) {
      console.error(error);
      setFiles(prev => prev.map(f => 
        addedEvidenceFiles.find(af => af.id === f.id) ? { ...f, status: 'error' } : f
      ));
      setStatus({ isProcessing: false, message: 'Failed to process evidence.' });
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    setHighlightedNodeId(node.id);
    setSelectedNode(node);
  };

  const handleTimelineEventClick = (nodeId: string) => {
    setHighlightedNodeId(nodeId);
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (node) setSelectedNode(node);
  };

  // --- Node & Link Management ---

  const handleAddNode = (newNode?: GraphNode) => {
    // Calculate centroid of existing graph to place new node nearby
    let initialX = 0;
    let initialY = 0;
    
    if (graphData.nodes.length > 0) {
       const sumX = graphData.nodes.reduce((sum, n) => sum + (n.x || 0), 0);
       const sumY = graphData.nodes.reduce((sum, n) => sum + (n.y || 0), 0);
       initialX = sumX / graphData.nodes.length;
       initialY = sumY / graphData.nodes.length;
       
       // Add offset (random angle, distance ~50) to prevent overlap
       const angle = Math.random() * Math.PI * 2;
       const radius = 50;
       initialX += Math.cos(angle) * radius;
       initialY += Math.sin(angle) * radius;
    }

    const nodeToAdd: GraphNode = newNode ? { ...newNode, x: initialX, y: initialY } : {
      id: `manual-${Date.now()}`,
      label: "New Node",
      type: "ENTITY",
      x: initialX,
      y: initialY,
      properties: {
        created_at: new Date().toISOString(),
        note: "Manually created"
      }
    };
    
    setGraphData(prev => ({
      nodes: [...prev.nodes, nodeToAdd],
      links: [...prev.links] 
    }));
    
    setHighlightedNodeId(nodeToAdd.id);
    setSelectedNode(nodeToAdd);
  };

  const handleUpdateNode = (updatedNode: GraphNode) => {
    setGraphData(prev => ({
      nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n),
      links: [...prev.links]
    }));
    setSelectedNode(updatedNode);
  };

  const handleDeleteNode = (nodeId: string) => {
    setGraphData(prev => {
      // Filter links that are connected to this node
      const remainingLinks = prev.links.filter(l => {
        // Handle D3 object references or string IDs
        const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return sId !== nodeId && tId !== nodeId;
      });

      return {
        nodes: prev.nodes.filter(n => n.id !== nodeId),
        links: remainingLinks
      };
    });
    
    setSelectedNode(null);
    setHighlightedNodeId(null);
  };

  const handleAddLink = (sourceId: string, targetId: string, label: string) => {
    const newLink: GraphLink = {
      source: sourceId,
      target: targetId,
      label: label
    };
    setGraphData(prev => ({
      nodes: [...prev.nodes],
      links: [...prev.links, newLink]
    }));
  };

  const handleRemoveSpecificLink = (link: GraphLink) => {
    setGraphData(prev => ({
      nodes: [...prev.nodes],
      links: prev.links.filter(l => l !== link)
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-800/50 glass-strong flex items-center justify-between px-6 z-20 shadow-lg relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 via-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg p-2">
            <Fingerprint className="text-white w-full h-full" />
          </div>
          <div>
             <h1 className="font-bold text-xl tracking-tight text-white">SOLARIS <span className="text-cyan-400 font-light">FORENSIC</span></h1>
             <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase opacity-80">Gemini 3 Pro Intelligence Module</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex glass p-1 rounded-lg border border-white/20">
             <button 
               onClick={() => setViewMode('graph')}
               className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'graph' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
               <Network size={16} /> Graph
             </button>
             <button 
               onClick={() => setViewMode('dual')}
               className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'dual' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
               <Calendar size={16} /> Timeline
             </button>
           </div>
           
           <button 
             onClick={() => handleAddNode()}
             className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 hover:bg-slate-900 transition-all"
             title="Create New Node"
           >
             <PlusCircle size={18} />
             <span className="text-sm font-medium hidden lg:inline">Add Node</span>
           </button>

           <button 
             onClick={() => setIsChatOpen(!isChatOpen)}
             className={`
               flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
               ${isChatOpen 
                 ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]' 
                 : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
               }
             `}
           >
             <MessageSquareText size={18} />
             <span className="font-medium hidden sm:inline">Assistant</span>
           </button>

           {/* User Menu */}
           <div className="relative">
             <button
               onClick={() => setShowUserMenu(!showUserMenu)}
               className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-white/20 hover:bg-white/10 text-white transition-all"
             >
               <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                 <span className="text-white text-sm font-semibold">
                   {user?.username?.[0]?.toUpperCase()}
                 </span>
               </div>
               <span className="text-sm font-medium hidden md:inline">{user?.username}</span>
             </button>

             {showUserMenu && (
               <div className="absolute right-0 mt-2 w-48 glass-strong border border-white/20 rounded-lg shadow-xl py-2 z-50 backdrop-blur-xl">
                 <div className="px-4 py-2 border-b border-white/10">
                   <p className="text-sm font-medium text-white">{user?.username}</p>
                   <p className="text-xs text-white/60 truncate">{user?.email}</p>
                 </div>
                 <button
                   onClick={() => {
                     signOut();
                     setShowUserMenu(false);
                   }}
                   className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 hover:text-red-400 transition-colors flex items-center gap-2"
                 >
                   <LogOut size={16} />
                   Sign Out
                 </button>
               </div>
             )}
           </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar (Evidence) */}
        <aside className="w-80 flex flex-col p-4 border-r border-slate-800/50 glass z-10 gap-4 flex-shrink-0">
          <EvidenceDrop onFilesAdded={handleFilesAdded} isProcessing={status.isProcessing} />
          <EvidenceSidebar files={files} selectedFileId={selectedFileId} onFileSelect={setSelectedFileId} />
        </aside>

        {/* Center/Right Content */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Main Visualization Area */}
          <div className="flex-1 flex overflow-hidden p-4 gap-4">
            
            {/* Graph Container */}
            <div 
              ref={graphContainerRef} 
              className={`flex-1 transition-all duration-500 ease-in-out h-full relative ${viewMode === 'dual' ? 'w-1/2' : 'w-full'}`}
            >
              {graphData.nodes.length > 0 ? (
                <KnowledgeGraph 
                  data={graphData} 
                  width={graphDimensions.width} 
                  height={graphDimensions.height}
                  selectedFileId={selectedFileId}
                  files={files}
                  highlightedNodeId={highlightedNodeId}
                  onNodeClick={handleNodeClick}
                />
              ) : (
                <div className="w-full h-full rounded-xl border border-slate-800 bg-slate-900/20 flex flex-col items-center justify-center text-slate-600 relative group">
                  <Network size={48} className="mb-4 opacity-20" />
                  <p>Upload evidence or create a node manually.</p>
                  <button 
                    onClick={() => handleAddNode()}
                    className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-sm transition-colors border border-slate-700"
                  >
                    Start Manually
                  </button>
                </div>
              )}

               {/* Inspector/Editor Component */}
               <NodeInspector 
                 node={selectedNode}
                 allNodes={graphData.nodes}
                 allLinks={graphData.links}
                 availableFiles={files}
                 onClose={() => setSelectedNode(null)}
                 onSave={handleUpdateNode}
                 onDelete={handleDeleteNode}
                 onAddLink={handleAddLink}
                 onRemoveLink={handleRemoveSpecificLink}
               />
            </div>

            {/* Timeline Pane (Conditional) */}
            {viewMode === 'dual' && (
               <div className="w-[400px] bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 fade-in flex-shrink-0">
                  <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                      <Calendar size={16} className="text-cyan-400"/> Temporal Log
                    </h2>
                  </div>
                  <div className="flex-1 overflow-hidden p-2">
                    <TimelineView 
                      nodes={graphData.nodes} 
                      selectedFileId={selectedFileId} 
                      files={files}
                      highlightedNodeId={highlightedNodeId}
                      onEventClick={handleTimelineEventClick}
                    />
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* Chat Interface Overlay */}
        <ChatInterface 
          files={files} 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          onNodeCreate={(n) => handleAddNode(n)}
        />
      </main>
    </div>
  );
};

export default Dashboard;
