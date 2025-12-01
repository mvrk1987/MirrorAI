
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StepUpload from './components/StepUpload';
import StepAnalysis from './components/StepAnalysis';
import StepResult from './components/StepResult';
import LoadingOverlay from './components/LoadingOverlay';
import ApiKeyManager from './components/ApiKeyManager';
import { AppState, AppStep, SkinAnalysis } from './types';
import { analyzeFaceImage, generateImprovedImage } from './services/geminiService';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [state, setState] = useState<AppState>({
    step: AppStep.UPLOAD,
    originalImage: null,
    analysisResult: null,
    generatedImage: null,
    isAnalyzing: false,
    isGenerating: false,
    error: null,
  });

  // 1. Check local storage for API Key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('mirror_ai_key');
    if (storedKey) {
      try {
        // Simple decryption (Base64 decode)
        setApiKey(atob(storedKey));
      } catch (e) {
        console.error("Failed to restore API key");
      }
    }
  }, []);

  const handleApiKeySet = (key: string) => {
    setApiKey(key);
  };

  const handleImageSelected = async (base64: string) => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setState(prev => ({ ...prev, originalImage: base64, isAnalyzing: true, error: null }));
    
    try {
      const result: SkinAnalysis = await analyzeFaceImage(base64, apiKey);
      setState(prev => ({
        ...prev,
        step: AppStep.ANALYSIS,
        analysisResult: result,
        isAnalyzing: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error.message || "이미지 분석에 실패했습니다."
      }));
    }
  };

  const handleGenerate = async () => {
    if (!state.originalImage || !state.analysisResult || !apiKey) return;
    
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const generatedImage = await generateImprovedImage(state.originalImage, state.analysisResult, apiKey);
      setState(prev => ({
        ...prev,
        step: AppStep.RESULT,
        generatedImage,
        isGenerating: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error.message || "이미지 생성에 실패했습니다."
      }));
    }
  };

  const handleReset = () => {
    setState({
      step: AppStep.UPLOAD,
      originalImage: null,
      analysisResult: null,
      generatedImage: null,
      isAnalyzing: false,
      isGenerating: false,
      error: null,
    });
  };

  // 2. Landing View if no API Key
  if (!apiKey) {
    return (
      <div className="min-h-screen bg-[#4A4A4A] text-slate-200 font-sans">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
          <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg">
               <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
               </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Mirror<span className="text-blue-400">AI</span> 시작하기</h1>
            <p className="text-slate-400 mb-8">
              고품질 얼굴 분석 서비스를 이용하려면<br/>Google Gemini API 키가 필요합니다.
            </p>
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/25 mb-4"
            >
              API Key 설정하기
            </button>
            
            <p className="text-xs text-slate-500">
              * 설정한 키는 브라우저에 안전하게 저장됩니다.
            </p>
          </div>
        </div>
        <ApiKeyManager 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          onApiKeySet={handleApiKeySet}
        />
        <footer className="py-8 text-center text-slate-600 text-sm">
          <p>© 2025 MirrorAI. Powered by MVRK.</p>
        </footer>
      </div>
    );
  }

  // 3. Main Application View (Key Exists)
  return (
    <div className="min-h-screen bg-[#4A4A4A] text-slate-200 font-sans selection:bg-blue-500/30">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Notification */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 flex justify-between items-center animate-fade-in">
            <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {state.error}
            </span>
            <button 
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              className="text-sm font-bold hover:text-white bg-red-500/20 px-3 py-1 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {state.isAnalyzing && <LoadingOverlay message="얼굴 구조 및 피부 상태 분석 중..." />}

        {/* Step 1: Upload */}
        {state.step === AppStep.UPLOAD && (
          <StepUpload onImageSelected={handleImageSelected} />
        )}

        {/* Step 2: Analysis */}
        {state.step === AppStep.ANALYSIS && state.originalImage && (
          <StepAnalysis 
            image={state.originalImage} 
            analysis={state.analysisResult}
            onGenerate={handleGenerate}
            isGenerating={state.isGenerating}
          />
        )}

        {/* Step 3: Result */}
        {state.step === AppStep.RESULT && state.originalImage && state.generatedImage && (
          <StepResult 
            originalImage={state.originalImage}
            generatedImage={state.generatedImage}
            onReset={handleReset}
          />
        )}
      </main>
      
      <ApiKeyManager 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onApiKeySet={handleApiKeySet}
      />

      <footer className="py-8 text-center ext-[#B8AFA6] text-sm">
        <p>© 2025 MirrorAI. Powered by MVRK.</p>
      </footer>
    </div>
  );
};

export default App;
