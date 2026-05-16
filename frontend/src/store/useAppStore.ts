import { create } from 'zustand';

export interface NodeData {
  id: string;
  label: string;
  type: string;
  [key: string]: any;
}

export interface LinkData {
  source: string;
  target: string;
  type: string;
  [key: string]: any;
}

export interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cypher?: string;
}

interface AppState {
  // Graph State
  graphData: GraphData;
  setGraphData: (data: GraphData) => void;
  selectedNode: NodeData | null;
  setSelectedNode: (node: NodeData | null) => void;
  isGraphLoading: boolean;
  setIsGraphLoading: (loading: boolean) => void;

  // Chat State
  messages: Message[];
  addMessage: (msg: Message) => void;
  isChatLoading: boolean;
  setIsChatLoading: (loading: boolean) => void;

  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isRightPanelOpen: boolean;
  setRightPanelOpen: (isOpen: boolean) => void;
  isUploadModalOpen: boolean;
  setUploadModalOpen: (isOpen: boolean) => void;
  
  // Data
  uploadedPapers: any[];
  addUploadedPaper: (paper: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Graph State
  graphData: { nodes: [], links: [] },
  setGraphData: (data) => set({ graphData: data }),
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node, isRightPanelOpen: !!node }),
  isGraphLoading: false,
  setIsGraphLoading: (loading) => set({ isGraphLoading: loading }),

  // Chat State
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  isChatLoading: false,
  setIsChatLoading: (loading) => set({ isChatLoading: loading }),

  // UI State
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  isRightPanelOpen: false,
  setRightPanelOpen: (isOpen) => set({ isRightPanelOpen: isOpen }),
  isUploadModalOpen: false,
  setUploadModalOpen: (isOpen) => set({ isUploadModalOpen: isOpen }),

  // Data
  uploadedPapers: [],
  addUploadedPaper: (paper) => set((state) => ({ uploadedPapers: [...state.uploadedPapers, paper] })),
}));
