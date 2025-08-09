import { StructuredDataInfo, ProductInfo, OfferInfo } from "../types";

export function getStructuredData(): StructuredDataInfo[] {
  const structuredData: StructuredDataInfo[] = [];
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');

  scripts.forEach((script, index) => {
    try {
      const data = JSON.parse(script.textContent || "{}");
      const type = data["@type"] || "Unknown";

      const info: StructuredDataInfo = {
        type,
        name: getSchemaName(data),
        content: data,
      };

      if (type === "Product" || (data as any).offers) {
        info.products = extractProductInfo(data);
      }

      structuredData.push(info);
    } catch (error) {
      console.error(`解析第 ${index + 1} 个JSON-LD失败:`, error);
    }
  });

  return structuredData;
}

export function getSchemaName(schema: Record<string, unknown>): string {
  return (schema.name as string) || (schema.title as string) || (schema["@type"] as string) || "Unnamed Schema";
}

export function extractProductInfo(schema: Record<string, unknown>): ProductInfo[] {
  const products: ProductInfo[] = [];
  if (schema["@type"] === "Product") {
    const product = createProductFromSchema(schema);
    products.push(product);
  }

  if ((schema as any).offers) {
    const offers = Array.isArray((schema as any).offers) ? (schema as any).offers : [(schema as any).offers];
    offers.forEach((offer: any) => {
      const offerInfo: OfferInfo = {
        price: getStringValue((offer as any).price),
        currency: getStringValue((offer as any).priceCurrency),
        availability: getStringValue((offer as any).availability),
        condition: getStringValue((offer as any).itemCondition),
        seller: getStringValue((offer as any).seller?.name),
        url: getStringValue((offer as any).url),
      };
      if (products.length > 0) products[0].offers.push(offerInfo);
    });
  }
  return products;
}

export function createProductFromSchema(schema: Record<string, unknown>): ProductInfo {
  const aggregateRating = (schema as any).aggregateRating || {};
  const offers = (schema as any).offers || {};
  const brand = (schema as any).brand || {};

  return {
    name: getStringValue((schema as any).name),
    price: getStringValue((offers as any).price),
    currency: getStringValue((offers as any).priceCurrency),
    availability: getStringValue((offers as any).availability),
    condition: getStringValue((offers as any).itemCondition),
    brand: getStringValue((brand as any).name),
    category: getStringValue((schema as any).category),
    sku: getStringValue((schema as any).sku),
    description: getStringValue((schema as any).description),
    image: getStringValue((schema as any).image),
    url: getStringValue((schema as any).url),
    rating: getStringValue((aggregateRating as any).ratingValue),
    ratingCount: getStringValue((aggregateRating as any).ratingCount),
    offers: [],
  };
}

export function getStringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (Array.isArray(value) && value.length > 0) return getStringValue(value[0]);
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    return (obj.name as string) || (obj.value as string) || "";
  }
  return "";
}

