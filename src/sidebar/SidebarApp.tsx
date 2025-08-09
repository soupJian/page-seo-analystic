import React, { useState, useEffect } from "react";
import { Button, Alert, Spin, Space, Typography, Empty, Result } from "antd";
import {
  ReloadOutlined,
  WarningOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

// 导入统一类型定义
import { SeoData } from "../types";
import HeadingMindMap from "./HeadingMindMap";

// 导入组件
import BasicInfoCard from "./components/BasicInfoCard";
import HeadingStructureCard from "./components/HeadingStructureCard";
import RecommendationsCard from "./components/RecommendationsCard";
import ImageSection from "./components/ImageSection";
import LinkSection from "./components/LinkSection";
import StructuredDataCard from "./components/StructuredDataCard";
import AnalyticsCard from "./components/AnalyticsCard";
import SpellCheckCard from "./components/SpellCheckCard";

interface SidebarAppProps {
  onReanalyze: () => void;
}
const SidebarApp: React.FC<SidebarAppProps> = ({ onReanalyze }) => {
  const [seoData, setSeoData] = useState<SeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recommendationImagePage, setRecommendationImagePage] = useState<
    Record<number, number>
  >({});

  const pageSize = 10;

  // 处理重新分析
  const handleReanalyze = () => {
    setLoading(true);
    setError(null);
    setSeoData(null);

    // 延迟一秒后触发重新分析，给用户看到loading效果
    setTimeout(() => {
      onReanalyze();
    }, 1000);
  };

  useEffect(() => {
    // Connect to background script
    const port = chrome.runtime.connect({ name: "sidebar" });

    // Send connection message
    port.postMessage({ type: "SIDEBAR_CONNECTED" });

    // Listen for messages from background script
    const handleMessage = (message: any) => {
      console.log("Sidebar received message:", message);

      if (message.type === "SEO_DATA") {
        setSeoData(message.data);
        setLoading(false);
        setError(null);
      } else if (message.type === "ANALYSIS_ERROR") {
        setError(message.error || "分析失败");
        setLoading(false);
      } else if (message.type === "URL_CHANGED") {
        setLoading(true);
        setError(null);
        setSeoData(null);
      }
    };

    port.onMessage.addListener(handleMessage);

    // Cleanup on unmount
    return () => {
      port.disconnect();
    };
  }, []);

  const exportToExcel = (data: any[], filename: string) => {
    import("../utils/export").then(m => m.exportToCsv(data, filename));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "blue";
    }
  };

  // 解析优化建议中的图片链接
  const parseImageUrls = (suggestion: string) => {
    const urlMatch = suggestion.match(
      /需要优化的图片：(.+?)(?:\s+等\d+张图片)?$/
    );
    if (!urlMatch) return { text: suggestion, urls: [] };

    const urlText = urlMatch[1];
    const urls = urlText.split(", ").filter(url => url.trim());
    const text = suggestion.replace(
      /需要优化的图片：.+?(?:\s+等\d+张图片)?$/,
      ""
    );

    return { text: text.trim(), urls };
  };

  // Loading state with full-height container
  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Title level={4} className="m-0">
            页面分析工具
          </Title>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center p-10">
          <Spin
            size="large"
            indicator={<LoadingOutlined className="text-5xl" spin />}
          />
          <Title level={5} className="mt-4 mb-2">
            正在分析页面
          </Title>
          <Typography.Text type="secondary">
            正在收集SEO数据，请稍候...
          </Typography.Text>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Title level={4} className="m-0">
            页面分析工具
          </Title>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center p-10">
          <Result
            status="error"
            title="分析失败"
            subTitle={error}
            extra={
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleReanalyze}
              >
                重新分析
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  // No data state
  if (!seoData) {
    return (
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Title level={4} className="m-0">
            页面分析工具
          </Title>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center p-10">
          <Result
            status="info"
            title="暂无数据"
            subTitle="点击按钮开始分析当前页面的SEO信息"
            extra={
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleReanalyze}
              >
                开始分析
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const foundAnalytics = seoData.analyticsInfo.filter(tool => tool.found);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <Space className="w-full justify-between">
          <Title level={4} className="m-0">
            页面分析工具
          </Title>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleReanalyze}
          >
            重新分析
          </Button>
        </Space>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <Space direction="vertical" size="middle" className="w-full">
          {/* 基本信息 */}
          <BasicInfoCard
            basicInfo={seoData.basicInfo}
            metaInfo={seoData.metaInfo}
          />

          {/* 标题结构 */}
          <HeadingStructureCard headings={seoData.headingStructure} />

          {/* 图片信息 */}
          <ImageSection
            imageInfo={seoData.imageInfo}
            onExport={exportToExcel}
          />

          {/* 链接信息 */}
          <LinkSection linksInfo={seoData.linksInfo} onExport={exportToExcel} />

          {/* 结构化数据 */}
          <StructuredDataCard structuredData={seoData.structuredData} />

          {/* 分析工具 */}
          <AnalyticsCard analyticsInfo={seoData.analyticsInfo} />

          {/* 拼写检查 */}
          <SpellCheckCard spellCheck={seoData.spellCheck} />

          {/* 优化建议 */}
          {seoData.recommendations.length > 0 && (
            <RecommendationsCard
              recommendations={seoData.recommendations}
              recommendationImagePage={recommendationImagePage}
              onRecommendationImagePageChange={(index, page) =>
                setRecommendationImagePage(prev => ({ ...prev, [index]: page }))
              }
            />
          )}
        </Space>
      </div>
    </div>
  );
};

export default SidebarApp;
