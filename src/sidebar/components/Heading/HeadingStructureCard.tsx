import React from "react";
import { Card, Space, Tag, Empty } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { HeadingInfo } from "../../../types";
import HeadingMindMap from "./HeadingMindMap";

interface HeadingStructureCardProps {
  headings: HeadingInfo[];
}

const HeadingStructureCard: React.FC<HeadingStructureCardProps> = ({
  headings,
}) => {
  // 已移除标题结构问题分析，仅展示结构可视化

  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined />
          标题结构
        </Space>
      }
      size="small"
      extra={<Tag color="blue">{headings.length} 个标题</Tag>}
    >
      {headings.length > 0 ? (
        <HeadingMindMap headings={headings} width={400} height={300} />
      ) : (
        <Empty description="未找到标题标签" />
      )}
    </Card>
  );
};

export default HeadingStructureCard;
