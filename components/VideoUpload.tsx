import React, { useRef, useState } from 'react';
import { UploadCloud, FileVideo, X } from 'lucide-react';

interface VideoUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onFileSelect, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert("请上传视频文件 (Please upload a video file).");
      return;
    }
    // Limit to 10MB to prevent RPC/XHR errors with Base64 encoding overhead
    if (file.size > 10 * 1024 * 1024) {
      alert("视频文件过大，请上传 10MB 以下的片段以确保分析成功。");
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (selectedFile) {
    return (
      <div className="w-full bg-[#18181b] rounded-xl border border-[#27272a] overflow-hidden">
        <div className="relative aspect-[9/16] max-h-[500px] w-full bg-black flex justify-center items-center">
             {/* Using video tag for local preview */}
             <video 
                src={URL.createObjectURL(selectedFile)} 
                controls 
                className="h-full w-full object-contain" 
             />
             <button 
                onClick={clearFile}
                disabled={isLoading}
                className="absolute top-4 right-4 bg-black/60 hover:bg-red-500/80 text-white p-2 rounded-full backdrop-blur-md transition-all z-10"
             >
                <X className="w-5 h-5" />
             </button>
        </div>
        <div className="p-4 border-t border-[#27272a] bg-[#18181b]">
            <p className="text-white font-medium truncate">{selectedFile.name}</p>
            <p className="text-gray-500 text-xs mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px]">
      <div 
        className={`h-full w-full rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 text-center cursor-pointer relative overflow-hidden group
          ${dragActive 
            ? "border-cyan-500 bg-cyan-500/10" 
            : "border-[#27272a] hover:border-gray-500 bg-[#18181b] hover:bg-[#1f1f22]"
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input 
            ref={inputRef}
            type="file" 
            className="hidden" 
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleChange}
        />
        
        <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
             <UploadCloud className="w-10 h-10 text-cyan-400" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">上传 TikTok 参考视频</h3>
        <p className="text-gray-400 text-sm max-w-xs mb-6">
            将爆款视频拖放到此处，或点击浏览。
        </p>
        
        <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><FileVideo className="w-3 h-3" /> MP4, MOV</span>
            <span>Max 10MB</span>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;