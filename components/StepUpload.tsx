import React, { useRef, useState } from 'react';

interface StepUploadProps {
  onImageSelected: (base64: string) => void;
}

const StepUpload: React.FC<StepUploadProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const cropToSquare = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageSrc); // Fallback if context fails
          return;
        }

        // Calculate the size of the square (use the smaller dimension)
        const size = Math.min(img.width, img.height);

        // Set canvas to the square size
        canvas.width = size;
        canvas.height = size;

        // Calculate the position to center the crop
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        // Draw the image cropped
        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

        // Convert back to base64
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => {
        resolve(imageSrc); // Fallback on error
      };
      img.src = imageSrc;
    });
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드해주세요.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // Increase limit slightly as we handle crop
      alert('파일 크기가 너무 큽니다. 10MB 이하의 이미지를 사용해주세요.');
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        try {
          // Auto-crop to 1:1
          const croppedImage = await cropToSquare(e.target.result);
          onImageSelected(croppedImage);
        } catch (error) {
          console.error("Image processing failed", error);
          alert("이미지 처리 중 오류가 발생했습니다.");
        } finally {
          setIsProcessing(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            얼굴 사진 업로드
          </h2>
          <p className="mt-2 text-slate-400">
            정확한 분석을 위해 정면에서 촬영된 선명한 사진을 업로드해주세요.<br/>
            <span className="text-xs text-slate-500">(이미지는 자동으로 1:1 비율로 조정됩니다)</span>
          </p>
        </div>

        <div 
          className={`border-2 border-dashed border-slate-600 rounded-3xl p-10 transition-all cursor-pointer group relative overflow-hidden
            ${isProcessing ? 'bg-slate-800 border-blue-500' : 'hover:border-blue-500 hover:bg-slate-800/50'}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
        >
          {isProcessing ? (
             <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-blue-400 font-medium">이미지 비율 조정 중...</p>
             </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-slate-200">클릭하여 업로드 또는 드래그 앤 드롭</p>
                <p className="text-sm text-slate-500">PNG, JPG (자동 1:1 크롭)</p>
              </div>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </div>

        <div className="mt-8 p-5 bg-slate-800/30 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
          <p className="text-sm text-slate-400 leading-relaxed font-light text-justify break-keep">
            MirrorAi는 최첨단 AI 얼굴 분석 기술을 통해 나만의 고유한 아름다움을 정밀하게 진단하고, 
            체계적인 관리 솔루션을 제시하는 혁신적인 뷰티 분석 플랫폼입니다. 
            단순히 현재의 모습을 보는 것을 넘어, 잠재된 개선 가능성까지 예측하여 
            당신의 뷰티 여정을 완전히 새로운 차원으로 이끌어 드립니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepUpload;