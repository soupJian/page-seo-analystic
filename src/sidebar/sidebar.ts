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
    console.log('=== 开始连接到background ===');
    this.port = chrome.runtime.connect({ name: 'sidebar' });
    console.log('端口创建成功:', this.port);

    this.port.onMessage.addListener((message: MessageData) => {
      console.log('=== 收到消息 ===');
      console.log('消息类型:', message.type);
      console.log('消息数据:', message.data);
      console.log('消息错误:', message.error);
      console.log('当前loading状态:', this.isLoading);
      console.log('当前seoData状态:', !!this.seoData);

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

    console.log('=== 连接到background完成 ===');
  }

  private setupEventListeners(): void {
    // 静态重新分析按钮（在header中的按钮）
    const reanalyzeBtn = document.getElementById('reanalyzeBtn');
    if (reanalyzeBtn) {
      reanalyzeBtn.addEventListener('click', () => this.triggerReanalysis());
    }

    // URL变化后的重新分析按钮
    const reanalyzeAfterUrlChange = document.getElementById('reanalyzeAfterUrlChange');
    if (reanalyzeAfterUrlChange) {
      reanalyzeAfterUrlChange.addEventListener('click', () => this.triggerReanalysis());
    }

    // 全局点击事件监听器（用于动态生成的按钮）
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

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
    console.log('数据类型检查:', typeof data);
    console.log('数据属性检查:', Object.keys(data || {}));

    if (!data) {
      console.error('接收到的数据为空或无效');
      return;
    }

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

    // 显示/隐藏状态卡片
    this.updateStatusCards();

    // 更新内容区域
    this.updateContentArea();

    console.log('=== updateUI 结束 ===');
  }

  private updateStatusCards(): void {
    const loadingStatus = document.getElementById('loadingStatus');
    const urlChangeNotice = document.getElementById('urlChangeNotice');
    const errorStatus = document.getElementById('errorStatus');

    if (this.isLoading) {
      loadingStatus?.classList.remove('hidden');
      urlChangeNotice?.classList.add('hidden');
      errorStatus?.classList.add('hidden');
    } else if (this.error) {
      loadingStatus?.classList.add('hidden');
      urlChangeNotice?.classList.add('hidden');
      errorStatus?.classList.remove('hidden');
      if (errorStatus) {
        const errorMessage = errorStatus.querySelector('#errorMessage');
        if (errorMessage) {
          errorMessage.textContent = this.error;
        }
      }
    } else {
      loadingStatus?.classList.add('hidden');
      urlChangeNotice?.classList.add('hidden');
      errorStatus?.classList.add('hidden');
    }
  }

  private updateContentArea(): void {
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
    console.log('- seoData详情:', this.seoData);

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
    const mainHTML = this.getMainHTML();
    console.log('生成的HTML长度:', mainHTML.length);
    console.log('HTML预览:', mainHTML.substring(0, 200) + '...');

    container.innerHTML = mainHTML;
    console.log('HTML已更新到容器');

    // 重新绑定事件监听器，因为innerHTML会清除事件监听器
    this.bindEventListeners();
    console.log('事件监听器已重新绑定');
  }

  private bindEventListeners(): void {
    // 重新绑定所有动态生成的按钮事件
    const reanalyzeButtons = document.querySelectorAll('.reanalyze-btn');
    reanalyzeButtons.forEach(button => {
      button.addEventListener('click', () => this.triggerReanalysis());
    });

    const imagePageButtons = document.querySelectorAll('.image-page-btn');
    imagePageButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const page = parseInt((e.target as HTMLElement).dataset.page || '1');
        this.goToImagePage(page);
      });
    });

    const linkPageButtons = document.querySelectorAll('.link-page-btn');
    linkPageButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const page = parseInt((e.target as HTMLElement).dataset.page || '1');
        this.goToLinkPage(page);
      });
    });

    const exportImagesButtons = document.querySelectorAll('.export-images-btn');
    exportImagesButtons.forEach(button => {
      button.addEventListener('click', () => this.exportImagesToExcel());
    });

    const exportLinksButtons = document.querySelectorAll('.export-links-btn');
    exportLinksButtons.forEach(button => {
      button.addEventListener('click', () => this.exportLinksToExcel());
    });
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
    `;
  }

  private getBasicInfoHTML(): string {
    const basic = this.seoData!.basicInfo;
    return `
      <div class="seo-card fade-in">
        <h2 class="seo-card-header basic-info">
          <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          基本信息
        </h2>
        <div class="seo-card-content">
          <div class="data-item">
            <span class="data-label">页面标题</span>
            <span class="data-value">${basic.title || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">页面URL</span>
            <span class="data-value">${basic.url || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">语言</span>
            <span class="data-value">${basic.language || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">字符集</span>
            <span class="data-value">${basic.charset || '-'}</span>
          </div>
          ${basic.logo ? `
            <div class="data-item">
              <span class="data-label">网站Logo</span>
              <span class="data-value">${basic.logo}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private getMetaInfoHTML(): string {
    const meta = this.seoData!.metaInfo;
    return `
      <div class="seo-card fade-in">
        <h2 class="seo-card-header meta-info">
          <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
          </svg>
          Meta 信息
        </h2>
        <div class="seo-card-content">
          <div class="data-item">
            <span class="data-label">页面描述</span>
            <span class="data-value">${meta.description || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">关键词</span>
            <span class="data-value">${meta.keywords || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Canonical URL</span>
            <span class="data-value">${meta.canonical || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Robots</span>
            <span class="data-value">${meta.robots || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Viewport</span>
            <span class="data-value">${meta.viewport || '-'}</span>
          </div>
        </div>
      </div>
    `;
  }

  private getOpenGraphHTML(): string {
    const og = this.seoData!.openGraphInfo;
    return `
      <div class="seo-card fade-in">
        <h2 class="seo-card-header og-info">
          <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
          </svg>
          Open Graph 信息
        </h2>
        <div class="seo-card-content">
          <div class="data-item">
            <span class="data-label">标题</span>
            <span class="data-value">${og.title || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">类型</span>
            <span class="data-value">${og.type || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">图片</span>
            <span class="data-value">${og.image || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">URL</span>
            <span class="data-value">${og.url || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">描述</span>
            <span class="data-value">${og.description || '-'}</span>
          </div>
          <div class="data-item">
            <span class="data-label">站点名</span>
            <span class="data-value">${og.siteName || '-'}</span>
          </div>
        </div>
      </div>
    `;
  }

  private getHeadingStructureHTML(): string {
    const headings = this.seoData!.headingStructure;
    if (headings.length === 0) {
      return `
        <div class="seo-card fade-in">
          <h2 class="seo-card-header heading-info">
            <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
            </svg>
            标题结构
          </h2>
          <div class="seo-card-content">
            <div class="empty-state">
              <p>未找到标题标签</p>
            </div>
          </div>
        </div>
      `;
    }

    const headingItems = headings.map(heading => `
      <div class="data-item">
        <span class="tag tag-${heading.tag.toLowerCase()}">${heading.tag.toUpperCase()}</span>
        <span class="data-value">${heading.text}</span>
      </div>
    `).join('');

    return `
      <div class="seo-card fade-in">
        <h2 class="seo-card-header heading-info">
          <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
          </svg>
          标题结构 <span style="opacity: 0.8; font-weight: 400;">(${headings.length})</span>
        </h2>
        <div class="seo-card-content">
          ${headingItems}
        </div>
      </div>
    `;
  }

  private getImageInfoHTML(): string {
    const images = this.seoData!.imageInfo;
    if (images.length === 0) {
      return `
        <div class="seo-card fade-in">
          <h2 class="seo-card-header image-info">
            <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            图片信息
          </h2>
          <div class="seo-card-content">
            <div class="empty-state">
              <p>未找到图片</p>
            </div>
          </div>
        </div>
      `;
    }

    const startIndex = (this.imagePagination.currentPage - 1) * this.imagePagination.itemsPerPage;
    const endIndex = startIndex + this.imagePagination.itemsPerPage;
    const pageImages = images.slice(startIndex, endIndex);

    const imageRows = pageImages.map(image => `
      <tr>
        <td>
          <img src="${image.src}" alt="${image.alt || '-'}" 
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 0.5rem; border: 1px solid #e2e8f0;">
        </td>
        <td>
          <a href="${image.src}" target="_blank" class="data-value">
            ${image.src.length > 50 ? image.src.substring(0, 50) + '...' : image.src}
          </a>
        </td>
        <td>
          <span class="${image.alt ? '' : 'text-gray-400 italic'}">${image.alt || '无Alt文本'}</span>
        </td>
        <td>
          <span class="tag tag-found">${image.width}×${image.height}</span>
        </td>
      </tr>
    `).join('');

    return `
      <div class="seo-card fade-in">
        <h2 class="seo-card-header image-info">
          <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          图片信息 <span style="opacity: 0.8; font-weight: 400;">(${images.length})</span>
          <button class="export-images-btn export-btn" style="margin-left: auto; padding: 0.5rem 1rem; font-size: 0.75rem;">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" style="margin-right: 0.25rem;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            导出Excel
          </button>
        </h2>
        <div class="seo-card-content">
          <table class="data-table">
            <thead>
              <tr>
                <th>图片</th>
                <th>链接</th>
                <th>Alt文本</th>
                <th>尺寸</th>
              </tr>
            </thead>
            <tbody>
              ${imageRows}
            </tbody>
          </table>
          ${this.getPaginationHTML(this.imagePagination, 'image')}
        </div>
      </div>
    `;
  }

  private getLinksInfoHTML(): string {
    const links = this.seoData!.linksInfo;
    if (links.length === 0) {
      return `
        <div class="seo-card fade-in">
          <h2 class="seo-card-header links-info">
            <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            链接信息
          </h2>
          <div class="seo-card-content">
            <div class="empty-state">
              <p>未找到链接</p>
            </div>
          </div>
        </div>
      `;
    }

    const startIndex = (this.linkPagination.currentPage - 1) * this.linkPagination.itemsPerPage;
    const endIndex = startIndex + this.linkPagination.itemsPerPage;
    const pageLinks = links.slice(startIndex, endIndex);

    const linkRows = pageLinks.map(link => `
      <tr>
        <td>
          <a href="${link.href}" target="_blank" class="data-value">
            ${link.href.length > 50 ? link.href.substring(0, 50) + '...' : link.href}
          </a>
        </td>
        <td>${link.text || '-'}</td>
        <td><span class="tag tag-${link.type}">${link.type}</span></td>
        <td>${link.title || '-'}</td>
      </tr>
    `).join('');

    return `
      <div class="seo-card fade-in">
        <h2 class="seo-card-header links-info">
          <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          链接信息 <span style="opacity: 0.8; font-weight: 400;">(${links.length})</span>
          <button class="export-links-btn export-btn" style="margin-left: auto; padding: 0.5rem 1rem; font-size: 0.75rem;">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" style="margin-right: 0.25rem;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            导出Excel
          </button>
        </h2>
        <div class="seo-card-content">
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
          ${this.getPaginationHTML(this.linkPagination, 'link')}
        </div>
      </div>
    `;
  }

  private getStructuredDataHTML(): string {
    const structured = this.seoData!.structuredData;
    if (structured.length === 0) {
      return `
        <div class="seo-card fade-in">
          <h2 class="seo-card-header structured-info">
            <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            结构化数据
          </h2>
          <div class="seo-card-content">
            <div class="empty-state">
              <p>未找到结构化数据</p>
            </div>
          </div>
        </div>
      `;
    }

    const schemaItems = structured.map((schema) => `
      <div class="data-item">
        <span class="data-label">类型</span>
        <span class="data-value">
          <span class="tag tag-found">${schema.type}</span>
          ${schema.name ? `<span class="tag tag-medium">${schema.name}</span>` : ''}
        </span>
      </div>
      ${schema.products && schema.products.length > 0 ? `
        <div class="data-item">
          <span class="data-label">产品信息</span>
          <span class="data-value">
            ${schema.products.map(product => `
              <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: #f8fafc; border-radius: 0.25rem;">
                <div><strong>名称:</strong> ${product.name}</div>
                <div><strong>品牌:</strong> ${product.brand}</div>
                <div><strong>价格:</strong> ${product.price} ${product.currency}</div>
                <div><strong>SKU:</strong> ${product.sku}</div>
                <div><strong>库存:</strong> ${product.availability}</div>
              </div>
            `).join('')}
          </span>
        </div>
      ` : ''}
    `).join('');

    return `
      <div class="seo-card fade-in">
        <h2 class="seo-card-header structured-info">
          <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          结构化数据 <span style="opacity: 0.8; font-weight: 400;">(${structured.length})</span>
        </h2>
        <div class="seo-card-content">
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
        <div class="seo-card fade-in">
          <h2 class="seo-card-header analytics-info">
            <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            分析工具
          </h2>
          <div class="seo-card-content">
            <div class="empty-state">
              <p>未检测到分析工具</p>
            </div>
          </div>
        </div>
      `;
    }

    const toolItems = foundTools.map(tool => `
      <div class="data-item">
        <span class="data-label">工具</span>
        <span class="data-value">
          <span class="tag tag-found">${tool.name}</span>
          <span class="tag tag-${tool.type}">${tool.type}</span>
          ${tool.id ? `<span class="tag tag-medium">ID: ${tool.id}</span>` : ''}
        </span>
      </div>
    `).join('');

    return `
      <div class="seo-card fade-in">
        <h2 class="seo-card-header analytics-info">
          <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          分析工具 <span style="opacity: 0.8; font-weight: 400;">(${foundTools.length})</span>
        </h2>
        <div class="seo-card-content">
          ${toolItems}
        </div>
      </div>
    `;
  }

  private getSpellCheckHTML(): string {
    const spellCheck = this.seoData!.spellCheck;
    if (spellCheck.length === 0) {
      return `
        <div class="seo-card fade-in">
          <h2 class="seo-card-header spell-info">
            <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            拼写检查
          </h2>
          <div class="seo-card-content">
            <div class="empty-state">
              <p>未发现拼写错误</p>
            </div>
          </div>
        </div>
      `;
    }

    const spellItems = spellCheck.map(spell => `
      <div class="data-item">
        <span class="data-label">错误单词</span>
        <span class="data-value">
          <span class="tag tag-high">${spell.word}</span>
          <div style="margin-top: 0.5rem;">
            <strong>建议:</strong> ${spell.suggestions.join(', ')}
          </div>
          <div style="margin-top: 0.25rem; font-size: 0.875rem; color: #64748b;">
            <strong>上下文:</strong> ${spell.context}
          </div>
        </span>
      </div>
    `).join('');

    return `
      <div class="seo-card fade-in">
        <h2 class="seo-card-header spell-info">
          <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          拼写检查 <span style="opacity: 0.8; font-weight: 400;">(${spellCheck.length})</span>
        </h2>
        <div class="seo-card-content">
          ${spellItems}
        </div>
      </div>
    `;
  }

  private getRecommendationsHTML(): string {
    const recommendations = this.seoData!.recommendations;
    if (recommendations.length === 0) {
      return `
        <div class="seo-card fade-in">
          <h2 class="seo-card-header recommendations-info">
            <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            优化建议
          </h2>
          <div class="seo-card-content">
            <div class="empty-state">
              <p>暂无优化建议</p>
            </div>
          </div>
        </div>
      `;
    }

    const recItems = recommendations.map(rec => `
      <div class="data-item">
        <span class="data-label">建议</span>
        <span class="data-value">
          <div style="margin-bottom: 0.5rem;">
            <span class="tag tag-${rec.priority}">${rec.priority}</span>
            <span class="tag tag-medium">${rec.category}</span>
          </div>
          <div style="margin-bottom: 0.25rem;">
            <strong>问题:</strong> ${rec.issue}
          </div>
          <div style="font-size: 0.875rem; color: #059669;">
            <strong>建议:</strong> ${rec.suggestion}
          </div>
        </span>
      </div>
    `).join('');

    return `
      <div class="seo-card fade-in">
        <h2 class="seo-card-header recommendations-info">
          <svg class="seo-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          优化建议 <span style="opacity: 0.8; font-weight: 400;">(${recommendations.length})</span>
        </h2>
        <div class="seo-card-content">
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
        <button class="${type}-page-btn pagination-btn" data-page="${pagination.currentPage - 1}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" style="margin-right: 0.25rem;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          上一页
        </button>
      `);
    }

    // 页码
    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === pagination.currentPage;
      pages.push(`
        <button class="${type}-page-btn pagination-btn ${isActive ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `);
    }

    // 下一页
    if (pagination.currentPage < pagination.totalPages) {
      pages.push(`
        <button class="${type}-page-btn pagination-btn" data-page="${pagination.currentPage + 1}">
          下一页
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14" style="margin-left: 0.25rem;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      `);
    }

    return `
      <div class="pagination">
        <div class="pagination-info">
          显示 <span style="font-weight: 600;">${((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> - 
          <span style="font-weight: 600;">${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> 
          / <span style="font-weight: 600;">${pagination.totalItems}</span> 项
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${pages.join('')}
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