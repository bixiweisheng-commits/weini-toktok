import React, { useRef, useState } from 'react';
import { ImagePlus, X, Box } from 'lucide-react';

interface ProductInputProps {
  onImageSelect: (file: File | null) => void;
  onDescriptionChange: (text: string) => void;
  description: string;
}

const ProductInput: React.FC<ProductInputProps> = ({ onImageSelect, onDescriptionChange, description }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      onImageSelect(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    onImageSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Box className="w-5 h-5 text-cyan-400" />
        您的产品信息 (Your Product)
      </h3>
      
      <div className="space-y-4">
        {/* Description Input */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">产品描述 (Description)</label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="例如：一款磁吸充电宝，能够吸附在iPhone背面，轻薄黑色，带有数字显示屏..."
            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 min-h-[100px] resize-none"
          />
        </div>

        {/* Image Input */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">产品图片 (作为 Sora 生成参考)</label>
          
          {!selectedImage ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#27272a] hover:border-cyan-500/50 bg-[#09090b] hover:bg-[#121215] rounded-lg p-4 cursor-pointer transition-colors flex items-center justify-center gap-3"
            >
              <div className="bg-[#18181b] p-2 rounded-full">
                <ImagePlus className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-300 font-medium">上传产品照片</p>
                <p className="text-xs text-gray-500">将作为视频第一帧使用</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>
          ) : (
            <div className="relative group rounded-lg overflow-hidden border border-[#27272a] h-32 w-full bg-black">
              <img 
                src={URL.createObjectURL(selectedImage)} 
                alt="Product Preview" 
                className="w-full h-full object-contain opacity-80"
              />
              <button 
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/70 hover:bg-red-500/80 text-white p-1.5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs text-gray-300 truncate">
                {selectedImage.name}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductInput;