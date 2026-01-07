
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
  WAIST = 'Waist'
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
  slot?: ClothingSlot; // Used for clothing "Used on feet/top/etc"
  price: number;
  location: ShopLocation;
  
  // Character Specific
  gender?: 'Male' | 'Female' | 'Random';
  ageRange?: string; 
  personality?: string;
  
  // Scene/Activity Shared Triggers
  triggerActions?: string;
  triggerLocations?: string;
  triggerTime?: string;
  actorConditions?: string;
  plotPrompt?: string;

  // Interaction Logic
  rehydrate?: boolean; // If item is a drink
  satiate?: boolean;   // If item is food
  energyBoost?: boolean;
  
  minutes?: string;
  timeoutMinutes?: number;
  effects?: string;
  actionConditions?: string;
  moveFirst?: boolean;
  sceneAlways?: string;
  animation?: string;
  
  // AI Prompt for Visuals
  imagePrompt: string;
}

export interface GeneratedAssets {
  manifest: string;
  script: string; 
  imageUrl: string | null;
  base64Image: string | null;
}
