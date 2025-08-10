import { AnalyticsInfo } from "../types";

export function getAnalyticsInfo(): AnalyticsInfo[] {
  const analytics: AnalyticsInfo[] = [];
  const scripts = document.querySelectorAll("script");
  const scriptTexts = Array.from(scripts)
    .map(script => script.textContent || "")
    .join(" ");

  // 按照类型分组的分析工具检测模式
  const analyticsPatterns = [
    // ==================== 网站分析工具 ====================
    { name: "Google Analytics", pattern: /gtag\(|ga\(|GoogleAnalyticsObject|google-analytics\.com/i, type: "tracking" },
    { name: "Adobe Analytics", pattern: /omniture|adobe\.com.*analytics|s_code\.js/i, type: "tracking" },
    { name: "Mixpanel", pattern: /mixpanel\.com|mixpanel\.init/i, type: "tracking" },
    { name: "Amplitude", pattern: /amplitude\.com|amplitude\.init/i, type: "tracking" },
    { name: "Heap Analytics", pattern: /heap\.com|heap\.load/i, type: "tracking" },
    { name: "Kissmetrics", pattern: /kissmetrics\.com|_kmq/i, type: "tracking" },
    { name: "Crazy Egg", pattern: /crazyegg\.com|ce\.js/i, type: "tracking" },
    { name: "FullStory", pattern: /fullstory\.com|fs\.js/i, type: "tracking" },
    { name: "Smartlook", pattern: /smartlook\.com|smartlook\.js/i, type: "tracking" },
    { name: "Lucky Orange", pattern: /luckyorange\.com|luckyorange\.js/i, type: "tracking" },

    // ==================== 标签管理系统 ====================
    { name: "Google Tag Manager", pattern: /gtm\.js|googletagmanager\.com|GTM-/i, type: "tag_manager" },
    { name: "Adobe Launch", pattern: /assets\.adobedtm\.com|launch\.js/i, type: "tag_manager" },
    { name: "Tealium", pattern: /tealium\.com|utag\.js/i, type: "tag_manager" },
    { name: "Segment", pattern: /segment\.com|analytics\.js|segment\.io/i, type: "tag_manager" },
    { name: "RudderStack", pattern: /rudderstack\.com|rudder-analytics/i, type: "tag_manager" },

    // ==================== 像素跟踪工具 ====================
    { name: "Facebook Pixel", pattern: /fbevents\.js|facebook\.net\/tr|fbq\(/i, type: "pixel" },
    { name: "TikTok Pixel", pattern: /tiktok\.com\/i18n\/pixel|analytics\.tiktok\.com|ttq\.track/i, type: "pixel" },
    { name: "LinkedIn Insight", pattern: /snap\.licdn\.com|linkedin\.com\/insight/i, type: "pixel" },
    { name: "Twitter Pixel", pattern: /static\.ads-twitter\.com|twq\.track/i, type: "pixel" },
    { name: "Pinterest Tag", pattern: /pintrk\.js|pintrk\.track/i, type: "pixel" },
    { name: "Snapchat Pixel", pattern: /snapchat\.com|sc-static\.net/i, type: "pixel" },

    // ==================== 热力图和用户行为分析 ====================
    { name: "Hotjar", pattern: /hotjar\.com|hjsv/i, type: "heatmap" },
    { name: "Mouseflow", pattern: /mouseflow\.com|mf\.js/i, type: "heatmap" },
    { name: "SessionCam", pattern: /sessioncam\.com|sessioncam\.js/i, type: "heatmap" },
    { name: "Inspectlet", pattern: /inspectlet\.com|inspectlet\.js/i, type: "heatmap" },
    { name: "Yandex Metrika", pattern: /mc\.yandex\.ru|yandex\.ru\/metrika/i, type: "heatmap" },

    // ==================== 客户数据平台 (CDP) ====================
    { name: "Segment", pattern: /segment\.com|analytics\.js|segment\.io/i, type: "cdp" },
    { name: "RudderStack", pattern: /rudderstack\.com|rudder-analytics/i, type: "cdp" },
    { name: "mParticle", pattern: /mparticle\.com|mparticle\.js/i, type: "cdp" },
    { name: "Amplitude", pattern: /amplitude\.com|amplitude\.init/i, type: "cdp" },

    // ==================== 邮件营销工具 ====================
    { name: "Klaviyo", pattern: /klaviyo\.com|klaviyo\.js/i, type: "email" },
    { name: "Mailchimp", pattern: /mailchimp\.com|mc\.js|chimpstatic\.com/i, type: "email" },
    { name: "ConvertKit", pattern: /convertkit\.com|ck\.js/i, type: "email" },
    { name: "ActiveCampaign", pattern: /activecampaign\.com|ac\.js/i, type: "email" },
    { name: "Drip", pattern: /drip\.com|drip\.js/i, type: "email" },
    { name: "GetResponse", pattern: /getresponse\.com|gr\.js/i, type: "email" },

    // ==================== 支付处理工具 ====================
    { name: "Stripe", pattern: /stripe\.com|stripe\.js|stripe\.com\/v3/i, type: "payment" },
    { name: "PayPal", pattern: /paypal\.com|paypalobjects\.com|paypal\.js/i, type: "payment" },
    { name: "Square", pattern: /square\.com|square\.js/i, type: "payment" },
    { name: "Shopify Payments", pattern: /shopify\.com.*payments|shopify-payment/i, type: "payment" },
    { name: "WooCommerce Payments", pattern: /woocommerce.*payments|wc-payment/i, type: "payment" },

    // ==================== 聊天和客服工具 ====================
    { name: "Intercom", pattern: /intercom\.io|intercom\.js/i, type: "chat" },
    { name: "Crisp", pattern: /crisp\.chat|crisp\.js/i, type: "chat" },
    { name: "Drift", pattern: /drift\.com|drift\.js/i, type: "chat" },
    { name: "Tawk.to", pattern: /tawk\.to|tawk\.js/i, type: "chat" },
    { name: "LiveChat", pattern: /livechat\.com|livechat\.js/i, type: "chat" },
    { name: "Zendesk Chat", pattern: /zendesk\.com.*chat|zdassets\.com/i, type: "chat" },
    { name: "Freshchat", pattern: /freshchat\.com|freshchat\.js/i, type: "chat" },

    // ==================== 客服和支持工具 ====================
    { name: "Zendesk", pattern: /zendesk\.com|zdassets\.com/i, type: "support" },
    { name: "Freshdesk", pattern: /freshdesk\.com|freshdesk\.js/i, type: "support" },
    { name: "Help Scout", pattern: /helpscout\.net|helpscout\.js/i, type: "support" },
    { name: "Desk.com", pattern: /desk\.com|desk\.js/i, type: "support" },

    // ==================== 电话跟踪工具 ====================
    { name: "CallRail", pattern: /callrail\.com|callrail\.js|cr\.js/i, type: "phone_tracking" },
    { name: "CallTrackingMetrics", pattern: /calltrackingmetrics\.com|ctm\.js/i, type: "phone_tracking" },
    { name: "Marchex", pattern: /marchex\.com|marchex\.js/i, type: "phone_tracking" },
    { name: "DialogTech", pattern: /dialogtech\.com|dialogtech\.js/i, type: "phone_tracking" },

    // ==================== 电商分析工具 ====================
    { name: "Shopify Analytics", pattern: /shopify\.com.*analytics|shopify-analytics/i, type: "ecommerce" },
    { name: "WooCommerce Analytics", pattern: /woocommerce.*analytics|wc-analytics/i, type: "ecommerce" },
    { name: "Magento Analytics", pattern: /magento.*analytics|magento\.com/i, type: "ecommerce" },
    { name: "BigCommerce Analytics", pattern: /bigcommerce.*analytics|bigcommerce\.com/i, type: "ecommerce" },

    // ==================== SEO 和网站监控工具 ====================
    { name: "Google Search Console", pattern: /google\.com\/webmasters|search\.google\.com/i, type: "seo" },
    { name: "Bing Webmaster", pattern: /bing\.com\/webmaster|bing\.com\/toolbox/i, type: "seo" },
    { name: "SEMrush", pattern: /semrush\.com|semrush\.js/i, type: "seo" },
    { name: "Ahrefs", pattern: /ahrefs\.com|ahrefs\.js/i, type: "seo" },
    { name: "Moz", pattern: /moz\.com|moz\.js/i, type: "seo" },

    // ==================== 其他常用工具 ====================
    { name: "Google Optimize", pattern: /googleoptimize\.com|google\.com\/optimize/i, type: "optimization" },
    { name: "Optimizely", pattern: /optimizely\.com|optimizely\.js/i, type: "optimization" },
    { name: "VWO", pattern: /vwo\.com|vwo\.js/i, type: "optimization" },
    { name: "Convert", pattern: /convert\.com|convert\.js/i, type: "optimization" },
    { name: "AB Tasty", pattern: /abtasty\.com|abtasty\.js/i, type: "optimization" },
  ];

  analyticsPatterns.forEach(tool => {
    const found = tool.pattern.test(scriptTexts) || tool.pattern.test(document.documentElement.innerHTML);

    analytics.push({ name: tool.name, type: tool.type, found });
  });

  return analytics;
}



