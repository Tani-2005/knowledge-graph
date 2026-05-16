import { X, Hash, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function NodeDetailsPanel() {
  const { selectedNode, setRightPanelOpen, setSelectedNode } = useAppStore();

  if (!selectedNode) return null;

  const closePanel = () => {
    setRightPanelOpen(false);
    setSelectedNode(null);
  };

  const skipKeys = ['id', 'label', 'type', 'x', 'y', 'vx', 'vy', 'index'];
  const properties = Object.entries(selectedNode).filter(([key]) => !skipKeys.includes(key));

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-color">
        <h2 className="font-semibold text-lg truncate pr-4 text-white">Node Details</h2>
        <button 
          onClick={closePanel}
          className="p-1.5 rounded-md hover:bg-white/10 text-textSecondary hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        
        {/* Main Info */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium w-fit">
            <Hash size={12} />
            {selectedNode.type}
          </div>
          <h1 className="text-2xl font-bold text-white break-words mt-1">
            {selectedNode.label}
          </h1>
          <p className="text-sm text-textSecondary mt-2">
            ID: <span className="font-mono text-xs text-textSecondary bg-black/20 px-1 rounded">{selectedNode.id}</span>
          </p>
        </div>

        {/* Properties */}
        {properties.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-textSecondary uppercase tracking-wider flex items-center gap-2">
              <Info size={14} /> Properties
            </h3>
            <div className="flex flex-col gap-2">
              {properties.map(([key, value]) => (
                <div key={key} className="p-3 bg-black/20 rounded-lg border border-border-color/50">
                  <div className="text-xs text-textSecondary mb-1 font-medium">{key}</div>
                  <div className="text-sm text-white break-words">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
