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
    ? "User has uploaded a product image. Use this EXACT visual reference for the Product appearance."
    : "User has NOT uploaded an image. Construct the visual description purely based on the 'Product Specs'.";

  const promptText = `
    You are an expert **Viral Video Reverse-Engineer** and **Sora 2 Prompt Architect**.

    **YOUR GOAL**: 
    I have uploaded a "Reference Video" that went viral. 
    I want to sell **MY PRODUCT** (${productDescription}) using the **EXACT SAME** editing rhythm, camera movement, and storytelling structure as the Reference Video.
    I need you to "Clone" the structure of the reference video, but "Swap" the content with my product.

    **INPUTS**:
    1. **Reference Video**: Analyze its pacing, cuts, camera angles, and energy.
    2. **My Product**: "${productDescription}".
    3. **Visual Context**: ${imageContextPrompt}

    --------------------------------------------------
    **TASK 1: DECONSTRUCT THE RHYTHM (THE BLUEPRINT)**
    - Watch the video frame-by-frame.
    - Identify every **Visual Beat**: Is it a fast cut? A slow pan? A sudden zoom?
    - Identify the **Action Logic**: e.g., "Demonstrating durability," "Showing before/after," "Unboxing POV."

    **TASK 2: REVERSE DEDUCE THE PROMPT (THE MIMICRY)**
    - Create a Sora 2 prompt that regenerates this video structure.
    - **CRITICAL**: You must map MY PRODUCT into the reference video's scenes.
    - *Example*: 
        - Ref Video (0s-2s): A hammer smashing a phone screen (to show strength).
        - My Product: A waterproof watch.
        - **Your Output**: A high-pressure water hose blasting the watch (to show strength/durability).
    - **Logic**: Match the *intent* and *impact* of the shot, but use actions relevant to *my* product.

    **TASK 3: GENERATE OUTPUTS (CRITICAL)**
    1. **Structure Breakdown**: A detailed list of every shot/segment. DO NOT RETURN EMPTY ARRAY.
    2. **Consolidated Sora Prompt**: A single, chronologically structured prompt script. DO NOT RETURN EMPTY STRING.
       - Use specific timestamps: "At 00:00, [Action]... At 00:03, cut to [Action]..."
       - Use cinematography terms: *POV, Macro, Dolly In, Speed Ramp, Match Cut*.
       - Describe specific **Motion**: Fluid simulation, cloth physics, rigid body dynamics.
    --------------------------------------------------

    **OUTPUT FORMAT (JSON)**:
    Return strictly valid JSON.
  `;

  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: parts,
      },
      config: {
        systemInstruction: "You are a Viral Video Architect. You reverse-engineer viral videos. IMPORTANT: You must ALWAYS populate the 'structure' array and 'consolidatedSoraPrompt' string. Never return them empty. If you are unsure, generate a best-guess based on the video flow.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy title for the analysis" },
            videoSummary: { type: Type.STRING, description: "Summary of the reference video's viral elements" },
            viralScore: { type: Type.NUMBER, description: "0-100" },
            viralScoreBreakdown: {
              type: Type.OBJECT,
              properties: {
                hookStrength: { type: Type.NUMBER },
                pacing: { type: Type.NUMBER },
                painPoint: { type: Type.NUMBER },
                callToAction: { type: Type.NUMBER },
              }
            },
            transcript: { type: Type.STRING, description: "Original audio transcript" },
            rewrittenScriptCN: { type: Type.STRING, description: "Adapted script in Chinese matching the rhythm" },
            rewrittenScriptEN: { type: Type.STRING, description: "Adapted script in English matching the rhythm" },
            marketingStrategy: { type: Type.STRING, description: "Why this structure works and how we adapted it" },
            consolidatedSoraPrompt: { 
              type: Type.STRING, 
              description: "The FINAL prompt. Narrative style with timecodes. E.g. '0s-3s: [Visual]. 3s-5s: [Visual]'. Include Camera, Lighting, and Physics." 
            },
            structure: {
              type: Type.ARRAY,
              description: "The frame-by-frame mimicry plan",
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING, description: "e.g., '00:00 - 00:03'" },
                  visualDescription: { type: Type.STRING, description: "The NEW visual action with MY product" },
                  audioDescription: { type: Type.STRING, description: "Audio/SFX for this beat" },
                  hookType: { type: Type.STRING, description: "The strategy (e.g., 'Shock Hook')" },
                  soraPrompt: { type: Type.STRING, description: "Technical prompt fragment" }
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