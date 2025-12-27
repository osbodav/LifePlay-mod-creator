
export enum ModCategory {
  ITEM = 'item',
  CLOTHING = 'clothing'
}

export enum ItemType {
  OBJECT = 'Object',
  CONSUMABLE = 'Consumable',
  FURNITURE = 'Furniture',
  ELECTRONIC = 'Electronic'
}

export enum ClothingType {
  TOP = 'Top',
  BOTTOM = 'Bottom',
  UNDERWEAR = 'Underwear',
  SHOES = 'Shoes',
  ACCESSORY = 'Accessory',
  FULL_BODY = 'FullBody'
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
  category: ModCategory;
  id: string;
  name: string;
  type: string; // Dynamic based on category
  price: number;
  description: string;
  location: ShopLocation;
  availability: string;
  imagePrompt: string;
}

export interface GeneratedAssets {
  script: string;
  imageUrl: string | null;
  base64Image: string | null;
}
