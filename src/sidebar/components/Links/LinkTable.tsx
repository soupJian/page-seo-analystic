import React, { useEffect, useState } from "react";
import { Table, Tag, Tooltip } from "antd";
import { LinkInfo } from "../../../types";

interface LinkTableProps {
  linksInfo: LinkInfo[];
  onExport: (data: any[], filename: string) => void;
}

const LinkTable: React.FC<LinkTableProps> = ({ linksInfo }) => {
  const [currentLinkPage, setLinkPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState<
    Record<string, React.Key[] | null>
  >({});
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
            className="block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
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
      filteredValue: columnFilters.text ?? null,
      filters: [
        { text: "文本为空", value: "empty" },
        { text: "文本有值", value: "nonempty" },
      ],
      onFilter: (value: any, record: any) => {
        const empty = !record.text || record.text.trim() === "";
        return value === "empty" ? empty : !empty;
      },
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
      filteredValue: columnFilters.type ?? null,
      filters: [
        { text: "内部链接", value: "internal" },
        { text: "外部链接", value: "external" },
        { text: "邮箱链接", value: "email" },
        { text: "电话链接", value: "phone" },
        { text: "锚点链接", value: "anchor" },
        { text: "JavaScript", value: "javascript" },
        { text: "FTP链接", value: "ftp" },
        { text: "文件链接", value: "file" },
      ],
      onFilter: (value: any, record: any) => record.type === value,
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

  return (
    <div>
      <Table
        columns={linkColumns}
        dataSource={linksInfo.map(l => ({ ...l, key: l.href }))}
        rowKey={(record: any) => record.href}
        pagination={{
          current: currentLinkPage,
          pageSize,
          onChange: page => setLinkPage(page),
          showSizeChanger: false,
          showQuickJumper: false,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        size="small"
        scroll={{ x: 400 }}
        onChange={(pagination, filters) => {
          setLinkPage(pagination.current || 1);
          setColumnFilters(filters as Record<string, React.Key[] | null>);
        }}
      />
    </div>
  );
};

export default LinkTable;
