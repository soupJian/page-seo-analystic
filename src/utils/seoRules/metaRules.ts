// Meta信息优化规则
import { SeoAnalysisData } from '../../types';

export interface MetaRule {
  category: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  condition: (data: SeoAnalysisData) => boolean;
}

export const metaRules: MetaRule[] = [
  {
    category: 'Meta描述',
    issue: 'Meta描述缺失',
    suggestion: '添加Meta描述标签，长度建议在150-160个字符之间，包含关键词和页面主要内容',
    priority: 'high',
    condition: (data: SeoAnalysisData) => Boolean(!data.metaInfo.description || data.metaInfo.description.trim() === '')
  },
  {
    category: 'Meta描述',
    issue: 'Meta描述过长',
    suggestion: 'Meta描述过长，建议缩短到150-160个字符，避免在搜索结果中被截断',
    priority: 'medium',
    condition: (data: SeoAnalysisData) => Boolean(data.metaInfo.description && data.metaInfo.description.length > 160)
  },
  {
    category: 'Meta描述',
    issue: 'Meta描述过短',
    suggestion: 'Meta描述过短，建议增加更多描述性内容，长度建议在120-160个字符之间',
    priority: 'low',
    condition: (data: SeoAnalysisData) => Boolean(data.metaInfo.description && data.metaInfo.description.length < 120)
  },
  {
    category: '关键词优化',
    issue: 'Meta关键词缺失',
    suggestion: '添加Meta关键词标签，包含页面相关的关键词',
    priority: 'medium',
    condition: (data: SeoAnalysisData) => Boolean(!data.metaInfo.keywords || data.metaInfo.keywords.trim() === '')
  },
  {
    category: '移动端优化',
    issue: '缺少Viewport设置',
    suggestion: '添加viewport meta标签，确保页面在移动设备上正确显示',
    priority: 'high',
    condition: (data: SeoAnalysisData) => Boolean(!data.metaInfo.viewport || data.metaInfo.viewport.trim() === '')
  }
];

export function checkMetaRules(data: SeoAnalysisData): MetaRule[] {
  return metaRules.filter(rule => rule.condition(data));
} 