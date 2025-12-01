import React from 'react';

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      <p className="mt-6 text-lg font-medium text-white animate-pulse text-center">{message}</p>
      <p className="mt-2 text-sm text-slate-400 text-center max-w-xs">AI가 얼굴 특징과 기하학적 구조를 스캔하고 있습니다...</p>
    </div>
  );
};

export default LoadingOverlay;
