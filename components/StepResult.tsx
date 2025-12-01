import React, { useState } from 'react';

interface StepResultProps {
  originalImage: string;
  generatedImage: string;
  onReset: () => void;
}

const StepResult: React.FC<StepResultProps> = ({ originalImage, generatedImage, onReset }) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'mirror-ai-enhanced.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center min-h-[70vh] p-4 animate-fade-in space-y-8">
      
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          개선 완료 (After)
        </h2>
        <p className="text-slate-400">슬라이더를 움직여 Before & After를 비교해보세요</p>
      </div>

      {/* Comparison Slider Container */}
      <div className="relative w-full max-w-2xl aspect-[3/4] md:aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/20 border border-slate-700 select-none bg-black">
        
        {/* Background (After) */}
        <img 
          src={generatedImage} 
          alt="After" 
          className="absolute inset-0 w-full h-full object-contain"
        />
        <div className="absolute top-4 right-4 bg-green-500/80 backdrop-blur px-3 py-1 rounded text-xs font-bold text-white z-10">
          AFTER
        </div>

        {/* Foreground (Before) - Clip Path based on slider */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%`, borderRight: '2px solid white' }}
        >
          <div className="absolute inset-0 w-[100vw] max-w-2xl h-full"> 
             <img 
                src={originalImage}
                alt="Before"
                className="h-full object-contain"
                style={{ width: '100%', maxWidth: 'none', objectPosition: 'left' }}
             />
           </div>
        </div>
        
        <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur px-3 py-1 rounded text-xs font-bold text-white z-10">
          BEFORE
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute inset-y-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center -ml-0.5">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
            </svg>
          </div>
        </div>

        {/* Invisible Range Input for Interaction */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={handleDownload}
          className="flex-1 bg-white text-slate-900 font-bold py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          결과 이미지 다운로드
        </button>
        
        <button
          onClick={onReset}
          className="flex-1 border border-slate-600 text-slate-300 font-semibold py-3 px-6 rounded-xl hover:bg-slate-800 transition-colors"
        >
          다른 사진 분석하기
        </button>
      </div>
    </div>
  );
};

export default StepResult;
