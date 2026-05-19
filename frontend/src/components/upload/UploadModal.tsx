import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, File, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { graphApi } from '../../services/api';
import { Card } from '../ui/Card';

export default function UploadModal() {
  const { isUploadModalOpen, setUploadModalOpen, addUploadedPaper, setGraphData } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waitForGraphRefresh = async (retries = 5, intervalMs = 2000) => {
    for (let attempt = 0; attempt < retries; attempt += 1) {
      try {
        const result = await graphApi.fetchGraph();
        const nodes = result.results.nodes || [];
        const links = result.results.links || [];

        if (nodes.length > 0 || links.length > 0) {
          setGraphData({ nodes, links });
          return true;
        }
      } catch (err) {
        console.warn('Graph refresh attempt failed', err);
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return false;
  };

  if (!isUploadModalOpen) return null;

  const handleClose = () => {
    setUploadModalOpen(false);
    setFile(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a PDF file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else if (selectedFile) {
      setError('Please upload a PDF file.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      await graphApi.uploadPaper(file);
      addUploadedPaper({ name: file.name, date: new Date().toISOString() });
      handleClose();

      const refreshed = await waitForGraphRefresh();
      if (!refreshed) {
        console.warn('Graph data not available yet after upload. It may still be processing in the backend.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || 'Failed to upload paper');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
        >
          <Card className="w-full max-w-md bg-surface-color border-border-color shadow-2xl p-6 relative">
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-textSecondary hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-semibold mb-6">Upload Research Paper</h2>

            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                file ? 'border-primary-color bg-primary-color/5' : 'border-border-color hover:border-accent hover:bg-white/5'
              }`}
            >
              <input 
                type="file" 
                accept="application/pdf"
                className="hidden" 
                id="file-upload" 
                onChange={handleFileChange}
              />
              
              {!file ? (
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <UploadCloud size={48} className="text-accent mb-4" />
                  <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-textSecondary">PDF files only</p>
                </label>
              ) : (
                <div className="flex flex-col items-center">
                  <File size={48} className="text-primary-color mb-4" />
                  <p className="text-sm font-medium text-white mb-2">{file.name}</p>
                  <p className="text-xs text-textSecondary mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <label htmlFor="file-upload" className="text-xs text-accent cursor-pointer hover:underline">
                    Select a different file
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                className="gap-2 min-w-[100px]"
              >
                {isUploading ? (
                  <><Loader2 size={16} className="animate-spin" /> Uploading</>
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
