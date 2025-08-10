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

    let type = "external";
    if (href.startsWith(window.location.origin)) {
      type = "internal";
    } else if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") ||
      href.startsWith("javascript:") || href.startsWith("ftp:") || href.startsWith("file:")) {
      type = "special";
    }

    if (href && text) links.push({ href, text, type, title, rel });
  });

  return links;
}

