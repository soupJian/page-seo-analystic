import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Table, Tag, Tooltip, Button, Space } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import { LinkInfo } from "../../../types";

interface LinkTableProps {
  linksInfo: LinkInfo[];
  onExport: (data: any[], filename: string) => void;
}

export interface LinkTableRef {
  getCurrentDisplayData: () => any[];
}

const LinkTable = forwardRef<LinkTableRef, LinkTableProps>(
  ({ linksInfo, onExport }, ref) => {
    const [currentLinkPage, setLinkPage] = useState(1);
    const [columnFilters, setColumnFilters] = useState<
      Record<string, React.Key[] | null>
    >({});
    const pageSize = 10;

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getCurrentDisplayData,
    }));

    // 获取当前表格显示的数据（考虑过滤，但不考虑分页）
    const getCurrentDisplayData = () => {
      let filteredData = [...linksInfo];

      // 应用过滤
      if (columnFilters.type) {
        filteredData = filteredData.filter(record =>
          columnFilters.type?.includes(record.type)
        );
      }

      // 返回所有过滤后的数据，不应用分页
      return filteredData;
    };

    // 导出当前显示的数据
    const handleExport = () => {
      const currentData = getCurrentDisplayData();
      onExport(currentData, "links");
    };

    const linkColumns = [
      {
        title: "链接",
        dataIndex: "href",
        key: "href",
        width: 200,
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
        width: 150,
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
        width: 100,
        filteredValue: columnFilters.type ?? null,
        filters: [
          { text: "内链", value: "internal" },
          { text: "外链", value: "external" },
          { text: "特殊链接", value: "special" },
        ],
        onFilter: (value: any, record: any) => record.type === value,
        render: (type: string) => {
          const typeConfig = {
            internal: {
              color: "green",
              text: "内链",
              description: "同域名链接",
            },
            external: {
              color: "blue",
              text: "外链",
              description: "其他域名链接",
            },
            special: {
              color: "orange",
              text: "特殊链接",
              description: "协议/锚点链接",
            },
          } as const;
          const config = (typeConfig as any)[type] || {
            color: "default",
            text: type,
            description: "",
          };
          return (
            <Tooltip title={config.description}>
              <Tag color={config.color}>{config.text}</Tag>
            </Tooltip>
          );
        },
      },
    ];

    return (
      <div>
        <Table
          columns={linkColumns}
          dataSource={linksInfo.map((l, index) => ({
            ...l,
            key: `${l.href}-${index}`,
          }))}
          rowKey={(record: any) => record.key}
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
  }
);

export default LinkTable;
