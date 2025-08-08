// 标题优化规则
import { SeoAnalysisData } from '../../types';

export interface TitleRule {
  category: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  condition: (data: SeoAnalysisData) => boolean;
}

export const titleRules: TitleRule[] = [
  {
    category: '标题优化',
    issue: '页面标题缺失',
    suggestion: '添加一个描述性的页面标题，长度建议在50-60个字符之间',
    priority: 'high',
    condition: (data: SeoAnalysisData) => Boolean(!data.basicInfo.title || data.basicInfo.title.trim() === '')
  },
  {
    category: '标题优化',
    issue: '页面标题过长',
    suggestion: '页面标题过长，建议缩短到50-60个字符，避免在搜索结果中被截断',
    priority: 'medium',
    condition: (data: SeoAnalysisData) => Boolean(data.basicInfo.title && data.basicInfo.title.length > 60)
  },
  {
    category: '标题优化',
    issue: '页面标题过短',
    suggestion: '页面标题过短，建议增加更多描述性内容，长度建议在30-60个字符之间',
    priority: 'low',
    condition: (data: SeoAnalysisData) => Boolean(data.basicInfo.title && data.basicInfo.title.length < 30)
  }
];

export function checkTitleRules(data: SeoAnalysisData): TitleRule[] {
  return titleRules.filter(rule => rule.condition(data));
} 