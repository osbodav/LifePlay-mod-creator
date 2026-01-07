
import { GoogleGenAI } from "@google/genai";
import { LPItem, ModCategory, ClothingSlot, ItemType } from "../types";

const API_KEY = process.env.API_KEY || '';

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
] as any;

const ENGINE_DATABASE = `
CLOTHING_SLOTS: Top, Bottom, Foot, Foot_Under, Top_Under, Bottom_Under, Outerwear, Accessory, Head, Eyewear, Neck, Wrist, Ear, Finger, Waist.
ITEM_TYPES: Object, Consumable, Furniture, Electronic, Gift.
STAT_KEYS: hunger, thirst, energy, mood, fitness, attractiveness, arousal, intelligence, cooking.
`;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async generateManifest(item: LPItem): Promise<string> {
    const prompt = `Generate a LifePlay .lpmod manifest.
    MODULE_UNIQUEID: ${item.id}_mod
    MODULE_NAME: ${item.modName}
    MODULE_AUTHOR: ${item.author}
    MODULE_DESCRIPTION: ${item.description}
    MODULE_VERSION: ${item.version}
    Return raw text.`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { temperature: 0.1, safetySettings: SAFETY_SETTINGS },
    });
    return response.text?.trim() || "";
  }

  async generateItemScript(item: LPItem): Promise<string> {
    const isClothing = item.category === ModCategory.CLOTHING;
    
    let contentPrompt = "";
    if (isClothing) {
      contentPrompt = `Generate a CLOTHING block for LifePlay.
      Slot/Type: ${item.slot || 'Top'}
      ID: ${item.id}
      NAME: ${item.name}
      PRICE: ${item.price}
      TEXTURE: ${item.id}.png
      DESCRIPTION: ${item.description}
      Rules: Ensure the SLOT matches valid engine keys: ${Object.values(ClothingSlot).join(', ')}.
      Return strictly the block within an .lpaction header.`;
    } else {
      // Logic for Consumables
      let effects = item.effects || "";
      if (item.type === ItemType.CONSUMABLE) {
        if (item.rehydrate) effects += " thirst -20 (START),";
        if (item.satiate) effects += " hunger -20 (START),";
        if (item.energyBoost) effects += " energy +10 (START),";
      }

      contentPrompt = `Generate an ITEM block for LifePlay.
      Type: ${item.type || 'Object'}
      ID: ${item.id}
      NAME: ${item.name}
      COST: ${item.price}
      ICON: ${item.id}.png
      DESCRIPTION: ${item.description}
      EFFECTS: ${effects}
      Rules: If it's a consumable like a cup or food, use (START) effects for stats like hunger/thirst.
      Return strictly the block within an .lpaction header.`;
    }

    const systemPrompt = `You are a LifePlay Mod Architect. 
    DATABASE: ${ENGINE_DATABASE}
    
    Header Format:
    WHAT: none
    WHERE: ${item.location}
    WHEN: 0 - 24
    WHO: none
    OTHER: 
    
    Then the block:
    ITEM / CLOTHING
      ...
    END_ITEM / END_CLOTHING
    
    Return ONLY raw text.`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contentPrompt,
      config: { systemInstruction: systemPrompt, temperature: 0.1, safetySettings: SAFETY_SETTINGS },
    });
    return response.text?.trim() || "";
  }

  async generateSceneScript(item: LPItem): Promise<string> {
    const systemPrompt = `You are a LifePlay Scene Architect. Generate code for .lpscene. Use SceneStart(), SceneEnd(), and dialogue with Actor(Mood):: "Text".`;
    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Scene ID: ${item.id}. Plot: ${item.plotPrompt}`,
      config: { systemInstruction: systemPrompt, temperature: 0.7, safetySettings: SAFETY_SETTINGS },
    });
    return response.text?.trim() || "";
  }

  async generateActivityScript(item: LPItem): Promise<string> {
    const prompt = `Generate a LifePlay Activity .lpaction script. 
    UNIQUEID: ${item.id}
    NAME: ${item.name}
    EFFECTS: ${item.effects}
    ANIMATION: ${item.animation}`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { temperature: 0.1, safetySettings: SAFETY_SETTINGS },
    });
    return response.text?.trim() || "";
  }

  async generateCharacterPreset(item: LPItem): Promise<string> {
    const prompt = `Generate a LifePlay .lpcharacter preset for ${item.name}. Gender: ${item.gender}.`;
    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { temperature: 0.7, safetySettings: SAFETY_SETTINGS },
    });
    return response.text?.trim() || "";
  }

  async generateItemTexture(prompt: string, category: ModCategory): Promise<{ base64: string }> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `LifePlay Mod Asset: ${prompt}. Game icon style, 512x512.` }],
      },
      config: { imageConfig: { aspectRatio: "1:1" }, safetySettings: SAFETY_SETTINGS }
    });
    let base64 = "";
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) { base64 = part.inlineData.data; break; }
    }
    return { base64 };
  }
}

export const geminiService = new GeminiService();
