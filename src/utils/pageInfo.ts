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

  imageElements.forEach(img => {
    const src = (img as HTMLImageElement).src || "";
    const alt = (img as HTMLImageElement).alt || "";
    const width = (img as HTMLImageElement).naturalWidth || 0;
    const height = (img as HTMLImageElement).naturalHeight || 0;
    const loading = (img as HTMLImageElement).loading || "";

    if (src) {
      const isSvg = src.toLowerCase().includes(".svg") || src.includes("data:image/svg+xml");
      const isWebp = src.toLowerCase().includes(".webp");

      images.push({
        src,
        alt,
        width,
        height,
        loading,
        format: isSvg ? "svg" : isWebp ? "webp" : "other",
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
    if (href.startsWith(window.location.origin)) type = "internal";
    else if (href.startsWith("#")) type = "anchor";
    else if (href.startsWith("mailto:")) type = "email";
    else if (href.startsWith("tel:")) type = "phone";
    else if (href.startsWith("javascript:")) type = "javascript";
    else if (href.startsWith("ftp:")) type = "ftp";
    else if (href.startsWith("file:")) type = "file";

    if (href && text) links.push({ href, text, type, title, rel });
  });

  return links;
}

