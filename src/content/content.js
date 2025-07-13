// Content Script - 页面分析和侧边栏管理
class PageAnalyzer {
  constructor() {
    this.sidebar = null;
    this.sidebarVisible = false;
    this.init();
  }

  init() {
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "analyzePage") {
        this.analyzePage();
        sendResponse({ success: true });
      }
    });

    // 监听来自侧边栏的消息
    window.addEventListener("message", event => {
      if (event.data.type === "CLOSE_SIDEBAR") {
        this.hideSidebar();
      }
    });
  }

  async analyzePage() {
    try {
      // 分析页面数据
      const seoData = {
        basic: this.getBasicInfo(),
        meta: this.getMetaInfo(),
        openGraph: this.getOpenGraphInfo(),
        headings: this.getHeadingStructure(),
        images: this.getImageInfo(),
        links: this.getLinksInfo(),
        analytics: this.getAnalyticsInfo(),
        structuredData: this.getStructuredDataInfo(),
        recommendations: [],
      };

      // 生成SEO建议
      seoData.recommendations = this.generateRecommendations(seoData);

      // 发送数据到侧边栏
      setTimeout(() => {
        this.sendDataToSidebar(seoData);
      }, 500);
    } catch (error) {
      console.error("页面分析失败:", error);
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
    // 查找页面logo
    const selectors = [
      'img[alt*="logo" i]',
      'img[src*="logo" i]',
      'img[class*="logo" i]',
      ".logo img",
      "#logo img",
      "header img:first-of-type",
    ];

    for (const selector of selectors) {
      const logo = document.querySelector(selector);
      if (logo && logo.src) {
        return logo.src;
      }
    }

    return null;
  }

  getMetaInfo() {
    const getMeta = name => {
      const meta = document.querySelector(
        `meta[name="${name}"], meta[property="${name}"]`
      );
      return meta ? meta.content : null;
    };

    return {
      description: getMeta("description"),
      keywords: getMeta("keywords"),
      author: getMeta("author"),
      viewport: getMeta("viewport"),
      robots: getMeta("robots"),
      canonical: document.querySelector('link[rel="canonical"]')?.href,
    };
  }

  getOpenGraphInfo() {
    const getOgMeta = property => {
      const meta = document.querySelector(`meta[property="${property}"]`);
      return meta ? meta.content : null;
    };

    return {
      title: getOgMeta("og:title"),
      description: getOgMeta("og:description"),
      type: getOgMeta("og:type"),
      url: getOgMeta("og:url"),
      image: getOgMeta("og:image"),
      siteName: getOgMeta("og:site_name"),
    };
  }

  getHeadingStructure() {
    const headings = [];
    const headingTags = document.querySelectorAll("h1, h2, h3, h4, h5, h6");

    headingTags.forEach(heading => {
      headings.push({
        tag: heading.tagName.toUpperCase(),
        text: heading.textContent.trim().substring(0, 100),
      });
    });

    return headings;
  }

  getImageInfo() {
    const images = [];
    const imgTags = document.querySelectorAll("img");

    imgTags.forEach((img, index) => {
      // 获取图片源，优先级：src > data-src > data-lazy-src
      let imgSrc =
        img.src ||
        img.dataset.src ||
        img.dataset.lazySrc ||
        img.getAttribute("data-original");

      if (imgSrc) {
        // 处理相对路径
        if (imgSrc.startsWith("//")) {
          imgSrc = window.location.protocol + imgSrc;
        } else if (imgSrc.startsWith("/")) {
          imgSrc = window.location.origin + imgSrc;
        } else if (!imgSrc.startsWith("http") && !imgSrc.startsWith("data:")) {
          imgSrc = new URL(imgSrc, window.location.href).href;
        }

        images.push({
          src: imgSrc,
          alt: img.alt || "",
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
          loading: img.loading || "",
          isDataUrl: imgSrc.startsWith("data:"),
          isLazyLoaded: !!(
            img.dataset.src ||
            img.dataset.lazySrc ||
            img.getAttribute("data-original")
          ),
          index: index + 1,
        });
      }
    });

    return images; // 返回所有图片，不限制数量
  }

  getLinksInfo() {
    const links = [];
    const linkTags = document.querySelectorAll("a[href]");

    linkTags.forEach(link => {
      if (link.href && link.href !== "#") {
        const linkInfo = {
          href: link.href,
          text: link.textContent.trim().substring(0, 100) || link.href,
          title: link.title || "",
          target: link.target || "_self",
          isExternal: link.hostname !== window.location.hostname,
        };

        // 避免重复链接
        if (!links.find(l => l.href === linkInfo.href)) {
          links.push(linkInfo);
        }
      }
    });

    return links.slice(0, 50); // 限制显示前50个链接
  }

  getStructuredDataInfo() {
    const structuredData = {
      allSchemas: [], // 存储所有原始的JSON-LD数据
      processedSchemas: [], // 存储处理后的结构化数据
    };

    // 查找所有LD+JSON脚本
    const ldJsonScripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    ldJsonScripts.forEach((script, scriptIndex) => {
      try {
        const data = JSON.parse(script.textContent);
        const schemas = Array.isArray(data) ? data : [data];

        schemas.forEach((schema, schemaIndex) => {
          // 保存原始数据
          const originalSchema = {
            scriptIndex: scriptIndex + 1,
            schemaIndex: schemaIndex + 1,
            type: schema["@type"] || "Unknown",
            rawData: schema,
          };
          structuredData.allSchemas.push(originalSchema);

          // 处理并增强数据
          const processedSchema = this.processJsonLdSchema(
            schema,
            scriptIndex + 1,
            schemaIndex + 1
          );
          if (processedSchema) {
            structuredData.processedSchemas.push(processedSchema);
          }
        });
      } catch (error) {
        console.error(`解析第${scriptIndex + 1}个LD+JSON失败:`, error);
      }
    });

    return structuredData;
  }

  processJsonLdSchema(schema, scriptIndex, schemaIndex) {
    const schemaType = schema["@type"];

    if (!schemaType) return null;

    const processedSchema = {
      id: `schema-${scriptIndex}-${schemaIndex}`,
      scriptIndex,
      schemaIndex,
      type: Array.isArray(schemaType) ? schemaType : [schemaType],
      name: this.getSchemaName(schema, schemaType),
      rawData: schema,
    };

    // 根据类型进行特殊处理
    if (this.isProductType(schemaType)) {
      processedSchema.productInfo = this.extractProductInfo(schema);
      processedSchema.category = "Product";
    } else if (this.isOrganizationType(schemaType)) {
      processedSchema.organizationInfo = this.extractOrganizationInfo(schema);
      processedSchema.category = "Organization";
    } else if (this.isBreadcrumbType(schemaType)) {
      processedSchema.breadcrumbInfo = this.extractBreadcrumbInfo(schema);
      processedSchema.category = "Navigation";
    } else if (this.isReviewType(schemaType)) {
      processedSchema.reviewInfo = this.extractReviewInfo(schema);
      processedSchema.category = "Review";
    } else if (this.isEventType(schemaType)) {
      processedSchema.eventInfo = this.extractEventInfo(schema);
      processedSchema.category = "Event";
    } else if (this.isArticleType(schemaType)) {
      processedSchema.articleInfo = this.extractArticleInfo(schema);
      processedSchema.category = "Content";
    } else {
      processedSchema.category = "Other";
    }

    return processedSchema;
  }

  getSchemaName(schema, schemaType) {
    // 根据不同的schema类型生成合适的名称
    if (schemaType === "BreadcrumbList") {
      if (schema.itemListElement && schema.itemListElement.length > 0) {
        const breadcrumbs = schema.itemListElement
          .map(item => item.name)
          .filter(name => name)
          .join(" > ");
        return breadcrumbs || "面包屑导航";
      }
      return "面包屑导航";
    } else if (schemaType === "Organization") {
      return schema.name || schema.legalName || "组织信息";
    } else if (schemaType === "Product") {
      return schema.name || "产品信息";
    } else if (schemaType === "Review") {
      return schema.name || `${schema.itemReviewed?.name || "商品"}的评价`;
    } else if (schemaType === "Event") {
      return schema.name || "事件信息";
    } else if (schemaType === "Article") {
      return schema.headline || schema.name || "文章信息";
    } else {
      return (
        schema.name || schema.headline || schema.title || `${schemaType}信息`
      );
    }
  }

  isProductType(type) {
    const productTypes = [
      "Product",
      "IndividualProduct",
      "ProductModel",
      "SomeProducts",
    ];
    return Array.isArray(type)
      ? type.some(t => productTypes.includes(t))
      : productTypes.includes(type);
  }

  isOrganizationType(type) {
    const orgTypes = [
      "Organization",
      "Corporation",
      "LocalBusiness",
      "Store",
      "OnlineStore",
    ];
    return Array.isArray(type)
      ? type.some(t => orgTypes.includes(t))
      : orgTypes.includes(type);
  }

  isBreadcrumbType(type) {
    return Array.isArray(type)
      ? type.includes("BreadcrumbList")
      : type === "BreadcrumbList";
  }

  isReviewType(type) {
    const reviewTypes = ["Review", "AggregateRating"];
    return Array.isArray(type)
      ? type.some(t => reviewTypes.includes(t))
      : reviewTypes.includes(type);
  }

  isEventType(type) {
    const eventTypes = ["Event", "BusinessEvent", "EducationEvent"];
    return Array.isArray(type)
      ? type.some(t => eventTypes.includes(t))
      : eventTypes.includes(type);
  }

  isArticleType(type) {
    const articleTypes = [
      "Article",
      "BlogPosting",
      "NewsArticle",
      "TechArticle",
    ];
    return Array.isArray(type)
      ? type.some(t => articleTypes.includes(t))
      : articleTypes.includes(type);
  }

  extractProductInfo(schema) {
    // 根据Google官方规范处理产品信息
    // 参考: https://developers.google.com/search/docs/appearance/structured-data/product

    // 处理offers - 可能是单个对象或数组
    const offersArray = Array.isArray(schema.offers)
      ? schema.offers
      : schema.offers
      ? [schema.offers]
      : [];
    const primaryOffer = offersArray[0] || {};

    // 处理品牌信息 - 可能是字符串或对象
    const brand = this.extractBrandInfo(schema.brand || schema.manufacturer);

    // 处理图片信息 - 必需属性
    const images = this.extractImageUrls(schema.image);

    // 处理评分信息 - aggregateRating对象
    const ratingInfo = this.extractRatingInfo(schema.aggregateRating);

    // 处理价格和货币
    const priceInfo = this.extractPriceInfo(primaryOffer, offersArray);

    // 处理可用性状态
    const availabilityInfo = this.extractAvailabilityInfo(primaryOffer);

    // 处理产品标识符
    const identifiers = this.extractProductIdentifiers(schema);

    // 处理卖家信息
    const sellerInfo = this.extractSellerInfo(primaryOffer);

    // 处理配送信息
    const shippingInfo = this.extractShippingInfo(primaryOffer);

    // 处理退货政策
    const returnPolicy = this.extractReturnPolicy(primaryOffer);

    // 处理所有offers的详细信息
    const allOffersDetails = this.extractAllOffersInfo(offersArray);

    return {
      // 必需属性
      name: schema.name || "",

      // 推荐属性
      description: schema.description || "",
      brand: brand,
      image: images.primary,
      images: images.all,

      // 产品标识符
      sku: identifiers.sku,
      gtin: identifiers.gtin,
      mpn: identifiers.mpn,

      // 分类信息
      category:
        schema.category || schema.productType || schema.additionalType || "",

      // 价格信息
      price: priceInfo.price,
      priceCurrency: priceInfo.currency,
      priceRange: priceInfo.range,

      // 可用性信息
      availability: availabilityInfo.status,
      availabilityText: availabilityInfo.text,
      condition: availabilityInfo.condition,

      // 评分信息
      rating: ratingInfo.value,
      ratingScale: ratingInfo.scale,
      reviewCount: ratingInfo.reviewCount,

      // 卖家信息
      seller: sellerInfo.name,
      sellerType: sellerInfo.type,

      // 配送信息
      shipping: shippingInfo,

      // 退货政策
      returnPolicy: returnPolicy,

      // 其他信息
      url: schema.url || "",
      keywords: this.extractKeywords(schema.keywords),
      validFrom: primaryOffer.validFrom || "",
      validThrough: primaryOffer.validThrough || "",

      // 多个offers信息
      allOffers: offersArray.length > 1 ? offersArray.length : 0,
      offersDetails: allOffersDetails,

      // 原始数据（用于调试）
      _rawSchema: schema,
    };
  }

  extractAllOffersInfo(offersArray) {
    if (!offersArray || offersArray.length === 0) return [];

    return offersArray.map((offer, index) => {
      const availabilityInfo = this.extractAvailabilityInfo(offer);
      const sellerInfo = this.extractSellerInfo(offer);
      const shippingInfo = this.extractShippingInfo(offer);
      const returnPolicy = this.extractReturnPolicy(offer);

      // 提取产品属性信息
      const productAttributes = this.extractProductAttributes(offer);

      // 提取库存详细信息
      const inventoryDetails = this.extractInventoryDetails(offer);

      // 提取价格详细信息
      const priceDetails = this.extractOfferPriceDetails(offer);

      // 提取产品变体信息
      const variantInfo = this.extractVariantInfo(offer);

      return {
        index: index + 1,

        // 核心标识信息
        sku: offer.sku || offer.itemOffered?.sku || "",
        gtin: offer.gtin || offer.itemOffered?.gtin || "",
        mpn: offer.mpn || offer.itemOffered?.mpn || "",
        serialNumber: offer.serialNumber || "",

        // 价格信息
        price: priceDetails.price,
        priceCurrency: priceDetails.currency,
        priceValidUntil: priceDetails.validUntil,
        originalPrice: priceDetails.originalPrice,
        discountAmount: priceDetails.discountAmount,
        discountPercentage: priceDetails.discountPercentage,
        priceType: priceDetails.priceType,

        // 产品属性
        productName: productAttributes.name,
        color: productAttributes.color,
        size: productAttributes.size,
        material: productAttributes.material,
        model: productAttributes.model,
        brand: productAttributes.brand,
        weight: productAttributes.weight,
        dimensions: productAttributes.dimensions,

        // 库存信息
        availability: availabilityInfo.status,
        availabilityText: availabilityInfo.text,
        condition: availabilityInfo.condition,
        inventoryLevel: inventoryDetails.level,
        inventoryStatus: inventoryDetails.status,
        stockQuantity: inventoryDetails.quantity,
        lowStockThreshold: inventoryDetails.lowStockThreshold,
        restockDate: inventoryDetails.restockDate,

        // 数量限制
        eligibleQuantity: offer.eligibleQuantity || "",
        minOrderQuantity: inventoryDetails.minOrderQuantity,
        maxOrderQuantity: inventoryDetails.maxOrderQuantity,

        // 卖家信息
        seller: sellerInfo.name,
        sellerType: sellerInfo.type,
        sellerRating: sellerInfo.rating,
        sellerLocation: sellerInfo.location,

        // 配送和服务
        shipping: shippingInfo,
        returnPolicy: returnPolicy,
        warranty: offer.warranty || "",

        // 地区和时间
        areaServed: offer.areaServed || "",
        eligibleRegion: offer.eligibleRegion || "",
        ineligibleRegion: offer.ineligibleRegion || "",
        validFrom: offer.validFrom || "",
        validThrough: offer.validThrough || "",

        // 业务信息
        businessFunction: offer.businessFunction || "",
        deliveryLeadTime: offer.deliveryLeadTime || "",
        category: offer.category || "",

        // 附加信息
        addOn: offer.addOn || "",
        url: offer.url || "",

        // 变体信息
        variantInfo: variantInfo,

        // 原始数据
        _rawOffer: offer,
      };
    });
  }

  extractProductAttributes(offer) {
    const itemOffered = offer.itemOffered || {};

    return {
      // 优先从offer直接获取name，然后从itemOffered获取
      name: offer.name || itemOffered.name || itemOffered.model || "",
      color: offer.color || itemOffered.color || itemOffered.colorName || "",
      size:
        offer.size ||
        itemOffered.size ||
        itemOffered.sizeSystem ||
        itemOffered.sizeGroup ||
        "",
      material: offer.material || itemOffered.material || "",
      model: offer.model || itemOffered.model || itemOffered.modelNumber || "",
      brand:
        offer.brand?.name ||
        offer.brand ||
        itemOffered.brand?.name ||
        itemOffered.brand ||
        "",
      weight:
        offer.weight?.value ||
        offer.weight ||
        itemOffered.weight?.value ||
        itemOffered.weight ||
        "",
      dimensions:
        offer.dimensions ||
        (itemOffered.width && itemOffered.height && itemOffered.depth
          ? `${itemOffered.width}x${itemOffered.height}x${itemOffered.depth}`
          : itemOffered.dimensions || ""),
    };
  }

  extractInventoryDetails(offer) {
    const inventory = offer.inventoryLevel || {};

    return {
      level: offer.inventoryLevel || "",
      status: this.getInventoryStatus(offer.inventoryLevel),
      quantity:
        inventory.value || inventory.quantity || offer.stockQuantity || "",
      lowStockThreshold: offer.lowStockThreshold || "",
      restockDate: offer.restockDate || offer.expectedRestockDate || "",
      minOrderQuantity:
        offer.eligibleQuantity?.minValue || offer.minOrderQuantity || "",
      maxOrderQuantity:
        offer.eligibleQuantity?.maxValue || offer.maxOrderQuantity || "",
    };
  }

  extractOfferPriceDetails(offer) {
    const price = parseFloat(offer.price || 0);
    const originalPrice = parseFloat(
      offer.originalPrice || offer.listPrice || 0
    );

    let discountAmount = 0;
    let discountPercentage = 0;

    if (originalPrice > price && price > 0) {
      discountAmount = originalPrice - price;
      discountPercentage = Math.round((discountAmount / originalPrice) * 100);
    }

    return {
      price: offer.price || "",
      currency: offer.priceCurrency || "",
      validUntil: offer.priceValidUntil || "",
      originalPrice: originalPrice > 0 ? originalPrice.toString() : "",
      discountAmount: discountAmount > 0 ? discountAmount.toFixed(2) : "",
      discountPercentage:
        discountPercentage > 0 ? `${discountPercentage}%` : "",
      priceType: offer.priceType || (discountAmount > 0 ? "折扣价" : "正常价"),
    };
  }

  extractVariantInfo(offer) {
    const itemOffered = offer.itemOffered || {};
    const variants = [];

    if (itemOffered.color) variants.push(`颜色: ${itemOffered.color}`);
    if (itemOffered.size) variants.push(`尺寸: ${itemOffered.size}`);
    if (itemOffered.material) variants.push(`材质: ${itemOffered.material}`);
    if (itemOffered.pattern) variants.push(`图案: ${itemOffered.pattern}`);
    if (itemOffered.style) variants.push(`风格: ${itemOffered.style}`);

    return variants.length > 0 ? variants.join(", ") : "";
  }

  getInventoryStatus(inventoryLevel) {
    const level = parseInt(inventoryLevel || 0);

    if (level === 0) return "无库存";
    if (level < 5) return "库存紧张";
    if (level < 20) return "库存充足";
    if (level >= 20) return "库存丰富";

    return "状态未知";
  }

  extractBrandInfo(brandData) {
    if (!brandData) return "";
    if (typeof brandData === "string") return brandData;
    if (typeof brandData === "object") {
      return brandData.name || brandData["@id"] || "";
    }
    return "";
  }

  extractImageUrls(imageData) {
    if (!imageData) return { primary: "", all: [] };

    const images = Array.isArray(imageData) ? imageData : [imageData];
    const urls = images
      .map(img => {
        if (typeof img === "string") return img;
        if (typeof img === "object") return img.url || img.contentUrl || "";
        return "";
      })
      .filter(url => url);

    return {
      primary: urls[0] || "",
      all: urls,
    };
  }

  extractRatingInfo(ratingData) {
    if (!ratingData) return { value: "", scale: "", reviewCount: "" };

    return {
      value: ratingData.ratingValue || "",
      scale: ratingData.bestRating
        ? `${ratingData.worstRating || 1}-${ratingData.bestRating}`
        : "",
      reviewCount: ratingData.reviewCount || ratingData.ratingCount || "",
    };
  }

  extractPriceInfo(primaryOffer, allOffers = []) {
    if (!primaryOffer && allOffers.length === 0) {
      return { price: "", currency: "", range: "", allPrices: [] };
    }

    const mainOffer = primaryOffer || allOffers[0];
    const price = mainOffer.price || mainOffer.priceSpecification?.price || "";
    const currency =
      mainOffer.priceCurrency ||
      mainOffer.priceSpecification?.priceCurrency ||
      "";

    // 处理多个offers的价格范围
    let range = "";
    let allPrices = [];

    if (allOffers.length > 1) {
      const prices = allOffers
        .map(offer => parseFloat(offer.price || 0))
        .filter(p => p > 0)
        .sort((a, b) => a - b);

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        range =
          minPrice === maxPrice ? `${minPrice}` : `${minPrice} - ${maxPrice}`;
        allPrices = prices;
      }
    } else if (mainOffer.lowPrice && mainOffer.highPrice) {
      range = `${mainOffer.lowPrice} - ${mainOffer.highPrice}`;
    }

    return { price, currency, range, allPrices };
  }

  extractAvailabilityInfo(offer) {
    if (!offer) return { status: "", text: "", condition: "" };

    const availability = offer.availability || "";
    const condition = offer.itemCondition || "";

    // 根据Google规范的可用性状态
    let text = "";
    if (availability.includes("InStock")) text = "有库存";
    else if (availability.includes("OutOfStock")) text = "无库存";
    else if (availability.includes("PreOrder")) text = "预订";
    else if (availability.includes("BackOrder")) text = "缺货订购";
    else if (availability.includes("Discontinued")) text = "已停产";
    else if (availability.includes("LimitedAvailability")) text = "限量供应";
    else if (availability.includes("OnlineOnly")) text = "仅在线销售";
    else if (availability.includes("InStoreOnly")) text = "仅店内销售";
    else if (availability.includes("SoldOut")) text = "售罄";
    else text = availability;

    return { status: availability, text, condition };
  }

  extractProductIdentifiers(schema) {
    return {
      sku: schema.sku || schema.productID || "",
      gtin:
        schema.gtin ||
        schema.gtin13 ||
        schema.gtin12 ||
        schema.gtin8 ||
        schema.isbn ||
        "",
      mpn: schema.mpn || "",
    };
  }

  extractSellerInfo(offer) {
    if (!offer || !offer.seller)
      return { name: "", type: "", rating: "", location: "" };

    const seller = offer.seller;
    return {
      name: seller.name || seller["@id"] || "",
      type: seller["@type"] || "",
      rating: seller.aggregateRating?.ratingValue || seller.rating || "",
      location:
        seller.address?.addressCountry ||
        seller.address?.addressLocality ||
        seller.location ||
        "",
    };
  }

  extractShippingInfo(offer) {
    if (!offer || !offer.shippingDetails) return null;

    const shipping = offer.shippingDetails;
    const deliveryTime = shipping.deliveryTime;

    // 处理配送时间详情
    let deliveryDetails = "";
    if (deliveryTime) {
      const handling = deliveryTime.handlingTime;
      const transit = deliveryTime.transitTime;

      if (handling && transit) {
        const handlingDays = `${handling.minValue || 0}-${
          handling.maxValue || 1
        }`;
        const transitDays = `${transit.minValue || 1}-${transit.maxValue || 7}`;
        deliveryDetails = `处理: ${handlingDays}天, 运输: ${transitDays}天`;
      }
    }

    return {
      cost: shipping.shippingRate?.value || "",
      currency: shipping.shippingRate?.currency || "",
      destination: shipping.shippingDestination?.addressCountry || "",
      deliveryTime: deliveryDetails || shipping.deliveryTime || "",
    };
  }

  extractReturnPolicy(offer) {
    if (!offer || !offer.hasMerchantReturnPolicy) return null;

    const policy = offer.hasMerchantReturnPolicy;

    // 处理退货政策类别
    let category = "";
    if (policy.returnPolicyCategory) {
      if (
        policy.returnPolicyCategory.includes("MerchantReturnFiniteReturnWindow")
      ) {
        category = "有限期退货";
      } else if (
        policy.returnPolicyCategory.includes("MerchantReturnNotPermitted")
      ) {
        category = "不可退货";
      } else if (
        policy.returnPolicyCategory.includes("MerchantReturnUnlimitedWindow")
      ) {
        category = "无限期退货";
      } else {
        category = policy.returnPolicyCategory;
      }
    }

    // 处理退货方式
    let method = "";
    if (policy.returnMethod) {
      if (policy.returnMethod.includes("ReturnByMail")) {
        method = "邮寄退货";
      } else if (policy.returnMethod.includes("ReturnInStore")) {
        method = "店内退货";
      } else {
        method = policy.returnMethod;
      }
    }

    // 处理退货费用
    let fees = "";
    if (policy.returnFees) {
      if (policy.returnFees.includes("ReturnFeesCustomerResponsibility")) {
        fees = "客户承担";
      } else if (policy.returnFees.includes("FreeReturn")) {
        fees = "免费退货";
      } else {
        fees = policy.returnFees;
      }
    }

    return {
      category: category,
      days: policy.merchantReturnDays || "",
      method: method,
      fees: fees,
      countries: Array.isArray(policy.applicableCountry)
        ? policy.applicableCountry.join(", ")
        : policy.applicableCountry || "",
    };
  }

  extractKeywords(keywordData) {
    if (!keywordData) return [];
    if (Array.isArray(keywordData)) return keywordData;
    if (typeof keywordData === "string") {
      return keywordData
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag);
    }
    return [];
  }

  extractOrganizationInfo(schema) {
    return {
      name: schema.name || "",
      type: schema["@type"] || "",
      url: schema.url || "",
      logo: schema.logo || "",
      contactPoint: schema.contactPoint || [],
      address: schema.address || {},
      sameAs: schema.sameAs || [],
    };
  }

  extractBreadcrumbInfo(schema) {
    return {
      items: (schema.itemListElement || []).map(item => ({
        name: item.name || "",
        url: item.item || "",
        position: item.position || 0,
      })),
    };
  }

  extractReviewInfo(schema) {
    return {
      type: schema["@type"] || "",
      ratingValue: schema.ratingValue || schema.bestRating || "",
      worstRating: schema.worstRating || "",
      bestRating: schema.bestRating || "",
      reviewCount: schema.reviewCount || "",
      author: schema.author?.name || "",
      datePublished: schema.datePublished || "",
    };
  }

  extractEventInfo(schema) {
    return {
      name: schema.name || "",
      startDate: schema.startDate || "",
      endDate: schema.endDate || "",
      location: schema.location?.name || schema.location || "",
      description: schema.description || "",
      organizer: schema.organizer?.name || "",
    };
  }

  extractArticleInfo(schema) {
    return {
      headline: schema.headline || "",
      author: schema.author?.name || "",
      datePublished: schema.datePublished || "",
      dateModified: schema.dateModified || "",
      publisher: schema.publisher?.name || "",
      image: schema.image || "",
      wordCount: schema.wordCount || "",
    };
  }

  getAnalyticsInfo() {
    const analytics = {
      googleAnalytics: false,
      googleTagManager: false,
      facebookPixel: false,
      hotjar: false,
      other: [],
    };

    // 检查Google Analytics
    if (
      window.gtag ||
      window.ga ||
      document.querySelector('script[src*="google-analytics"]') ||
      document.querySelector('script[src*="gtag"]')
    ) {
      analytics.googleAnalytics = true;
    }

    // 检查Google Tag Manager
    if (
      window.dataLayer ||
      document.querySelector('script[src*="googletagmanager"]')
    ) {
      analytics.googleTagManager = true;
    }

    // 检查Facebook Pixel
    if (window.fbq || document.querySelector('script[src*="facebook.net"]')) {
      analytics.facebookPixel = true;
    }

    // 检查Hotjar
    if (window.hj || document.querySelector('script[src*="hotjar"]')) {
      analytics.hotjar = true;
    }

    // 检查其他分析工具
    const scripts = document.querySelectorAll("script[src]");
    scripts.forEach(script => {
      const src = script.src.toLowerCase();
      if (src.includes("baidu") && src.includes("analytics")) {
        analytics.other.push("百度统计");
      } else if (src.includes("cnzz")) {
        analytics.other.push("CNZZ");
      } else if (src.includes("matomo")) {
        analytics.other.push("Matomo");
      }
    });

    return analytics;
  }

  generateRecommendations(data) {
    const recommendations = [];

    // 根据Google SEO指南检查标题
    if (!data.basic.title) {
      recommendations.push({
        type: "error",
        title: "🚨 缺少页面标题",
        description: "页面标题是最重要的SEO元素，必须包含描述性的<title>标签",
        reference:
          "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
        priority: "高",
      });
    } else {
      if (data.basic.title.length < 30) {
        recommendations.push({
          type: "warning",
          title: "⚠️ 标题过短",
          description:
            "标题长度建议30-60个字符，当前过短可能无法充分描述页面内容",
          priority: "中",
        });
      } else if (data.basic.title.length > 60) {
        recommendations.push({
          type: "warning",
          title: "⚠️ 标题过长",
          description: "标题超过60个字符可能在搜索结果中被截断，影响点击率",
          priority: "中",
        });
      }
    }

    // 检查Meta描述
    if (!data.meta.description) {
      recommendations.push({
        type: "error",
        title: "🚨 缺少Meta描述",
        description: "Meta描述直接影响搜索结果的点击率，是重要的SEO元素",
        priority: "高",
      });
    } else {
      if (data.meta.description.length < 120) {
        recommendations.push({
          type: "warning",
          title: "⚠️ Meta描述过短",
          description:
            "Meta描述建议120-160个字符，当前过短无法充分吸引用户点击",
          priority: "中",
        });
      } else if (data.meta.description.length > 160) {
        recommendations.push({
          type: "warning",
          title: "⚠️ Meta描述过长",
          description: "Meta描述超过160个字符可能在搜索结果中被截断",
          priority: "中",
        });
      }
    }

    // 检查标题结构
    const h1Tags = data.headings.filter(h => h.tag === "H1");
    if (h1Tags.length === 0) {
      recommendations.push({
        type: "error",
        title: "🚨 缺少H1标签",
        description: "H1是页面最重要的标题，每个页面都应该有且仅有一个H1标签",
        priority: "高",
      });
    } else if (h1Tags.length > 1) {
      recommendations.push({
        type: "warning",
        title: "⚠️ 多个H1标签",
        description:
          "页面有多个H1标签，建议只使用一个主标题以保持清晰的页面结构",
        priority: "中",
      });
    }

    // 检查标题层次结构
    const headingLevels = data.headings
      .map(h => parseInt(h.tag.substring(1)))
      .sort();
    let hasStructureIssue = false;
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        hasStructureIssue = true;
        break;
      }
    }
    if (hasStructureIssue) {
      recommendations.push({
        type: "warning",
        title: "⚠️ 标题层次结构不规范",
        description: "标题应按H1→H2→H3的顺序组织，避免跳级使用",
        priority: "中",
      });
    }

    // 检查图片优化
    const imagesWithoutAlt = data.images.filter(img => !img.alt);
    if (imagesWithoutAlt.length > 0) {
      recommendations.push({
        type: "warning",
        title: "⚠️ 图片缺少Alt文本",
        description: `${imagesWithoutAlt.length}张图片缺少Alt文本，影响可访问性和图片搜索SEO`,
        priority: "中",
      });
    }

    // 检查大尺寸图片
    const largeImages = data.images.filter(
      img => img.width > 1200 || img.height > 1200
    );
    if (largeImages.length > 0) {
      recommendations.push({
        type: "recommendation",
        title: "💡 图片尺寸优化",
        description: `${largeImages.length}张图片尺寸较大，建议压缩以提高页面加载速度`,
        priority: "低",
      });
    }

    // 检查内部链接
    const internalLinks = data.links.filter(link => !link.isExternal);
    if (internalLinks.length < 3) {
      recommendations.push({
        type: "recommendation",
        title: "💡 增加内部链接",
        description: "建议增加更多内部链接以改善网站结构和用户导航体验",
        priority: "低",
      });
    }

    // 检查结构化数据
    if (!data.structuredData || data.structuredData.allSchemas.length === 0) {
      recommendations.push({
        type: "warning",
        title: "⚠️ 缺少结构化数据",
        description: "添加结构化数据可获得丰富搜索结果，提高点击率",
        reference:
          "https://developers.google.com/search/docs/appearance/structured-data/search-gallery",
        priority: "中",
      });
    } else {
      // 检查产品结构化数据完整性
      const productSchemas = data.structuredData.processedSchemas.filter(
        schema => schema.category === "Product" && schema.productInfo
      );
      if (productSchemas.length > 0) {
        const incompleteProducts = productSchemas.filter(
          schema =>
            !schema.productInfo.name ||
            !schema.productInfo.image ||
            !schema.productInfo.price
        );
        if (incompleteProducts.length > 0) {
          recommendations.push({
            type: "warning",
            title: "⚠️ 产品结构化数据不完整",
            description: `${incompleteProducts.length}个产品缺少必需字段（名称、图片、价格）`,
            priority: "中",
          });
        }

        // 检查评分信息
        const productsWithoutRating = productSchemas.filter(
          schema => !schema.productInfo.rating
        );
        if (productsWithoutRating.length > 0) {
          recommendations.push({
            type: "recommendation",
            title: "💡 添加产品评分",
            description: "添加评分信息可获得星级评分的丰富搜索结果",
            priority: "低",
          });
        }
      }
    }

    // 检查移动友好性
    if (
      !data.meta.viewport ||
      !data.meta.viewport.includes("width=device-width")
    ) {
      recommendations.push({
        type: "error",
        title: "🚨 缺少移动视口标签",
        description: "缺少viewport meta标签会影响移动搜索排名和用户体验",
        priority: "高",
      });
    }

    // 检查Open Graph
    if (!data.openGraph.title || !data.openGraph.description) {
      recommendations.push({
        type: "recommendation",
        title: "💡 添加Open Graph标签",
        description: "OG标签可改善在社交媒体平台的分享效果和展示",
        priority: "低",
      });
    }

    // 检查页面内容长度
    const textContent = document.body.innerText || "";
    if (textContent.length < 300) {
      recommendations.push({
        type: "warning",
        title: "⚠️ 页面内容过短",
        description: "页面内容少于300字符，建议增加更多有价值的内容",
        priority: "中",
      });
    }

    // 检查分析工具
    if (!data.analytics.googleAnalytics && !data.analytics.googleTagManager) {
      recommendations.push({
        type: "recommendation",
        title: "💡 添加网站分析工具",
        description: "安装Google Analytics等分析工具来跟踪网站性能和用户行为",
        priority: "低",
      });
    }

    // 检查页面性能相关
    if (data.images.length > 20) {
      recommendations.push({
        type: "recommendation",
        title: "💡 考虑图片懒加载",
        description: "页面图片较多，建议使用懒加载技术提高首屏加载速度",
        priority: "低",
      });
    }

    return recommendations;
  }

  sendDataToSidebar(data) {
    // 通过Chrome runtime发送消息到background script
    chrome.runtime
      .sendMessage({
        action: "sendDataToSidebar",
        data: data,
      })
      .then(response => {
        if (response && response.success) {
          console.log("数据已发送到background script");
        }
      })
      .catch(error => {
        console.error("发送数据到background script失败:", error);
      });
  }
}

// 初始化页面分析器
const pageAnalyzer = new PageAnalyzer();
