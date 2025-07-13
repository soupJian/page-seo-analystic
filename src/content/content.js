// Content Script - 页面分析和数据传递
class PageAnalyzer {
  constructor() {
    this.lastAnalyzedUrl = null;
    this.isAnalyzing = false;
    this.isActivated = false;
    this.init();
  }

  init() {
    // 监听来自background script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "analyzePage") {
        this.isActivated = true;
        this.analyzePage();
        sendResponse({ success: true });
      } else if (request.action === "checkActivation") {
        sendResponse({ activated: this.isActivated });
      }
    });

    // 监听URL变化
    this.setupUrlChangeDetection();
  }

  setupUrlChangeDetection() {
    // 保存原始的pushState和replaceState方法
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // 重写pushState方法
    history.pushState = function (state, title, url) {
      originalPushState.call(history, state, title, url);
      window.dispatchEvent(new Event("urlchange"));
    };

    // 重写replaceState方法
    history.replaceState = function (state, title, url) {
      originalReplaceState.call(history, state, title, url);
      window.dispatchEvent(new Event("urlchange"));
    };

    // 监听URL变化事件
    window.addEventListener("urlchange", () => {
      if (this.isActivated) {
        this.handleUrlChange();
      }
    });

    // 监听popstate事件（浏览器前进/后退）
    window.addEventListener("popstate", () => {
      if (this.isActivated) {
        this.handleUrlChange();
      }
    });
  }

  handleUrlChange() {
    const currentUrl = window.location.href;
    const currentDomain = this.getDomain(currentUrl);
    const lastDomain = this.lastAnalyzedUrl
      ? this.getDomain(this.lastAnalyzedUrl)
      : currentDomain;

    if (currentDomain !== lastDomain) {
      // 不同域名，关闭侧边栏
      this.isActivated = false;
      this.lastAnalyzedUrl = null;
      chrome.runtime.sendMessage({ action: "deactivateTab" });
    } else if (currentUrl !== this.lastAnalyzedUrl) {
      // 同域名但URL变化，显示重新分析提示
      this.sendDataToSidebar({
        type: "URL_CHANGED",
        newUrl: currentUrl,
        message: "URL已变化，点击重新分析当前页面",
      });
    }
  }

  getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return "";
    }
  }

  async analyzePage() {
    console.log("开始分析页面:", window.location.href);
    if (this.isAnalyzing) {
      console.log("已经在分析中，跳过");
      return;
    }

    this.isAnalyzing = true;
    this.lastAnalyzedUrl = window.location.href;

    try {
      // 发送分析开始状态
      console.log("发送分析开始状态到sidebar");
      this.sendDataToSidebar({
        type: "ANALYSIS_STARTED",
        message: "正在分析页面SEO信息...",
      });

      // 收集SEO数据
      const seoData = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        basicInfo: this.getBasicInfo(),
        metaInfo: this.getMetaInfo(),
        openGraphInfo: this.getOpenGraphInfo(),
        headingStructure: this.getHeadingStructure(),
        imageInfo: this.getImageInfo(),
        linksInfo: this.getLinksInfo(),
        structuredData: this.getStructuredDataInfo(),
        analyticsInfo: this.getAnalyticsInfo(),
        spellCheck: this.performSpellCheck(),
      };

      // 生成优化建议
      seoData.recommendations = this.generateRecommendations(seoData);

      // 发送完整数据到侧边栏
      this.sendDataToSidebar({
        type: "SEO_DATA",
        data: seoData,
      });

      // 存储数据到background script
      console.log("准备发送数据到background script:", seoData);
      chrome.runtime
        .sendMessage({
          action: "setSeoData",
          data: seoData,
        })
        .then(response => {
          console.log("数据发送到background成功:", response);
        })
        .catch(error => {
          console.error("发送数据到background失败:", error);
        });
    } catch (error) {
      console.error("分析页面失败:", error);
      this.sendDataToSidebar({
        type: "ANALYSIS_ERROR",
        error: error.message,
      });
    } finally {
      this.isAnalyzing = false;
    }
  }

  getBasicInfo() {
    return {
      title: document.title,
      url: window.location.href,
      lang: document.documentElement.lang,
      charset: document.characterSet,
      logo: this.findLogo(),
    };
  }

  findLogo() {
    const logoSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'meta[property="og:image"]',
      'img[alt*="logo" i]',
      'img[class*="logo" i]',
      'img[id*="logo" i]',
    ];

    for (const selector of logoSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        if (element.tagName === "LINK" || element.tagName === "META") {
          return (
            element.getAttribute("href") || element.getAttribute("content")
          );
        } else if (element.tagName === "IMG") {
          return element.src;
        }
      }
    }
    return null;
  }

  getMetaInfo() {
    const metaInfo = {};
    const metas = document.querySelectorAll("meta");

    metas.forEach(meta => {
      const name = meta.getAttribute("name") || meta.getAttribute("property");
      const content = meta.getAttribute("content");
      if (name && content) {
        metaInfo[name] = content;
      }
    });

    return metaInfo;
  }

  getOpenGraphInfo() {
    const ogInfo = {};
    const ogMetas = document.querySelectorAll('meta[property^="og:"]');

    ogMetas.forEach(meta => {
      const property = meta.getAttribute("property");
      const content = meta.getAttribute("content");
      if (property && content) {
        ogInfo[property] = content;
      }
    });

    return ogInfo;
  }

  getHeadingStructure() {
    const headings = [];
    const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");

    headingElements.forEach(heading => {
      headings.push({
        level: parseInt(heading.tagName.charAt(1)),
        text: heading.textContent.trim(),
        tag: heading.tagName.toLowerCase(),
      });
    });

    return headings;
  }

  getImageInfo() {
    const images = [];
    const imgElements = document.querySelectorAll("img");

    imgElements.forEach(img => {
      const width = img.naturalWidth || img.width || 0;
      const height = img.naturalHeight || img.height || 0;

      images.push({
        src: img.src,
        alt: img.alt || "-",
        width: width,
        height: height,
        title: img.title || "",
        displayWidth: Math.min(width, 100),
      });
    });

    return images;
  }

  getLinksInfo() {
    const links = [];
    const linkElements = document.querySelectorAll("a[href]");

    linkElements.forEach(link => {
      const href = link.getAttribute("href");
      if (href) {
        const isExternal =
          href.startsWith("http") && !href.includes(window.location.hostname);
        links.push({
          href: href,
          text: link.textContent.trim(),
          title: link.title || "",
          target: link.target || "",
          type: isExternal ? "外部链接" : "内部链接",
        });
      }
    });

    return links;
  }

  getStructuredDataInfo() {
    const allSchemas = [];
    const processedSchemas = [];
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    scripts.forEach((script, scriptIndex) => {
      try {
        const data = JSON.parse(script.textContent);
        const schemas = Array.isArray(data) ? data : [data];

        schemas.forEach((schema, schemaIndex) => {
          // 保存原始数据
          allSchemas.push({
            scriptIndex: scriptIndex + 1,
            schemaIndex: schemaIndex + 1,
            data: schema,
          });

          // 处理数据
          const processedSchema = this.processJsonLdSchema(
            schema,
            scriptIndex + 1,
            schemaIndex + 1
          );
          if (processedSchema) {
            processedSchemas.push(processedSchema);
          }
        });
      } catch (error) {
        console.error("解析JSON-LD失败:", error);
      }
    });

    return {
      allSchemas,
      processedSchemas,
    };
  }

  processJsonLdSchema(schema, scriptIndex, schemaIndex) {
    const schemaType = schema["@type"];
    const schemaName = this.getSchemaName(schema, schemaType);

    const result = {
      type: "JSON-LD",
      schemaType: schemaType,
      name: schemaName,
      script: scriptIndex,
      id: `schema-${scriptIndex}-${schemaIndex}`,
      data: schema,
      category: this.getSchemaCategory(schemaType),
      rawData: schema,
    };

    // 处理产品信息
    if (this.isProductType(schemaType)) {
      result.productInfo = this.extractProductInfo(schema);
    }

    return result;
  }

  getSchemaCategory(schemaType) {
    if (this.isProductType(schemaType)) {
      return "Product";
    } else if (schemaType === "Organization") {
      return "Organization";
    } else if (schemaType === "BreadcrumbList") {
      return "Navigation";
    } else if (schemaType === "Review" || schemaType === "AggregateRating") {
      return "Review";
    } else if (schemaType === "Event") {
      return "Event";
    } else if (schemaType === "Article" || schemaType === "BlogPosting") {
      return "Article";
    } else if (schemaType === "LocalBusiness" || schemaType === "Business") {
      return "Business";
    } else if (schemaType === "WebSite" || schemaType === "WebPage") {
      return "Website";
    }
    return "Other";
  }

  getSchemaName(schema, schemaType) {
    if (schemaType === "Product") {
      return schema.name || "产品";
    } else if (schemaType === "Organization") {
      return schema.name || "组织";
    } else if (schemaType === "BreadcrumbList") {
      return "面包屑导航";
    } else if (schemaType === "Review") {
      return "评论";
    } else if (schemaType === "Event") {
      return schema.name || "事件";
    } else if (schemaType === "Article") {
      return schema.headline || "文章";
    }
    return schemaType || "未知类型";
  }

  isProductType(type) {
    return (
      type === "Product" || (Array.isArray(type) && type.includes("Product"))
    );
  }

  extractProductInfo(schema) {
    const productInfo = {
      name: schema.name || "",
      description: schema.description || "",
      brand: schema.brand?.name || schema.brand || "",
      sku: schema.sku || "",
      gtin: schema.gtin || schema.gtin13 || schema.gtin12 || schema.gtin8 || "",
      category: schema.category || "",
      image: Array.isArray(schema.image)
        ? schema.image
        : [schema.image].filter(Boolean),
      offers: [],
    };

    // 处理价格信息
    if (schema.offers) {
      const offers = Array.isArray(schema.offers)
        ? schema.offers
        : [schema.offers];
      offers.forEach(offer => {
        if (offer) {
          productInfo.offers.push({
            price: offer.price || "",
            currency: offer.priceCurrency || "",
            availability: offer.availability || "",
            validFrom: offer.priceValidFrom || "",
            validUntil: offer.priceValidUntil || "",
            seller: offer.seller?.name || "",
          });
        }
      });
    }

    return productInfo;
  }

  getAnalyticsInfo() {
    const analytics = [];
    const scripts = document.querySelectorAll("script");

    // 检测各种分析工具
    const detectionRules = [
      {
        name: "Google Analytics",
        patterns: [
          /gtag\(/,
          /ga\(/,
          /google-analytics/,
          /googletagmanager\.com\/gtag/,
        ],
        globalVars: ["gtag", "ga", "google_tag_manager"],
      },
      {
        name: "Google Tag Manager",
        patterns: [/googletagmanager\.com\/gtm/, /dataLayer/],
        globalVars: ["google_tag_manager", "dataLayer"],
      },
      {
        name: "Facebook Pixel",
        patterns: [/connect\.facebook\.net/, /fbq\(/],
        globalVars: ["fbq"],
      },
      {
        name: "Hotjar",
        patterns: [/hotjar\.com/, /hj\(/],
        globalVars: ["hj"],
      },
      {
        name: "Baidu Analytics",
        patterns: [/hm\.baidu\.com/, /_hmt/],
        globalVars: ["_hmt"],
      },
    ];

    detectionRules.forEach(rule => {
      let detected = false;

      // 检查全局变量
      rule.globalVars.forEach(varName => {
        if (window[varName]) {
          detected = true;
        }
      });

      // 检查脚本内容
      if (!detected) {
        scripts.forEach(script => {
          const content = script.textContent || script.src || "";
          rule.patterns.forEach(pattern => {
            if (pattern.test(content)) {
              detected = true;
            }
          });
        });
      }

      if (detected) {
        analytics.push({
          name: rule.name,
          detected: true,
          type: "analytics",
        });
      }
    });

    return analytics;
  }

  performSpellCheck() {
    const textContent = document.body.textContent || "";
    const words = textContent.match(/\b[a-zA-Z]+\b/g) || [];

    // 简单的拼写检查 - 检查常见错误
    const commonErrors = {
      teh: "the",
      recieve: "receive",
      seperate: "separate",
      occurence: "occurrence",
      necesary: "necessary",
      accomodate: "accommodate",
    };

    const errors = [];
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      if (commonErrors[lowerWord]) {
        errors.push({
          word: word,
          suggestion: commonErrors[lowerWord],
          position: textContent.indexOf(word),
        });
      }
    });

    return {
      totalWords: words.length,
      errors: errors,
      errorCount: errors.length,
    };
  }

  generateRecommendations(data) {
    const recommendations = [];

    // 标题检查
    if (!data.basicInfo.title || data.basicInfo.title.length < 10) {
      recommendations.push({
        type: "error",
        title: "⚠️ 标题过短",
        description:
          "页面标题应该至少包含10个字符，当前标题过短可能影响SEO效果",
        action: "建议将标题扩展到30-60个字符，包含主要关键词",
        priority: "high",
      });
    } else if (data.basicInfo.title.length > 60) {
      recommendations.push({
        type: "warning",
        title: "⚠️ 标题过长",
        description: "页面标题超过60个字符，可能在搜索结果中被截断",
        action: "建议将标题缩短到60个字符以内",
        priority: "medium",
      });
    }

    // Meta描述检查
    if (!data.metaInfo.description) {
      recommendations.push({
        type: "error",
        title: "❌ 缺少Meta描述",
        description: "页面缺少meta description标签，这是重要的SEO元素",
        action: "添加150-160个字符的meta description，简洁描述页面内容",
        priority: "high",
      });
    } else if (data.metaInfo.description.length > 160) {
      recommendations.push({
        type: "warning",
        title: "⚠️ Meta描述过长",
        description: "Meta描述超过160个字符，可能在搜索结果中被截断",
        action: "建议将Meta描述缩短到160个字符以内",
        priority: "medium",
      });
    }

    // H1标签检查
    const h1Count = data.headingStructure.filter(h => h.level === 1).length;
    if (h1Count === 0) {
      recommendations.push({
        type: "error",
        title: "❌ 缺少H1标签",
        description: "页面应该包含一个H1标签作为主标题",
        action: "添加一个H1标签，包含页面主要关键词",
        priority: "high",
      });
    } else if (h1Count > 1) {
      recommendations.push({
        type: "warning",
        title: "⚠️ 多个H1标签",
        description: `页面包含${h1Count}个H1标签，建议只使用一个`,
        action: "将多余的H1标签改为H2或其他级别的标题",
        priority: "medium",
      });
    }

    // 图片Alt检查
    const imagesWithoutAlt = data.imageInfo.filter(
      img => !img.alt || img.alt === "-"
    ).length;
    if (imagesWithoutAlt > 0) {
      recommendations.push({
        type: "warning",
        title: "🖼️ 图片缺少Alt属性",
        description: `${imagesWithoutAlt}张图片缺少alt属性，影响可访问性和SEO`,
        action: "为所有图片添加描述性的alt属性",
        priority: "medium",
      });
    }

    // 拼写检查
    if (data.spellCheck.errorCount > 0) {
      recommendations.push({
        type: "info",
        title: "📝 发现拼写错误",
        description: `检测到${data.spellCheck.errorCount}个可能的拼写错误`,
        action: "检查并修正页面中的拼写错误",
        priority: "low",
      });
    }

    // 结构化数据检查
    if (data.structuredData.length === 0) {
      recommendations.push({
        type: "info",
        title: "📋 缺少结构化数据",
        description:
          "页面没有结构化数据，添加结构化数据可以提高搜索结果的展示效果",
        action: "考虑添加相关的JSON-LD结构化数据",
        priority: "low",
      });
    }

    // 分析工具检查
    if (data.analyticsInfo.length === 0) {
      recommendations.push({
        type: "info",
        title: "📊 未检测到分析工具",
        description: "页面未检测到Google Analytics等分析工具",
        action: "考虑添加网站分析工具来跟踪用户行为",
        priority: "low",
      });
    }

    return recommendations;
  }

  sendDataToSidebar(data) {
    // 发送数据到background script，让其转发给sidebar
    chrome.runtime
      .sendMessage({
        action: "sendToSidebar",
        data: data,
      })
      .catch(error => {
        console.error("发送消息到background失败:", error);
      });
  }
}

// 初始化页面分析器
const pageAnalyzer = new PageAnalyzer();

// 在全局暴露pageAnalyzer对象以便调试
window.pageAnalyzer = pageAnalyzer;
console.log("Content script已加载并初始化");
