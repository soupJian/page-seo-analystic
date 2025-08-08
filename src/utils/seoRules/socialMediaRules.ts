// 社交媒体优化规则
import { SeoAnalysisData } from '../../types';

export interface SocialMediaRule {
  category: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  condition: (data: SeoAnalysisData) => boolean;
}

export const socialMediaRules: SocialMediaRule[] = [
  {
    category: '社交媒体优化',
    issue: '缺少Open Graph标签',
    suggestion: '添加Open Graph标签，优化在社交媒体上的显示效果',
    priority: 'medium',
    condition: (data: SeoAnalysisData) => Boolean(!data.openGraphInfo.title && !data.openGraphInfo.description)
  },
  {
    category: '社交媒体优化',
    issue: 'Open Graph图片缺失',
    suggestion: '添加Open Graph图片，提高在社交媒体上的分享效果',
    priority: 'low',
    condition: (data: SeoAnalysisData) => Boolean(!data.openGraphInfo.image)
  }
];

export function checkSocialMediaRules(data: SeoAnalysisData): SocialMediaRule[] {
  return socialMediaRules.filter(rule => rule.condition(data));
} 