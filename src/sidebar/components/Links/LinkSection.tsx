import React, { useState } from "react";
import { Card, Space, Tag, Button, Empty } from "antd";
import { LinkOutlined, ExportOutlined } from "@ant-design/icons";
import { LinkInfo } from "../../../types";
import LinkTable from "./LinkTable";

interface LinkSectionProps {
  linksInfo: LinkInfo[];
  onExport: (data: any[], filename: string) => void;
}

const LinkSection: React.FC<LinkSectionProps> = ({ linksInfo, onExport }) => {
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
            onClick={() => onExport(linksInfo, "links")}
          >
            导出
          </Button>
        </Space>
      }
    >
      {linksInfo.length > 0 ? (
        <LinkTable linksInfo={linksInfo} onExport={onExport} />
      ) : (
        <Empty description="未找到链接" />
      )}
    </Card>
  );
};

export default LinkSection;
