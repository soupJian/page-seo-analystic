import React, { useState } from "react";
import { Card, Space, Tag, Empty, Radio } from "antd";
import {
  InfoCircleOutlined,
  AppstoreOutlined,
  BranchesOutlined,
} from "@ant-design/icons";
import { HeadingInfo } from "../../../types";
import HeadingMindMap from "./HeadingMindMap";
import HeadingColumns from "./HeadingColumns";

interface HeadingStructureCardProps {
  headings: HeadingInfo[];
}

const HeadingStructureCard: React.FC<HeadingStructureCardProps> = ({
  headings,
}) => {
  const [viewMode, setViewMode] = useState<"mindmap" | "columns">("mindmap");

  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined />
          标题结构
        </Space>
      }
      size="small"
      extra={
        <Space>
          <Tag color="blue">{headings.length} 个标题</Tag>
          <Radio.Group
            value={viewMode}
            onChange={e => setViewMode(e.target.value)}
            size="small"
            buttonStyle="solid"
          >
            <Radio.Button value="mindmap">
              <BranchesOutlined />
              思维导图
            </Radio.Button>
            <Radio.Button value="columns">
              <AppstoreOutlined />
              分栏展示
            </Radio.Button>
          </Radio.Group>
        </Space>
      }
    >
      {headings.length > 0 ? (
        viewMode === "mindmap" ? (
          <HeadingMindMap headings={headings} width={400} height={300} />
        ) : (
          <HeadingColumns headings={headings} />
        )
      ) : (
        <Empty description="未找到标题标签" />
      )}
    </Card>
  );
};

export default HeadingStructureCard;
