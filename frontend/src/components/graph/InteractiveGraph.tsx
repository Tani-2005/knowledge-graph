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
  if (t.includes('type')) return 'var(--node-task)';
  if (t.includes('category')) return '#ffb86c';
  if (t.includes('order')) return '#8b5cf6';
  if (t.includes('person')) return '#22c55e';
  if (t.includes('product')) return '#38bdf8';
  return 'var(--node-default)';
};

const renderLinkLabel = (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
  const label = link.type || link.label || 'REL';
  const fontSize = 10 / globalScale;
  ctx.font = `${fontSize}px Sans-Serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, (link.source.x + link.target.x) / 2, (link.source.y + link.target.y) / 2 - 6);
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
        nodeLabel={(node: any) => `${node.type}: ${node.label}`}
        nodeColor={(node: any) => 
          selectedNode?.id === node.id 
            ? '#ffffff' 
            : getNodeColor(node.type)
        }
        nodeRelSize={8}
        linkColor={() => 'rgba(255,255,255,0.25)'}
        linkWidth={(link: any) => (selectedNode && (selectedNode.id === link.source.id || selectedNode.id === link.target.id) ? 2 : 1)}
        linkDirectionalArrowLength={8}
        linkDirectionalArrowRelPos={1}
        linkLabel={(link: any) => link.type || link.label || 'RELATED_TO'}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.label || node.id;
          const fontSize = 12 / globalScale;
          const isSelected = selectedNode?.id === node.id;
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, isSelected ? 7 : 6, 0, 2 * Math.PI, false);
          ctx.fillStyle = isSelected ? '#ffffff' : getNodeColor(node.type);
          ctx.fill();
          
          if (isSelected) {
            ctx.lineWidth = 2 / globalScale;
            ctx.strokeStyle = '#06b6d4';
            ctx.stroke();
          }

          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(label, node.x, node.y + 10);
        }}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={(link: any, ctx, globalScale) => {
          const start = link.source;
          const end = link.target;
          if (typeof start !== 'object' || typeof end !== 'object') return;
          renderLinkLabel(link, ctx, globalScale);
        }}
      />
    </div>
  );
}
