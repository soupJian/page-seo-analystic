// 背景脚本 - 管理扩展生命周期和消息传递

// 类型定义
interface SeoData {
  basicInfo: BasicInfo;
  metaInfo: MetaInfo;
  openGraphInfo: OpenGraphInfo;
  headingStructure: HeadingInfo[];
  imageInfo: ImageInfo[];
  linksInfo: LinkInfo[];
  structuredData: StructuredDataInfo[];
  analyticsInfo: AnalyticsInfo[];
  spellCheck: SpellCheckInfo[];
  recommendations: RecommendationInfo[];
}

interface BasicInfo {
  title: string;
  url: string;
  language: string;
  charset: string;
  logo: string;
  description: string;
}

interface MetaInfo {
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

interface OpenGraphInfo {
  title: string;
  type: string;
  image: string;
  url: string;
  description: string;
  siteName: string;
  locale: string;
}

interface HeadingInfo {
  tag: string;
  text: string;
  level: number;
}

interface ImageInfo {
  src: string;
  alt: string;
  width: number;
  height: number;
  loading: string;
}

interface LinkInfo {
  href: string;
  text: string;
  type: string;
  title: string;
  rel: string;
}

interface StructuredDataInfo {
  type: string;
  name: string;
  content: Record<string, unknown>;
  products?: ProductInfo[];
}

interface ProductInfo {
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
  offers: OfferInfo[];
}

interface OfferInfo {
  price: string;
  currency: string;
  availability: string;
  condition: string;
  seller: string;
  url: string;
}

interface AnalyticsInfo {
  name: string;
  id: string;
  type: string;
  found: boolean;
}

interface SpellCheckInfo {
  word: string;
  suggestions: string[];
  context: string;
}

interface RecommendationInfo {
  category: string;
  issue: string;
  suggestion: string;
  priority: string;
}

interface BackgroundMessage {
  action: string;
  data?: SeoData;
  tabId?: number;
  url?: string;
  error?: string;
  message?: string;
}

interface SidebarMessage {
  type: string;
  data?: SeoData;
  error?: string;
  message?: string;
}

class BackgroundManager {
  private seoDataCache: Map<number, SeoData> = new Map();
  private sidebarPorts: Map<number, chrome.runtime.Port> = new Map();

  constructor() {
    this.init();
  }

  private init(): void {
    // 监听扩展图标点击事件
    chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
      if (tab.id && tab.url) {
        console.log(`点击扩展图标，标签页ID: ${tab.id}, URL: ${tab.url}`);

        try {
          // 打开侧边栏
          await chrome.sidePanel.open({ tabId: tab.id });
          console.log(`已为标签页 ${tab.id} 打开侧边栏`);

          // 注入内容脚本
          await this.injectContentScript(tab.id);

        } catch (error) {
          console.error('打开侧边栏失败:', error);
        }
      }
    });

    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((
      request: BackgroundMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: any) => void
    ) => {
      const tabId = sender.tab?.id;
      if (!tabId) return false;

      console.log(`收到来自标签页 ${tabId} 的消息:`, request);

      if (request.action === "setSeoData") {
        // 存储SEO数据
        this.seoDataCache.set(tabId, request.data!);
        console.log(`存储标签页 ${tabId} 的SEO数据:`, request.data);

        // 转发到对应的sidebar
        this.sendToSidebar(tabId, {
          type: "SEO_DATA",
          data: request.data
        });

        sendResponse({ success: true });
        return true;

      } else if (request.action === "getSeoData") {
        // 获取SEO数据
        const data = this.seoDataCache.get(tabId);
        console.log(`获取标签页 ${tabId} 的SEO数据:`, data);
        sendResponse({ data: data || null });
        return true;

      } else if (request.action === "analyzeUrl") {
        // 分析URL变化
        console.log(`标签页 ${tabId} URL变化为: ${request.url}`);

        // 清除旧数据
        this.seoDataCache.delete(tabId);

        // 通知sidebar URL变化
        this.sendToSidebar(tabId, {
          type: "URL_CHANGED",
          message: request.url
        });

        sendResponse({ success: true });
        return true;
      }

      return false;
    });

    // 监听来自sidebar的连接
    chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
      if (port.name === "sidebar") {
        console.log('Sidebar连接建立');

        // 获取当前活动标签页
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            const tabId = tabs[0].id;
            this.sidebarPorts.set(tabId, port);
            console.log(`Sidebar连接到标签页 ${tabId}`);

            // 监听端口断开
            port.onDisconnect.addListener(() => {
              console.log(`标签页 ${tabId} 的sidebar断开连接`);
              this.sidebarPorts.delete(tabId);
            });

            // 如果有缓存数据，立即发送
            const cachedData = this.seoDataCache.get(tabId);
            if (cachedData) {
              console.log(`发送缓存数据到标签页 ${tabId} 的sidebar`);
              this.sendToSidebar(tabId, {
                type: "SEO_DATA",
                data: cachedData
              });
            } else {
              // 如果没有缓存数据，请求content script分析页面
              console.log(`标签页 ${tabId} 没有缓存数据，请求content script分析`);
              chrome.tabs.sendMessage(tabId, { action: "analyzePage" }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error('请求分析页面失败:', chrome.runtime.lastError);
                  this.sendToSidebar(tabId, {
                    type: "ANALYSIS_ERROR",
                    error: "无法连接到页面内容脚本，请刷新页面重试"
                  });
                }
              });
            }
          }
        });
      }
    });

    // 监听标签页更新事件
    chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (changeInfo.status === 'complete') {
        // 页面加载完成，清除旧数据
        this.seoDataCache.delete(tabId);
        console.log(`标签页 ${tabId} 页面更新，清除旧数据`);
      }
    });

    // 监听标签页关闭事件
    chrome.tabs.onRemoved.addListener((tabId: number) => {
      this.seoDataCache.delete(tabId);
      this.sidebarPorts.delete(tabId);
      console.log(`标签页 ${tabId} 关闭，清理数据`);
    });
  }

  private sendToSidebar(tabId: number, message: SidebarMessage): void {
    const port = this.sidebarPorts.get(tabId);
    if (port) {
      try {
        port.postMessage(message);
        console.log(`发送消息到标签页 ${tabId} 的sidebar:`, message);
      } catch (error) {
        console.error(`发送消息到标签页 ${tabId} 失败:`, error);
        this.sidebarPorts.delete(tabId);
      }
    } else {
      console.warn(`标签页 ${tabId} 没有连接的sidebar`);
    }
  }

  private async injectContentScript(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      console.log(`已向标签页 ${tabId} 注入内容脚本`);
    } catch (error) {
      console.error(`注入内容脚本失败:`, error);
    }
  }
}

// 初始化背景管理器 - 使用IIFE避免全局变量冲突
(function () {
  'use strict';
  new BackgroundManager();
})(); 