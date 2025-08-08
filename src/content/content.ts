// 内容脚本 - 页面分析和SEO数据收集

// 导入统一类型定义
import {
  SeoData,
  BasicInfo,
  MetaInfo,
  OpenGraphInfo,
  HeadingInfo,
  ImageInfo,
  LinkInfo,
  StructuredDataInfo,
  ProductInfo,
  OfferInfo,
  AnalyticsInfo,
  SpellCheckInfo,
  RecommendationInfo,
  MessageData
} from '../types';

// 初始化内容分析器 - 使用IIFE避免全局变量冲突
(function () {
  'use strict';

  // 检查是否已经初始化过，避免重复初始化
  if ((window as any).__seoAnalyzerInitialized) {
    return;
  }
  (window as any).__seoAnalyzerInitialized = true;

  // 在局部作用域中创建类定义，避免全局变量冲突
  class PageAnalyzer {
    private lastUrl: string = '';
    private isAnalyzing: boolean = false;

    constructor() {
      this.init();
    }

    private init(): void {
      // 监听来自background script的消息
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'analyzePage') {
          this.analyzePage()
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true; // 异步响应
        }
      });

      // 监听URL变化
      this.watchUrlChanges();

      // 初始分析
      this.analyzePage();
    }

    private watchUrlChanges(): void {
      let currentUrl = window.location.href;
      let lastCheckTime = Date.now();

      // 监听popstate事件（浏览器前进后退）
      window.addEventListener('popstate', () => {
        this.handleUrlChange();
      });

      // 监听hashchange事件（URL hash变化）
      window.addEventListener('hashchange', () => {
        this.handleUrlChange();
      });

      // 重写history方法来捕获pushState和replaceState
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      const self = this;

      history.pushState = function (...args) {
        originalPushState.apply(history, args);
        setTimeout(() => {
          self.handleUrlChange();
        }, 100);
      };

      history.replaceState = function (...args) {
        originalReplaceState.apply(history, args);
        setTimeout(() => {
          self.handleUrlChange();
        }, 100);
      };

      // 监听DOM变化（SPA应用可能通过DOM变化来改变页面内容）
      const observer = new MutationObserver((mutations) => {
        const now = Date.now();
        // 避免频繁触发，至少间隔500ms
        if (now - lastCheckTime > 500) {
          lastCheckTime = now;
          const newUrl = window.location.href;
          if (newUrl !== currentUrl) {
            currentUrl = newUrl;
            this.handleUrlChange();
          }
        }
      });

      // 观察整个文档的变化
      observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });

      // 定期检查URL变化（备用方案，每2秒检查一次）
      setInterval(() => {
        const newUrl = window.location.href;
        if (newUrl !== currentUrl) {
          currentUrl = newUrl;
          this.handleUrlChange();
        }
      }, 2000);

      // 监听页面可见性变化（用户切换标签页回来时）
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          const newUrl = window.location.href;
          if (newUrl !== currentUrl) {
            currentUrl = newUrl;
            this.handleUrlChange();
          }
        }
      });
    }

    private async handleUrlChange(): Promise<void> {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastUrl) {
        this.lastUrl = currentUrl;

        // 通知background script URL变化
        chrome.runtime.sendMessage({
          action: 'analyzeUrl',
          url: currentUrl
        });

        // 延迟一秒后重新分析页面，确保页面内容加载完成
        setTimeout(() => {
          this.analyzePage();
        }, 1000);
      }
    }

    private async analyzePage(): Promise<SeoData> {
      if (this.isAnalyzing) {
        return this.getEmptyData();
      }

      this.isAnalyzing = true;

      try {
        const data: SeoData = {
          basicInfo: this.getBasicInfo(),
          metaInfo: this.getMetaInfo(),
          openGraphInfo: this.getOpenGraphInfo(),
          headingStructure: this.getHeadingStructure(),
          imageInfo: this.getImageInfo(),
          linksInfo: this.getLinksInfo(),
          structuredData: this.getStructuredData(),
          analyticsInfo: this.getAnalyticsInfo(),
          spellCheck: this.getSpellCheck(),
          recommendations: this.getRecommendations()
        };

        // 发送数据到background script
        chrome.runtime.sendMessage({
          action: 'setSeoData',
          data: data
        });

        return data;
      } catch (error) {
        throw error;
      } finally {
        this.isAnalyzing = false;
      }
    }

    private getEmptyData(): SeoData {
      return {
        basicInfo: {
          title: '',
          url: '',
          language: '',
          charset: '',
          logo: '',
          description: ''
        },
        metaInfo: {
          description: '',
          keywords: '',
          canonical: '',
          robots: '',
          viewport: '',
          author: '',
          generator: '',
          themeColor: '',
          appleTouchIcon: '',
          favicon: ''
        },
        openGraphInfo: {
          title: '',
          type: '',
          image: '',
          url: '',
          description: '',
          siteName: '',
          locale: ''
        },
        headingStructure: [],
        imageInfo: [],
        linksInfo: [],
        structuredData: [],
        analyticsInfo: [],
        spellCheck: [],
        recommendations: []
      };
    }

    private getBasicInfo(): BasicInfo {
      const title = document.title || '';
      const url = window.location.href;
      const language = document.documentElement.lang || 'en';
      const charset = document.characterSet || 'UTF-8';

      // 尝试获取网站logo
      let logo = '';
      const logoSelectors = [
        'img[alt*="logo" i]',
        'img[class*="logo" i]',
        'img[id*="logo" i]',
        '.logo img',
        '#logo img',
        'header img:first-of-type'
      ];

      for (const selector of logoSelectors) {
        const logoElement = document.querySelector(selector) as HTMLImageElement;
        if (logoElement && logoElement.src) {
          logo = logoElement.src;
          break;
        }
      }

      return {
        title,
        url,
        language,
        charset,
        logo,
        description: this.getMetaContent('description') || ''
      };
    }

    private getMetaInfo(): MetaInfo {
      return {
        description: this.getMetaContent('description') || '',
        keywords: this.getMetaContent('keywords') || '',
        canonical: this.getLinkHref('canonical') || '',
        robots: this.getMetaContent('robots') || '',
        viewport: this.getMetaContent('viewport') || '',
        author: this.getMetaContent('author') || '',
        generator: this.getMetaContent('generator') || '',
        themeColor: this.getMetaContent('theme-color') || '',
        appleTouchIcon: this.getLinkHref('apple-touch-icon') || '',
        favicon: this.getLinkHref('icon') || this.getLinkHref('shortcut icon') || ''
      };
    }

    private getOpenGraphInfo(): OpenGraphInfo {
      return {
        title: this.getMetaProperty('og:title') || '',
        type: this.getMetaProperty('og:type') || '',
        image: this.getMetaProperty('og:image') || '',
        url: this.getMetaProperty('og:url') || '',
        description: this.getMetaProperty('og:description') || '',
        siteName: this.getMetaProperty('og:site_name') || '',
        locale: this.getMetaProperty('og:locale') || ''
      };
    }

    private getHeadingStructure(): HeadingInfo[] {
      const headings: HeadingInfo[] = [];
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

      headingElements.forEach(heading => {
        const tag = heading.tagName.toLowerCase();
        const text = heading.textContent?.trim() || '';
        const level = parseInt(tag.substring(1));

        if (text) {
          headings.push({
            tag,
            text,
            level
          });
        }
      });

      return headings;
    }

    private getImageInfo(): ImageInfo[] {
      const images: ImageInfo[] = [];
      const imageElements = document.querySelectorAll('img');

      imageElements.forEach(img => {
        const src = img.src || '';
        const alt = img.alt || '';
        const width = img.naturalWidth || 0;
        const height = img.naturalHeight || 0;
        const loading = img.loading || '';

        if (src) {
          images.push({
            src,
            alt,
            width,
            height,
            loading
          });
        }
      });

      return images;
    }

    private getLinksInfo(): LinkInfo[] {
      const links: LinkInfo[] = [];
      const linkElements = document.querySelectorAll('a[href]');

      linkElements.forEach(link => {
        const linkEl = link as HTMLAnchorElement;
        const href = linkEl.href || '';
        const text = linkEl.textContent?.trim() || '';
        const title = linkEl.getAttribute('title') || '';
        const rel = linkEl.getAttribute('rel') || '';

        // 判断链接类型
        let type = 'external';
        if (href.startsWith(window.location.origin)) {
          type = 'internal';
        } else if (href.startsWith('#')) {
          type = 'anchor';
        } else if (href.startsWith('mailto:')) {
          type = 'email';
        } else if (href.startsWith('tel:')) {
          type = 'phone';
        }

        if (href && text) {
          links.push({
            href,
            text,
            type,
            title,
            rel
          });
        }
      });

      return links;
    }

    private getStructuredData(): StructuredDataInfo[] {
      const structuredData: StructuredDataInfo[] = [];
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');

      scripts.forEach((script, index) => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          const type = data['@type'] || 'Unknown';

          const info: StructuredDataInfo = {
            type,
            name: this.getSchemaName(data),
            content: data
          };

          // 如果是产品相关的结构化数据，提取产品信息
          if (type === 'Product' || data.offers) {
            info.products = this.extractProductInfo(data);
          }

          structuredData.push(info);
        } catch (error) {
          console.error(`解析第 ${index + 1} 个JSON-LD失败:`, error);
        }
      });

      return structuredData;
    }

    private getSchemaName(schema: Record<string, unknown>): string {
      return (schema.name as string) || (schema.title as string) || (schema['@type'] as string) || 'Unnamed Schema';
    }

    private extractProductInfo(schema: Record<string, unknown>): ProductInfo[] {
      const products: ProductInfo[] = [];

      // 如果是单个产品
      if (schema['@type'] === 'Product') {
        const product = this.createProductFromSchema(schema);
        products.push(product);
      }

      // 处理offers信息
      if (schema.offers) {
        const offers = Array.isArray(schema.offers) ? schema.offers : [schema.offers];
        offers.forEach(offer => {
          const offerInfo: OfferInfo = {
            price: this.getStringValue((offer as any).price),
            currency: this.getStringValue((offer as any).priceCurrency),
            availability: this.getStringValue((offer as any).availability),
            condition: this.getStringValue((offer as any).itemCondition),
            seller: this.getStringValue((offer as any).seller?.name),
            url: this.getStringValue((offer as any).url)
          };

          if (products.length > 0) {
            products[0].offers.push(offerInfo);
          }
        });
      }

      return products;
    }

    private createProductFromSchema(schema: Record<string, unknown>): ProductInfo {
      const aggregateRating = (schema.aggregateRating as any) || {};
      const offers = (schema.offers as any) || {};
      const brand = (schema.brand as any) || {};

      return {
        name: this.getStringValue(schema.name),
        price: this.getStringValue(offers.price),
        currency: this.getStringValue(offers.priceCurrency),
        availability: this.getStringValue(offers.availability),
        condition: this.getStringValue(offers.itemCondition),
        brand: this.getStringValue(brand.name),
        category: this.getStringValue(schema.category),
        sku: this.getStringValue(schema.sku),
        description: this.getStringValue(schema.description),
        image: this.getStringValue(schema.image),
        url: this.getStringValue(schema.url),
        rating: this.getStringValue(aggregateRating.ratingValue),
        ratingCount: this.getStringValue(aggregateRating.ratingCount),
        offers: []
      };
    }

    private getStringValue(value: unknown): string {
      if (typeof value === 'string') {
        return value;
      } else if (typeof value === 'number') {
        return value.toString();
      } else if (Array.isArray(value) && value.length > 0) {
        return this.getStringValue(value[0]);
      } else if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        return (obj.name as string) || (obj.value as string) || '';
      }
      return '';
    }

    private getAnalyticsInfo(): AnalyticsInfo[] {
      const analytics: AnalyticsInfo[] = [];
      const scripts = document.querySelectorAll('script');
      const scriptTexts = Array.from(scripts).map(script => script.textContent || '').join(' ');

      // 定义常见的分析工具模式
      const analyticsPatterns = [
        { name: 'Google Analytics', pattern: /gtag\(|ga\(|GoogleAnalyticsObject|google-analytics\.com/i, type: 'tracking' },
        { name: 'Google Tag Manager', pattern: /gtm\.js|googletagmanager\.com/i, type: 'tag_manager' },
        { name: 'Facebook Pixel', pattern: /fbevents\.js|facebook\.net\/tr/i, type: 'pixel' },
        { name: 'Adobe Analytics', pattern: /omniture|adobe\.com.*analytics/i, type: 'analytics' },
        { name: 'Hotjar', pattern: /hotjar\.com/i, type: 'heatmap' },
        { name: 'Mixpanel', pattern: /mixpanel\.com/i, type: 'analytics' },
        { name: 'Segment', pattern: /segment\.com|analytics\.js/i, type: 'cdp' },
        { name: 'Amplitude', pattern: /amplitude\.com/i, type: 'analytics' },
        { name: 'Klaviyo', pattern: /klaviyo\.com/i, type: 'email' },
        { name: 'Intercom', pattern: /intercom\.io/i, type: 'chat' },
        { name: 'Zendesk', pattern: /zendesk\.com/i, type: 'support' },
        { name: 'Crisp', pattern: /crisp\.chat/i, type: 'chat' },
        { name: 'Drift', pattern: /drift\.com/i, type: 'chat' }
      ];

      analyticsPatterns.forEach(tool => {
        const found = tool.pattern.test(scriptTexts) || tool.pattern.test(document.documentElement.innerHTML);
        const id = this.extractAnalyticsId(tool.name, scriptTexts);

        analytics.push({
          name: tool.name,
          id,
          type: tool.type,
          found
        });
      });

      return analytics;
    }

    private extractAnalyticsId(toolName: string, scriptText: string): string {
      const patterns: Record<string, RegExp> = {
        'Google Analytics': /gtag\(['"]config['"],\s*['"]([^'"]+)['"]/i,
        'Google Tag Manager': /GTM-[A-Z0-9]+/i,
        'Facebook Pixel': /fbq\(['"]init['"],\s*['"]?(\d+)['"]?/i
      };

      const pattern = patterns[toolName];
      if (pattern) {
        const match = scriptText.match(pattern);
        return match ? (match[1] || match[0]) : '';
      }

      return '';
    }

    private getSpellCheck(): SpellCheckInfo[] {
      const spellErrors: SpellCheckInfo[] = [];
      const pageText = document.body.textContent || '';

      // 常见拼写错误词典
      const spellDict: Record<string, string[]> = {
        'recieve': ['receive'],
        'seperate': ['separate'],
        'occured': ['occurred'],
        'neccessary': ['necessary'],
        'accomodate': ['accommodate'],
        'definately': ['definitely'],
        'independant': ['independent'],
        'maintainence': ['maintenance'],
        'existance': ['existence'],
        'buisness': ['business']
      };

      Object.entries(spellDict).forEach(([wrongWord, suggestions]) => {
        const regex = new RegExp(`\\b${wrongWord}\\b`, 'gi');
        const matches = pageText.match(regex);

        if (matches) {
          matches.forEach(match => {
            const context = this.getWordContext(pageText, match);
            spellErrors.push({
              word: match,
              suggestions,
              context
            });
          });
        }
      });

      return spellErrors;
    }

    private getWordContext(text: string, word: string): string {
      const index = text.toLowerCase().indexOf(word.toLowerCase());
      if (index === -1) return '';

      const start = Math.max(0, index - 30);
      const end = Math.min(text.length, index + word.length + 30);

      return text.substring(start, end).trim();
    }

    private getRecommendations(): RecommendationInfo[] {
      // 内联SEO规则检查，避免动态导入问题
      const recommendations: RecommendationInfo[] = [];

      // 标题优化规则
      const title = document.title;
      if (!title || title.trim() === '') {
        recommendations.push({
          category: '标题优化',
          issue: '页面标题缺失',
          suggestion: '添加一个描述性的页面标题，长度建议在50-60个字符之间',
          priority: 'high'
        });
      } else if (title.length > 60) {
        recommendations.push({
          category: '标题优化',
          issue: '页面标题过长',
          suggestion: '页面标题过长，建议缩短到50-60个字符，避免在搜索结果中被截断',
          priority: 'medium'
        });
      } else if (title.length < 30) {
        recommendations.push({
          category: '标题优化',
          issue: '页面标题过短',
          suggestion: '页面标题过短，建议增加更多描述性内容，长度建议在30-60个字符之间',
          priority: 'low'
        });
      }

      // Meta信息规则
      const description = this.getMetaContent('description');
      if (!description || description.trim() === '') {
        recommendations.push({
          category: 'Meta描述',
          issue: 'Meta描述缺失',
          suggestion: '添加Meta描述标签，长度建议在150-160个字符之间，包含关键词和页面主要内容',
          priority: 'high'
        });
      } else if (description.length > 160) {
        recommendations.push({
          category: 'Meta描述',
          issue: 'Meta描述过长',
          suggestion: 'Meta描述过长，建议缩短到150-160个字符，避免在搜索结果中被截断',
          priority: 'medium'
        });
      } else if (description.length < 120) {
        recommendations.push({
          category: 'Meta描述',
          issue: 'Meta描述过短',
          suggestion: 'Meta描述过短，建议增加更多描述性内容，长度建议在120-160个字符之间',
          priority: 'low'
        });
      }

      // 关键词规则
      const keywords = this.getMetaContent('keywords');
      if (!keywords || keywords.trim() === '') {
        recommendations.push({
          category: '关键词优化',
          issue: 'Meta关键词缺失',
          suggestion: '添加Meta关键词标签，包含页面相关的关键词',
          priority: 'medium'
        });
      }

      // 图片优化规则
      const images = this.getImageInfo();
      const imagesWithoutAlt = images.filter(img => !img.alt || img.alt.trim() === '');
      if (imagesWithoutAlt.length > 0) {
        recommendations.push({
          category: '图片优化',
          issue: '图片缺少Alt属性',
          suggestion: `为${imagesWithoutAlt.length}张图片添加Alt属性，提高可访问性和SEO效果`,
          priority: 'high'
        });
      }

      const imagesWithEmptyAlt = images.filter(img => img.alt === '' || img.alt === '-');
      if (imagesWithEmptyAlt.length > 0) {
        recommendations.push({
          category: '图片优化',
          issue: '图片Alt属性为空',
          suggestion: '为没有Alt属性的图片添加描述性的Alt文本',
          priority: 'medium'
        });
      }

      // 标题结构规则
      const headings = this.getHeadingStructure();
      const h1Count = headings.filter(h => h.level === 1).length;
      if (h1Count === 0) {
        recommendations.push({
          category: '标题结构',
          issue: '缺少H1标题',
          suggestion: '每个页面应该只有一个H1标题，用于描述页面的主要内容',
          priority: 'high'
        });
      } else if (h1Count > 1) {
        recommendations.push({
          category: '标题结构',
          issue: '多个H1标题',
          suggestion: '页面包含多个H1标题，建议只保留一个主要的H1标题',
          priority: 'high'
        });
      }

      // 标题层级规则
      const levels = headings.map(h => h.level);
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
          recommendations.push({
            category: '标题结构',
            issue: '标题层级不合理',
            suggestion: '标题层级应该合理，H1后面应该是H2，H2后面可以是H3，避免跳过层级',
            priority: 'medium'
          });
          break;
        }
      }

      // 链接优化规则
      const links = this.getLinksInfo();
      const badLinks = links.filter(link =>
        !link.text ||
        link.text.trim() === '' ||
        link.text.toLowerCase().includes('点击') ||
        link.text.toLowerCase().includes('click')
      );
      if (badLinks.length > 0) {
        recommendations.push({
          category: '链接优化',
          issue: '链接缺少描述性文本',
          suggestion: '为链接添加描述性的文本，避免使用"点击这里"等无意义的文本',
          priority: 'medium'
        });
      }

      // 结构化数据规则
      const structuredData = this.getStructuredData();
      if (structuredData.length === 0) {
        recommendations.push({
          category: '结构化数据',
          issue: '缺少结构化数据',
          suggestion: '添加结构化数据（JSON-LD），帮助搜索引擎更好地理解页面内容',
          priority: 'medium'
        });
      }

      // 社交媒体规则
      const ogTitle = this.getMetaProperty('og:title');
      const ogDescription = this.getMetaProperty('og:description');
      if (!ogTitle && !ogDescription) {
        recommendations.push({
          category: '社交媒体优化',
          issue: '缺少Open Graph标签',
          suggestion: '添加Open Graph标签，优化在社交媒体上的显示效果',
          priority: 'medium'
        });
      }

      const ogImage = this.getMetaProperty('og:image');
      if (!ogImage) {
        recommendations.push({
          category: '社交媒体优化',
          issue: 'Open Graph图片缺失',
          suggestion: '添加Open Graph图片，提高在社交媒体上的分享效果',
          priority: 'low'
        });
      }

      // 移动端优化规则
      const viewport = this.getMetaContent('viewport');
      if (!viewport || viewport.trim() === '') {
        recommendations.push({
          category: '移动端优化',
          issue: '缺少Viewport设置',
          suggestion: '添加viewport meta标签，确保页面在移动设备上正确显示',
          priority: 'high'
        });
      }

      // 可访问性规则
      const language = document.documentElement.lang || '';
      if (!language || language.trim() === '') {
        recommendations.push({
          category: '可访问性',
          issue: '缺少语言设置',
          suggestion: '在HTML标签中设置正确的语言属性',
          priority: 'medium'
        });
      }

      // 性能优化规则
      const largeImages = images.filter(img => img.width > 1920 || img.height > 1080);
      if (largeImages.length > 0) {
        recommendations.push({
          category: '性能优化',
          issue: '图片未优化',
          suggestion: '使用适当的图片格式和大小，考虑使用WebP格式和懒加载',
          priority: 'medium'
        });
      }

      // 按优先级排序
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      recommendations.sort((a, b) => priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]);

      return recommendations;
    }

    private getMetaContent(name: string): string {
      const meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      return meta?.content || '';
    }

    private getMetaProperty(property: string): string {
      const meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      return meta?.content || '';
    }

    private getLinkHref(rel: string): string {
      const link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      return link?.href || '';
    }
  }

  // 创建实例
  const analyzer = new PageAnalyzer();

  // 可选：将实例存储到一个命名空间中，避免冲突
  (window as any).__seoAnalyzer = analyzer;

})(); 