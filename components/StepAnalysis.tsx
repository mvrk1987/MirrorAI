import React, { useRef, useState } from 'react';
import { SkinAnalysis } from '../types';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface StepAnalysisProps {
  image: string;
  analysis: SkinAnalysis | null;
  onGenerate: () => void;
  isGenerating: boolean;
}

const StepAnalysis: React.FC<StepAnalysisProps> = ({ image, analysis, onGenerate, isGenerating }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!analysis) return null;

  // Use tilt angle to rotate the mesh/grid slightly to visualize asymmetry
  const visualTilt = Math.max(-15, Math.min(15, analysis.tiltAngle));

  // Determine tilt description text
  const tiltDirection = analysis.tiltAngle > 0 ? "오른쪽" : "왼쪽";
  const tiltDescription = analysis.tiltAngle === 0 
    ? "완벽한 좌우 대칭입니다." 
    : `좌우대칭 구조로 봤을 경우 ${tiltDirection}으로 ${Math.abs(analysis.tiltAngle)}도 기울어짐`;

  // Calculate Face Box styles for Mesh
  const box = analysis.faceBox || { ymin: 100, xmin: 200, ymax: 900, xmax: 800 }; 
  
  const topPct = (box.ymin / 1000) * 100;
  const leftPct = (box.xmin / 1000) * 100;
  const widthPct = ((box.xmax - box.xmin) / 1000) * 100;
  const heightPct = ((box.ymax - box.ymin) / 1000) * 100;

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsDownloading(true);

    try {
        // Capture the element as a canvas
        const canvas = await html2canvas(printRef.current, {
            scale: 2, // Higher scale for better quality
            backgroundColor: '#1e293b', // Ensure background color matches app theme
            logging: false,
            useCORS: true 
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Title
        pdf.setFontSize(16);
        pdf.text("MirrorAI - Analysis Report", 10, 15);
        pdf.setFontSize(10);
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, 10, 22);

        // Add the captured image below the title
        pdf.addImage(imgData, 'PNG', 0, 30, pdfWidth, pdfHeight);

        pdf.save("MirrorAI_Analysis_Report.pdf");
    } catch (error) {
        console.error("PDF generation failed:", error);
        alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh] p-4 animate-fade-in">
      
      {/* Left Column: Visual Analysis */}
      <div className="flex-1 flex flex-col items-center justify-start">
        <h3 className="text-xl font-semibold mb-4 text-blue-300">얼굴 비대칭 분석 (Before)</h3>
        
        {/* Image Container - fits to image aspect ratio */}
        <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 border border-slate-700 bg-black">
          <img 
            src={image} 
            alt="Face Analysis" 
            className="w-full h-auto object-contain block" 
          />
          
          {/* Overlay Mesh - Restricted to Face Box */}
          <div 
            className="absolute border border-blue-400/30 rounded-[50%]"
            style={{
                top: `${topPct}%`,
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                transform: `rotate(${visualTilt}deg)`,
                boxShadow: 'inset 0 0 20px rgba(0, 255, 255, 0.2)'
            }}
          >
            {/* Inner Grid */}
            <div className="w-full h-full opacity-40 mix-blend-screen rounded-[50%] overflow-hidden">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="cyan" strokeWidth="0.5"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#smallGrid)" />
                    {/* Center Crosshair */}
                    <line x1="50" y1="0" x2="50" y2="100" stroke="red" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="yellow" strokeWidth="1" strokeDasharray="4" />
                </svg>
            </div>
          </div>

          {/* Angle Indicator Overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-red-500/50 flex items-center gap-2 shadow-lg z-10 whitespace-nowrap">
            <span className="text-xs text-slate-300">Tilt</span>
            <span className={`text-lg font-bold ${Math.abs(analysis.tiltAngle) > 1 ? 'text-red-400' : 'text-green-400'}`}>
              {analysis.tiltAngle}°
            </span>
          </div>
        </div>
        
        {/* Tilt Description Below Image */}
        <div className="mt-4 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-600 text-center shadow-lg max-w-md w-full">
             <p className="text-sm text-blue-200 font-medium">
                {tiltDescription}
             </p>
        </div>
      </div>

      {/* Right Column: Text Diagnosis & Action */}
      <div className="flex-1 space-y-6">
        {/* Analysis Report Card - Ref attached here for Screenshot */}
        <div ref={printRef} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">피부 및 대칭 진단</h3>
            <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 uppercase tracking-wider">종합 점수</span>
                <span className="text-2xl font-bold text-blue-400">{analysis.overallScore}/100</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Asymmetry Report */}
            <div className="bg-slate-900/50 p-4 rounded-xl border-l-4 border-purple-500">
              <h4 className="font-medium text-purple-300 mb-1">얼굴 대칭성</h4>
              <p className="text-sm text-slate-300">{analysis.asymmetryDescription}</p>
              <div className="mt-2 text-xs text-slate-500">대칭 점수: {analysis.asymmetryScore}/100</div>
            </div>

            {/* Conditions List */}
            <div className="space-y-2">
              <h4 className="font-medium text-slate-300 mb-2">상세 분석 내용</h4>
              {analysis.skinConditions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    item.severity === '심함' || item.severity === '매우 심함' ? 'bg-red-500' : 
                    item.severity === '보통' ? 'bg-orange-400' : 'bg-yellow-300'
                  }`} />
                  <div className="w-full">
                    <div className="flex justify-between items-center w-full">
                        <span className="font-medium text-slate-200">{item.condition}</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 border border-slate-600 px-2 py-0.5 rounded-full">{item.severity}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons: PDF Download & Generate */}
        <div className="sticky bottom-4 z-10 space-y-3">
          <button
             onClick={handleDownloadPDF}
             disabled={isDownloading}
             className="w-full py-3 px-4 rounded-xl font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 border border-slate-600 disabled:opacity-50"
          >
             {isDownloading ? (
               <span className="flex items-center gap-2">
                 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 PDF 생성 중...
               </span>
             ) : (
               <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                분석 결과 PDF 다운로드
               </>
             )}
          </button>
          
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transform transition-all 
              ${isGenerating 
                ? 'bg-slate-700 cursor-not-allowed opacity-80' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-[1.02] active:scale-[0.98] shadow-blue-500/20'
              } text-white flex items-center justify-center gap-3`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                개선된 After 결과 생성 중...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                After 결과 보기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepAnalysis;