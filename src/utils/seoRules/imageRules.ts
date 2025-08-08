// 图片优化规则
import { SeoAnalysisData } from '../../types';

export interface ImageRule {
  category: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  condition: (data: SeoAnalysisData) => boolean;
}

export const imageRules: ImageRule[] = [
  {
    category: '图片优化',
    issue: '图片缺少Alt属性',
    suggestion: '为所有图片添加Alt属性，提高可访问性和SEO效果',
    priority: 'high',
    condition: (data: SeoAnalysisData) => Boolean(data.imageInfo.some(img => !img.alt || img.alt.trim() === ''))
  },
  {
    category: '图片优化',
    issue: '图片Alt属性为空',
    suggestion: '为没有Alt属性的图片添加描述性的Alt文本',
    priority: 'medium',
    condition: (data: SeoAnalysisData) => Boolean(data.imageInfo.some(img => img.alt === '' || img.alt === '-'))
  },
  {
    category: '性能优化',
    issue: '图片未优化',
    suggestion: '使用适当的图片格式和大小，考虑使用WebP格式和懒加载',
    priority: 'medium',
    condition: (data: SeoAnalysisData) => Boolean(data.imageInfo.some(img =>
      img.width > 1920 || img.height > 1080
    ))
  }
];

export function checkImageRules(data: SeoAnalysisData): ImageRule[] {
  return imageRules.filter(rule => rule.condition(data));
} 