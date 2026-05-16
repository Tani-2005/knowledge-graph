import { motion } from 'framer-motion';
import { Network, Upload, FileText, Settings, Search } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar, setUploadModalOpen, uploadedPapers } = useAppStore();

  return (
    <motion.div
      initial={false}
      animate={{ 
        width: isSidebarOpen ? 280 : 64,
      }}
      className="h-full bg-surface-color border-r border-border-color flex flex-col backdrop-blur-md relative z-20 shrink-0 transition-all duration-300"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-color">
        {isSidebarOpen && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1.5 bg-primary-color rounded-lg shrink-0">
              <Network size={20} className="text-white" />
            </div>
            <span className="font-semibold text-lg whitespace-nowrap text-textPrimary tracking-tight">GraphRAG</span>
          </div>
        )}
        {!isSidebarOpen && (
          <div className="w-full flex justify-center">
            <div className="p-1.5 bg-primary-color rounded-lg cursor-pointer" onClick={toggleSidebar}>
              <Network size={20} className="text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-6">
        
        {/* Upload Button */}
        <div className="px-4">
          <Button 
            className="w-full justify-start gap-3 h-11" 
            variant="default"
            onClick={() => setUploadModalOpen(true)}
          >
            <Upload size={18} />
            {isSidebarOpen && <span>Upload Paper</span>}
          </Button>
        </div>

        {/* Search */}
        {isSidebarOpen && (
          <div className="px-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
              <Input placeholder="Search graph..." className="pl-9 bg-black/20 border-border-color" />
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="px-4 flex flex-col gap-2">
          {isSidebarOpen && (
            <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Documents</h3>
          )}
          
          {uploadedPapers.length === 0 ? (
            isSidebarOpen && <p className="text-sm text-textSecondary px-2">No papers uploaded yet.</p>
          ) : (
            uploadedPapers.map((paper, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer text-sm text-textSecondary hover:text-textPrimary transition-colors group">
                <FileText size={18} className="shrink-0 text-accent group-hover:text-primary-color" />
                {isSidebarOpen && <span className="truncate">{paper.name || 'Research Paper.pdf'}</span>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-color">
        <div className="flex items-center gap-3 text-textSecondary hover:text-textPrimary cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Settings size={20} />
          {isSidebarOpen && <span>Settings</span>}
        </div>
      </div>
    </motion.div>
  );
}
