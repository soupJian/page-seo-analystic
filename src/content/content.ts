// 内容脚本 - 页面分析和SEO数据收集

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
  action: string;
  data?: SeoData;
  url?: string;
  error?: string;
}

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

      // 监听popstate事件（浏览器前进后退）
      window.addEventListener('popstate', () => {
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

      // 定期检查URL变化（备用方案）
      setInterval(() => {
        if (currentUrl !== window.location.href) {
          currentUrl = window.location.href;
          this.handleUrlChange();
        }
      }, 1000);
    }

    private async handleUrlChange(): Promise<void> {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastUrl) {
        this.lastUrl = currentUrl;
        console.log('URL变化检测到:', currentUrl);

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
      console.log('开始分析页面...');

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

        console.log('页面分析完成:', data);
        return data;
      } catch (error) {
        console.error('页面分析失败:', error);
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
      const recommendations: RecommendationInfo[] = [];

      // 检查标题长度
      const title = document.title;
      if (title.length < 30) {
        recommendations.push({
          category: 'Title',
          issue: '标题过短',
          suggestion: '建议标题长度在30-60个字符之间，当前长度: ' + title.length,
          priority: 'medium'
        });
      } else if (title.length > 60) {
        recommendations.push({
          category: 'Title',
          issue: '标题过长',
          suggestion: '建议标题长度在30-60个字符之间，当前长度: ' + title.length,
          priority: 'medium'
        });
      }

      // 检查Meta描述
      const description = this.getMetaContent('description');
      if (!description) {
        recommendations.push({
          category: 'Meta',
          issue: '缺少Meta描述',
          suggestion: '添加Meta描述标签，长度建议在150-160个字符之间',
          priority: 'high'
        });
      } else if (description.length < 120) {
        recommendations.push({
          category: 'Meta',
          issue: 'Meta描述过短',
          suggestion: '建议Meta描述长度在150-160个字符之间，当前长度: ' + description.length,
          priority: 'medium'
        });
      } else if (description.length > 160) {
        recommendations.push({
          category: 'Meta',
          issue: 'Meta描述过长',
          suggestion: '建议Meta描述长度在150-160个字符之间，当前长度: ' + description.length,
          priority: 'medium'
        });
      }

      // 检查H1标签
      const h1Elements = document.querySelectorAll('h1');
      if (h1Elements.length === 0) {
        recommendations.push({
          category: 'Headings',
          issue: '缺少H1标签',
          suggestion: '每个页面应该有且仅有一个H1标签',
          priority: 'high'
        });
      } else if (h1Elements.length > 1) {
        recommendations.push({
          category: 'Headings',
          issue: '多个H1标签',
          suggestion: '每个页面应该有且仅有一个H1标签，当前有' + h1Elements.length + '个',
          priority: 'high'
        });
      }

      // 检查图片Alt属性
      const images = document.querySelectorAll('img');
      let missingAltCount = 0;
      images.forEach(img => {
        if (!img.alt) {
          missingAltCount++;
        }
      });

      if (missingAltCount > 0) {
        recommendations.push({
          category: 'Images',
          issue: '图片缺少Alt属性',
          suggestion: `${missingAltCount}张图片缺少Alt属性，建议为所有图片添加描述性的Alt文本`,
          priority: 'medium'
        });
      }

      // 检查内部链接
      const links = document.querySelectorAll('a[href]');
      let internalLinkCount = 0;
      links.forEach(link => {
        const linkEl = link as HTMLAnchorElement;
        if (linkEl.href.startsWith(window.location.origin)) {
          internalLinkCount++;
        }
      });

      if (internalLinkCount < 3) {
        recommendations.push({
          category: 'Links',
          issue: '内部链接过少',
          suggestion: '建议增加更多内部链接以改善网站结构和用户体验',
          priority: 'low'
        });
      }

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