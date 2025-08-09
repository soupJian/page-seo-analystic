// 内容脚本 - 页面分析和SEO数据收集

// 导入统一类型定义
import { SeoData, SeoAnalysisData } from '../types';
import { getBasicInfo, getMetaInfo, getOpenGraphInfo, getHeadingStructure, getImageInfo, getLinksInfo } from '../utils/pageInfo';
import { getStructuredData } from '../utils/structuredData';
import { getAnalyticsInfo } from '../utils/analytics';

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
      chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
      const observer = new MutationObserver((_mutations) => {
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
        const basicInfo = getBasicInfo();
        const metaInfo = getMetaInfo();
        const openGraphInfo = getOpenGraphInfo();
        const headingStructure = getHeadingStructure();
        const imageInfo = getImageInfo();
        const linksInfo = getLinksInfo();
        const structuredData = getStructuredData();
        const analyticsInfo = getAnalyticsInfo();

        const analysisData: SeoAnalysisData = {
          basicInfo,
          metaInfo,
          openGraphInfo,
          headingStructure,
          imageInfo,
          linksInfo,
          structuredData,
          analyticsInfo,
        };


        // 发送数据到background script
        chrome.runtime.sendMessage({
          action: 'setSeoData',
          data: analysisData
        });

        return analysisData;
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
        analyticsInfo: []
      };
    }

    // 所有细节方法已下沉到 utils 中
  }

  // 创建实例
  const analyzer = new PageAnalyzer();

  // 可选：将实例存储到一个命名空间中，避免冲突
  (window as any).__seoAnalyzer = analyzer;

})(); 