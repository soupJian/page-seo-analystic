// 侧边栏脚本 - 数据展示和用户交互

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

interface MessageData {
  type: string;
  data?: SeoData;
  error?: string;
  message?: string;
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

class SidebarManager {
  private port: chrome.runtime.Port | null = null;
  private seoData: SeoData | null = null;
  private isLoading: boolean = false;
  private error: string | null = null;

  // 分页状态
  private imagePagination: PaginationState = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  };

  private linkPagination: PaginationState = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  };

  constructor() {
    // 确保DOM完全加载后再初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  private init(): void {
    console.log('=== Sidebar初始化开始 ===');
    console.log('DOM状态:', document.readyState);

    this.connectToBackground();
    this.setupEventListeners();
    this.showLoading();

    console.log('=== Sidebar初始化完成 ===');
  }

  private connectToBackground(): void {
    this.port = chrome.runtime.connect({ name: 'sidebar' });

    this.port.onMessage.addListener((message: MessageData) => {
      console.log('=== 收到消息 ===');
      console.log('消息类型:', message.type);
      console.log('消息数据:', message.data);
      console.log('消息错误:', message.error);
      console.log('当前loading状态:', this.isLoading);

      switch (message.type) {
        case 'SEO_DATA':
          console.log('处理SEO_DATA消息');
          this.handleSeoData(message.data!);
          break;
        case 'URL_CHANGED':
          console.log('处理URL_CHANGED消息');
          this.showUrlChangeNotice(message);
          break;
        case 'ANALYSIS_ERROR':
          console.log('处理ANALYSIS_ERROR消息');
          this.showError(message.error || '分析失败');
          break;
        default:
          console.warn('未知消息类型:', message.type);
      }
    });

    this.port.onDisconnect.addListener(() => {
      console.log('与background的连接断开');
      this.port = null;
    });
  }

  private setupEventListeners(): void {
    // 重新分析按钮
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('reanalyze-btn')) {
        this.triggerReanalysis();
      }

      // 图片分页
      if (target.classList.contains('image-page-btn')) {
        const page = parseInt(target.dataset.page || '1');
        this.goToImagePage(page);
      }

      // 链接分页
      if (target.classList.contains('link-page-btn')) {
        const page = parseInt(target.dataset.page || '1');
        this.goToLinkPage(page);
      }

      // 导出Excel
      if (target.classList.contains('export-images-btn')) {
        this.exportImagesToExcel();
      }

      if (target.classList.contains('export-links-btn')) {
        this.exportLinksToExcel();
      }
    });
  }

  private showLoading(): void {
    this.isLoading = true;
    this.error = null;
    this.updateUI();
  }

  private showError(errorMessage: string): void {
    this.isLoading = false;
    this.error = errorMessage;
    this.updateUI();
  }

  private showUrlChangeNotice(message: MessageData): void {
    const container = document.getElementById('contentArea');
    if (container) {
      container.innerHTML = `
        <div class="url-change-notice">
          <div class="notice-icon">🔄</div>
          <h3>页面已变化</h3>
          <p>检测到URL变化: ${message.message}</p>
          <button class="reanalyze-btn">重新分析当前页面</button>
        </div>
      `;
    }
  }

  private handleSeoData(data: SeoData): void {
    console.log('=== handleSeoData 开始 ===');
    console.log('接收到的数据:', data);
    console.log('数据是否有效:', !!data);

    this.seoData = data;
    this.isLoading = false;
    this.error = null;

    console.log('设置后的状态:');
    console.log('- seoData:', !!this.seoData);
    console.log('- isLoading:', this.isLoading);
    console.log('- error:', this.error);

    // 初始化分页
    this.imagePagination.totalItems = data.imageInfo.length;
    this.imagePagination.totalPages = Math.ceil(data.imageInfo.length / this.imagePagination.itemsPerPage);

    this.linkPagination.totalItems = data.linksInfo.length;
    this.linkPagination.totalPages = Math.ceil(data.linksInfo.length / this.linkPagination.itemsPerPage);

    console.log('分页信息:');
    console.log('- 图片总数:', this.imagePagination.totalItems);
    console.log('- 链接总数:', this.linkPagination.totalItems);

    console.log('准备调用updateUI');
    this.updateUI();
    console.log('=== handleSeoData 结束 ===');
  }

  private updateUI(): void {
    console.log('=== updateUI 开始 ===');
    const container = document.getElementById('contentArea');
    console.log('容器元素:', container);

    if (!container) {
      console.error('找不到contentArea容器元素');
      return;
    }

    console.log('当前状态检查:');
    console.log('- isLoading:', this.isLoading);
    console.log('- error:', this.error);
    console.log('- seoData:', !!this.seoData);

    if (this.isLoading) {
      console.log('显示加载中...');
      container.innerHTML = this.getLoadingHTML();
      return;
    }

    if (this.error) {
      console.log('显示错误:', this.error);
      container.innerHTML = this.getErrorHTML();
      return;
    }

    if (!this.seoData) {
      console.log('显示无数据');
      container.innerHTML = this.getNoDataHTML();
      return;
    }

    console.log('显示主要内容');
    container.innerHTML = this.getMainHTML();
    console.log('=== updateUI 结束 ===');
  }

  private getLoadingHTML(): string {
    return `
      <div class="flex flex-col items-center justify-center min-h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl mx-4 my-6">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div class="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-pulse"></div>
        </div>
        <div class="mt-6 text-center">
          <h3 class="text-lg font-semibold text-gray-800 mb-2">正在分析页面</h3>
          <p class="text-sm text-gray-600">正在收集SEO数据，请稍候...</p>
          <div class="flex justify-center mt-4 space-x-1">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      </div>
    `;
  }

  private getErrorHTML(): string {
    return `
      <div class="flex flex-col items-center justify-center min-h-96 bg-gradient-to-br from-red-50 to-pink-100 rounded-xl mx-4 my-6 p-8">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">分析失败</h3>
        <p class="text-sm text-gray-600 text-center mb-6 max-w-xs">${this.error}</p>
        <button class="reanalyze-btn bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>重新分析</span>
        </button>
      </div>
    `;
  }

  private getNoDataHTML(): string {
    return `
      <div class="flex flex-col items-center justify-center min-h-96 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl mx-4 my-6 p-8">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">暂无数据</h3>
        <p class="text-sm text-gray-600 text-center mb-6 max-w-xs">点击扩展图标开始分析当前页面的SEO信息</p>
        <div class="flex items-center space-x-2 text-xs text-gray-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>确保页面已完全加载</span>
        </div>
      </div>
    `;
  }

  private getMainHTML(): string {
    if (!this.seoData) return '';

    return `
      <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div class="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h2 class="text-lg font-bold text-gray-800">SEO 分析报告</h2>
            </div>
            <button class="reanalyze-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>重新分析</span>
            </button>
          </div>
        </div>
        
        <div class="p-4 space-y-6">
          ${this.getBasicInfoHTML()}
          ${this.getMetaInfoHTML()}
          ${this.getOpenGraphHTML()}
          ${this.getHeadingStructureHTML()}
          ${this.getImageInfoHTML()}
          ${this.getLinksInfoHTML()}
          ${this.getStructuredDataHTML()}
          ${this.getAnalyticsHTML()}
          ${this.getSpellCheckHTML()}
          ${this.getRecommendationsHTML()}
        </div>
      </div>
    `;
  }

  private getBasicInfoHTML(): string {
    const basic = this.seoData!.basicInfo;
    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white">基本信息</h3>
          </div>
        </div>
        <div class="p-6">
          <div class="grid gap-4">
            <div class="flex flex-col">
              <label class="text-sm font-medium text-gray-500 mb-1">页面标题</label>
              <span class="text-gray-900 font-medium">${basic.title || '-'}</span>
            </div>
            <div class="flex flex-col">
              <label class="text-sm font-medium text-gray-500 mb-1">页面URL</label>
              <span class="text-blue-600 text-sm break-all hover:text-blue-800 transition-colors">${basic.url || '-'}</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col">
                <label class="text-sm font-medium text-gray-500 mb-1">语言</label>
                <span class="text-gray-900 px-2 py-1 bg-gray-100 rounded text-sm">${basic.language || '-'}</span>
              </div>
              <div class="flex flex-col">
                <label class="text-sm font-medium text-gray-500 mb-1">字符集</label>
                <span class="text-gray-900 px-2 py-1 bg-gray-100 rounded text-sm">${basic.charset || '-'}</span>
              </div>
            </div>
            ${basic.logo ? `
              <div class="flex flex-col">
                <label class="text-sm font-medium text-gray-500 mb-2">网站Logo</label>
                <div class="flex items-center space-x-3">
                  <img src="${basic.logo}" alt="Logo" class="w-12 h-12 rounded-lg object-cover border border-gray-200">
                  <span class="text-sm text-gray-600 break-all">${basic.logo}</span>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private getMetaInfoHTML(): string {
    const meta = this.seoData!.metaInfo;
    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white">Meta 信息</h3>
          </div>
        </div>
        <div class="p-6">
          <div class="grid gap-4">
            <div class="flex flex-col">
              <label class="text-sm font-medium text-gray-500 mb-1">页面描述</label>
              <span class="text-gray-900 text-sm leading-relaxed">${meta.description || '-'}</span>
            </div>
            <div class="flex flex-col">
              <label class="text-sm font-medium text-gray-500 mb-1">关键词</label>
              <span class="text-gray-900 text-sm">${meta.keywords || '-'}</span>
            </div>
            <div class="flex flex-col">
              <label class="text-sm font-medium text-gray-500 mb-1">Canonical URL</label>
              <span class="text-blue-600 text-sm break-all hover:text-blue-800 transition-colors">${meta.canonical || '-'}</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col">
                <label class="text-sm font-medium text-gray-500 mb-1">Robots</label>
                <span class="text-gray-900 px-2 py-1 bg-gray-100 rounded text-sm">${meta.robots || '-'}</span>
              </div>
              <div class="flex flex-col">
                <label class="text-sm font-medium text-gray-500 mb-1">Viewport</label>
                <span class="text-gray-900 px-2 py-1 bg-gray-100 rounded text-sm">${meta.viewport || '-'}</span>
          </div>
        </div>
      </div>
    `;
  }

  private getOpenGraphHTML(): string {
    const og = this.seoData!.openGraphInfo;
    return `
      <div class="seo-card">
        <h3>Open Graph</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>标题:</label>
            <span>${og.title || '-'}</span>
          </div>
          <div class="info-item">
            <label>类型:</label>
            <span>${og.type || '-'}</span>
          </div>
          <div class="info-item">
            <label>图片:</label>
            <span>${og.image || '-'}</span>
          </div>
          <div class="info-item">
            <label>URL:</label>
            <span>${og.url || '-'}</span>
          </div>
          <div class="info-item">
            <label>描述:</label>
            <span>${og.description || '-'}</span>
          </div>
          <div class="info-item">
            <label>站点名:</label>
            <span>${og.siteName || '-'}</span>
          </div>
        </div>
      </div>
    `;
  }

  private getHeadingStructureHTML(): string {
    const headings = this.seoData!.headingStructure;
    if (headings.length === 0) {
      return `
        <div class="seo-card">
          <h3>标题结构</h3>
          <p class="no-data">未找到标题标签</p>
        </div>
      `;
    }

    const headingItems = headings.map(heading => `
      <div class="heading-item">
        <span class="heading-tag heading-${heading.level}">${heading.tag.toUpperCase()}</span>
        <span class="heading-text">${heading.text}</span>
      </div>
    `).join('');

    return `
      <div class="seo-card">
        <h3>标题结构 (${headings.length})</h3>
        <div class="heading-structure">
          ${headingItems}
        </div>
      </div>
    `;
  }

  private getImageInfoHTML(): string {
    const images = this.seoData!.imageInfo;
    if (images.length === 0) {
      return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white">图片信息</h3>
            </div>
          </div>
          <div class="p-6 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <p class="text-gray-500">未找到图片</p>
          </div>
        </div>
      `;
    }

    const startIndex = (this.imagePagination.currentPage - 1) * this.imagePagination.itemsPerPage;
    const endIndex = startIndex + this.imagePagination.itemsPerPage;
    const pageImages = images.slice(startIndex, endIndex);

    const imageRows = pageImages.map(image => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="p-4">
          <img src="${image.src}" alt="${image.alt || '-'}" 
               class="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm">
        </td>
        <td class="p-4">
          <a href="${image.src}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm font-medium break-all transition-colors">
            ${image.src.length > 40 ? image.src.substring(0, 40) + '...' : image.src}
          </a>
        </td>
        <td class="p-4">
          <span class="text-gray-900 text-sm ${image.alt ? '' : 'text-gray-400 italic'}">${image.alt || '无Alt文本'}</span>
        </td>
        <td class="p-4">
          <span class="text-gray-600 text-sm font-mono bg-gray-100 px-2 py-1 rounded">${image.width}×${image.height}</span>
        </td>
      </tr>
    `).join('');

    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white">图片信息</h3>
              <span class="bg-white/20 text-white px-2 py-1 rounded-full text-sm font-medium">${images.length}</span>
            </div>
            <button class="export-images-btn bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>导出Excel</span>
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left p-4 font-medium text-gray-700">图片</th>
                <th class="text-left p-4 font-medium text-gray-700">链接</th>
                <th class="text-left p-4 font-medium text-gray-700">Alt文本</th>
                <th class="text-left p-4 font-medium text-gray-700">尺寸</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${imageRows}
            </tbody>
          </table>
        </div>
        ${this.getPaginationHTML(this.imagePagination, 'image')}
      </div>
    `;
  }

  private getLinksInfoHTML(): string {
    const links = this.seoData!.linksInfo;
    if (links.length === 0) {
      return `
        <div class="seo-card">
          <h3>链接信息</h3>
          <p class="no-data">未找到链接</p>
        </div>
      `;
    }

    const startIndex = (this.linkPagination.currentPage - 1) * this.linkPagination.itemsPerPage;
    const endIndex = startIndex + this.linkPagination.itemsPerPage;
    const pageLinks = links.slice(startIndex, endIndex);

    const linkRows = pageLinks.map(link => `
      <tr>
        <td>
          <a href="${link.href}" target="_blank" class="link-url">
            ${link.href.length > 50 ? link.href.substring(0, 50) + '...' : link.href}
          </a>
        </td>
        <td>${link.text || '-'}</td>
        <td><span class="link-type link-type-${link.type}">${link.type}</span></td>
        <td>${link.title || '-'}</td>
      </tr>
    `).join('');

    return `
      <div class="seo-card">
        <h3>链接信息 (${links.length})</h3>
        <div class="table-actions">
          <button class="export-links-btn">导出Excel</button>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>链接</th>
                <th>文本</th>
                <th>类型</th>
                <th>标题</th>
              </tr>
            </thead>
            <tbody>
              ${linkRows}
            </tbody>
          </table>
        </div>
        ${this.getPaginationHTML(this.linkPagination, 'link')}
      </div>
    `;
  }

  private getStructuredDataHTML(): string {
    const structured = this.seoData!.structuredData;
    if (structured.length === 0) {
      return `
        <div class="seo-card">
          <h3>结构化数据</h3>
          <p class="no-data">未找到结构化数据</p>
        </div>
      `;
    }

    const schemaItems = structured.map((schema) => `
      <div class="schema-item">
        <div class="schema-header">
          <span class="schema-type">${schema.type}</span>
          <span class="schema-name">${schema.name}</span>
        </div>
        ${schema.products && schema.products.length > 0 ? `
          <div class="product-info">
            <h4>产品信息:</h4>
            ${schema.products.map(product => `
              <div class="product-item">
                <p><strong>名称:</strong> ${product.name}</p>
                <p><strong>品牌:</strong> ${product.brand}</p>
                <p><strong>价格:</strong> ${product.price} ${product.currency}</p>
                <p><strong>SKU:</strong> ${product.sku}</p>
                <p><strong>库存:</strong> ${product.availability}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <details class="schema-details">
          <summary>查看原始数据</summary>
          <pre class="schema-raw">${JSON.stringify(schema.content, null, 2)}</pre>
        </details>
      </div>
    `).join('');

    return `
      <div class="seo-card">
        <h3>结构化数据 (${structured.length})</h3>
        <div class="schema-list">
          ${schemaItems}
        </div>
      </div>
    `;
  }

  private getAnalyticsHTML(): string {
    const analytics = this.seoData!.analyticsInfo;
    const foundTools = analytics.filter(tool => tool.found);

    if (foundTools.length === 0) {
      return `
        <div class="seo-card">
          <h3>分析工具</h3>
          <p class="no-data">未检测到分析工具</p>
        </div>
      `;
    }

    const toolItems = foundTools.map(tool => `
      <div class="analytics-item">
        <div class="tool-info">
          <span class="tool-name">${tool.name}</span>
          <span class="tool-type">${tool.type}</span>
        </div>
        ${tool.id ? `<div class="tool-id">ID: ${tool.id}</div>` : ''}
      </div>
    `).join('');

    return `
      <div class="seo-card">
        <h3>分析工具 (${foundTools.length})</h3>
        <div class="analytics-list">
          ${toolItems}
        </div>
      </div>
    `;
  }

  private getSpellCheckHTML(): string {
    const spellCheck = this.seoData!.spellCheck;
    if (spellCheck.length === 0) {
      return `
        <div class="seo-card">
          <h3>拼写检查</h3>
          <p class="no-data">未发现拼写错误</p>
        </div>
      `;
    }

    const spellItems = spellCheck.map(spell => `
      <div class="spell-item">
        <div class="spell-word">${spell.word}</div>
        <div class="spell-suggestions">
          建议: ${spell.suggestions.join(', ')}
        </div>
        <div class="spell-context">${spell.context}</div>
      </div>
    `).join('');

    return `
      <div class="seo-card">
        <h3>拼写检查 (${spellCheck.length})</h3>
        <div class="spell-list">
          ${spellItems}
        </div>
      </div>
    `;
  }

  private getRecommendationsHTML(): string {
    const recommendations = this.seoData!.recommendations;
    if (recommendations.length === 0) {
      return `
        <div class="seo-card">
          <h3>优化建议</h3>
          <p class="no-data">暂无优化建议</p>
        </div>
      `;
    }

    const recItems = recommendations.map(rec => `
      <div class="recommendation-item priority-${rec.priority}">
        <div class="rec-header">
          <span class="rec-category">${rec.category}</span>
          <span class="rec-priority">${rec.priority}</span>
        </div>
        <div class="rec-issue">${rec.issue}</div>
        <div class="rec-suggestion">${rec.suggestion}</div>
      </div>
    `).join('');

    return `
      <div class="seo-card">
        <h3>优化建议 (${recommendations.length})</h3>
        <div class="recommendations-list">
          ${recItems}
        </div>
      </div>
    `;
  }

  private getPaginationHTML(pagination: PaginationState, type: string): string {
    if (pagination.totalPages <= 1) return '';

    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    // 上一页
    if (pagination.currentPage > 1) {
      pages.push(`
        <button class="${type}-page-btn px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1" data-page="${pagination.currentPage - 1}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          <span>上一页</span>
        </button>
      `);
    }

    // 页码
    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === pagination.currentPage;
      pages.push(`
        <button class="${type}-page-btn px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
        }" data-page="${i}">
          ${i}
        </button>
      `);
    }

    // 下一页
    if (pagination.currentPage < pagination.totalPages) {
      pages.push(`
        <button class="${type}-page-btn px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1" data-page="${pagination.currentPage + 1}">
          <span>下一页</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      `);
    }

    return `
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            显示 <span class="font-medium">${((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> - 
            <span class="font-medium">${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> 
            / <span class="font-medium">${pagination.totalItems}</span> 项
          </div>
          <div class="flex items-center space-x-2">
            ${pages.join('')}
          </div>
        </div>
      </div>
    `;
  }

  private goToImagePage(page: number): void {
    this.imagePagination.currentPage = page;
    this.updateUI();
  }

  private goToLinkPage(page: number): void {
    this.linkPagination.currentPage = page;
    this.updateUI();
  }

  private triggerReanalysis(): void {
    this.showLoading();
    // 通过消息传递触发重新分析
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'analyzePage' });
      }
    });
  }

  private exportImagesToExcel(): void {
    if (!this.seoData?.imageInfo.length) return;

    const data = this.seoData.imageInfo.map(image => ({
      '图片链接': image.src,
      'Alt文本': image.alt || '-',
      '宽度': image.width,
      '高度': image.height,
      '加载方式': image.loading || '-'
    }));

    this.downloadExcel(data, '图片信息.xlsx');
  }

  private exportLinksToExcel(): void {
    if (!this.seoData?.linksInfo.length) return;

    const data = this.seoData.linksInfo.map(link => ({
      '链接地址': link.href,
      '链接文本': link.text || '-',
      '链接类型': link.type,
      '标题': link.title || '-',
      'Rel属性': link.rel || '-'
    }));

    this.downloadExcel(data, '链接信息.xlsx');
  }

  private downloadExcel(data: Record<string, unknown>[], filename: string): void {
    // 简单的CSV导出实现
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename.replace('.xlsx', '.csv');
    link.click();
  }
}

// 初始化侧边栏管理器 - 使用IIFE避免全局变量冲突
(function (global) {
  'use strict';

  // 检查是否已经初始化过，避免重复初始化
  if (global.__sidebarManagerInitialized) {
    return;
  }
  global.__sidebarManagerInitialized = true;

  // 在局部作用域中创建实例，避免全局变量冲突
  const sidebarManager = new SidebarManager();

  // 将实例存储到全局作用域中供事件处理使用
  global.sidebarManager = sidebarManager;

})(window as any); 