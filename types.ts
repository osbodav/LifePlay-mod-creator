
export enum ModCategory {
  ITEM = 'item',
  CLOTHING = 'clothing',
  CHARACTER = 'character',
  SCENE = 'scene',
  ACTION = 'action'
}

export enum ItemType {
  OBJECT = 'Object',
  CONSUMABLE = 'Consumable',
  FURNITURE = 'Furniture',
  ELECTRONIC = 'Electronic',
  GIFT = 'Gift'
}

export enum ClothingSlot {
  TOP = 'Top',
  BOTTOM = 'Bottom',
  FOOT = 'Foot',
  FOOT_UNDER = 'Foot_Under',
  TOP_UNDER = 'Top_Under',
  BOTTOM_UNDER = 'Bottom_Under',
  OUTERWEAR = 'Outerwear',
  ACCESSORY = 'Accessory',
  HEAD = 'Head',
  EYEWEAR = 'Eyewear',
  NECK = 'Neck',
  WRIST = 'Wrist',
  EAR = 'Ear',
  FINGER = 'Finger',
  WAIST = 'Waist',
  HANDS = 'Hands'
}

export enum ShopLocation {
  SUPERMARKET = 'supermarket',
  PHARMACY = 'pharmacy',
  CLOTHES = 'clothes',
  FURNITURE = 'furniture_shop',
  ELECTRONICS = 'electronics_shop',
  SEX_SHOP = 'sex_shop',
  MALL = 'mall'
}

export interface LPItem {
  // Manifest Data
  category: ModCategory;
  author: string;
  version: string;
  modName: string;
  
  // Shared Metadata
  id: string; 
  name: string; 
  description: string;
  
  // Item/Clothing Specific
  type: ItemType | string; 
  slot?: ClothingSlot; 
  price: number;
  location: ShopLocation;
  
  // Interaction Logic (Smart Detection)
  rehydrate?: boolean;
  satiate?: boolean;
  energyBoost?: boolean;
  intoxicate?: boolean;
  
  // Registration in Lists
  registerAsUniform?: boolean;
  registerInOutfits?: boolean;
  outfitCategory?: string; // work, sports, swim, formal, casual, sleepwear, underwear
  clothingTags?: string; // comma separated tags e.g. "skirt, tight, leather"
  
  // Scene/Activity Shared Triggers
  triggerActions?: string;
  triggerLocations?: string;
  triggerTime?: string;
  actorConditions?: string;
  plotPrompt?: string;
  sceneActors?: string; 
  linkSceneToItem?: boolean; 

  minutes?: string;
  timeoutMinutes?: number;
  effects?: string;
  actionConditions?: string;
  moveFirst?: boolean;
  sceneAlways?: string;
  animation?: string; // Animation to trigger (e.g., 'drink', 'eat', 'wear')
  
  // AI Prompt for Visuals
  imagePrompt: string;

  // Metadata used in UI and registry generation
  gender?: 'Female' | 'Male' | 'Unisex';
  availability?: string;
  ageRange?: string;
  personality?: string;
}

export interface GeneratedAssets {
  manifest: string;
  script: string;
  registryEntries?: string; 
  imageUrl: string | null;
  base64Image: string | null;
}
