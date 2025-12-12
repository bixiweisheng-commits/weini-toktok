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
    You are an expert TikTok Dropshipping Strategist and a specialized **Sora 2 Prompt Engineer**.
    
    INPUTS:
    1. **REFERENCE VIDEO**: A viral TikTok video (Analyze its structure, editing, and camera movement).
    2. **MY PRODUCT SPECS**: "${productDescription}"
    3. **VISUAL CONTEXT**: ${imageContextPrompt}

    --------------------------------------------------
    **CRITICAL ANALYSIS STEP 1: EDITING STRUCTURE DETECTION**
    You must first determine if the Reference Video is:
    - **Type A: Single Continuous Shot (One-Shot)**: No cuts, the camera moves continuously around the subject.
    - **Type B: Multi-Cut (Montage)**: Fast cuts between different angles.
    
    *RULE*: If the video is **Type A (One-Shot)**, your output structure MUST contain ONLY "Shot 1" with a long duration (e.g., 0s-15s). Do NOT artificially break it into Shot 2, Shot 3. Describe the complex camera movement (e.g., "Orbiting," "Dolly In," "Tracking") within that single prompt block.
    --------------------------------------------------

    --------------------------------------------------
    **CRITICAL ANALYSIS STEP 2: FEATURE INTEGRATION**
    You cannot just "show the product". You must VISUALIZE the functions described in "${productDescription}".
    - If the product is magnetic -> Visual: Show it snapping instantly onto a surface.
    - If it's waterproof -> Visual: Show water pouring over it.
    - If it's a beauty cream -> Visual: Show the texture being spread on skin.
    
    *RULE*: Every visual description MUST demonstrate a specific feature of MY PRODUCT, not the product in the reference video.
    --------------------------------------------------

    TASKS:

    1. **Analyze Video Core**:
       - Summary, Viral Score, Breakdown.

    2. **Adapt Script**: 
       - Rewrite the script to sell *MY PRODUCT* using the reference video's hook and logic.
    
    3. **Generate Sora 2 Prompts (The most important part)**:
       - Use "Sora 2 Physics" keywords: *Photorealistic, 8k, Ray-tracing, Newton-accurate physics, Macro lens, Anamorphic*.
       - **Strictly follow the Editing Structure detected in Step 1.**
       - **Strictly integrate Product Features from Step 2.**
       
       **FORMATTING FOR SORA**:
       - For One-Shot videos: Write a single, long, detailed paragraph describing the flow of the camera and the product action.
       - For Multi-Cut videos: Break down frame by frame.

    4. **Structure Breakdown (JSON)**: 
       - Summarize the shots. If One-Shot, this array should have size 1.

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
        systemInstruction: "You are an AI film director. You are rigorous about 'Continuity'. If a video has no cuts, you never invent cuts. You are obsessed with showcasing specific product features visually.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title in Chinese" },
            videoSummary: { type: Type.STRING, description: "Brief summary." },
            viralScore: { type: Type.NUMBER, description: "Total Score 0-100" },
            viralScoreBreakdown: {
              type: Type.OBJECT,
              properties: {
                hookStrength: { type: Type.NUMBER },
                pacing: { type: Type.NUMBER },
                painPoint: { type: Type.NUMBER },
                callToAction: { type: Type.NUMBER },
              }
            },
            transcript: { type: Type.STRING },
            rewrittenScriptCN: { type: Type.STRING },
            rewrittenScriptEN: { type: Type.STRING },
            marketingStrategy: { type: Type.STRING },
            consolidatedSoraPrompt: { 
              type: Type.STRING, 
              description: "The FINAL prompt for Sora. If One-Shot, this is one long paragraph. If Multi-Cut, it is a list of shots." 
            },
            structure: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING, description: "e.g., '00:00 - 00:15' for one shot, or '00:00-00:03' for cuts" },
                  visualDescription: { type: Type.STRING, description: "How the PRODUCT FEATURE is shown." },
                  audioDescription: { type: Type.STRING },
                  hookType: { type: Type.STRING },
                  soraPrompt: { type: Type.STRING }
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