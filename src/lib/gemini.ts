import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export interface Lead {
  name: string;
  website: string;
  email: string;
  niche: string;
}

export async function findLeads(niche: string, count: number = 10): Promise<Lead[]> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Find ${count} businesses in the niche: "${niche}". 
  For each business, provide:
  1. Business Name
  2. Website URL
  3. A public contact email address (e.g., info@, hello@, contact@).
  
  Use the googleSearch tool. Return ONLY a JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The name of the business" },
              website: { type: Type.STRING, description: "The official website URL" },
              email: { type: Type.STRING, description: "The public contact email address" },
              niche: { type: Type.STRING, description: "The niche or category" }
            },
            required: ["name", "website", "email", "niche"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as Lead[];
  } catch (error) {
    console.error("Error finding leads:", error);
    throw error;
  }
}
