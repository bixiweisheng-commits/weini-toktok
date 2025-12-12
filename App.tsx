import React, { useState, useEffect } from 'react';
import { AppState, AnalysisResult } from './types';
import { analyzeVideo } from './services/geminiService';
import VideoUpload from './components/VideoUpload';
import ProductInput from './components/ProductInput';
import AnalysisDisplay from './components/AnalysisDisplay';
import { Activity, Wand2, Zap, Download, KeyRound, Save, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Inputs
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productDescription, setProductDescription] = useState<string>('');
  
  const [error, setError] = useState<string | null>(null);

  // Load API key from local storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySaved(true);
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      alert("请输入有效的 API Key");
      return;
    }
    localStorage.setItem('gemini_api_key', apiKey);
    setIsKeySaved(true);
    alert("API Key 已保存");
  };

  const replaceApiKey = () => {
    if (window.confirm("确定要替换 API Key 吗？")) {
        setIsKeySaved(false);
        setApiKey(''); 
        localStorage.removeItem('gemini_api_key');
    }
  };

  const handleFileSelect = (file: File) => {
    setVideoFile(file);
    setAnalysisResult(null);
    setAppState(AppState.IDLE);
    setError(null);
  };

  const handleAnalyze = async () => {
    const currentKey = apiKey || localStorage.getItem('gemini_api_key');
    if (!currentKey) {
        setError("请在右上角输入您的 Google Gemini API Key 并点击保存按钮。");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    if (!videoFile) return;
    if (!productDescription) {
        setError("请输入产品描述 (Please provide a product description).");
        return;
    }

    setAppState(AppState.ANALYZING);
    setError(null);

    try {
      // Pass the user's API key explicitly
      const result = await analyzeVideo(currentKey, videoFile, productImage, productDescription);
      setAnalysisResult(result);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "分析失败。请确保API Key正确且视频格式支持。");
      setAppState(AppState.ERROR);
    }
  };

  const handleExport = () => {
    if (!analysisResult) return;
    
    // Construct HTML content for Word Doc
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Analysis Report</title>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; }
        h1 { color: #2E86C1; }
        h2 { color: #1F618D; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px; }
        .score { font-size: 24px; font-weight: bold; color: #E74C3C; }
        .prompt { background-color: #f4f4f4; padding: 10px; border-left: 5px solid #2E86C1; font-family: monospace; white-space: pre-wrap; }
        .script-box { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; background: #fafafa; }
        .summary-box { background: #eef7fa; padding: 15px; border-radius: 5px; border: 1px solid #bce0ec; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
        th { background-color: #f2f2f2; }
      </style>
      </head>
      <body>
        <h1>${analysisResult.title} - 爆款视频分析报告</h1>
        
        <p><strong>分析时间:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>爆款潜力指数:</strong> <span class="score">${analysisResult.viralScore}/100</span></p>
        
        <h2>1. 视频概要 (Video Summary)</h2>
        <div class="summary-box">
            <p>${analysisResult.videoSummary}</p>
        </div>

        <h3>维度得分:</h3>
        <ul>
            <li>黄金3秒: ${analysisResult.viralScoreBreakdown.hookStrength}</li>
            <li>节奏感: ${analysisResult.viralScoreBreakdown.pacing}</li>
            <li>痛点直击: ${analysisResult.viralScoreBreakdown.painPoint}</li>
            <li>转化话术: ${analysisResult.viralScoreBreakdown.callToAction}</li>
        </ul>

        <h2>2. 核心爆款策略 (Strategy)</h2>
        <p>${analysisResult.marketingStrategy}</p>

        <h2>3. 爆款脚本改写 (Scripts)</h2>
        <div class="script-box">
            <h3>中文版 (Chinese)</h3>
            <p>${analysisResult.rewrittenScriptCN.replace(/\n/g, '<br/>')}</p>
        </div>
        <div class="script-box">
            <h3>英文版 (English - for Global)</h3>
            <p>${analysisResult.rewrittenScriptEN.replace(/\n/g, '<br/>')}</p>
        </div>

        <h2>4. Sora 2 分镜提示词 (Shot-by-Shot Prompt)</h2>
        <p><em>格式：Shot [No.] (Time) - Camera - Visual - Audio - Action</em></p>
        <div class="prompt">
            ${analysisResult.consolidatedSoraPrompt}
        </div>

        <h2>5. 结构拆解 (Breakdown)</h2>
        <table>
            <tr>
                <th width="10%">时间 (Time)</th>
                <th width="10%">类型 (Type)</th>
                <th width="40%">视觉描述 (Visual)</th>
                <th width="40%">语音/语气 (Audio/Tone)</th>
            </tr>
            ${analysisResult.structure.map(s => `
                <tr>
                    <td>${s.timestamp}</td>
                    <td>${s.hookType}</td>
                    <td>${s.visualDescription}</td>
                    <td>${s.audioDescription}</td>
                </tr>
            `).join('')}
        </table>

        <h2>6. 原始参考脚本</h2>
        <p>${analysisResult.transcript.replace(/\n/g, '<br/>')}</p>
      </body>
      </html>
    `;
    
    // Create Blob with Word MIME type
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiktok_analysis_${new Date().toISOString().slice(0,10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-purple-600 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden md:block">TikTok<span className="text-cyan-400">爆款</span>分析器</h1>
            <h1 className="text-xl font-bold tracking-tight md:hidden">Viral<span className="text-cyan-400">Gen</span></h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* API Key Input Area */}
            <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-1 pr-2 transition-colors">
                <div className="p-1.5 bg-[#27272a] rounded mr-2">
                    <KeyRound className="w-4 h-4 text-gray-400" />
                </div>
                
                {isKeySaved ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400 font-mono flex items-center gap-1 font-medium bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                             ● Key已保存
                        </span>
                        <button 
                            onClick={replaceApiKey}
                            className="text-xs bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 px-3 py-1.5 rounded flex items-center gap-1 transition-colors border border-[#3f3f46]"
                        >
                            <RefreshCw className="w-3 h-3" /> 替换
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <input 
                            type="password" 
                            placeholder="输入 Gemini API Key" 
                            value={apiKey}
                            onChange={handleApiKeyChange}
                            className="bg-transparent border-none focus:outline-none text-xs text-white w-24 md:w-40 placeholder-gray-600"
                        />
                        <button 
                            onClick={saveApiKey}
                            className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors font-medium shadow-sm"
                        >
                            <Save className="w-3 h-3" /> 保存
                        </button>
                    </div>
                )}
            </div>

            {analysisResult && (
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 text-xs bg-[#27272a] hover:bg-[#3f3f46] text-white px-3 py-2 rounded-lg transition-colors border border-[#3f3f46]"
              >
                <Download className="w-3 h-3" />
                <span className="hidden md:inline">导出 Word</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-6">
                {/* 1. Video Upload */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="bg-gray-800 text-gray-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        上传参考视频 (Video)
                    </h2>
                    <VideoUpload 
                        onFileSelect={handleFileSelect} 
                        isLoading={appState === AppState.ANALYZING} 
                    />
                </div>

                {/* 2. Product Input */}
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                         <span className="bg-gray-800 text-gray-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                        输入产品信息 (Context)
                    </h2>
                    <ProductInput 
                        onImageSelect={setProductImage}
                        onDescriptionChange={setProductDescription}
                        description={productDescription}
                    />
                </div>

                {/* Action Button */}
                {videoFile && appState !== AppState.ANALYZING && appState !== AppState.SUCCESS && (
                    <button
                        onClick={handleAnalyze}
                        disabled={!productDescription}
                        className={`w-full font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group
                            ${productDescription 
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }
                        `}
                    >
                        <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        开始分析 & 改写
                    </button>
                )}

                {appState === AppState.ANALYZING && (
                    <div className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-8 flex flex-col items-center justify-center text-center animate-pulse">
                        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h3 className="text-white font-medium">正在分析与改写...</h3>
                        <p className="text-sm text-gray-500 mt-2">正在提取爆款结构，生成 Sora 分镜脚本。</p>
                    </div>
                )}

                 {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
            <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    分析结果 (Results)
                </h2>

                {appState === AppState.IDLE && !videoFile && (
                    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-12 text-center h-[600px] flex flex-col justify-center items-center">
                        <div className="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Activity className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">准备就绪 (Ready)</h3>
                        <p className="text-gray-400 max-w-md mx-auto">
                            1. 输入 API Key 并保存 <br/>
                            2. 上传爆款视频 <br/>
                            3. 我们将为您生成中英双语脚本和精确到镜头的 Sora 提示词。
                        </p>
                    </div>
                )}

                {analysisResult && <AnalysisDisplay data={analysisResult} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;