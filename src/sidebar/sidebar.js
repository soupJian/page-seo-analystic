// 导入xlsx库
import * as XLSX from "xlsx";

// 侧边栏JavaScript逻辑
class SidebarManager {
  constructor() {
    this.currentImagePage = 1;
    this.currentLinkPage = 1;
    this.itemsPerPage = 10;
    this.allImages = [];
    this.allLinks = [];
    this.currentProductData = null;
    this.port = null;
    this.init();
  }

  init() {
    // 连接到background script
    this.port = chrome.runtime.connect({ name: "sidebar" });

    // 监听来自background script的消息
    this.port.onMessage.addListener(data => {
      console.log("收到background消息:", data);
      if (data.type === "SEO_DATA") {
        console.log("收到SEO数据:", data.data);
        this.displaySeoData(data.data);
      } else if (data.type === "ANALYSIS_STARTED") {
        console.log("分析开始:", data.message);
        this.showAnalysisStatus(data.message);
      } else if (data.type === "ANALYSIS_ERROR") {
        console.log("分析错误:", data.error);
        this.showAnalysisError(data.error);
      } else if (data.type === "URL_CHANGED") {
        console.log("URL变化:", data);
        this.showUrlChangeNotification(data);
      }
    });

    // 监听来自content script的直接消息（保持兼容性）
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === "SEO_DATA") {
        console.log("收到SEO数据:", request.data);
        this.displaySeoData(request.data);
      } else if (request.type === "ANALYSIS_STARTED") {
        console.log("分析开始:", request.message);
        this.showAnalysisStatus(request.message);
      } else if (request.type === "ANALYSIS_ERROR") {
        console.log("分析错误:", request.error);
        this.showAnalysisError(request.error);
      } else if (request.type === "URL_CHANGED") {
        console.log("URL变化:", request);
        this.showUrlChangeNotification(request);
      }
    });

    // 页面加载时请求数据，带重试机制
    this.requestSeoData();

    // 关闭按钮事件
    document.getElementById("closeSidebar").addEventListener("click", () => {
      window.close();
    });

    // 添加手动分析按钮事件
    this.addManualAnalysisButton();

    // 延迟添加导出按钮事件监听器
    setTimeout(() => {
      this.addExportEventListeners();
    }, 1000);
  }

  async requestSeoData(retryCount = 0) {
    try {
      // 首先尝试从background script获取缓存数据
      const response = await chrome.runtime.sendMessage({
        action: "getSeoData",
      });
      if (response && response.data) {
        console.log("从background script获取到数据:", response.data);
        this.displaySeoData(response.data);
        return;
      }

      console.log("background script中暂无数据");

      // 如果没有缓存数据，直接触发content script分析
      if (retryCount === 0) {
        console.log("直接触发content script分析");
        await this.triggerAnalysis();
        // 触发分析后，给一些时间让分析完成，然后重试获取数据
        setTimeout(() => {
          this.requestSeoData(1);
        }, 2000);
        return;
      }

      // 如果没有数据且重试次数少于3次，则等待后重试
      if (retryCount < 3) {
        console.log(`等待1秒后重试 (${retryCount + 1}/3)`);
        setTimeout(() => {
          this.requestSeoData(retryCount + 1);
        }, 1000);
      } else {
        // 重试次数用完，显示错误信息
        this.showAnalysisError("无法获取SEO数据，请刷新页面后重试");
      }
    } catch (error) {
      console.error("获取SEO数据失败:", error);
      // 如果出错且重试次数少于3次，则等待后重试
      if (retryCount < 3) {
        console.log(`连接失败，等待1秒后重试 (${retryCount + 1}/3)`);
        setTimeout(() => {
          this.requestSeoData(retryCount + 1);
        }, 1000);
      }
    }
  }

  async triggerAnalysis() {
    try {
      console.log("开始触发分析...");
      // 获取当前活动标签页
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      console.log("查询到标签页:", tabs.length);
      if (tabs.length > 0) {
        console.log("发送分析消息到标签页:", tabs[0].id, tabs[0].url);
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          action: "analyzePage",
        });
        console.log("content script响应:", response);
      } else {
        console.error("没有找到活动标签页");
      }
    } catch (error) {
      console.error("触发分析失败:", error);
    }
  }

  addManualAnalysisButton() {
    // 在页面顶部添加手动分析按钮
    const container = document.getElementById("content");
    if (container) {
      const buttonHtml = `
        <div class="p-4 bg-blue-50 border-b border-blue-200">
          <button id="manualAnalysisBtn" class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            手动开始分析
          </button>
        </div>
      `;
      container.insertAdjacentHTML("afterbegin", buttonHtml);

      // 添加点击事件
      document
        .getElementById("manualAnalysisBtn")
        .addEventListener("click", () => {
          console.log("手动触发分析按钮被点击");
          this.triggerAnalysis();
        });
    }
  }

  showAnalysisStatus(message) {
    const container = document.getElementById("content");
    if (container) {
      container.innerHTML = `
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600">${message}</p>
          </div>
        </div>
      `;
    }
  }

  showAnalysisError(error) {
    const container = document.getElementById("content");
    if (container) {
      container.innerHTML = `
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="text-red-500 text-4xl mb-4">⚠️</div>
            <p class="text-red-600">分析失败: ${error}</p>
            <button onclick="location.reload()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              重试
            </button>
          </div>
        </div>
      `;
    }
  }

  showUrlChangeNotification(data) {
    const container = document.getElementById("content");
    if (container) {
      container.innerHTML = `
        <div class="p-6">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 class="font-medium text-yellow-800 mb-2">页面URL已变化</h3>
            <p class="text-sm text-yellow-700 mb-4">${data.message}</p>
            <div class="space-y-2 text-sm">
              <div><strong>新URL:</strong> <span class="text-green-600">${data.newUrl}</span></div>
            </div>
            <button onclick="chrome.runtime.sendMessage({action: 'analyzePage'})" 
                    class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              重新分析
            </button>
          </div>
        </div>
      `;
    }
  }

  displaySeoData(data) {
    console.log("开始显示SEO数据:", data);

    // 直接调用各个显示方法，不需要重新创建DOM结构
    this.displayBasicInfo(data.basicInfo);
    this.displayMetaInfo(data.metaInfo);
    this.displayOpenGraphInfo(data.openGraphInfo);
    this.displayHeadingStructure(data.headingStructure);
    this.displayImageInfo(data.imageInfo);
    this.displayLinksInfo(data.linksInfo);
    this.displayStructuredDataInfo(data.structuredData);
    this.displayAnalyticsInfo(data.analyticsInfo);
    this.displayRecommendations(data.recommendations);

    console.log("SEO数据显示完成");
  }

  displayBasicInfo(basic) {
    console.log("显示基本信息:", basic);
    const container = document.getElementById("basicInfo");
    if (!container) {
      console.error("DOM element 'basicInfo' not found");
      return;
    }
    container.innerHTML = `
      <div class="seo-content">
        <div class="grid grid-cols-2 gap-4">
          <div><strong>标题:</strong> ${basic.title || "无"}</div>
          <div><strong>URL:</strong> <a href="${
            basic.url
          }" target="_blank" class="text-blue-600 hover:underline">${
      basic.url
    }</a></div>
          <div><strong>语言:</strong> ${basic.lang || "未设置"}</div>
          <div><strong>字符集:</strong> ${basic.charset || "未设置"}</div>
          <div><strong>Logo:</strong> ${
            basic.logo
              ? `<img src="${basic.logo}" alt="Logo" class="h-6 inline">`
              : "未找到"
          }</div>
        </div>
      </div>
    `;
  }

  displayMetaInfo(meta) {
    console.log("显示Meta信息:", meta);
    const container = document.getElementById("metaInfo");
    if (!container) {
      console.error("DOM element 'metaInfo' not found");
      return;
    }
    container.innerHTML = `
      <div class="seo-content">
        <div class="grid grid-cols-1 gap-2">
          <div><strong>Description:</strong> ${
            meta.description || "未设置"
          }</div>
          <div><strong>Keywords:</strong> ${meta.keywords || "未设置"}</div>
          <div><strong>Author:</strong> ${meta.author || "未设置"}</div>
          <div><strong>Viewport:</strong> ${meta.viewport || "未设置"}</div>
          <div><strong>Robots:</strong> ${meta.robots || "未设置"}</div>
          <div><strong>Canonical:</strong> ${
            meta.canonical
              ? `<a href="${meta.canonical}" target="_blank" class="text-blue-600 hover:underline">${meta.canonical}</a>`
              : "未设置"
          }</div>
        </div>
      </div>
    `;
  }

  displayOpenGraphInfo(og) {
    console.log("显示Open Graph信息:", og);
    const container = document.getElementById("openGraphInfo");
    if (!container) {
      console.error("DOM element 'openGraphInfo' not found");
      return;
    }
    container.innerHTML = `
      <div class="seo-content">
        <div class="grid grid-cols-1 gap-2">
          <div><strong>Title:</strong> ${og["og:title"] || "未设置"}</div>
          <div><strong>Description:</strong> ${
            og["og:description"] || "未设置"
          }</div>
          <div><strong>Image:</strong> ${
            og["og:image"]
              ? `<a href="${og["og:image"]}" target="_blank" class="text-blue-600 hover:underline">查看图片</a>`
              : "未设置"
          }</div>
          <div><strong>URL:</strong> ${
            og["og:url"]
              ? `<a href="${og["og:url"]}" target="_blank" class="text-blue-600 hover:underline">${og["og:url"]}</a>`
              : "未设置"
          }</div>
          <div><strong>Type:</strong> ${og["og:type"] || "未设置"}</div>
          <div><strong>Site Name:</strong> ${
            og["og:site_name"] || "未设置"
          }</div>
        </div>
      </div>
    `;
  }

  displayHeadingStructure(headings) {
    const container = document.getElementById("headingStructure");
    if (!container) {
      console.error("DOM element 'headingStructure' not found");
      return;
    }

    const headingColors = {
      H1: "bg-red-100 text-red-800 border-l-4 border-red-500",
      H2: "bg-orange-100 text-orange-800 border-l-4 border-orange-500",
      H3: "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500",
      H4: "bg-green-100 text-green-800 border-l-4 border-green-500",
      H5: "bg-blue-100 text-blue-800 border-l-4 border-blue-500",
      H6: "bg-purple-100 text-purple-800 border-l-4 border-purple-500",
    };

    if (!headings || headings.length === 0) {
      container.innerHTML = '<div class="seo-content">未找到标题标签</div>';
      return;
    }

    container.innerHTML = `
      <div class="seo-content">
        <div class="space-y-2">
          ${headings
            .map(
              heading => `
            <div class="flex items-start space-x-3 p-2 rounded-lg ${
              headingColors[heading.tag] ||
              "bg-gray-100 text-gray-800 border-l-4 border-gray-500"
            }">
              <span class="px-2 py-1 bg-white rounded text-xs font-bold shadow-sm">
                ${heading.tag}
              </span>
              <span class="text-sm font-medium flex-1 leading-relaxed">${
                heading.text
              }</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  displayImageInfo(images) {
    this.allImages = images || [];
    this.currentImagePage = 1;
    this.renderImageTable();
  }

  renderImageTable() {
    const container = document.getElementById("imageInfo");
    if (!container) {
      console.error("DOM element 'imageInfo' not found");
      return;
    }

    const startIndex = (this.currentImagePage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const currentImages = this.allImages.slice(startIndex, endIndex);
    const totalPages = Math.ceil(this.allImages.length / this.itemsPerPage);

    if (this.allImages.length === 0) {
      container.innerHTML = '<div class="seo-content">未找到图片</div>';
      return;
    }

    let html = `
      <div class="seo-content">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-medium">图片信息 (${this.allImages.length})</h3>
          <button id="exportImagesBtn" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
            导出Excel
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full border border-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="border border-gray-200 px-2 py-1 text-left text-xs">序号</th>
                <th class="border border-gray-200 px-2 py-1 text-left text-xs">图片</th>
                <th class="border border-gray-200 px-2 py-1 text-left text-xs">链接</th>
                <th class="border border-gray-200 px-2 py-1 text-left text-xs">Alt文本</th>
                <th class="border border-gray-200 px-2 py-1 text-left text-xs">尺寸</th>
                <th class="border border-gray-200 px-2 py-1 text-left text-xs">类型</th>
              </tr>
            </thead>
            <tbody>
              ${currentImages
                .map(
                  (img, index) => `
                <tr class="hover:bg-gray-50">
                  <td class="border border-gray-200 px-2 py-1 text-xs">${
                    startIndex + index + 1
                  }</td>
                  <td class="border border-gray-200 px-2 py-1">
                    <img src="${img.src}" alt="${
                    img.alt || ""
                  }" class="max-w-[100px] h-auto object-contain rounded">
                  </td>
                  <td class="border border-gray-200 px-2 py-1 text-xs">
                    <a href="${
                      img.src
                    }" target="_blank" class="text-blue-600 hover:underline max-w-[100px] block truncate">
                      ${img.src}
                    </a>
                  </td>
                  <td class="border border-gray-200 px-2 py-1 text-xs">${
                    img.alt || "-"
                  }</td>
                  <td class="border border-gray-200 px-2 py-1 text-xs">${
                    img.width || "?"
                  }x${img.height || "?"}</td>
                  <td class="border border-gray-200 px-2 py-1 text-xs">
                    ${
                      img.isDataUrl
                        ? '<span class="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Base64</span>'
                        : ""
                    }
                    ${
                      img.isLazyLoaded
                        ? '<span class="px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">懒加载</span>'
                        : ""
                    }
                    ${
                      img.loading === "lazy"
                        ? '<span class="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">延迟</span>'
                        : ""
                    }
                    ${
                      !img.isDataUrl &&
                      !img.isLazyLoaded &&
                      img.loading !== "lazy"
                        ? '<span class="px-1 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">普通</span>'
                        : ""
                    }
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        ${this.createPagination("image", this.currentImagePage, totalPages)}
      </div>
    `;

    container.innerHTML = html;
    this.addPaginationEventListeners();
  }

  displayLinksInfo(links) {
    this.allLinks = links || [];
    this.currentLinkPage = 1;
    this.renderLinkTable();
  }

  renderLinkTable() {
    const container = document.getElementById("linksInfo");
    if (!container) {
      console.error("DOM element 'linksInfo' not found");
      return;
    }

    const startIndex = (this.currentLinkPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const currentLinks = this.allLinks.slice(startIndex, endIndex);
    const totalPages = Math.ceil(this.allLinks.length / this.itemsPerPage);

    if (this.allLinks.length === 0) {
      container.innerHTML = '<div class="seo-content">未找到链接</div>';
      return;
    }

    let html = `
      <div class="seo-content">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-medium">链接信息 (${this.allLinks.length})</h3>
          <button id="exportLinksBtn" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
            导出Excel
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full border border-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="border border-gray-200 px-2 py-1 text-left text-xs">序号</th>
                <th class="border border-gray-200 px-2 py-1 text-left text-xs">链接文本</th>
                <th class="border border-gray-200 px-2 py-1 text-left text-xs">URL</th>
                <th class="border border-gray-200 px-2 py-1 text-left text-xs">类型</th>
                <th class="border border-gray-200 px-2 py-1 text-left text-xs">目标</th>
              </tr>
            </thead>
            <tbody>
              ${currentLinks
                .map(
                  (link, index) => `
                <tr class="hover:bg-gray-50">
                  <td class="border border-gray-200 px-2 py-1 text-xs">${
                    startIndex + index + 1
                  }</td>
                  <td class="border border-gray-200 px-2 py-1 text-xs">${
                    link.text || "-"
                  }</td>
                  <td class="border border-gray-200 px-2 py-1 text-xs">
                    <a href="${
                      link.href
                    }" target="_blank" class="text-blue-600 hover:underline max-w-[100px] block truncate">
                      ${link.href}
                    </a>
                  </td>
                  <td class="border border-gray-200 px-2 py-1 text-xs">
                    <span class="inline-block px-2 py-1 rounded text-xs whitespace-nowrap ${
                      link.isExternal
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }">
                      ${link.isExternal ? "外部" : "内部"}
                    </span>
                  </td>
                  <td class="border border-gray-200 px-2 py-1 text-xs">${
                    link.target || "-"
                  }</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        ${this.createPagination("link", this.currentLinkPage, totalPages)}
      </div>
    `;

    container.innerHTML = html;
    this.addPaginationEventListeners();
  }

  displayStructuredDataInfo(structuredData) {
    console.log("显示结构化数据:", structuredData);
    const container = document.getElementById("structuredDataInfo");
    if (!container) {
      console.error("DOM element 'structuredDataInfo' not found");
      return;
    }

    if (!structuredData) {
      console.log("没有结构化数据");
      container.innerHTML =
        '<div class="seo-content text-gray-500 text-center py-8">未找到结构化数据</div>';
      return;
    }

    if (!structuredData.allSchemas || structuredData.allSchemas.length === 0) {
      console.log("allSchemas为空");
      container.innerHTML =
        '<div class="seo-content text-gray-500 text-center py-8">未找到结构化数据</div>';
      return;
    }

    console.log("找到", structuredData.allSchemas.length, "个结构化数据");

    // 保存产品数据用于导出
    const firstProduct = structuredData.processedSchemas.find(
      schema => schema.category === "Product"
    );
    this.currentProductData = firstProduct ? firstProduct.productInfo : null;

    // 按类别分组显示
    const groupedSchemas = this.groupSchemasByCategory(
      structuredData.processedSchemas
    );
    console.log("分组后的schemas:", groupedSchemas);

    // 创建优雅的展示结构
    let html = `
      <div class="structured-data-container space-y-6">
        <div class="summary-card bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-blue-600">${
                Object.keys(groupedSchemas).length
              }</div>
              <div class="text-xs text-gray-500">种类型</div>
            </div>
          </div>
        </div>
    `;

    // 显示每个类别的数据
    Object.keys(groupedSchemas).forEach(category => {
      const schemas = groupedSchemas[category];
      html += this.renderSchemaCategory(category, schemas);
    });

    html += `</div>`;
    container.innerHTML = html;
    console.log("结构化数据显示完成");
  }

  groupSchemasByCategory(schemas) {
    const grouped = {};
    schemas.forEach(schema => {
      if (!grouped[schema.category]) {
        grouped[schema.category] = [];
      }
      grouped[schema.category].push(schema);
    });
    return grouped;
  }

  renderSchemaCategory(category, schemas) {
    const categoryConfig = this.getCategoryConfig(category);

    let html = `
      <div class="category-section bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="category-header bg-gradient-to-r ${categoryConfig.gradientFrom} ${categoryConfig.gradientTo} px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="text-2xl">${categoryConfig.icon}</div>
              <div>
                <h3 class="text-lg font-semibold text-white">${categoryConfig.title}</h3>
                <p class="text-sm text-white/80">${categoryConfig.description}</p>
              </div>
            </div>
            <div class="bg-white/20 px-3 py-1 rounded-full">
              <span class="text-white font-medium">${schemas.length}</span>
            </div>
          </div>
        </div>
        <div class="category-content p-6 space-y-4">
    `;

    schemas.forEach((schema, index) => {
      html += this.renderSchemaItem(schema, categoryConfig, index);
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  renderSchemaItem(schema, categoryConfig, index) {
    console.log("渲染schema:", schema);

    let html = `
      <div class="schema-item border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div class="schema-header flex items-start justify-between mb-3">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                #${index + 1}
              </span>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                categoryConfig.badgeColor
              }">
                ${schema.schemaType}
              </span>
            </div>
            <h4 class="text-lg font-semibold text-gray-800 mb-1">${
              schema.name
            }</h4>
          </div>
        </div>
        <div class="schema-content">
    `;

    // 根据类别显示特定信息
    if (schema.category === "Product" && schema.productInfo) {
      html += this.renderProductCard(schema.productInfo);
    } else if (schema.category === "Organization" && schema.organizationInfo) {
      html += this.renderOrganizationCard(schema.organizationInfo);
    } else if (schema.category === "Navigation") {
      html += this.renderNavigationCard(schema.rawData);
    } else {
      html += this.renderGenericCard(schema.rawData);
    }

    html += `
        </div>
      </div>
    `;

    console.log("schema渲染完成");
    return html;
  }

  getCategoryConfig(category) {
    const configs = {
      Product: {
        icon: "🛍️",
        title: "产品信息",
        description: "电商产品的详细信息和价格",
        gradientFrom: "from-green-500",
        gradientTo: "to-emerald-600",
        badgeColor: "bg-green-100 text-green-800",
      },
      Organization: {
        icon: "🏢",
        title: "组织机构",
        description: "公司或组织的基本信息",
        gradientFrom: "from-blue-500",
        gradientTo: "to-blue-600",
        badgeColor: "bg-blue-100 text-blue-800",
      },
      Navigation: {
        icon: "🧭",
        title: "导航面包屑",
        description: "页面导航路径和层级结构",
        gradientFrom: "from-purple-500",
        gradientTo: "to-purple-600",
        badgeColor: "bg-purple-100 text-purple-800",
      },
      Review: {
        icon: "⭐",
        title: "评价评论",
        description: "用户评价和评分信息",
        gradientFrom: "from-yellow-500",
        gradientTo: "to-orange-500",
        badgeColor: "bg-yellow-100 text-yellow-800",
      },
      Event: {
        icon: "📅",
        title: "活动事件",
        description: "活动、会议或事件信息",
        gradientFrom: "from-red-500",
        gradientTo: "to-pink-500",
        badgeColor: "bg-red-100 text-red-800",
      },
      Article: {
        icon: "📰",
        title: "文章内容",
        description: "新闻文章或博客内容",
        gradientFrom: "from-indigo-500",
        gradientTo: "to-indigo-600",
        badgeColor: "bg-indigo-100 text-indigo-800",
      },
      Business: {
        icon: "🏪",
        title: "本地商家",
        description: "本地商家和服务信息",
        gradientFrom: "from-teal-500",
        gradientTo: "to-cyan-500",
        badgeColor: "bg-teal-100 text-teal-800",
      },
      Website: {
        icon: "🌐",
        title: "网站信息",
        description: "网站基本信息和描述",
        gradientFrom: "from-gray-500",
        gradientTo: "to-gray-600",
        badgeColor: "bg-gray-100 text-gray-800",
      },
      Other: {
        icon: "📋",
        title: "其他类型",
        description: "其他类型的结构化数据",
        gradientFrom: "from-gray-400",
        gradientTo: "to-gray-500",
        badgeColor: "bg-gray-100 text-gray-800",
      },
    };

    return configs[category] || configs.Other;
  }

  renderProductCard(product) {
    console.log("渲染产品卡片:", product);
    return `
      <div class="product-card bg-green-50 rounded-lg p-4 border border-green-200">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">产品名称:</span>
              <span class="text-sm text-gray-800">${product.name || "-"}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">品牌:</span>
              <span class="text-sm text-gray-800">${product.brand || "-"}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">SKU:</span>
              <span class="text-sm font-mono text-blue-600">${
                product.sku || "-"
              }</span>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">描述:</span>
              <span class="text-sm text-gray-800">${
                product.description
                  ? product.description.substring(0, 50) + "..."
                  : "-"
              }</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">类别:</span>
              <span class="text-sm text-gray-800">${
                product.category || "-"
              }</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">GTIN:</span>
              <span class="text-sm font-mono text-gray-600">${
                product.gtin || "-"
              }</span>
            </div>
          </div>
        </div>
        ${
          product.offers && product.offers.length > 0
            ? `
          <div class="mt-4 pt-4 border-t border-green-200">
            <h5 class="text-sm font-medium text-gray-700 mb-2">优惠信息 (${
              product.offers.length
            })</h5>
            <div class="space-y-2">
              ${product.offers
                .slice(0, 3)
                .map(
                  offer => `
                <div class="bg-white p-2 rounded border border-green-300">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">${
                      offer.seller || "默认销售商"
                    }</span>
                    <span class="font-medium text-green-600">${offer.price} ${
                    offer.currency || ""
                  }</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    <span>可用性: ${offer.availability || "-"}</span>
                    ${offer.validFrom ? ` | 有效期: ${offer.validFrom}` : ""}
                  </div>
                </div>
              `
                )
                .join("")}
              ${
                product.offers.length > 3
                  ? `<div class="text-xs text-gray-500">还有 ${
                      product.offers.length - 3
                    } 个优惠...</div>`
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  renderOrganizationCard(org) {
    return `
      <div class="organization-card bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">组织名称:</span>
              <span class="text-sm text-gray-800">${org.name || "-"}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">网站:</span>
              <span class="text-sm text-blue-600">${org.url || "-"}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">电话:</span>
              <span class="text-sm text-gray-800">${org.telephone || "-"}</span>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">地址:</span>
              <span class="text-sm text-gray-800">${org.address || "-"}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">邮编:</span>
              <span class="text-sm text-gray-800">${
                org.postalCode || "-"
              }</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">国家:</span>
              <span class="text-sm text-gray-800">${
                org.addressCountry || "-"
              }</span>
            </div>
          </div>
        </div>
        ${
          org.description
            ? `
          <div class="mt-3 pt-3 border-t border-blue-200">
            <div class="text-sm text-gray-700">${org.description}</div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  renderNavigationCard(rawData) {
    if (rawData.itemListElement && Array.isArray(rawData.itemListElement)) {
      return `
        <div class="navigation-card bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div class="flex items-center space-x-2 mb-3">
            <span class="text-sm font-medium text-gray-600">导航路径:</span>
            <span class="text-xs text-purple-600">${
              rawData.itemListElement.length
            } 层级</span>
          </div>
          <div class="breadcrumb-list space-y-2">
            ${rawData.itemListElement
              .map(
                (item, index) => `
              <div class="flex items-center space-x-2 text-sm">
                <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                  ${item.position || index + 1}
                </span>
                <span class="text-gray-800">${item.name || "-"}</span>
                ${
                  item.item
                    ? `<span class="text-blue-600 text-xs">${item.item}</span>`
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }
    return this.renderGenericCard(rawData);
  }

  renderGenericCard(rawData) {
    const keyFields = [
      "name",
      "url",
      "description",
      "headline",
      "title",
      "text",
      "datePublished",
      "author",
    ];
    const displayFields = keyFields.filter(field => rawData[field]);

    if (displayFields.length === 0) {
      return `
        <div class="generic-card bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div class="text-sm text-gray-500 text-center">暂无可显示的关键字段</div>
        </div>
      `;
    }

    return `
      <div class="generic-card bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div class="grid grid-cols-1 gap-2">
          ${displayFields
            .map(field => {
              const value =
                typeof rawData[field] === "string"
                  ? rawData[field].length > 100
                    ? rawData[field].substring(0, 100) + "..."
                    : rawData[field]
                  : JSON.stringify(rawData[field]).substring(0, 100);
              return `
              <div class="flex items-start space-x-2">
                <span class="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0">${field}:</span>
                <span class="text-sm text-gray-800 break-words">${value}</span>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  renderOfferInfo(offer) {
    return `
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
        <!-- 标题和价格区域 -->
        <div class="flex justify-between items-start mb-3">
          <div class="flex-1">
            <div class="font-semibold text-gray-900 mb-2">
              ${offer.productName || `产品选项 ${offer.index}`}
            </div>
            ${
              offer.sku
                ? `<div class="text-xs text-blue-700 font-mono bg-blue-100 px-2 py-1 rounded inline-block">SKU: ${offer.sku}</div>`
                : ""
            }
            <div class="mt-2">
              <span class="inline-block px-3 py-1 rounded-full text-xs font-medium ${
                offer.availabilityText === "有库存"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : offer.availabilityText === "无库存"
                  ? "bg-red-100 text-red-800 border border-red-300"
                  : offer.availabilityText === "预订"
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-gray-100 text-gray-800 border border-gray-300"
              }">
                ${offer.availabilityText || "状态未知"}
              </span>
            </div>
          </div>
          <div class="text-right ml-4">
            <div class="text-green-600 font-bold text-xl">${offer.price} ${
      offer.priceCurrency
    }</div>
            ${
              offer.originalPrice && offer.originalPrice !== offer.price
                ? `<div class="text-gray-500 line-through text-sm">原价: ${offer.originalPrice}</div>`
                : ""
            }
            ${
              offer.discountPercentage
                ? `<div class="text-red-500 text-sm font-medium bg-red-50 px-2 py-1 rounded">省${offer.discountPercentage}</div>`
                : ""
            }
          </div>
        </div>
        
        <!-- 产品规格信息 -->
        ${
          offer.color || offer.size || offer.material
            ? `
          <div class="mb-2 p-2 bg-blue-50 rounded">
            <strong class="text-blue-800">🎨 产品规格</strong>
            <div class="grid grid-cols-2 gap-1 mt-1 text-xs">
              ${
                offer.color
                  ? `<div>颜色: <span class="px-1 py-0.5 bg-gray-200 rounded">${offer.color}</span></div>`
                  : ""
              }
              ${
                offer.size
                  ? `<div>尺寸: <span class="font-medium">${offer.size}</span></div>`
                  : ""
              }
              ${offer.material ? `<div>材质: ${offer.material}</div>` : ""}
              ${offer.model ? `<div>型号: ${offer.model}</div>` : ""}
            </div>
          </div>
        `
            : ""
        }
        
        <!-- 库存详情 -->
        ${
          offer.inventoryLevel || offer.stockQuantity
            ? `
          <div class="mb-2 p-2 bg-yellow-50 rounded">
            <strong class="text-yellow-800">📊 库存详情</strong>
            <div class="grid grid-cols-2 gap-1 mt-1 text-xs">
              ${
                offer.inventoryLevel
                  ? `<div>库存水平: ${offer.inventoryLevel}</div>`
                  : ""
              }
              ${
                offer.stockQuantity
                  ? `<div>库存数量: ${offer.stockQuantity}</div>`
                  : ""
              }
              ${
                offer.inventoryStatus
                  ? `<div>库存状态: ${offer.inventoryStatus}</div>`
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }
        
        <!-- 销售信息 -->
        <div class="grid grid-cols-2 gap-1 text-gray-600 text-xs">
          ${offer.warranty ? `<div>🛡️ 保修: ${offer.warranty}</div>` : ""}
          ${
            offer.url
              ? `<div>🔗 <a href="${offer.url}" target="_blank" class="text-blue-600 hover:underline">查看详情</a></div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  renderOrganizationInfo(org) {
    return `
      <div class="grid grid-cols-2 gap-2">
        <div><strong>名称:</strong> ${org.name || "-"}</div>
        <div><strong>类型:</strong> ${org.type || "-"}</div>
        <div><strong>网址:</strong> ${
          org.url
            ? `<a href="${org.url}" target="_blank" class="text-blue-600 hover:underline">${org.url}</a>`
            : "-"
        }</div>
        <div><strong>Logo:</strong> ${
          org.logo
            ? `<a href="${org.logo}" target="_blank" class="text-blue-600 hover:underline">查看</a>`
            : "-"
        }</div>
      </div>
    `;
  }

  renderBasicSchemaInfo(rawData) {
    const keyFields = [
      "name",
      "url",
      "description",
      "headline",
      "title",
      "text",
    ];
    let html = `<div class="grid grid-cols-1 gap-1 text-xs">`;

    keyFields.forEach(field => {
      if (rawData[field]) {
        const value =
          typeof rawData[field] === "string"
            ? rawData[field].substring(0, 100) +
              (rawData[field].length > 100 ? "..." : "")
            : JSON.stringify(rawData[field]).substring(0, 100);
        html += `<div><strong>${field}:</strong> ${value}</div>`;
      }
    });

    html += `</div>`;
    return html;
  }

  displayAnalyticsInfo(analytics) {
    console.log("显示分析工具信息:", analytics);
    const container = document.getElementById("analyticsInfo");
    if (!container) {
      console.error("DOM element 'analyticsInfo' not found");
      return;
    }

    const tools = [];

    // 如果analytics是数组（新格式）
    if (Array.isArray(analytics)) {
      analytics.forEach(tool => {
        if (tool.detected) {
          tools.push(tool.name);
        }
      });
    } else if (analytics) {
      // 兼容旧格式
      if (analytics.googleAnalytics) tools.push("Google Analytics");
      if (analytics.googleTagManager) tools.push("Google Tag Manager");
      if (analytics.facebookPixel) tools.push("Facebook Pixel");
      if (analytics.hotjar) tools.push("Hotjar");
      if (analytics.mixpanel) tools.push("Mixpanel");
    }

    console.log("检测到的分析工具:", tools);

    container.innerHTML = `
      <div class="seo-content">
        ${
          tools.length > 0
            ? `
          <div class="space-y-2">
            <div class="text-green-600 font-medium">检测到以下分析工具:</div>
            ${tools
              .map(
                tool =>
                  `<div class="bg-green-100 text-green-800 px-3 py-1 rounded inline-block mr-2 mb-2 text-sm">${tool}</div>`
              )
              .join("")}
          </div>
        `
            : '<div class="text-gray-500">未检测到分析工具</div>'
        }
      </div>
    `;
  }

  displayRecommendations(recommendations) {
    console.log("显示优化建议:", recommendations);
    const container = document.getElementById("recommendationsInfo");
    if (!container) {
      console.error("DOM element 'recommendationsInfo' not found");
      return;
    }

    if (!recommendations || recommendations.length === 0) {
      console.log("没有优化建议");
      container.innerHTML = '<div class="seo-content">暂无优化建议</div>';
      return;
    }

    console.log("找到", recommendations.length, "个优化建议");

    const priorityColors = {
      high: "border-red-400 bg-red-50 text-red-800",
      medium: "border-yellow-400 bg-yellow-50 text-yellow-800",
      low: "border-green-400 bg-green-50 text-green-800",
    };

    container.innerHTML = `
      <div class="seo-content space-y-3">
        ${recommendations
          .map(
            rec => `
          <div class="border-l-4 ${
            priorityColors[rec.priority] || priorityColors.medium
          } p-3 rounded">
            <div class="font-medium mb-1">${rec.title}</div>
            <div class="text-sm text-gray-600">${rec.description}</div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
    console.log("优化建议显示完成");
  }

  createPagination(type, currentPage, totalPages) {
    if (totalPages <= 1) return "";

    let html = `<div class="flex justify-center items-center space-x-2 mt-4">`;

    // 上一页
    if (currentPage > 1) {
      html += `<button class="pagination-btn px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600" data-type="${type}" data-page="${
        currentPage - 1
      }">上一页</button>`;
    }

    // 页码
    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        html += `<span class="px-3 py-1 bg-blue-600 text-white rounded text-sm">${i}</span>`;
      } else {
        html += `<button class="pagination-btn px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300" data-type="${type}" data-page="${i}">${i}</button>`;
      }
    }

    // 下一页
    if (currentPage < totalPages) {
      html += `<button class="pagination-btn px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600" data-type="${type}" data-page="${
        currentPage + 1
      }">下一页</button>`;
    }

    html += `</div>`;
    return html;
  }

  changePage(type, page) {
    if (type === "image") {
      this.currentImagePage = page;
      this.renderImageTable();
    } else if (type === "link") {
      this.currentLinkPage = page;
      this.renderLinkTable();
    }
  }

  addPaginationEventListeners() {
    // 移除之前的事件监听器
    document.querySelectorAll(".pagination-btn").forEach(btn => {
      btn.removeEventListener("click", this.handlePaginationClick);
    });

    // 添加新的事件监听器
    document.querySelectorAll(".pagination-btn").forEach(btn => {
      btn.addEventListener("click", this.handlePaginationClick.bind(this));
    });
  }

  addExportEventListeners() {
    // 为导出按钮添加事件监听器
    const exportImagesBtn = document.getElementById("exportImagesBtn");
    if (exportImagesBtn) {
      exportImagesBtn.removeEventListener("click", this.exportImages);
      exportImagesBtn.addEventListener("click", this.exportImages.bind(this));
    }

    const exportLinksBtn = document.getElementById("exportLinksBtn");
    if (exportLinksBtn) {
      exportLinksBtn.removeEventListener("click", this.exportLinks);
      exportLinksBtn.addEventListener("click", this.exportLinks.bind(this));
    }

    const exportOffersBtn = document.getElementById("exportOffers");
    if (exportOffersBtn) {
      exportOffersBtn.removeEventListener("click", this.exportOffers);
      exportOffersBtn.addEventListener("click", this.exportOffers.bind(this));
    }
  }

  handlePaginationClick(event) {
    const type = event.target.dataset.type;
    const page = parseInt(event.target.dataset.page);
    this.changePage(type, page);
  }

  exportImages() {
    if (!this.allImages || this.allImages.length === 0) {
      alert("没有图片数据可导出");
      return;
    }

    const data = [
      [
        "序号",
        "图片链接",
        "Alt文本",
        "宽度",
        "高度",
        "类型",
        "是否懒加载",
        "加载方式",
        "可点击链接",
      ],
      ...this.allImages.map((img, index) => [
        index + 1,
        img.src,
        img.alt || "-",
        img.width || "?",
        img.height || "?",
        img.isDataUrl ? "Base64" : "普通",
        img.isLazyLoaded ? "是" : "否",
        img.loading || "默认",
        `=HYPERLINK("${img.src}","查看图片")`,
      ]),
    ];

    this.downloadExcel(data, "页面图片信息.xlsx");
  }

  exportLinks() {
    if (!this.allLinks || this.allLinks.length === 0) {
      alert("没有链接数据可导出");
      return;
    }

    const data = [
      ["序号", "链接文本", "URL", "类型", "标题", "目标", "可点击链接"],
      ...this.allLinks.map((link, index) => [
        index + 1,
        link.text || "-",
        link.href,
        link.isExternal ? "外部" : "内部",
        link.title || "-",
        link.target || "-",
        `=HYPERLINK("${link.href}","打开链接")`,
      ]),
    ];

    this.downloadExcel(data, "页面链接信息.xlsx");
  }

  exportOffers() {
    // 从当前存储的产品数据中获取offers信息
    if (
      !this.currentProductData ||
      !this.currentProductData.offersDetails ||
      this.currentProductData.offersDetails.length === 0
    ) {
      alert("没有offers数据可导出");
      return;
    }

    const data = [
      [
        "序号",
        "产品名称",
        "SKU",
        "GTIN",
        "MPN",
        "序列号",
        "价格",
        "货币",
        "原价",
        "折扣金额",
        "折扣比例",
        "价格类型",
        "价格有效期",
        "产品名称",
        "颜色",
        "尺寸",
        "材质",
        "型号",
        "品牌",
        "重量",
        "尺寸规格",
        "变体信息",
        "可用性",
        "商品状态",
        "库存水平",
        "库存状态",
        "库存数量",
        "最小订购量",
        "最大订购量",
        "补货日期",
        "卖家",
        "卖家类型",
        "卖家评分",
        "卖家位置",
        "保修",
        "交付时间",
        "服务区域",
        "适用地区",
        "不适用地区",
        "有效开始",
        "有效结束",
        "业务功能",
        "商品类别",
        "链接",
        "配送费用",
        "配送货币",
        "配送目的地",
        "配送时间",
        "退货政策类别",
        "退货天数",
        "退货方式",
        "退货费用",
        "退货适用国家",
      ],
      ...this.currentProductData.offersDetails.map((offer, index) => [
        offer.index,
        this.currentProductData.name || "",
        offer.sku,
        offer.gtin,
        offer.mpn,
        offer.serialNumber,
        offer.price,
        offer.priceCurrency,
        offer.originalPrice,
        offer.discountAmount,
        offer.discountPercentage,
        offer.priceType,
        offer.priceValidUntil,
        offer.productName,
        offer.color,
        offer.size,
        offer.material,
        offer.model,
        offer.brand,
        offer.weight,
        offer.dimensions,
        offer.variantInfo,
        offer.availabilityText,
        offer.condition,
        offer.inventoryLevel,
        offer.inventoryStatus,
        offer.stockQuantity,
        offer.minOrderQuantity,
        offer.maxOrderQuantity,
        offer.restockDate,
        offer.seller,
        offer.sellerType,
        offer.sellerRating,
        offer.sellerLocation,
        offer.warranty,
        offer.deliveryLeadTime,
        offer.areaServed,
        offer.eligibleRegion,
        offer.ineligibleRegion,
        offer.validFrom,
        offer.validThrough,
        offer.businessFunction,
        offer.category,
        offer.url ? `=HYPERLINK("${offer.url}","查看详情")` : "",
        offer.shipping ? offer.shipping.cost : "",
        offer.shipping ? offer.shipping.currency : "",
        offer.shipping ? offer.shipping.destination : "",
        offer.shipping ? offer.shipping.deliveryTime : "",
        offer.returnPolicy ? offer.returnPolicy.category : "",
        offer.returnPolicy ? offer.returnPolicy.days : "",
        offer.returnPolicy ? offer.returnPolicy.method : "",
        offer.returnPolicy ? offer.returnPolicy.fees : "",
        offer.returnPolicy ? offer.returnPolicy.countries : "",
      ]),
    ];

    this.downloadExcel(
      data,
      `${this.currentProductData.name || "产品"}_销售选项数据.xlsx`
    );
  }

  downloadExcel(data, filename) {
    try {
      // 检查是否有xlsx库
      if (typeof XLSX !== "undefined") {
        // 使用XLSX库
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "数据");
        XLSX.writeFile(wb, filename);
      } else {
        // 降级到CSV
        this.downloadCSV(data, filename.replace(".xlsx", ".csv"));
      }
    } catch (error) {
      console.error("导出失败:", error);
      // 降级到CSV
      this.downloadCSV(data, filename.replace(".xlsx", ".csv"));
    }
  }

  downloadCSV(data, filename) {
    // 添加BOM以支持中文
    const BOM = "\uFEFF";
    const csvContent =
      BOM +
      data
        .map(row =>
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// 初始化侧边栏管理器
new SidebarManager();
