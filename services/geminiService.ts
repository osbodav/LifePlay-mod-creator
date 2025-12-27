
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

    const systemPrompt = `You are a LifePlay (LP) Scripting expert for version 2023_04_Stable. 
    LifePlay scripts use a specific non-standard syntax. 
    
    Example of a correct ITEM script:
    WHAT: item
    WHERE: supermarket
    WHEN: 0 - 24
    WHO:
    OTHER:
    
    ITEM
      ID: example_id
      NAME: Example Item
      TYPE: Object
      COST: 50
      ICON: example_id.png
      DESCRIPTION: This is a description.
    END_ITEM

    Example of a correct CLOTHING script:
    WHAT: clothing
    WHERE: clothes
    WHEN: 0 - 24
    WHO:
    OTHER:
    
    CLOTHING
      ID: cool_shirt
      NAME: Cool Shirt
      TYPE: Top
      PRICE: 100
      TEXTURE: cool_shirt.png
    END_CLOTHING`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Generate a valid LifePlay (.lpmod) script for the following:
        Category: ${item.category}
        Name: ${item.name}
        ID: ${item.id}
        Type: ${item.type}
        Price/Cost: ${item.price}
        Description: ${item.description}
        Shop Location: ${item.location}
        Availability: ${item.availability}

        Rules:
        1. Start with the WHAT, WHERE, WHEN, WHO, OTHER headers.
        2. Use the ${blockType}...END_${blockType} block.
        3. Use ${tagForVisual}: ${item.id}.png
        4. No JSON, no markdown outside the script itself. Return ONLY the script.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
      },
    });

    return response.text?.trim() || "";
  }

  async generateItemTexture(prompt: string, category: ModCategory): Promise<{ base64: string }> {
    const styleContext = category === ModCategory.CLOTHING 
      ? "clothing texture layout, clean fabric pattern or apparel item on flat background" 
      : "game item icon, 2D sprite style, isolated on clean background";

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `High-quality game asset: ${prompt}. Style: ${styleContext}. Professional digital art, 512x512 resolution, suitable for LifePlay UI.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    let base64 = "";
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        base64 = part.inlineData.data;
        break;
      }
    }

    if (!base64) throw new Error("Failed to generate asset texture.");
    return { base64 };
  }
}

export const geminiService = new GeminiService();
