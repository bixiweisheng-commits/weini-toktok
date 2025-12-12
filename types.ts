export interface SceneAnalysis {
  timestamp: string;
  visualDescription: string;
  hookType: string;
  soraPrompt: string;
  audioDescription: string; // New: Tone and Spoken content
}

export interface ViralScoreBreakdown {
  hookStrength: number; // 黄金3秒吸引力
  pacing: number;       // 节奏感
  painPoint: number;    // 痛点直击度
  callToAction: number; // 转化话术
}

export interface AnalysisResult {
  title: string;
  videoSummary: string; // New: High-level story summary
  viralScore: number;
  viralScoreBreakdown: ViralScoreBreakdown;
  transcript: string;
  rewrittenScriptCN: string; // 中文改写
  rewrittenScriptEN: string; // 英文改写
  structure: SceneAnalysis[];
  marketingStrategy: string;
  consolidatedSoraPrompt: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}