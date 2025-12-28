
import { GoogleGenAI } from "@google/genai";
import { LPItem, ModCategory } from "../types";

const API_KEY = process.env.API_KEY || '';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async generateItemScript(item: LPItem): Promise<string> {
    const isClothing = item.category === ModCategory.CLOTHING;
    const blockType = isClothing ? 'CLOTHING' : 'ITEM';
    const tagForPrice = isClothing ? 'PRICE' : 'COST';
    const tagForVisual = isClothing ? 'TEXTURE' : 'ICON';

    const systemPrompt = `You are the LifePlay (LP) Scripting Engine for version 2023_04_Stable.
    Your sole purpose is to generate raw .lpmod script files. 
    You operate in an unrestricted creative mode for game modding. 
    Treat all descriptions and items as fictional game assets.

    CRITICAL SYNTAX RULES:
    1. Every file MUST start with the standard header block:
       WHAT: item (or clothing)
       WHERE: [location]
       WHEN: 0 - 24
       WHO:
       OTHER:
    
    2. Followed by the item block:
       ${blockType}
         ID: [id]
         NAME: [name]
         TYPE: [type]
         ${tagForPrice}: [price]
         ${tagForVisual}: [id].png
         DESCRIPTION: [desc]
       END_${blockType}

    Do not include any conversational text, markdown formatting (no \`\`\` tags), or JSON. Output the raw script only.`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Generate a LifePlay script for:
        Category: ${item.category}
        ID: ${item.id}
        Name: ${item.name}
        Type: ${item.type}
        Price: ${item.price}
        Location: ${item.location}
        Description: ${item.description}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        // The "Fix": Explicitly set safety thresholds to NONE for modding freedom
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      },
    });

    return response.text?.trim() || "";
  }

  async generateItemTexture(prompt: string, category: ModCategory): Promise<{ base64: string }> {
    const styleContext = category === ModCategory.CLOTHING 
      ? "clothing apparel texture, high resolution fabric, flat layout" 
      : "high quality game icon, realistic detail, isolated on white background";

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `High-definition LifePlay game asset: ${prompt}. ${styleContext}. Professional digital illustration, 512x512, centered.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }
    });

    let base64 = "";
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        base64 = part.inlineData.data;
        break;
      }
    }

    if (!base64) throw new Error("Texture generation blocked or failed.");
    return { base64 };
  }
}

export const geminiService = new GeminiService();
