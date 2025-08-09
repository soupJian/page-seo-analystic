import React, { useState } from "react";
import {
  Table,
  Tag,
  Tooltip,
  Pagination,
  Space,
  Typography,
  Select,
} from "antd";
import { LinkInfo } from "../../../types";

interface LinkTableProps {
  linksInfo: LinkInfo[];
  onExport: (data: any[], filename: string) => void;
}

const LinkTable: React.FC<LinkTableProps> = ({ linksInfo, onExport }) => {
  const [linkFilter, setLinkFilter] = useState("all");
  const [currentLinkPage, setLinkPage] = useState(1);
  const pageSize = 10;

  const linkColumns = [
    {
      title: "链接",
      dataIndex: "href",
      key: "href",
      render: (href: string) => (
        <Tooltip title={href}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {href}
          </a>
        </Tooltip>
      ),
    },
    {
      title: "文本",
      dataIndex: "text",
      key: "text",
      render: (text: string) => (
        <div className="max-h-10 overflow-hidden leading-5 line-clamp-2 break-words">
          <span className={text ? "text-gray-900" : "text-gray-500"}>
            {text || "-"}
          </span>
        </div>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const typeConfig = {
          internal: { color: "green", text: "内部链接" },
          external: { color: "blue", text: "外部链接" },
          email: { color: "purple", text: "邮箱链接" },
          phone: { color: "orange", text: "电话链接" },
          anchor: { color: "cyan", text: "锚点链接" },
          javascript: { color: "red", text: "JavaScript" },
          ftp: { color: "magenta", text: "FTP链接" },
          file: { color: "geekblue", text: "文件链接" },
        } as const;
        const config = (typeConfig as any)[type] || {
          color: "default",
          text: type,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  const filteredLinks = linksInfo.filter(link => {
    if (linkFilter === "all") return true;
    if (linkFilter === "internal") return link.type === "internal";
    if (linkFilter === "external") return link.type === "external";
    if (linkFilter === "special") {
      return ["email", "phone", "anchor", "javascript", "ftp", "file"].includes(
        link.type
      );
    }
    return true;
  });

  const paginatedLinks = filteredLinks.slice(
    (currentLinkPage - 1) * pageSize,
    currentLinkPage * pageSize
  );

  return (
    <div>
      <div className="mb-2">
        <Space>
          <Typography.Text strong>过滤:</Typography.Text>
          <Select
            value={linkFilter}
            onChange={setLinkFilter}
            className="w-36"
            size="small"
          >
            <Select.Option value="all">全部链接</Select.Option>
            <Select.Option value="internal">内部链接</Select.Option>
            <Select.Option value="external">外部链接</Select.Option>
            <Select.Option value="special">特殊链接</Select.Option>
          </Select>
          <Typography.Text type="secondary">
            (显示 {filteredLinks.length} / {linksInfo.length})
          </Typography.Text>
        </Space>
      </div>
      <Table
        columns={linkColumns}
        dataSource={paginatedLinks}
        pagination={false}
        size="small"
        scroll={{ x: 400 }}
      />
      <Pagination
        current={currentLinkPage}
        total={filteredLinks.length}
        pageSize={pageSize}
        onChange={page => {
          setLinkPage(page);
        }}
        size="small"
        className="mt-2 text-center"
        showSizeChanger={false}
        showQuickJumper={false}
        showTotal={(total, range) =>
          `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }
      />
    </div>
  );
};

export default LinkTable;
