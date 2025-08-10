import { BasicInfo, MetaInfo, OpenGraphInfo, HeadingInfo, ImageInfo, LinkInfo } from "../types";
import { getMetaContent, getMetaProperty, getLinkHref, findLogoUrl } from "./dom";

export function getBasicInfo(): BasicInfo {
  const title = document.title || "";
  const url = window.location.href;
  const language = document.documentElement.lang || "en";
  const charset = document.characterSet || "UTF-8";

  return {
    title,
    url,
    language,
    charset,
    logo: findLogoUrl(),
    description: getMetaContent("description") || "",
  };
}

export function getMetaInfo(): MetaInfo {
  return {
    description: getMetaContent("description") || "",
    keywords: getMetaContent("keywords") || "",
    canonical: getLinkHref("canonical") || "",
    robots: getMetaContent("robots") || "",
    viewport: getMetaContent("viewport") || "",
    author: getMetaContent("author") || "",
    generator: getMetaContent("generator") || "",
    themeColor: getMetaContent("theme-color") || "",
    appleTouchIcon: getLinkHref("apple-touch-icon") || "",
    favicon: getLinkHref("icon") || getLinkHref("shortcut icon") || "",
  };
}

export function getOpenGraphInfo(): OpenGraphInfo {
  return {
    title: getMetaProperty("og:title") || "",
    type: getMetaProperty("og:type") || "",
    image: getMetaProperty("og:image") || "",
    url: getMetaProperty("og:url") || "",
    description: getMetaProperty("og:description") || "",
    siteName: getMetaProperty("og:site_name") || "",
    locale: getMetaProperty("og:locale") || "",
  };
}

export function getHeadingStructure(): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");

  headingElements.forEach(heading => {
    const tag = heading.tagName.toLowerCase();
    const text = heading.textContent?.trim() || "";
    const level = parseInt(tag.substring(1));

    if (text) headings.push({ tag, text, level });
  });

  return headings;
}

export function getImageInfo(): ImageInfo[] {
  const images: ImageInfo[] = [];
  const imageElements = document.querySelectorAll("img");
  const seenSrcSet: Set<string> = new Set();

  imageElements.forEach(img => {
    const el = img as HTMLImageElement;
    const src = el.currentSrc || el.src || "";
    const alt = (img as HTMLImageElement).alt || "";
    const width = el.naturalWidth || 0;
    const height = el.naturalHeight || 0;
    const loading = el.loading || "";

    if (src) {
      if (seenSrcSet.has(src)) {
        return; // 去重，确保同一 src 仅保留一条
      }
      seenSrcSet.add(src);
      const lower = src.toLowerCase();
      const isData = lower.startsWith("data:");
      if (isData && !lower.startsWith("data:image/")) {
        return; // 过滤非图片的 data URI
      }

      const isSvg = lower.includes(".svg") || lower.startsWith("data:image/svg");
      const isWebp = lower.includes(".webp") || lower.startsWith("data:image/webp");
      const isPng = lower.includes(".png") || lower.startsWith("data:image/png");
      const isJpg = lower.includes(".jpg") || lower.includes(".jpeg") || lower.startsWith("data:image/jpeg");
      const isGif = lower.includes(".gif") || lower.startsWith("data:image/gif");
      const isAvif = lower.includes(".avif") || lower.startsWith("data:image/avif");

      // 过滤掉非图片格式（仅保留常见图片格式）
      if (!(isSvg || isWebp || isPng || isJpg || isGif || isAvif || (isData && lower.startsWith("data:image/")))) {
        return;
      }

      let format: string = "other";
      if (isSvg) format = "svg";
      else if (isWebp) format = "webp";
      else if (isPng) format = "png";
      else if (isJpg) format = "jpg";
      else if (isGif) format = "gif";
      else if (isAvif) format = "avif";


      images.push({
        src,
        alt,
        width,
        height,
        loading,
        format,
      });
    }
  });
  return images;
}

export function getLinksInfo(): LinkInfo[] {
  const links: LinkInfo[] = [];
  const linkElements = document.querySelectorAll("a[href]");

  linkElements.forEach(link => {
    const linkEl = link as HTMLAnchorElement;
    const href = linkEl.href || "";
    const text = linkEl.textContent?.trim() || "";
    const title = linkEl.getAttribute("title") || "";
    const rel = linkEl.getAttribute("rel") || "";

    // 过滤掉无效链接
    if (!href ||
      href === "javascript:" ||
      href === "void 0" ||
      href === "undefined" ||
      href === "null" ||
      href.trim() === "" ||
      href.startsWith("javascript:") ||
      href.startsWith("void 0") ||
      href.startsWith("undefined") ||
      href.startsWith("null")) {
      return;
    }

    let type = "external";

    try {
      const currentUrl = new URL(window.location.href);
      const linkUrl = new URL(href, window.location.href);

      // 1. 首先判断特殊链接：锚点、邮件、电话、协议链接等
      if (href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("sms:") ||
        href.startsWith("ftp:") ||
        href.startsWith("file:") ||
        href.startsWith("data:") ||
        href.startsWith("blob:") ||
        href.startsWith("about:") ||
        href.startsWith("chrome:") ||
        href.startsWith("moz-extension:") ||
        href.startsWith("chrome-extension:") ||
        href.startsWith("edge-extension:") ||
        href.startsWith("safari-extension:") ||
        href.startsWith("opera-extension:") ||
        href.startsWith("vivaldi-extension:")) {
        type = "special";
      }
      // 2. 然后判断内链：只需要判断是否同域名（不要求协议相同）
      else if (linkUrl.hostname === currentUrl.hostname) {
        type = "internal";
      }
      // 3. 最后剩下的就是外链：不同域名的链接
      else {
        type = "external";
      }
    } catch (error) {
      // 如果URL解析失败，默认为特殊链接
      console.warn("链接URL解析失败:", href, error);
      type = "special";
    }

    if (href && text) links.push({ href, text, type, title, rel });
  });

  return links;
}

