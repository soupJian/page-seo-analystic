// 链接优化规则
import { SeoAnalysisData } from '../../types';

export interface LinkRule {
  category: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  condition: (data: SeoAnalysisData) => boolean;
}

export const linkRules: LinkRule[] = [
  {
    category: '链接优化',
    issue: '链接缺少描述性文本',
    suggestion: '为链接添加描述性的文本，避免使用"点击这里"等无意义的文本',
    priority: 'medium',
    condition: (data: SeoAnalysisData) => Boolean(data.linksInfo.some(link =>
      !link.text ||
      link.text.trim() === '' ||
      link.text.toLowerCase().includes('点击') ||
      link.text.toLowerCase().includes('click')
    ))
  }
];

export function checkLinkRules(data: SeoAnalysisData): LinkRule[] {
  return linkRules.filter(rule => rule.condition(data));
} 