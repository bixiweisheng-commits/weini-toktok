import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Helper to convert file to base64 for inlineData
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export const analyzeVideo = async (
  apiKey: string,
  videoFile: File, 
  productImage: File | null, 
  productDescription: string
): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("请先在右上角输入您的 Google Gemini API Key。");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const parts: any[] = [];
  
  // 1. Add the viral video (Reference Structure)
  const videoPart = await fileToGenerativePart(videoFile);
  parts.push(videoPart);

  // 2. Add the product image (Visual Context) if available
  if (productImage) {
    const imagePart = await fileToGenerativePart(productImage);
    parts.push(imagePart);
  }

  const imageContextPrompt = productImage 
    ? "User has uploaded a product image. Use this EXACT visual reference for the 'Shot 1' start frame."
    : "User has NOT uploaded an image. You must construct the visual description purely based on the 'Product Description' provided.";

  const promptText = `
    You are an expert TikTok Dropshipping Strategist and a Professional Video Director (Storyboard Artist).
    
    INPUTS:
    1. A Viral Video (Reference for structure, camera angles, pacing, and editing).
    2. Product Info: "${productDescription}"
    3. Visual Context: ${imageContextPrompt}

    TASKS:

    1. **Analyze Video Core**:
       - **Video Summary**: Provide a concise 2-3 sentence summary of what happens in the video, the story arc, and the main selling angle.
       - **Viral Score**: Rate from 0-100 and breakdown.

    2. **Adapt Content**: Create a new script selling *MY PRODUCT* following the viral structure. Output in Chinese and English.

    3. **Generate Structured Sora 2 Prompt (STRICT SHOT-BY-SHOT FORMAT)**: 
       - **CRITICAL REQUIREMENT**: Do NOT write a paragraph.
       - **FORMAT**: Structured list of shots (Storyboard style).
       - **AUDIO ANALYSIS**: If there is a person speaking, you MUST describe the **Tone** (e.g., Excited, Sarcastic, Whisper) and the **Content**. If it's music only, describe the vibe.
       
       - **TEMPLATE PER SHOT**:
         "**Shot [N] ([Start Time] - [End Time])**
          **Camera**: [Specific Movement: e.g., Close-up Zoom In / Wide Angle Pan Left / Handheld POV]
          **Visual**: [Detailed visual description of my product being used]
          **Audio**: [Tone/Speaker]: "[Spoken Words]" OR [Sound Effect/Music Vibe]
          **Action**: [Specific physical action]"
       
       - **EXAMPLE OUTPUT**:
         "Shot 1 (0s - 2s):
          Camera: Static Medium Shot.
          Visual: A woman holds the [my product] next to her face.
          Audio: Sarcastic Tone: 'You surely don't need this...'
          Action: She rolls her eyes and throws the product on the bed.
          
          Shot 2 (2s - 4s):
          Camera: Fast Zoom In to Extreme Close-up.
          Visual: The product texture is shown in high detail.
          Audio: High Energy/Fast Paced: '...unless you hate saving money!'
          Action: A finger points aggressively at the price tag."

    4. **Structure Breakdown**: Summarize the above in a JSON list.

    Return the response in strictly valid JSON.
  `;

  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: parts,
      },
      config: {
        systemInstruction: "You are a professional video director. You speak in camera shots, angles, and movements. You explicitly analyze audio tones and spoken dialogue.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title in Chinese" },
            videoSummary: { type: Type.STRING, description: "A brief summary of the video's story/concept." },
            viralScore: { type: Type.NUMBER, description: "Total Score 0-100" },
            viralScoreBreakdown: {
              type: Type.OBJECT,
              properties: {
                hookStrength: { type: Type.NUMBER, description: "Score 0-100 for first 3 seconds" },
                pacing: { type: Type.NUMBER, description: "Score 0-100 for editing rhythm" },
                painPoint: { type: Type.NUMBER, description: "Score 0-100 for problem identification" },
                callToAction: { type: Type.NUMBER, description: "Score 0-100 for sales closing" },
              }
            },
            transcript: { type: Type.STRING, description: "Original transcript" },
            rewrittenScriptCN: { type: Type.STRING, description: "Adapted script in Chinese" },
            rewrittenScriptEN: { type: Type.STRING, description: "Adapted script in English" },
            marketingStrategy: { type: Type.STRING, description: "Strategy analysis in Chinese" },
            consolidatedSoraPrompt: { 
              type: Type.STRING, 
              description: "The formatted Shot-by-Shot prompt list including Audio context." 
            },
            structure: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING, description: "e.g., '00:00 - 00:03'" },
                  visualDescription: { type: Type.STRING, description: "Scene description" },
                  audioDescription: { type: Type.STRING, description: "Tone and spoken words (or music vibe)" },
                  hookType: { type: Type.STRING, description: "Hook type" },
                  soraPrompt: { type: Type.STRING, description: "Short prompt segment" }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini.");
    }

    try {
      return JSON.parse(response.text) as AnalysisResult;
    } catch (e) {
      console.error("Failed to parse JSON", response.text);
      throw new Error("Failed to parse analysis results.");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Check for specific error related to payload size or XHR failure
    if (error.message && (error.message.includes("xhr error") || error.message.includes("Rpc failed"))) {
       throw new Error("视频文件可能过大或网络连接不稳定。请尝试上传更小的视频文件（建议 < 10MB）或检查网络。");
    }
    
    throw error;
  }
};