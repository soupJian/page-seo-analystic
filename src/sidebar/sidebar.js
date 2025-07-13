// 侧边栏JavaScript逻辑
class SidebarManager {
  constructor() {
    this.currentImagePage = 1;
    this.currentLinkPage = 1;
    this.itemsPerPage = 10;
    this.allImages = [];
    this.allLinks = [];
    this.currentProductData = null;
    this.init();
  }

  init() {
    // 监听来自background script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === "SEO_DATA") {
        this.displaySeoData(request.data);
      }
    });

    // 页面加载时请求数据，带重试机制
    this.requestSeoData();

    // 关闭按钮事件
    document.getElementById("closeSidebar").addEventListener("click", () => {
      window.close();
    });

    // 延迟添加导出按钮事件监听器
    setTimeout(() => {
      this.addExportEventListeners();
    }, 1000);
  }

  async requestSeoData(retryCount = 0) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "getSeoData",
      });
      if (response && response.data) {
        console.log("从background script获取到数据:", response.data);
        this.displaySeoData(response.data);
      } else {
        console.log("background script中暂无数据");
        // 如果没有数据且重试次数少于3次，则等待后重试
        if (retryCount < 3) {
          console.log(`等待1秒后重试 (${retryCount + 1}/3)`);
          setTimeout(() => {
            this.requestSeoData(retryCount + 1);
          }, 1000);
        }
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

  displaySeoData(data) {
    this.displayBasicInfo(data.basic);
    this.displayMetaInfo(data.meta);
    this.displayOpenGraphInfo(data.openGraph);
    this.displayHeadingStructure(data.headings);
    this.displayImageInfo(data.images);
    this.displayLinksInfo(data.links);
    this.displayStructuredDataInfo(data.structuredData);
    this.displayAnalyticsInfo(data.analytics);
    this.displayRecommendations(data.recommendations);
  }

  displayBasicInfo(basic) {
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
          <div><strong>语言:</strong> ${basic.language || "未设置"}</div>
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
    const container = document.getElementById("openGraphInfo");
    if (!container) {
      console.error("DOM element 'openGraphInfo' not found");
      return;
    }
    container.innerHTML = `
      <div class="seo-content">
        <div class="grid grid-cols-1 gap-2">
          <div><strong>Title:</strong> ${og.title || "未设置"}</div>
          <div><strong>Description:</strong> ${og.description || "未设置"}</div>
          <div><strong>Image:</strong> ${
            og.image
              ? `<a href="${og.image}" target="_blank" class="text-blue-600 hover:underline">查看图片</a>`
              : "未设置"
          }</div>
          <div><strong>URL:</strong> ${
            og.url
              ? `<a href="${og.url}" target="_blank" class="text-blue-600 hover:underline">${og.url}</a>`
              : "未设置"
          }</div>
          <div><strong>Type:</strong> ${og.type || "未设置"}</div>
          <div><strong>Site Name:</strong> ${og.siteName || "未设置"}</div>
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
      H1: "bg-red-100 text-red-800",
      H2: "bg-orange-100 text-orange-800",
      H3: "bg-yellow-100 text-yellow-800",
      H4: "bg-green-100 text-green-800",
      H5: "bg-blue-100 text-blue-800",
      H6: "bg-purple-100 text-purple-800",
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
            <div class="flex items-center space-x-2">
              <span class="px-2 py-1 rounded text-xs font-medium ${
                headingColors[heading.tag] || "bg-gray-100 text-gray-800"
              }">
                ${heading.tag}
              </span>
              <span class="text-sm">${heading.text}</span>
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
                  }" class="w-[100px] h-16 object-cover rounded">
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
                    <span class="px-2 py-1 rounded text-xs ${
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
    const container = document.getElementById("structuredDataInfo");
    if (!container) {
      console.error("DOM element 'structuredDataInfo' not found");
      return;
    }

    if (!structuredData || structuredData.allSchemas.length === 0) {
      container.innerHTML = '<div class="seo-content">未找到结构化数据</div>';
      return;
    }

    // 保存产品数据用于导出 - 从processedSchemas中获取第一个产品
    const firstProduct = structuredData.processedSchemas.find(
      schema => schema.category === "Product"
    );
    this.currentProductData = firstProduct ? firstProduct.productInfo : null;

    let html = `
      <div class="space-y-4">
        <div class="bg-blue-50 p-3 rounded">
          <div class="text-sm font-medium text-blue-800">
            发现 ${structuredData.allSchemas.length} 个JSON-LD结构化数据
          </div>
          <div class="text-xs text-blue-600 mt-1">
            来自 ${
              new Set(structuredData.allSchemas.map(s => s.scriptIndex)).size
            } 个script标签
          </div>
        </div>
    `;

    // 按类别分组显示
    const groupedSchemas = this.groupSchemasByCategory(
      structuredData.processedSchemas
    );

    // 显示每个类别的数据
    Object.keys(groupedSchemas).forEach(category => {
      const schemas = groupedSchemas[category];
      html += this.renderSchemaCategory(category, schemas);
    });

    html += "</div>";
    container.innerHTML = html;
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
      <div class="border-l-4 ${categoryConfig.borderColor} pl-4 mb-4">
        <h3 class="font-medium ${categoryConfig.textColor} mb-2">
          ${categoryConfig.icon} ${categoryConfig.title} (${schemas.length})
        </h3>
        <div class="space-y-3">
    `;

    schemas.forEach(schema => {
      html += this.renderSchema(schema, categoryConfig);
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  getCategoryConfig(category) {
    const configs = {
      Product: {
        icon: "🛍️",
        title: "产品信息",
        borderColor: "border-green-400",
        textColor: "text-green-800",
        bgColor: "bg-green-50",
      },
      Organization: {
        icon: "🏢",
        title: "组织信息",
        borderColor: "border-blue-400",
        textColor: "text-blue-800",
        bgColor: "bg-blue-50",
      },
      Navigation: {
        icon: "🧭",
        title: "导航信息",
        borderColor: "border-purple-400",
        textColor: "text-purple-800",
        bgColor: "bg-purple-50",
      },
      Review: {
        icon: "⭐",
        title: "评价信息",
        borderColor: "border-yellow-400",
        textColor: "text-yellow-800",
        bgColor: "bg-yellow-50",
      },
      Event: {
        icon: "📅",
        title: "事件信息",
        borderColor: "border-red-400",
        textColor: "text-red-800",
        bgColor: "bg-red-50",
      },
      Content: {
        icon: "📝",
        title: "内容信息",
        borderColor: "border-indigo-400",
        textColor: "text-indigo-800",
        bgColor: "bg-indigo-50",
      },
      Other: {
        icon: "🔧",
        title: "其他信息",
        borderColor: "border-gray-400",
        textColor: "text-gray-800",
        bgColor: "bg-gray-50",
      },
    };
    return configs[category] || configs.Other;
  }

  renderSchema(schema, categoryConfig) {
    let html = `
      <div class="${categoryConfig.bgColor} p-3 rounded text-sm border">
        <div class="flex justify-between items-start mb-2">
          <div>
            <div class="font-medium text-gray-800">${schema.name}</div>
            <div class="text-xs text-gray-600">
              类型: ${schema.type.join(", ")} | 
              脚本: ${schema.scriptIndex} | 
              ID: ${schema.id}
            </div>
          </div>
        </div>
    `;

    // 根据类别显示特定信息
    if (schema.category === "Product" && schema.productInfo) {
      html += this.renderProductInfo(schema.productInfo);
    } else if (schema.category === "Organization" && schema.organizationInfo) {
      html += this.renderOrganizationInfo(schema.organizationInfo);
    } else {
      // 显示原始数据的关键字段
      html += this.renderBasicSchemaInfo(schema.rawData);
    }

    html += `</div>`;
    return html;
  }

  renderProductInfo(product) {
    let html = `
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div><strong>名称:</strong> ${product.name || "-"}</div>
        <div><strong>品牌:</strong> ${product.brand || "-"}</div>
        <div><strong>SKU:</strong> <span class="font-mono text-blue-600">${
          product.sku || "-"
        }</span></div>
        <div><strong>起始价格:</strong> ${
          product.price
            ? `<span class="text-green-600 font-semibold">${product.price} ${
                product.priceCurrency || ""
              }</span>`
            : "-"
        }</div>
        <div><strong>价格范围:</strong> ${
          product.priceRange
            ? `<span class="text-green-600 font-semibold">${
                product.priceRange
              } ${product.priceCurrency || ""}</span>`
            : "-"
        }</div>
        <div><strong>GTIN:</strong> <span class="font-mono">${
          product.gtin || "-"
        }</span></div>
        <div><strong>MPN:</strong> <span class="font-mono">${
          product.mpn || "-"
        }</span></div>
        <div><strong>商品状态:</strong> ${product.condition || "-"}</div>
        <div><strong>类别:</strong> ${product.category || "-"}</div>
        <div><strong>可用性:</strong> 
          <span class="px-2 py-1 rounded text-xs ${
            product.availabilityText === "有库存"
              ? "bg-green-100 text-green-800"
              : product.availabilityText === "无库存"
              ? "bg-red-100 text-red-800"
              : product.availabilityText === "预订"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }">
            ${product.availabilityText || "-"}
          </span>
        </div>
        <div><strong>评分:</strong> ${
          product.rating
            ? `<span class="text-yellow-600">⭐ ${product.rating}</span> ${
                product.ratingScale ? `(${product.ratingScale})` : ""
              } (${product.reviewCount || 0} 评论)`
            : "-"
        }</div>
      </div>
    `;

    // 显示offers信息
    if (product.offersDetails && product.offersDetails.length > 0) {
      html += `
        <div class="mt-3 border-t pt-3">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-medium text-gray-800">💰 销售选项 (${
              product.offersDetails.length
            })</h4>
            <button id="exportOffers" class="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">
              导出Excel
            </button>
          </div>
          <div class="space-y-2 max-h-60 overflow-y-auto">
            ${product.offersDetails
              .map((offer, index) => this.renderOfferInfo(offer))
              .join("")}
          </div>
        </div>
      `;
    }

    return html;
  }

  renderOfferInfo(offer) {
    return `
      <div class="bg-white p-3 rounded border text-xs border-l-4 ${
        offer.availabilityText === "有库存"
          ? "border-green-400"
          : offer.availabilityText === "无库存"
          ? "border-red-400"
          : "border-yellow-400"
      }">
        <!-- 标题和价格区域 -->
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1">
            <div class="font-medium text-gray-800 mb-1">
              ${offer.productName || `选项 ${offer.index}`}
            </div>
            ${
              offer.sku
                ? `<div class="text-xs text-blue-600 font-mono">SKU: ${offer.sku}</div>`
                : ""
            }
            <div class="mt-1">
              <span class="px-2 py-1 rounded text-xs font-medium ${
                offer.availabilityText === "有库存"
                  ? "bg-green-100 text-green-800"
                  : offer.availabilityText === "无库存"
                  ? "bg-red-100 text-red-800"
                  : offer.availabilityText === "预订"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }">
                ${offer.availabilityText || "状态未知"}
              </span>
            </div>
          </div>
          <div class="text-right ml-4">
            <div class="text-green-600 font-bold text-lg">${offer.price} ${
      offer.priceCurrency
    }</div>
            ${
              offer.originalPrice && offer.originalPrice !== offer.price
                ? `<div class="text-gray-500 line-through text-xs">原价: ${offer.originalPrice}</div>`
                : ""
            }
            ${
              offer.discountPercentage
                ? `<div class="text-red-500 text-xs font-medium">省${offer.discountPercentage}</div>`
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
    const container = document.getElementById("analyticsInfo");
    if (!container) {
      console.error("DOM element 'analyticsInfo' not found");
      return;
    }

    const tools = [];

    if (analytics.googleAnalytics) tools.push("Google Analytics");
    if (analytics.googleTagManager) tools.push("Google Tag Manager");
    if (analytics.facebookPixel) tools.push("Facebook Pixel");
    if (analytics.hotjar) tools.push("Hotjar");
    if (analytics.mixpanel) tools.push("Mixpanel");

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
    const container = document.getElementById("recommendations");
    if (!container) {
      console.error("DOM element 'recommendations' not found");
      return;
    }

    if (!recommendations || recommendations.length === 0) {
      container.innerHTML = '<div class="seo-content">暂无优化建议</div>';
      return;
    }

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
            <div class="text-sm mb-2">${rec.description}</div>
            ${
              rec.action
                ? `<div class="text-xs"><strong>建议:</strong> ${rec.action}</div>`
                : ""
            }
            ${
              rec.link
                ? `<div class="text-xs mt-1"><a href="${rec.link}" target="_blank" class="text-blue-600 hover:underline">了解更多</a></div>`
                : ""
            }
          </div>
        `
          )
          .join("")}
      </div>
    `;
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
