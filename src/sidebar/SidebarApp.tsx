import React, { useState, useEffect } from "react";
import { Button, Space, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const { Title } = Typography;

// 导入统一类型定义
import { PageData } from "../types";
// import HeadingMindMap from "./HeadingMindMap";

// 导入组件（直接到具体文件）
import BasicInfoCard from "./components/Basic/BasicInfoCard";
import HeadingStructureCard from "./components/Heading/HeadingStructureCard";
import ImageSection from "./components/Images/ImageSection";
import LinkSection from "./components/Links/LinkSection";
import StructuredDataCard from "./components/StructuredData/StructuredDataCard";
import AnalyticsCard from "./components/Analytics/AnalyticsCard";
// 拼写检查组件已移除
import LoadingState from "./components/States/LoadingState";
import ErrorState from "./components/States/ErrorState";
import EmptyState from "./components/States/EmptyState";

interface SidebarAppProps {
  onReanalyze: () => void;
}
const SidebarApp: React.FC<SidebarAppProps> = ({ onReanalyze }) => {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 优化建议相关功能已移除

  // const pageSize = 10;

  // 处理重新分析
  const handleReanalyze = () => {
    setLoading(true);
    setError(null);
    setPageData(null);

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

      if (message.type === "PAGE_DATA") {
        setPageData(message.data);
        setLoading(false);
        setError(null);
      } else if (message.type === "ANALYSIS_ERROR") {
        setError(message.error || "分析失败");
        setLoading(false);
      } else if (message.type === "URL_CHANGED") {
        setLoading(true);
        setError(null);
        setPageData(null);
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

  // Loading state
  if (loading) return <LoadingState />;

  // Error state
  if (error)
    return <ErrorState errorMessage={error} onRetry={handleReanalyze} />;

  // No data state
  if (!pageData) return <EmptyState onStart={handleReanalyze} />;

  // const foundAnalytics = pageData.analyticsInfo.filter(tool => tool.found);

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
            basicInfo={pageData.basicInfo}
            metaInfo={pageData.metaInfo}
          />

          {/* 标题结构 */}
          <HeadingStructureCard headings={pageData.headingStructure} />

          {/* 图片信息 */}
          <ImageSection
            imageInfo={pageData.imageInfo}
            onExport={exportToExcel}
          />

          {/* 链接信息 */}
          <LinkSection
            linksInfo={pageData.linksInfo}
            onExport={exportToExcel}
          />

          {/* 结构化数据 */}
          <StructuredDataCard structuredData={pageData.structuredData} />

          {/* 分析工具 */}
          <AnalyticsCard analyticsInfo={pageData.analyticsInfo} />

          {/* 拼写检查功能已移除 */}

          {/* 优化建议组件已移除 */}
        </Space>
      </div>
    </div>
  );
};

export default SidebarApp;
