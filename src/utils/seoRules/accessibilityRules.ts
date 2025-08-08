// 可访问性优化规则
import { SeoAnalysisData } from '../../types';

export interface AccessibilityRule {
  category: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  condition: (data: SeoAnalysisData) => boolean;
}

export const accessibilityRules: AccessibilityRule[] = [
  {
    category: '可访问性',
    issue: '缺少语言设置',
    suggestion: '在HTML标签中设置正确的语言属性',
    priority: 'medium',
    condition: (data: SeoAnalysisData) => Boolean(!data.basicInfo.language || data.basicInfo.language.trim() === '')
  }
];

export function checkAccessibilityRules(data: SeoAnalysisData): AccessibilityRule[] {
  return accessibilityRules.filter(rule => rule.condition(data));
} 