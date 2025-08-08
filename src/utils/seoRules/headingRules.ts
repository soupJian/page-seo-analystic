// 标题结构优化规则
import { SeoAnalysisData } from '../../types';

export interface HeadingRule {
  category: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  condition: (data: SeoAnalysisData) => boolean;
}

export const headingRules: HeadingRule[] = [
  {
    category: '标题结构',
    issue: '缺少H1标题',
    suggestion: '每个页面应该只有一个H1标题，用于描述页面的主要内容',
    priority: 'high',
    condition: (data: SeoAnalysisData) => Boolean(!data.headingStructure.some(h => h.level === 1))
  },
  {
    category: '标题结构',
    issue: '多个H1标题',
    suggestion: '页面包含多个H1标题，建议只保留一个主要的H1标题',
    priority: 'high',
    condition: (data: SeoAnalysisData) => Boolean(data.headingStructure.filter(h => h.level === 1).length > 1)
  },
  {
    category: '标题结构',
    issue: '标题层级不合理',
    suggestion: '标题层级应该合理，H1后面应该是H2，H2后面可以是H3，避免跳过层级',
    priority: 'medium',
    condition: (data: SeoAnalysisData) => {
      const levels = data.headingStructure.map(h => h.level);
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
          return true;
        }
      }
      return false;
    }
  }
];

export function checkHeadingRules(data: SeoAnalysisData): HeadingRule[] {
  return headingRules.filter(rule => rule.condition(data));
} 