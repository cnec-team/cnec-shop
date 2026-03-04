// CNEC Commerce Database Types
// Creator Select Shop Platform

// =============================================
// ENUMS
// =============================================

export type UserRole = 'super_admin' | 'brand_admin' | 'creator' | 'buyer';
export type UserStatus = 'pending' | 'active' | 'suspended';
export type CampaignType = 'GONGGU' | 'ALWAYS';
export type CampaignStatus = 'DRAFT' | 'RECRUITING' | 'ACTIVE' | 'ENDED';
export type RecruitmentType = 'OPEN' | 'APPROVAL';
export type ParticipationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ShopItemType = 'GONGGU' | 'PICK';
export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
export type ConversionType = 'DIRECT' | 'INDIRECT';
export type ConversionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type SettlementStatus = 'PENDING' | 'COMPLETED' | 'CARRIED_OVER';
export type SkinType = 'combination' | 'dry' | 'oily' | 'normal' | 'oily_sensitive';
export type PersonalColor = 'spring_warm' | 'summer_cool' | 'autumn_warm' | 'winter_cool';
export type ProductCategory = 'skincare' | 'makeup' | 'hair' | 'body' | 'etc';
export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type ShippingFeeType = 'FREE' | 'PAID' | 'CONDITIONAL_FREE';
export type BannerType = 'HORIZONTAL' | 'VERTICAL';
export type BannerLinkType = 'EXTERNAL' | 'COLLECTION' | 'PRODUCT';
export type NotificationType = 'ORDER' | 'SHIPPING' | 'SETTLEMENT' | 'CAMPAIGN' | 'SYSTEM';

