import React from "react";
import { Card, Space, Tag } from "antd";
import { BarChartOutlined } from "@ant-design/icons";
import { AnalyticsInfo } from "../../../types";

interface AnalyticsCardProps {
  analyticsInfo: AnalyticsInfo[];
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ analyticsInfo }) => {
  const foundAnalytics = analyticsInfo.filter(tool => tool.found);

  if (foundAnalytics.length === 0) {
    return null;
  }

  return (
    <Card
      title={
        <Space>
          <BarChartOutlined />
          分析工具
        </Space>
      }
      size="small"
      extra={<Tag color="blue">{foundAnalytics.length} 个工具</Tag>}
    >
      <Space wrap>
        {foundAnalytics.map((tool, index) => (
          <Tag key={index} color="green">
            {tool.name}
          </Tag>
        ))}
      </Space>
    </Card>
  );
};

export default AnalyticsCard;
