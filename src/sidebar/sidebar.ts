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
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在分析页面SEO信息...</p>
      </div>
    `;
  }

  private getErrorHTML(): string {
    return `
      <div class="error-container">
        <div class="error-icon">❌</div>
        <h3>分析失败</h3>
        <p>${this.error}</p>
        <button class="reanalyze-btn">重新分析</button>
      </div>
    `;
  }

  private getNoDataHTML(): string {
    return `
      <div class="no-data-container">
        <div class="no-data-icon">📊</div>
        <h3>暂无数据</h3>
        <p>点击扩展图标开始分析页面</p>
      </div>
    `;
  }

  private getMainHTML(): string {
    if (!this.seoData) return '';

    return `
      <div class="seo-dashboard">
        <div class="dashboard-header">
          <h2>SEO 分析报告</h2>
          <button class="reanalyze-btn">重新分析</button>
        </div>
        
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
    `;
  }

  private getBasicInfoHTML(): string {
    const basic = this.seoData!.basicInfo;
    return `
      <div class="seo-card">
        <h3>基本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>标题:</label>
            <span>${basic.title || '-'}</span>
          </div>
          <div class="info-item">
            <label>URL:</label>
            <span class="url-text">${basic.url || '-'}</span>
          </div>
          <div class="info-item">
            <label>语言:</label>
            <span>${basic.language || '-'}</span>
          </div>
          <div class="info-item">
            <label>字符集:</label>
            <span>${basic.charset || '-'}</span>
          </div>
          ${basic.logo ? `
            <div class="info-item">
              <label>Logo:</label>
              <img src="${basic.logo}" alt="Logo" class="logo-preview">
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private getMetaInfoHTML(): string {
    const meta = this.seoData!.metaInfo;
    return `
      <div class="seo-card">
        <h3>Meta 信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>描述:</label>
            <span>${meta.description || '-'}</span>
          </div>
          <div class="info-item">
            <label>关键词:</label>
            <span>${meta.keywords || '-'}</span>
          </div>
          <div class="info-item">
            <label>Canonical:</label>
            <span>${meta.canonical || '-'}</span>
          </div>
          <div class="info-item">
            <label>Robots:</label>
            <span>${meta.robots || '-'}</span>
          </div>
          <div class="info-item">
            <label>Viewport:</label>
            <span>${meta.viewport || '-'}</span>
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
        <div class="seo-card">
          <h3>图片信息</h3>
          <p class="no-data">未找到图片</p>
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
               style="max-width: 100px; height: auto;">
        </td>
        <td>
          <a href="${image.src}" target="_blank" class="image-link">
            ${image.src.length > 50 ? image.src.substring(0, 50) + '...' : image.src}
          </a>
        </td>
        <td>${image.alt || '-'}</td>
        <td>${image.width}x${image.height}</td>
      </tr>
    `).join('');

    return `
      <div class="seo-card">
        <h3>图片信息 (${images.length})</h3>
        <div class="table-actions">
          <button class="export-images-btn">导出Excel</button>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>图片</th>
                <th>链接</th>
                <th>Alt</th>
                <th>尺寸</th>
              </tr>
            </thead>
            <tbody>
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
      pages.push(`<button class="${type}-page-btn" data-page="${pagination.currentPage - 1}">‹</button>`);
    }

    // 页码
    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === pagination.currentPage ? 'active' : '';
      pages.push(`<button class="${type}-page-btn ${activeClass}" data-page="${i}">${i}</button>`);
    }

    // 下一页
    if (pagination.currentPage < pagination.totalPages) {
      pages.push(`<button class="${type}-page-btn" data-page="${pagination.currentPage + 1}">›</button>`);
    }

    return `
      <div class="pagination">
        <div class="pagination-info">
          第 ${pagination.currentPage} 页，共 ${pagination.totalPages} 页
        </div>
        <div class="pagination-buttons">
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
(function () {
  'use strict';
  new SidebarManager();
})(); 