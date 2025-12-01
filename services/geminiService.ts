
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { SkinAnalysis } from "../types";

// Helper to create a client with a specific key
const getAiClient = (apiKey: string) => {
  return new GoogleGenAI({ apiKey });
};

const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const getMimeType = (base64: string) => {
  const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

// New function to test the API Key connection
export const testApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const ai = getAiClient(apiKey);
    // Simple light-weight call to check validity
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
    });
    return !!response.text;
  } catch (error) {
    console.error("API Key Test Failed:", error);
    return false;
  }
};

export const analyzeFaceImage = async (base64Image: string, apiKey: string): Promise<SkinAnalysis> => {
  try {
    const mimeType = getMimeType(base64Image);
    const data = cleanBase64(base64Image);
    const ai = getAiClient(apiKey);

    const schema = {
      type: Type.OBJECT,
      properties: {
        asymmetryScore: { type: Type.NUMBER, description: "0-100 score for symmetry (100 is perfect)." },
        asymmetryDescription: { type: Type.STRING, description: "Description of asymmetry in Korean." },
        tiltAngle: { type: Type.NUMBER, description: "Head tilt angle in degrees (- for left, + for right)." },
        faceBox: {
            type: Type.OBJECT,
            description: "Bounding box of the face in 0-1000 scale.",
            properties: {
                ymin: { type: Type.NUMBER },
                xmin: { type: Type.NUMBER },
                ymax: { type: Type.NUMBER },
                xmax: { type: Type.NUMBER }
            }
        },
        overallScore: { type: Type.NUMBER, description: "Overall skin health score 0-100." },
        skinConditions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              condition: { type: Type.STRING, description: "Condition name (e.g., 기미, 다크서클, 피부톤, 주름)." },
              severity: { type: Type.STRING, enum: ["보통", "심함", "매우 심함"] },
              description: { type: Type.STRING, description: "Detailed diagnosis in Korean." }
            }
          }
        }
      },
      required: ["asymmetryScore", "asymmetryDescription", "tiltAngle", "skinConditions", "overallScore"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data
            }
          },
          {
            text: `
              이 얼굴 사진을 미용 목적으로 분석해주세요.
              다음 항목들을 중점적으로 분석하여 한국어로 JSON 응답을 주세요:
              1. 얼굴 좌우 대칭성 (중앙 기준 각도 차이 포함)
              2. 얼굴의 정확한 위치 (Bounding Box 0-1000 scale)
              3. 피부 상태: 기미/잡티, 다크서클, 피부톤, 주름
              
              각 상태에 대해 구체적인 진단 내용을 작성해주세요.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
        ],
      }
    });

    if (!response.text) {
      throw new Error("AI 응답이 없습니다.");
    }

    let jsonString = response.text.trim();
    // Strip markdown code blocks if present
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(jsonString) as SkinAnalysis;

  } catch (error: any) {
    console.error("Analysis failed:", error);
    if (error.toString().includes('403') || error.toString().includes('Permission denied')) {
        throw new Error("API 권한이 거부되었습니다. API 키를 확인해주세요.");
    }
    throw new Error("이미지 분석에 실패했습니다. 다시 시도해주세요.");
  }
};

export const generateImprovedImage = async (base64Image: string, analysis: SkinAnalysis, apiKey: string): Promise<string> => {
  try {
    const mimeType = getMimeType(base64Image);
    const data = cleanBase64(base64Image);
    const ai = getAiClient(apiKey);

    const conditionsList = analysis.skinConditions.map(c => `${c.condition} (${c.severity})`).join(", ");
    
    const prompt = `
      Professional Aesthetic Dermatology & Plastic Surgery Simulation.
      
      Input: A photo of a user's face.
      Analysis Data:
      - Current Tilt/Asymmetry: ${analysis.tiltAngle} degrees.
      - Asymmetry Details: ${analysis.asymmetryDescription}
      - Skin Issues: ${conditionsList}
      
      GOAL: Generate a realistic "After" image that corrects these issues.
      
      STRICT EDITING INSTRUCTIONS:
      
      1. **PERFECT SYMMETRY (0° TILT)**:
         - Correct the head tilt to be exactly 0 degrees (perfect vertical alignment).
         - Make the left and right sides of the face symmetrical (eyes, eyebrows, cheekbones, jawline).
         - The facial axis must be perfectly straight.
         
      2. **SKIN RETOUCHING (Based on Diagnosis)**:
         - **Blemishes/Spots**: Remove visible blemishes, acne, and pigmentation.
         - **Dark Circles**: Brighten the under-eye area to remove dark circles and hollowness.
         - **Skin Tone**: Even out the skin tone for a bright, healthy, and translucent look.
         - **Wrinkles**: Smooth out deep wrinkles (nasolabial folds, forehead lines) while keeping natural skin texture.
         
      3. **IDENTITY & REALISM**:
         - The subject MUST remain recognizable (same person).
         - Maintain natural skin pores (do not create a "plastic" or "wax" look).
         - Preserve original hair, clothing, background, and lighting conditions.
      
      Return ONLY the generated image.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        imageConfig: {
           // Default config
        }
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                 return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("이미지 생성 결과가 비어있습니다.");

  } catch (error: any) {
    console.error("Generation failed:", error);
    if (error.toString().includes('403') || error.toString().includes('Permission denied')) {
        throw new Error("API 권한이 없습니다. 유료 모델 사용이 가능한 API 키인지 확인해주세요.");
    }
    throw new Error("개선된 이미지 생성에 실패했습니다.");
  }
};
