// 统一的SEO规则导出
import { SeoAnalysisData } from '../../types';

// 导入所有规则模块
import { checkTitleRules, TitleRule } from './titleRules';
import { checkMetaRules, MetaRule } from './metaRules';
import { checkImageRules, ImageRule } from './imageRules';
import { checkHeadingRules, HeadingRule } from './headingRules';
import { checkLinkRules, LinkRule } from './linkRules';
import { checkStructuredDataRules, StructuredDataRule } from './structuredDataRules';
import { checkSocialMediaRules, SocialMediaRule } from './socialMediaRules';
import { checkAccessibilityRules, AccessibilityRule } from './accessibilityRules';

// 统一的规则类型
export type SeoRule = TitleRule | MetaRule | ImageRule | HeadingRule | LinkRule | StructuredDataRule | SocialMediaRule | AccessibilityRule;

// 检查所有SEO规则
export function checkAllSeoRules(data: SeoAnalysisData): SeoRule[] {
  const allRules: SeoRule[] = [
    ...checkTitleRules(data),
    ...checkMetaRules(data),
    ...checkImageRules(data),
    ...checkHeadingRules(data),
    ...checkLinkRules(data),
    ...checkStructuredDataRules(data),
    ...checkSocialMediaRules(data),
    ...checkAccessibilityRules(data)
  ];

  // 按优先级排序
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return allRules.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

// 按分类检查规则
export function checkRulesByCategory(data: SeoAnalysisData) {
  return {
    title: checkTitleRules(data),
    meta: checkMetaRules(data),
    image: checkImageRules(data),
    heading: checkHeadingRules(data),
    link: checkLinkRules(data),
    structuredData: checkStructuredDataRules(data),
    socialMedia: checkSocialMediaRules(data),
    accessibility: checkAccessibilityRules(data)
  };
}

// 获取规则统计
export function getRuleStats(rules: SeoRule[]) {
  const stats = {
    total: rules.length,
    high: rules.filter(r => r.priority === 'high').length,
    medium: rules.filter(r => r.priority === 'medium').length,
    low: rules.filter(r => r.priority === 'low').length,
    byCategory: {} as Record<string, number>
  };

  rules.forEach(rule => {
    stats.byCategory[rule.category] = (stats.byCategory[rule.category] || 0) + 1;
  });

  return stats;
}

// 导出所有规则模块（便于单独使用）
export {
  checkTitleRules,
  checkMetaRules,
  checkImageRules,
  checkHeadingRules,
  checkLinkRules,
  checkStructuredDataRules,
  checkSocialMediaRules,
  checkAccessibilityRules
}; 