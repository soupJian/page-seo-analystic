// 统一的类型导出文件
// 包含所有项目中使用的接口定义，除了Props类型

// ==================== 页面分析相关类型 ====================

export interface PageData {
  basicInfo: BasicInfo;
  metaInfo: MetaInfo;
  openGraphInfo: OpenGraphInfo;
  headingStructure: HeadingInfo[];
  imageInfo: ImageInfo[];
  linksInfo: LinkInfo[];
  structuredData: StructuredDataInfo[];
  analyticsInfo: AnalyticsInfo[];
}

export interface BasicInfo {
  title: string;
  url: string;
  language: string;
  charset: string;
  logo: string;
  description: string;
}

export interface MetaInfo {
  description: string;
  keywords: string;
  canonical: string;
  robots: string;
  viewport: string;
  author: string;
  generator: string;
  themeColor: string;
  appleTouchIcon: string;
  favicon: string;
}

export interface OpenGraphInfo {
  title: string;
  type: string;
  image: string;
  url: string;
  description: string;
  siteName: string;
  locale: string;
}

export interface HeadingInfo {
  tag: string;
  text: string;
  level: number;
}

export interface ImageInfo {
  src: string;
  alt: string;
  width: number;
  height: number;
  loading: string;
  format?: string;
}

export interface LinkInfo {
  href: string;
  text: string;
  type: string;
  title: string;
  rel: string;
}

export interface StructuredDataInfo {
  type: string;
  name: string;
  content: Record<string, unknown>;
  products?: ProductInfo[];
}

export interface ProductInfo {
  name: string;
  price: string;
  currency: string;
  availability: string;
  condition: string;
  brand: string;
  category: string;
  sku: string;
  description: string;
  image: string;
  url: string;
  rating: string;
  ratingCount: string;
  offers?: OfferInfo[];
}

export interface OfferInfo {
  price: string;
  currency: string;
  availability: string;
  condition: string;
  seller: string;
  url: string;
}

export interface AnalyticsInfo {
  name: string;
  id: string;
  type: string;
  found: boolean;
}

// 拼写检查类型已移除

// RecommendationInfo 类型及字段已移除

// ==================== 页面分析建议相关类型 ====================

// PageRecommendation 类型已不再使用，保留兼容性可按需恢复

export interface PageAnalysisData {
  basicInfo: {
    title: string;
    url: string;
    language: string;
    charset: string;
    logo: string;
    description: string;
  };
  metaInfo: {
    description: string;
    keywords: string;
    canonical: string;
    robots: string;
    viewport: string;
    author: string;
    generator: string;
    themeColor: string;
    appleTouchIcon: string;
    favicon: string;
  };
  openGraphInfo: {
    title: string;
    type: string;
    image: string;
    url: string;
    description: string;
    siteName: string;
    locale: string;
  };
  headingStructure: Array<{
    tag: string;
    text: string;
    level: number;
  }>;
  imageInfo: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
    loading: string;
  }>;
  linksInfo: Array<{
    href: string;
    text: string;
    type: string;
    title: string;
    rel: string;
  }>;
  structuredData: Array<{
    type: string;
    name: string;
    content: Record<string, unknown>;
    products?: Array<{
      name: string;
      price: string;
      currency: string;
      availability: string;
      condition: string;
      brand: string;
      category: string;
      sku: string;
      description: string;
      image: string;
      url: string;
      rating: string;
      ratingCount: string;
    }>;
  }>;
  analyticsInfo: Array<{
    name: string;
    id: string;
    type: string;
    found: boolean;
  }>;
}

// ==================== 消息传递相关类型 ====================

export interface BackgroundMessage {
  action: string;
  data?: PageData;
  tabId?: number;
  url?: string;
  error?: string;
  message?: string;
}

export interface SidebarMessage {
  type: string;
  data?: PageData;
  error?: string;
  message?: string;
}

export interface MessageData {
  action: string;
  data?: PageData;
  url?: string;
  error?: string;
}

// ==================== 分页相关类型 ====================

export interface PaginationInfo {
  current: number;
  pageSize: number;
  total: number;
}

// ==================== 导出相关类型 ====================

export interface ExportData {
  filename: string;
  data: any[];
  headers?: string[];
}

// ==================== 统计相关类型 ====================

// RecommendationStats 类型已不再使用，保留兼容性可按需恢复

// ==================== 工具类型 ====================

export type Priority = 'high' | 'medium' | 'low';