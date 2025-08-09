import { RecommendationInfo, SeoAnalysisData } from "../types";
import { checkAllSeoRules } from "./seoRules";

export function buildRecommendations(data: SeoAnalysisData): RecommendationInfo[] {
  // 使用统一规则系统生成建议
  const rules = checkAllSeoRules(data);
  // 规则类型与 RecommendationInfo 结构兼容（字段名一致）
  return rules.map(r => ({
    category: r.category,
    issue: r.issue,
    suggestion: r.suggestion,
    priority: r.priority,
  }));
}

