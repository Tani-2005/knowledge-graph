import { useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import InteractiveGraph from '../components/graph/InteractiveGraph';
import ChatInterface from '../components/chat/ChatInterface';
import NodeDetailsPanel from '../components/graph/NodeDetailsPanel';
import UploadModal from '../components/upload/UploadModal';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const { setGraphData } = useAppStore();

  useEffect(() => {
    // Optionally fetch initial graph data
    const fetchInitialGraph = async () => {
      try {
        // Uncomment when backend has /graph endpoint ready
        // const data = await graphApi.fetchGraph();
        // setGraphData(data);
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
