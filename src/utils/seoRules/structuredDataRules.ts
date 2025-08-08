// 结构化数据优化规则
import { SeoAnalysisData } from '../../types';

export interface StructuredDataRule {
  category: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  condition: (data: SeoAnalysisData) => boolean;
}

export const structuredDataRules: StructuredDataRule[] = [
  {
    category: '结构化数据',
    issue: '缺少结构化数据',
    suggestion: '添加结构化数据（JSON-LD），帮助搜索引擎更好地理解页面内容',
    priority: 'medium',
    condition: (data: SeoAnalysisData) => Boolean(data.structuredData.length === 0)
  }
];

export function checkStructuredDataRules(data: SeoAnalysisData): StructuredDataRule[] {
  return structuredDataRules.filter(rule => rule.condition(data));
} 