// =============================================
// CORE TABLES
// =============================================

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  status: UserStatus;
  name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Brand {
  id: string;
  user_id: string;
  brand_name: string;
  logo_url?: string;
  business_number?: string;
  representative_name?: string;
  business_registration_url?: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  contact_phone?: string;
  contact_email?: string;
  default_shipping_fee?: number;
  free_shipping_threshold?: number;
  default_courier?: string;
  return_address?: string;
  exchange_policy?: string;
  platform_fee_rate: number;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface Creator {
  id: string;
  user_id: string;
  shop_id: string; // URL slug: shop.cnec.kr/{shop_id}
  display_name: string;
  bio?: string;
  profile_image_url?: string;
  cover_image_url?: string;
  banner_image_url?: string;
  banner_link?: string;
  instagram_handle?: string;
  youtube_handle?: string;
  tiktok_handle?: string;
  skin_type?: SkinType;
  personal_color?: PersonalColor;
  skin_concerns?: string[];
  scalp_concerns?: string[];
  total_sales: number;
  total_earnings: number;
  bank_name?: string;
  bank_account?: string;
  is_business: boolean;
  business_number?: string;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  category: ProductCategory;
  description?: string;
  original_price: number;
  sale_price: number;
  stock: number;
  images: string[];
  thumbnail_url?: string;
  volume?: string;
  ingredients?: string;
  usage_info?: string;
  shipping_fee_type: ShippingFeeType;
  shipping_fee?: number;
  free_shipping_threshold?: number;
  courier?: string;
  shipping_info?: string;
  return_policy?: string;
  status: ProductStatus;
  allow_creator_pick: boolean;
  default_commission_rate: number;
  created_at: string;
  updated_at?: string;
  // Joined
  brand?: Brand;
}

// =============================================
// CAMPAIGN TABLES
// =============================================

export interface Campaign {
  id: string;
  brand_id: string;
  type: CampaignType;
  title: string;
  description?: string;
  status: CampaignStatus;
  start_at?: string;
  end_at?: string;
  recruitment_type: RecruitmentType;
  commission_rate: number;
  total_stock?: number;
  sold_count: number;
  target_participants?: number;
  conditions?: string;
  created_at: string;
  updated_at?: string;
  // Joined
  brand?: Brand;
  products?: CampaignProduct[];
  participants?: CampaignParticipation[];
  promotion_kit?: PromotionKit;
}

export interface CampaignProduct {
  id: string;
  campaign_id: string;
  product_id: string;
  campaign_price: number;
  per_creator_limit?: number;
  // Joined
  product?: Product;
  campaign?: Campaign;
}

export interface CampaignParticipation {
  id: string;
  campaign_id: string;
  creator_id: string;
  status: ParticipationStatus;
  message?: string;
  applied_at: string;
  approved_at?: string;
  // Joined
  campaign?: Campaign;
  creator?: Creator;
}

// =============================================
// CREATOR SHOP TABLES
// =============================================

export interface CreatorShopItem {
  id: string;
  creator_id: string;
  product_id: string;
  campaign_id?: string;
  type: ShopItemType;
  collection_id?: string;
  display_order: number;
  is_visible: boolean;
  added_at: string;
  // Joined
  product?: Product;
  campaign?: Campaign;
  campaign_product?: CampaignProduct;
}

export interface Collection {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  // Joined
  items?: CreatorShopItem[];
}

export interface BeautyRoutine {
  id: string;
  creator_id: string;
  name: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  // Joined
  steps?: RoutineStep[];
}

export interface RoutineStep {
  id: string;
  routine_id: string;
  step_name: string;
  step_description: string;
  image_url?: string;
  link_url?: string;
  product_tags?: { product_id: string; x: number; y: number }[];
  display_order: number;
  // Joined
  product?: Product;
}

export interface Banner {
  id: string;
  creator_id: string;
  image_url: string;
  banner_type: BannerType;
  link_url?: string;
  link_type: BannerLinkType;
  is_visible: boolean;
  display_order: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

// =============================================
// ORDER TABLES
// =============================================

export interface Order {
  id: string;
  order_number: string;
  creator_id: string;
  brand_id: string;
  buyer_id?: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  shipping_address: string;
  shipping_detail?: string;
  shipping_zipcode?: string;
  shipping_memo?: string;
  total_amount: number;
  product_amount?: number;
  shipping_fee: number;
  payment_method?: string;
  pg_transaction_id?: string;
  pg_provider?: string;
  status: OrderStatus;
  courier_code?: string;
  tracking_number?: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at?: string;
  // Joined
  items?: OrderItem[];
  creator?: Creator;
  brand?: Brand;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  campaign_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  // Joined
  product?: Product;
  campaign?: Campaign;
}

// =============================================
// CONVERSION & COMMISSION
// =============================================

export interface Conversion {
  id: string;
  order_id: string;
  order_item_id: string;
  creator_id: string;
  conversion_type: ConversionType;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: ConversionStatus;
  created_at: string;
  confirmed_at?: string;
}

// =============================================
// SETTLEMENT
// =============================================

export interface Settlement {
  id: string;
  creator_id: string;
  period_start: string;
  period_end: string;
  total_conversions: number;
  total_sales: number;
  direct_commission: number;
  indirect_commission: number;
  gross_commission: number;
  withholding_tax: number;
  net_amount: number;
  status: SettlementStatus;
  paid_at?: string;
  created_at: string;
  // Joined
  creator?: Creator;
}

// =============================================
// TRACKING
// =============================================

export interface ShopVisit {
  id: string;
  creator_id: string;
  visitor_id: string;
  ip_address?: string;
  user_agent?: string;
  referer?: string;
  visited_at: string;
  expires_at: string;
}

// =============================================
// PROMOTION KIT
// =============================================

export interface PromotionKit {
  id: string;
  campaign_id: string;
  product_images: string[];
  story_templates: string[];
  recommended_caption?: string;
  hashtags: string[];
}

// =============================================
// DASHBOARD STATS
// =============================================

export interface BrandDashboardStats {
  total_visits: number;
  total_orders: number;
  total_revenue: number;
  total_commission: number;
  conversion_rate: number;
  active_campaigns: number;
  active_creators: number;
  product_count: number;
}

export interface CreatorDashboardStats {
  total_visits: number;
  total_orders: number;
  total_revenue: number;
  total_earnings: number;
  conversion_rate: number;
  pending_settlement: number;
  active_gonggu: number;
  active_picks: number;
}

export interface AdminDashboardStats {
  total_brands: number;
  total_creators: number;
  total_orders: number;
  total_gmv: number;
  total_commission: number;
  pending_settlements: number;
}

// =============================================
// COMMISSION CONSTANTS
// =============================================

export const INDIRECT_COMMISSION_RATE = 0.03; // 3%
export const COOKIE_WINDOW_HOURS = 24;
export const PLATFORM_FEE_RATE = 0.03; // 3-5%, default 3%
export const WITHHOLDING_TAX_RATE = 0.033; // 3.3% for non-business individuals

// =============================================
// SKIN TYPE / PERSONAL COLOR LABELS
// =============================================

export const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  combination: '복합성',
  dry: '건성',
  oily: '지성',
  normal: '중성',
  oily_sensitive: '수부지',
};

export const PERSONAL_COLOR_LABELS: Record<PersonalColor, string> = {
  spring_warm: '봄웜',
  summer_cool: '여름쿨',
  autumn_warm: '가을웜',
  winter_cool: '겨울쿨',
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  skincare: '스킨케어',
  makeup: '메이크업',
  hair: '헤어',
  body: '바디',
  etc: '기타',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: '결제대기',
  PAID: '결제완료',
  PREPARING: '배송준비',
  SHIPPING: '배송중',
  DELIVERED: '배송완료',
  CONFIRMED: '구매확정',
  CANCELLED: '취소',
  REFUNDED: '환불',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: '작성중',
  RECRUITING: '모집중',
  ACTIVE: '진행중',
  ENDED: '종료',
};

export const SHIPPING_FEE_TYPE_LABELS: Record<ShippingFeeType, string> = {
  FREE: '무료배송',
  PAID: '유료배송',
  CONDITIONAL_FREE: '조건부 무료',
};

export const COURIER_LABELS: Record<string, string> = {
  cj: 'CJ대한통운',
  hanjin: '한진택배',
  logen: '로젠택배',
  epost: '우체국택배',
  lotte: '롯데택배',
  etc: '기타',
};

// =============================================
// DATABASE INTERFACE (Supabase)
// =============================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      brands: {
        Row: Brand;
        Insert: Omit<Brand, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Brand, 'id'>>;
      };
      creators: {
        Row: Creator;
        Insert: Omit<Creator, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Creator, 'id'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id'>>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Campaign, 'id'>>;
      };
      campaign_products: {
        Row: CampaignProduct;
        Insert: Omit<CampaignProduct, 'id'>;
        Update: Partial<Omit<CampaignProduct, 'id'>>;
      };
      campaign_participations: {
        Row: CampaignParticipation;
        Insert: Omit<CampaignParticipation, 'id' | 'applied_at'>;
        Update: Partial<Omit<CampaignParticipation, 'id'>>;
      };
      creator_shop_items: {
        Row: CreatorShopItem;
        Insert: Omit<CreatorShopItem, 'id' | 'added_at'>;
        Update: Partial<Omit<CreatorShopItem, 'id'>>;
      };
      collections: {
        Row: Collection;
        Insert: Omit<Collection, 'id' | 'created_at'>;
        Update: Partial<Omit<Collection, 'id'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id'>;
        Update: Partial<Omit<OrderItem, 'id'>>;
      };
      conversions: {
        Row: Conversion;
        Insert: Omit<Conversion, 'id' | 'created_at'>;
        Update: Partial<Omit<Conversion, 'id'>>;
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, 'id' | 'created_at'>;
        Update: Partial<Omit<Settlement, 'id'>>;
      };
      shop_visits: {
        Row: ShopVisit;
        Insert: Omit<ShopVisit, 'id'>;
        Update: Partial<Omit<ShopVisit, 'id'>>;
      };
      promotion_kits: {
        Row: PromotionKit;
        Insert: Omit<PromotionKit, 'id'>;
        Update: Partial<Omit<PromotionKit, 'id'>>;
      };
      beauty_routines: {
        Row: BeautyRoutine;
        Insert: Omit<BeautyRoutine, 'id' | 'created_at'>;
        Update: Partial<Omit<BeautyRoutine, 'id'>>;
      };
      routine_steps: {
        Row: RoutineStep;
        Insert: Omit<RoutineStep, 'id'>;
        Update: Partial<Omit<RoutineStep, 'id'>>;
      };
      banners: {
        Row: Banner;
        Insert: Omit<Banner, 'id' | 'created_at'>;
        Update: Partial<Omit<Banner, 'id'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id'>>;
      };
    };
  };
}
