# Page Analytics - 网页分析 Chrome 扩展

一个功能强大的 Chrome 扩展，用于分析网页信息，提供详细的网页报告和优化建议。

## 功能特性

### 🔍 网页分析

- **页面基本信息**: 标题、URL、语言、字符集、Logo
- **Meta 标签分析**: description、keywords、author 等
- **Open Graph 信息**: 社交媒体分享优化
- **标题结构**: H1-H6 标签层次结构分析
- **图片优化**: Alt 属性检查、尺寸信息
- **链接分析**: 内部/外部链接统计

### 📊 结构化数据

- **JSON-LD 检测**: 自动识别和解析结构化数据
- **产品信息**: 价格、品牌、SKU、库存状态
- **组织信息**: 公司、联系方式、地址
- **面包屑导航**: 网站结构分析
- **评论和评分**: 用户反馈数据

### 🛠️ 分析工具检测

- Google Analytics
- Google Tag Manager
- Facebook Pixel
- Adobe Analytics
- Hotjar
- Mixpanel
- 其他常见分析工具

### ✅ 网页优化建议

- 标题长度检查
- Meta 描述优化
- 图片 Alt 属性建议
- 标题结构优化
- 拼写检查
- 国际化建议

### 📤 数据导出

- Excel 格式导出
- 图片信息表格
- 链接信息表格
- 结构化数据导出

## 安装方法

### 开发模式安装

1. 克隆或下载项目
2. 运行 `npm install` 安装依赖
3. 运行 `npm run build` 构建项目
4. 打开 Chrome 浏览器，进入扩展管理页面 (`chrome://extensions/`)
5. 开启"开发者模式"
6. 点击"加载已解压的扩展程序"，选择项目的 `dist` 文件夹

### 使用方法

1. 安装扩展后，浏览器工具栏会出现扩展图标
2. 访问任意网页
3. 点击扩展图标，侧边栏会自动打开并开始分析
4. 查看详细的网页分析报告
5. 根据优化建议改进网页

## 技术架构

### 前端技术栈

- **构建工具**: Vite
- **样式框架**: TailwindCSS
- **JavaScript**: ES6+
- **Excel 导出**: XLSX.js

### Chrome 扩展架构

- **Manifest V3**: 最新的 Chrome 扩展规范
- **Background Service Worker**: 处理扩展生命周期
- **Content Scripts**: 页面数据分析
- **Side Panel**: 现代化侧边栏界面

### 项目结构

```
src/
├── background/          # Background Service Worker
│   └── background.js
├── content/            # Content Scripts
│   └── content.js
├── sidebar/            # 侧边栏界面
│   ├── sidebar.html
│   └── sidebar.js
└── styles/             # 样式文件
    └── main.css
```

## 开发指南

### 环境要求

- Node.js 16+
- npm 7+
- Chrome 88+

### 开发命令

```bash
# 安装依赖
npm install

# 开发模式构建
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

### 代码规范

- 使用 ES6+语法
- 遵循 Chrome 扩展最佳实践
- 注释清晰，代码结构清晰
- 使用 TailwindCSS 进行样式开发

## 功能详解

### 页面分析流程

1. **页面加载检测**: 自动检测页面加载完成
2. **DOM 解析**: 提取页面结构和内容
3. **数据处理**: 分析和整理网页相关数据
4. **结果展示**: 在侧边栏中展示分析结果

### 结构化数据处理

- 支持 JSON-LD 格式
- 自动识别 Schema.org 标准
- 产品、组织、文章等类型分类
- 提供详细的结构化数据报告

### 性能优化

- 异步数据处理
- 分页显示大量数据
- 图片懒加载
- 内存管理优化

## 更新日志

### v1.0.0

- 初始版本发布
- 完整的网页分析功能
- 结构化数据支持
- Excel 导出功能
- 现代化 UI 界面

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目。

### 提交 Issue

- 详细描述问题
- 提供复现步骤
- 包含环境信息

### 提交 PR

- Fork 项目
- 创建功能分支
- 提交清晰的 commit 信息
- 确保代码通过测试

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 GitHub Issue
- 发送邮件反馈

---

**注意**: 此扩展仅用于网页分析和优化建议，不会收集或存储任何用户数据。
