import { AnalyticsInfo } from "../types";

export function getAnalyticsInfo(): AnalyticsInfo[] {
  const analytics: AnalyticsInfo[] = [];
  const scripts = document.querySelectorAll("script");
  const scriptTexts = Array.from(scripts)
    .map(script => script.textContent || "")
    .join(" ");

  const analyticsPatterns = [
    { name: "Google Analytics", pattern: /gtag\(|ga\(|GoogleAnalyticsObject|google-analytics\.com/i, type: "tracking" },
    { name: "Google Tag Manager", pattern: /gtm\.js|googletagmanager\.com/i, type: "tag_manager" },
    { name: "Facebook Pixel", pattern: /fbevents\.js|facebook\.net\/tr/i, type: "pixel" },
    { name: "Adobe Analytics", pattern: /omniture|adobe\.com.*analytics/i, type: "analytics" },
    { name: "Hotjar", pattern: /hotjar\.com/i, type: "heatmap" },
    { name: "Mixpanel", pattern: /mixpanel\.com/i, type: "analytics" },
    { name: "Segment", pattern: /segment\.com|analytics\.js/i, type: "cdp" },
    { name: "Amplitude", pattern: /amplitude\.com/i, type: "analytics" },
    { name: "Klaviyo", pattern: /klaviyo\.com/i, type: "email" },
    { name: "Intercom", pattern: /intercom\.io/i, type: "chat" },
    { name: "Zendesk", pattern: /zendesk\.com/i, type: "support" },
    { name: "Crisp", pattern: /crisp\.chat/i, type: "chat" },
    { name: "Drift", pattern: /drift\.com/i, type: "chat" },
  ];

  analyticsPatterns.forEach(tool => {
    const found = tool.pattern.test(scriptTexts) || tool.pattern.test(document.documentElement.innerHTML);
    const id = extractAnalyticsId(tool.name, scriptTexts);

    analytics.push({ name: tool.name, id, type: tool.type, found });
  });

  return analytics;
}

export function extractAnalyticsId(toolName: string, scriptText: string): string {
  const patterns: Record<string, RegExp> = {
    "Google Analytics": /gtag\(['"]config['"],\s*['"]([^'"]+)['"]/i,
    "Google Tag Manager": /GTM-[A-Z0-9]+/i,
    "Facebook Pixel": /fbq\(['"]init['"],\s*['"]?(\d+)['"]?/i,
  };
  const pattern = patterns[toolName];
  if (pattern) {
    const match = scriptText.match(pattern);
    return match ? (match[1] || match[0]) : "";
  }
  return "";
}

