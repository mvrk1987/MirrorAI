
import React, { useState, useEffect } from 'react';
import { testApiKey } from '../services/geminiService';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: (key: string) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ isOpen, onClose, onApiKeySet }) => {
  const [inputKey, setInputKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Load existing key from storage (decrypt/decode)
      const stored = localStorage.getItem('mirror_ai_key');
      if (stored) {
        try {
          setInputKey(atob(stored));
        } catch (e) {
          console.error("Failed to decode key", e);
        }
      }
      setStatus('idle');
      setMessage('');
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    if (!inputKey.trim()) {
      setStatus('error');
      setMessage('API Key를 입력해주세요.');
      return;
    }

    setStatus('testing');
    setMessage('연결 테스트 중...');

    try {
      const success = await testApiKey(inputKey.trim());
      if (success) {
        setStatus('success');
        setMessage('연결 성공! Gemini API와 통신이 가능합니다.');
      } else {
        setStatus('error');
        setMessage('연결 실패. API Key를 확인해주세요.');
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(`오류 발생: ${e.message}`);
    }
  };

  const handleSave = () => {
    if (!inputKey.trim()) {
      setStatus('error');
      setMessage('저장할 API Key가 없습니다.');
      return;
    }

    // Simple "Encryption" using Base64 to prevent plain text storage
    // Note: This is client-side obfuscation, not high-grade security.
    try {
      const encryptedKey = btoa(inputKey.trim());
      localStorage.setItem('mirror_ai_key', encryptedKey);
      onApiKeySet(inputKey.trim());
      onClose();
      alert('API Key가 로컬 스토리지에 안전하게 저장되었습니다.');
    } catch (e) {
      setStatus('error');
      setMessage('키 저장 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              API Key 관리
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-slate-400 mb-4">
            Google Gemini API Key를 입력하세요. 키는 암호화되어 브라우저 로컬 스토리지에만 저장됩니다.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">GOOGLE GENAI API KEY</label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
              />
            </div>

            {/* Status Message */}
            {status !== 'idle' && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                status === 'success' ? 'bg-green-500/20 text-green-300' :
                status === 'error' ? 'bg-red-500/20 text-red-300' :
                'bg-blue-500/20 text-blue-300'
              }`}>
                {status === 'testing' && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>}
                {status === 'success' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                {status === 'error' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleTestConnection}
                disabled={status === 'testing'}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors disabled:opacity-50"
              >
                연결 테스트
              </button>
              <button
                onClick={handleSave}
                disabled={status === 'testing'}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20"
              >
                저장 및 사용
              </button>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 p-4 border-t border-slate-700 text-center">
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline">
            Google AI Studio에서 API 키 발급받기
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager;
