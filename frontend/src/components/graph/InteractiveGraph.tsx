import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useAppStore } from '../../store/useAppStore';
import type { NodeData } from '../../store/useAppStore';

const getNodeColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('model')) return 'var(--node-model)';
  if (t.includes('metric')) return 'var(--node-metric)';
  if (t.includes('task')) return 'var(--node-task)';
  if (t.includes('dataset')) return 'var(--node-dataset)';
  if (t.includes('paper')) return 'var(--node-paper)';
  return 'var(--node-default)';
};

export default function InteractiveGraph() {
  const graphRef = useRef<any>(null);
  const { graphData, setSelectedNode, selectedNode } = useAppStore();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Zoom to fit on initial load
  useEffect(() => {
    if (graphData.nodes.length > 0 && graphRef.current) {
      setTimeout(() => {
        graphRef.current?.zoomToFit(400, 50);
      }, 100);
    }
  }, [graphData]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node as NodeData);
    
    // Zoom to node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(8, 2000);
    }
  }, [setSelectedNode]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div className="w-full h-full bg-[#020617]">
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="label"
        nodeColor={(n: any) => 
          selectedNode?.id === n.id 
            ? '#ffffff' 
            : getNodeColor(n.type)
        }
        nodeRelSize={6}
        linkColor={() => 'rgba(255,255,255,0.2)'}
        linkWidth={1}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.label || node.id;
          const fontSize = 12 / globalScale;
          const isSelected = selectedNode?.id === node.id;
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, isSelected ? 6 : 5, 0, 2 * Math.PI, false);
          ctx.fillStyle = isSelected ? '#ffffff' : getNodeColor(node.type);
          ctx.fill();
          
          if (isSelected) {
            ctx.lineWidth = 2 / globalScale;
            ctx.strokeStyle = '#06b6d4';
            ctx.stroke();
          }

          if (globalScale > 1.5 || isSelected) {
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(label, node.x, node.y + (isSelected ? 10 : 8));
          }
        }}
      />
    </div>
  );
}
