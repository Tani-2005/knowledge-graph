import { useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import InteractiveGraph from '../components/graph/InteractiveGraph';
import ChatInterface from '../components/chat/ChatInterface';
import NodeDetailsPanel from '../components/graph/NodeDetailsPanel';
import UploadModal from '../components/upload/UploadModal';
import { graphApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const { setGraphData } = useAppStore();

  useEffect(() => {
    // Optionally fetch initial graph data
    const fetchInitialGraph = async () => {
      try {
        const data = await graphApi.fetchGraph();
        const results = data.results || {};
        const normalized = {
          nodes: results.nodes || [],
          links: results.links || results.relationships || [],
        };
        if (normalized.nodes.length > 0 || normalized.links.length > 0) {
          setGraphData(normalized);
        }
      } catch (error) {
        console.error('Failed to fetch initial graph:', error);
      }
    };
    
    fetchInitialGraph();
  }, [setGraphData]);

  return (
    <MainLayout
      graphComponent={<InteractiveGraph />}
      chatComponent={<ChatInterface />}
      rightPanelComponent={<NodeDetailsPanel />}
      uploadModalComponent={<UploadModal />}
    />
  );
}
