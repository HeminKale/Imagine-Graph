
export interface GraphNode {
  id: string;
  label: string; // The text shown (e.g., "Mark", "Solaris Corp")
  type: 'ENTITY' | 'CONFLICT' | 'DISCREPANCY' | 'EVENT';
  group?: number; // For coloring by group
  val?: number; // Size
  x?: number;
  y?: number;
  z?: number;
  properties?: {
    name?: string;
    description?: string;
    timestamp?: string; // ISO date string or generic time
    source_file?: string;
    confidence?: number;
    [key: string]: any;
  };
}

export interface GraphLink {
  source: string | GraphNode; // Can be ID or Node object after d3 processing
  target: string | GraphNode; // Can be ID or Node object after d3 processing
  label: string; // Predicate (e.g., "OWNED_BY")
  properties?: {
    description?: string;
    confidence?: number;
    source_file?: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface EvidenceFile {
  id: string;
  file: File;
  name: string;
  type: 'audio' | 'image' | 'pdf' | 'video';
  status: 'idle' | 'processing' | 'processed' | 'error';
  color: string; // Assigned color for visualization
}

export interface ProcessingStatus {
  isProcessing: boolean;
  message: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCall?: {
    id: string;
    name: string;
    args: any;
  };
  toolStatus?: 'pending' | 'success' | 'rejected';
}
