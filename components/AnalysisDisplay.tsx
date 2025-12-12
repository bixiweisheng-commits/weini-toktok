import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { Copy, Sparkles, MessageSquare, Video, Layers, Check, FileText, Volume2 } from 'lucide-react';

interface AnalysisDisplayProps {
  data: AnalysisResult;
}

// Simple Radar Chart Component
const RadarChart = ({ data }: { data: AnalysisResult['viralScoreBreakdown'] }) => {
  const size = 200;
  const center = size / 2;
  const radius = (size - 40) / 2;
  
  // Normalize scores to radius
  const normalize = (score: number) => (score / 100) * radius;

  // 4 Axes: Top, Right, Bottom, Left
  const metrics = [
    { key: 'hookStrength', label: '黄金3秒', angle: -90 }, // Top
    { key: 'pacing', label: '节奏感', angle: 0 },         // Right
    { key: 'callToAction', label: '转化话术', angle: 90 }, // Bottom
    { key: 'painPoint', label: '痛点直击', angle: 180 },   // Left
  ];

  const points = metrics.map((m) => {
    // @ts-ignore
    const r = normalize(data[m.key]);
    const x = center + r * Math.cos((m.angle * Math.PI) / 180);
    const y = center + r * Math.sin((m.angle * Math.PI) / 180);
    return `${x},${y}`;
  }).join(' ');

  const axisPoints = metrics.map((m) => {
    const r = radius;
    const x = center + r * Math.cos((m.angle * Math.PI) / 180);
    const y = center + r * Math.sin((m.angle * Math.PI) / 180);
    return { x, y, label: m.label, align: m.angle === -90 ? 'middle' : m.angle === 0 ? 'start' : m.angle === 90 ? 'middle' : 'end' };
  });

  return (
    <div className="flex justify-center items-center py-4 relative">
       <svg width={size + 100} height={size + 60} className="overflow-visible">
          {[0.25, 0.5, 0.75, 1].map((scale, i) => (
             <circle 
                key={i} 
                cx={center} 
                cy={center} 
                r={radius * scale} 
                fill="none" 
                stroke="#3f3f46" 
                strokeWidth="1" 
                strokeDasharray="4 4"
             />
          ))}
          {axisPoints.map((p, i) => (
             <line 
                key={i} 
                x1={center} 
                y1={center} 
                x2={p.x} 
                y2={p.y} 
                stroke="#3f3f46" 
                strokeWidth="1" 
             />
          ))}
          <polygon 
             points={points} 
             fill="rgba(6, 182, 212, 0.3)" 
             stroke="#06b6d4" 
             strokeWidth="2" 
          />
          {metrics.map((m, i) => {
             // @ts-ignore
             const r = normalize(data[m.key]);
             const x = center + r * Math.cos((m.angle * Math.PI) / 180);
             const y = center + r * Math.sin((m.angle * Math.PI) / 180);
             return <circle key={i} cx={x} cy={y} r="4" fill="#ffffff" />;
          })}
          {axisPoints.map((p, i) => (
            <text 
              key={i} 
              x={p.x + (p.align === 'start' ? 10 : p.align === 'end' ? -10 : 0)} 
              y={p.y + (i === 0 ? -10 : i === 2 ? 20 : 5)} 
              textAnchor={p.align} 
              fill="#9ca3af" 
              fontSize="12" 
              fontWeight="500"
            >
              {p.label}
            </text>
          ))}
       </svg>
    </div>
  );
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* 0. Video Summary */}
      <div className="bg-[#18181b] border border-[#27272a] p-6 rounded-xl relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-medium">视频概要 (Story Summary)</h3>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{data.videoSummary}</p>
          <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Video className="w-40 h-40 text-cyan-500" />
          </div>
      </div>

      {/* 1. Viral Score & Radar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#18181b] border border-[#27272a] p-6 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500"></div>
           <div className="text-center z-10">
              <span className="text-gray-400 text-sm font-medium uppercase tracking-widest">Viral Score</span>
              <div className="text-7xl font-bold text-white mt-2 mb-1 tracking-tighter">
                {data.viralScore}
              </div>
              <span className="text-gray-500 text-sm">/ 100 爆款指数</span>
           </div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-xl flex flex-col items-center justify-center">
           <RadarChart data={data.viralScoreBreakdown} />
        </div>
      </div>

      {/* 2. Strategy Text */}
      <div className="bg-[#18181b] border border-[#27272a] p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-medium">爆款逻辑拆解 (Strategy)</h3>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{data.marketingStrategy}</p>
      </div>

      {/* 3. Sora Prompt - LIST FORMAT */}
      <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]">
        <div className="p-4 border-b border-cyan-500/20 bg-cyan-900/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-cyan-100">Sora 2 分镜提示词 (Storyboard Prompt)</h3>
            </div>
            <button 
              onClick={() => copyToClipboard(data.consolidatedSoraPrompt, 'sora')}
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {copiedSection === 'sora' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedSection === 'sora' ? '已复制' : '复制提示词'}
            </button>
        </div>
        <div className="p-6">
            <div className="bg-[#09090b] rounded-lg p-5 border border-cyan-500/20 relative group">
                {/* Pre-wrap and specialized font for script reading */}
                <p className="text-cyan-100/90 text-sm leading-6 font-mono whitespace-pre-wrap select-all">
                    {data.consolidatedSoraPrompt}
                </p>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-yellow-500/80 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                 <div className="mt-0.5"><Sparkles className="w-3 h-3" /></div>
                 <span>
                    <strong>结构已优化：</strong> 提示词已包含 "Shot (Time) - Camera - Visual - Audio - Action"，确保画面与声音情绪同步。
                 </span>
            </div>
        </div>
      </div>

      {/* 4. Bilingual Rewritten Scripts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#18181b] border border-indigo-500/30 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-indigo-500/20 bg-indigo-500/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-red-500 text-white text-[10px] font-bold px-1 rounded">CN</div>
              <h3 className="font-semibold text-indigo-100">中文改写文案</h3>
            </div>
            <button 
              onClick={() => copyToClipboard(data.rewrittenScriptCN, 'cn')}
              className="text-xs text-indigo-300 hover:text-white transition-colors flex items-center gap-1"
            >
              {copiedSection === 'cn' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              复制
            </button>
          </div>
          <div className="p-4 text-gray-200 text-sm whitespace-pre-wrap flex-grow font-medium leading-relaxed">
            {data.rewrittenScriptCN}
          </div>
        </div>

        <div className="bg-[#18181b] border border-blue-500/30 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-blue-500/20 bg-blue-500/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white text-[10px] font-bold px-1 rounded">EN</div>
              <h3 className="font-semibold text-blue-100">英文改写文案 (For Global)</h3>
            </div>
            <button 
              onClick={() => copyToClipboard(data.rewrittenScriptEN, 'en')}
              className="text-xs text-blue-300 hover:text-white transition-colors flex items-center gap-1"
            >
              {copiedSection === 'en' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              Copy
            </button>
          </div>
          <div className="p-4 text-gray-200 text-sm whitespace-pre-wrap flex-grow font-medium leading-relaxed font-sans">
            {data.rewrittenScriptEN}
          </div>
        </div>
      </div>

      {/* 5. Structural Timeline */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-pink-500" />
          分镜结构拆解 (Shot Breakdown)
        </h3>
        
        <div className="space-y-3">
          {data.structure.map((scene, idx) => (
            <div key={idx} className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start group hover:border-gray-600 transition-colors">
               <div className="flex items-center gap-3 md:w-32 shrink-0">
                  <div className="bg-gray-800 rounded px-2 py-1 text-xs font-mono text-cyan-400 border border-gray-700 whitespace-nowrap">
                      {scene.timestamp}
                  </div>
               </div>
               
               <div className="flex-1 space-y-3">
                   <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-bold">
                        {scene.hookType}
                      </span>
                   </div>
                   
                   {/* Visual */}
                   <div className="flex gap-2">
                      <Video className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                          <span className="text-xs text-gray-500 uppercase font-bold">画面 (Visual):</span>
                          <p className="text-gray-300 text-sm">{scene.visualDescription}</p>
                      </div>
                   </div>

                   {/* Audio */}
                   <div className="flex gap-2 bg-[#09090b] p-2 rounded border border-[#27272a]/50">
                      <Volume2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                          <span className="text-xs text-green-500/80 uppercase font-bold">语音/音效 (Audio):</span>
                          <p className="text-gray-300 text-sm font-medium">{scene.audioDescription}</p>
                      </div>
                   </div>

                   <p className="text-gray-500 text-xs font-mono pt-1 border-t border-gray-800">
                      Prompt Segment: {scene.soraPrompt}
                   </p>
               </div>
            </div>
          ))}
        </div>
      </div>
      
       {/* 6. Original Transcript (Bottom) */}
       <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden mt-8 opacity-60 hover:opacity-100 transition-opacity">
          <div className="p-3 border-b border-[#27272a] bg-[#27272a]/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-400">原始视频脚本参考</h3>
            </div>
            <button 
              onClick={() => copyToClipboard(data.transcript, 'orig')}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              复制
            </button>
          </div>
          <div className="p-4 text-gray-500 text-xs whitespace-pre-wrap">
            {data.transcript}
          </div>
      </div>
    </div>
  );
};

export default AnalysisDisplay;