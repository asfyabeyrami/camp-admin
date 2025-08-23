// Product inside basket/cart
export type ProductInBasket = {
  name: string;
  price: number;
};

// آیتم سبد خرید
export type CartItem = {
  id: string;
  basketId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: ProductInBasket;
};

// سبد خرید
export type Cart = {
  items: CartItem[];
};

// جواب افزودن به سبد خرید
export type AddToBasketResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data: CartItem;
  timestamp: string;
};
export type OrderResult = {
  orderNumber: string;
  totalAmount: number;
};
export type UserProfileResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data: UserProfile;
  timestamp: string;
};

// src/types/checkout.ts
export enum PaymentType {
  ONLINE = "ONLINE",
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
  BANK_TRANSFER = "BANK_TRANSFER",
}
export type Province = { id: string; name: string };
export type City = { id: string; provinceId: string; name: string };
export type UserAddress = {
  id: string;
  address: string;
  postalCode: string;
  provinceId?: string;
  cityId?: string;
};
export type UserProfile = {
  id: string;
  name: string;
  lastName: string;
  mobile: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  role: string;
  address: UserAddress[];
};
export type ProductListResponse = { data: Product[] };

export type Dimensions = { value: number; unit: string };
export type Media = { id: string; url: string; type: string };
export type MediaItem = {
  id: string;
  alt?: string;
  description: string;
  media: Media;
};
export type CategoryObj = {
  id: string;
  title: string;
  fatherId: string | null;
};
export type CategoryOnProduct = {
  productId: string;
  categoryId: string;
  category: CategoryObj;
};
export type TagObj = { id: string; title: string };
export type TagOnProduct = { productId: string; tagId: string; tag: TagObj };
export type FeatureValue = {
  id: string;
  featureId: string;
  name: string;
  rate?: string;
  Length?: Dimensions;
  Width?: Dimensions;
  Height?: Dimensions;
  stock_quantity?: number;
};
export type Feature = {
  id: string;
  productId: string;
  feature: string;
  FeatureValue: FeatureValue[];
};
export type Delivery = { id: string; name: string };
export type Product = {
  id: string;
  code: number;
  name: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  altText?: string;
  structuredData?: unknown;
  deliveryId?: string | null;
  isAvailable: boolean;
  count: number;
  price: number;
  off: number;
  description: { text: string };
  createdAt: string;
  updatedAt: string;
  media_item: MediaItem[];
  CategoriesOnProduct: CategoryOnProduct[];
  tagOnProduct: TagOnProduct[];
  Delivery: Delivery;
  Feature: Feature[];
};
export interface CategoryItem {
  id: string;
  title: string;
  slug: string;
  fatherId?: string | null;
  description?: { text: string } | null;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  altText?: string;
  structuredData?: any;
  createdAt?: string;
  updatedAt?: string;
  parent?: CategoryItem | null;
  children?: CategoryItem[];
  // Add any other fields you need from your API here
}
