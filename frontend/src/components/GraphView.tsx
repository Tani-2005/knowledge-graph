import { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface Node {
  id: string;
  label: string;
  type: string;
  color?: string;
  [key: string]: any;
}

interface Link {
  source: string;
  target: string;
  type: string;
  [key: string]: any;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface GraphViewProps {
  data: GraphData;
}

const colorMap: Record<string, string> = {
  Model: 'var(--node-model)',
  Metric: 'var(--node-metric)',
  Task: 'var(--node-task)',
};

export default function GraphView({ data }: GraphViewProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Recenter graph when data changes
  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current.d3Force('charge').strength(-400);
        fgRef.current.zoomToFit(400, 50);
      }, 100);
    }
  }, [data]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {data.nodes.length === 0 ? (
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          <p>No graph data to display. Ask a question to visualize relationships.</p>
        </div>
      ) : (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={data}
          nodeLabel={(node: any) => `${node.type}: ${node.label}`}
          nodeColor={(node: any) => colorMap[node.type] || 'var(--node-default)'}
          nodeRelSize={6}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkLabel={(link: any) => link.type}
          linkColor={() => 'var(--border-color)'}
          backgroundColor="transparent"
          // Add custom node drawing for beautiful labels
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.label;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color || colorMap[node.type] || 'var(--node-default)';
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'var(--text-primary)';
            ctx.fillText(label, node.x, node.y + 8);
          }}
        />
      )}
    </div>
  );
}
