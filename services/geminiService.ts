
import { GoogleGenAI } from "@google/genai";
import { LPItem, ModCategory, ClothingSlot, ItemType } from "../types";

const ENGINE_REF = `
LIFEPLAY STABLE ENGINE REFERENCE (V2023_04):

1. CORE STATS:
   - Biological: mood, energy, intoxication, arousal, hygiene, fitness
   - Mental/Social: intelligence, attractiveness, interpersonal, perversion, masochism
   - Relationship: rapportwithplayer, attractionwithplayer, incest (for relatives)

2. ADVANCED SCRIPTING CONCEPTS:
   - Logic: If/ElseIf/EndIf, While/EndWhile
   - Comparisons: Player.intelligence > 50, Actor.rapportwithplayer < 0, Player.isCuckold()
   - Commands: SceneStart(), SceneEnd(), FollowUp([SceneID]), Animate([Anim]), timeout([Minutes], [SceneID])
   - Variables: MyVar = random(1, 100), Actor.setActorVar(rk_VB_Hunger, 50)
   - Formatting: Use double colon for dialogue e.g., Actor(Mood):: "Dialogue"

3. MOD FILES:
   - .lpmod: Manifest metadata.
   - .lpaction: Defines ITEM, CLOTHING, and ACTION blocks.
   - .lpscene: Full narrative sequence with WHO/WHERE/WHEN/WHAT headers.
   - .lpcharacter: Character presets.
`;

export class GeminiService {
  async generateManifest(item: LPItem): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Generate a LifePlay .lpmod manifest for ${item.category} "${item.name}". 
      ID: ${item.id}, Author: ${item.author}, Version: ${item.version}.
      Use the strict format:
      MODULE_UNIQUEID: ${item.id}
      MODULE_NAME: ${item.name}
      MODULE_AUTHOR: ${item.author}
      MODULE_LINK: None
      MODULE_DESCRIPTION: ${item.description}
      MODULE_VERSION: ${item.version}`,
      config: { temperature: 0.1 },
    });
    return response.text?.trim() || "";
  }

  async generateRegistryEntries(item: LPItem): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate registry integration for: ${item.name} (ID: ${item.id}), Category: ${item.category}.
    
    CONTEXT:
    Gender: ${item.gender || 'Female'}
    Slot: ${item.slot || 'Top'}
    Outfit Category: ${item.outfitCategory || 'Casual'}
    Tags: ${item.clothingTags || ''}
    Shop Location: ${item.location}
    Price: ${item.price}

    RULES:
    1. If CLOTHING: 
       - Generate line for 'outfits_F.txt' and 'outfits_M.txt' where appropriate.
       - Format: [ID]: true: [Slots]: [Tags]
    2. If ITEM: Generate 'AddShopItem(${item.location}, ${item.id}, ${item.price})' command.
    3. If it is a Uniform, provide the uniforms.txt block.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { systemInstruction: ENGINE_REF, temperature: 0.1 },
    });
    return response.text?.trim() || "No registry entries generated.";
  }

  async generateItemScript(item: LPItem): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const complexityPrompt = `
      Create a high-quality .lpaction block for ID: ${item.id}.
      TYPE: ${item.category.toUpperCase()}
      NAME: ${item.name}
      DESCRIPTION: ${item.description}
      
      Requirements for high-fidelity generation:
      1. Use random() for all stat changes to simulate variability (e.g., mood += random(1, 5)).
      2. Implement conditional outcomes where possible. If the player is drunk (intoxication > 20), make the effect stronger or different.
      3. Use appropriate animations: ${item.animation || 'sit'}.
      4. For CLOTHING: Include effects on perversion or attractiveness if the item is revealing/stylish.
      5. For ITEM: If consumable, handle multiple stats (hunger, thirst, mood, energy).
      6. For ACTION: Make it a multi-stage activity with narrative flavor text in quotes.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: complexityPrompt,
      config: { 
        systemInstruction: `You are a Senior LifePlay Modder. Your scripts are known for their depth and attention to detail. Use professional LP syntax. ${ENGINE_REF}`,
        temperature: 0.4 
      },
    });
    return response.text?.trim() || "";
  }

  async generateSceneScript(item: LPItem): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const scenePrompt = `
      Generate a sophisticated .lpscene script for ID: ${item.id}_scene.
      PLOT: ${item.plotPrompt}
      ACTORS: ${item.sceneActors}
      
      ARCHITECTURAL REQUIREMENTS:
      1. HEADERS: Define WHAT, WHERE, WHEN, WHO, OTHER accurately. Use getPerson() or getRelative() for WHO.
      2. NARRATIVE FLOW: Start with descriptive scene setting in quotes.
      3. BRANCHING LOGIC: Include at least one complex "If" check based on a skill or relationship (e.g., If Player.intelligence > 40 Or Actor.rapportwithplayer > 20).
      4. CHOICES: Implement a meaningful 0::/1:: choice menu.
      5. CONSEQUENCES: Choices must affect multiple stats (e.g., Actor.attractionwithplayer += 5, Player.mood -= 2).
      6. DIALOGUE: Use mood tags (Happy, Sad, Angry, Flirty, Surprised) to define actor reactions.
      7. ANIMATIONS: Integrate Animate() calls to synchronize with the dialogue and actions.
      8. CONCLUSION: End with SceneEnd() and a logical timeout() if the scene is repeatable.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: scenePrompt,
      config: { 
        systemInstruction: `You are the lead narrative designer for LifePlay. You create immersive, branching stories that leverage the engine's full technical capability. ${ENGINE_REF}`, 
        temperature: 0.8 
      },
    });
    return response.text?.trim() || "";
  }

  async generateCharacterPreset(item: LPItem): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Generate .lpcharacter for ${item.name}. Include basic stats and features.`,
    });
    return response.text?.trim() || "";
  }

  async generateItemTexture(prompt: string, category: ModCategory, itemData: LPItem): Promise<{ base64: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let visualContext = "";
    if (category === ModCategory.CLOTHING) {
      visualContext = `This is a ${itemData.gender} ${itemData.outfitCategory} clothing item for the ${itemData.slot} slot. 
      Tags: ${itemData.clothingTags}.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `LifePlay Mod Asset: ${prompt}. ${visualContext} Professional game icon, isolated subject, 512x512, vibrant colors, clear background, realistic texture.` }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    
    let base64 = "";
    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts || [];
      for (const part of parts) {
        if (part.inlineData) { 
          base64 = part.inlineData.data; 
          break; 
        }
      }
    }
    
    return { base64 };
  }
}

export const geminiService = new GeminiService();
