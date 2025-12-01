export enum AppStep {
  UPLOAD = 0,
  ANALYSIS = 1,
  RESULT = 2
}

export interface SkinAnalysis {
  asymmetryScore: number; // 0 to 100, where 100 is perfect symmetry
  asymmetryDescription: string;
  tiltAngle: number; // Estimated tilt in degrees
  faceBox?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
  skinConditions: {
    condition: string;
    severity: 'Mild' | 'Moderate' | 'Severe' | '보통' | '심함' | '매우 심함';
    description: string;
  }[];
  overallScore: number;
}

export interface AppState {
  step: AppStep;
  originalImage: string | null; // Base64
  analysisResult: SkinAnalysis | null;
  generatedImage: string | null; // Base64
  isAnalyzing: boolean;
  isGenerating: boolean;
  error: string | null;
}