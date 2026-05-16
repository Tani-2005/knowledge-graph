import React from 'react';
import Sidebar from './Sidebar';
import { useAppStore } from '../../store/useAppStore';

interface MainLayoutProps {
  graphComponent: React.ReactNode;
  chatComponent: React.ReactNode;
  rightPanelComponent?: React.ReactNode;
  uploadModalComponent?: React.ReactNode;
}

export default function MainLayout({ 
  graphComponent, 
  chatComponent, 
  rightPanelComponent,
  uploadModalComponent 
}: MainLayoutProps) {
  const { isRightPanelOpen } = useAppStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-textPrimary">
      {/* Sidebar - Left */}
      <Sidebar />

      {/* Center - Main Content Area */}
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        
        {/* Full screen graph background */}
        <div className="absolute inset-0 z-0">
          {graphComponent}
        </div>

        {/* Content Overlay */}
        <div className="flex-1 pointer-events-none z-10 flex flex-col justify-end pb-6 px-6">
          {/* Chat Interface anchored to bottom */}
          <div className="pointer-events-auto w-full max-w-4xl mx-auto flex flex-col items-center">
            {chatComponent}
          </div>
        </div>

        {/* Right Panel */}
        {isRightPanelOpen && rightPanelComponent && (
          <div className="absolute top-0 right-0 h-full w-80 lg:w-96 border-l border-border-color bg-surface-color backdrop-blur-md shadow-2xl z-20 pointer-events-auto transform transition-transform duration-300">
            {rightPanelComponent}
          </div>
        )}
      </div>

      {/* Modals */}
      {uploadModalComponent}
    </div>
  );
}
