import React, { useRef } from "react";
import { Card, Space, Button, Empty } from "antd";
import { LinkOutlined, ExportOutlined } from "@ant-design/icons";
import { LinkInfo } from "../../../types";
import LinkTable, { LinkTableRef } from "./LinkTable";

interface LinkSectionProps {
  linksInfo: LinkInfo[];
  onExport: (data: any[], filename: string) => void;
}

const LinkSection: React.FC<LinkSectionProps> = ({ linksInfo, onExport }) => {
  const linkTableRef = useRef<LinkTableRef>(null);

  const handleExport = () => {
    if (linkTableRef.current) {
      const currentData = linkTableRef.current.getCurrentDisplayData();
      onExport(currentData, "links");
    } else {
      // 如果没有引用，导出原始数据
      onExport(linksInfo, "links");
    }
  };

  return (
    <Card
      title={
        <Space>
          <LinkOutlined />
          链接信息
        </Space>
      }
      size="small"
      extra={
        <Space>
          <Button
            type="link"
            size="small"
            icon={<ExportOutlined />}
            onClick={handleExport}
          >
            导出
          </Button>
        </Space>
      }
    >
      {linksInfo.length > 0 ? (
        <LinkTable
          ref={linkTableRef}
          linksInfo={linksInfo}
          onExport={onExport}
        />
      ) : (
        <Empty description="未找到链接" />
      )}
    </Card>
  );
};

export default LinkSection;
