// DOM 辅助方法
export function getMetaContent(name: string): string {
  const meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  return meta?.content || "";
}

export function getMetaProperty(property: string): string {
  const meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  return meta?.content || "";
}

export function getLinkHref(rel: string): string {
  const link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  return link?.href || "";
}

export function findLogoUrl(): string {
  const logoSelectors = [
    'img[alt*="logo" i]',
    'img[class*="logo" i]',
    'img[id*="logo" i]',
    '.logo img',
    '#logo img',
    'header img:first-of-type'
  ];

  for (const selector of logoSelectors) {
    const logoElement = document.querySelector(selector) as HTMLImageElement | null;
    if (logoElement?.src) return logoElement.src;
  }
  return "";
}

