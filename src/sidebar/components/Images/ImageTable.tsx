import React, { useEffect, useState } from "react";
import { Table, Tag, Tooltip, Typography, Space, Button, Image } from "antd";
import { ImageInfo } from "../../../types";

interface ImageTableProps {
  imageInfo: ImageInfo[];
}

const ImageTable: React.FC<ImageTableProps> = ({ imageInfo }) => {
  const [currentImagePage, setImagePage] = useState(1);
  const [rows, setRows] = useState<
    (ImageInfo & { key: string; size?: number })[]
  >([]);
  const pageSize = 10;
  const [sortInfo, setSortInfo] = useState<{
    field?: string;
    order?: "ascend" | "descend" | null;
  }>({}); // 移除默认排序
  const processedKeysRef = React.useRef<Set<string>>(new Set());

  const [columnFilters, setColumnFilters] = useState<
    Record<string, React.Key[] | null>
  >({});

  // 主动预加载所有图片并通过多种方式获取体积
  useEffect(() => {
    processedKeysRef.current.clear();
    setRows(imageInfo.map(img => ({ ...img, key: img.src })));
    setImagePage(1);
    setColumnFilters({}); // 重置过滤条件

    const preloadOne = (key: string, src: string) =>
      new Promise<void>(resolve => {
        const img = new window.Image();
        img.onload = () => {
          try {
            // 方法1: 尝试从 Performance API 获取
            const entries = performance.getEntriesByName?.(src) || [];
            let bytes: number | undefined;

            if (entries.length > 0) {
              const e = entries[
                entries.length - 1
              ] as PerformanceResourceTiming;
              bytes =
                (typeof e.encodedBodySize === "number" &&
                  e.encodedBodySize > 0 &&
                  e.encodedBodySize) ||
                (typeof e.transferSize === "number" &&
                  e.transferSize > 0 &&
                  e.transferSize) ||
                undefined;
            }

            // 方法2: 如果 Performance API 失败且是同源图片，尝试 HEAD 请求
            if (
              (!bytes || Number.isNaN(bytes)) &&
              new URL(src).origin === window.location.origin
            ) {
              fetch(src, { method: "HEAD" })
                .then(res => {
                  const contentLength = res.headers.get("content-length");
                  if (contentLength) {
                    bytes = parseInt(contentLength, 10);
                  }
                })
                .catch(() => {
                  // 忽略错误，保持 bytes 为 undefined
                })
                .finally(() => {
                  if (bytes && !Number.isNaN(bytes)) {
                    setRows(prev =>
                      prev.map(r => (r.key === key ? { ...r, size: bytes } : r))
                    );
                  }
                  processedKeysRef.current.add(key);
                  resolve();
                });
            } else {
              if (bytes && !Number.isNaN(bytes)) {
                setRows(prev =>
                  prev.map(r => (r.key === key ? { ...r, size: bytes } : r))
                );
              }
              processedKeysRef.current.add(key);
              resolve();
            }
          } catch (e) {
            console.error("Error getting image size:", e);
            processedKeysRef.current.add(key);
            resolve();
          }
        };
        img.onerror = () => {
          processedKeysRef.current.add(key);
          resolve();
        };
        img.referrerPolicy = "no-referrer";
        img.decoding = "async";
        img.src = src;
      });

    (async () => {
      for (const r of imageInfo) {
        // 顺序预加载，避免过多并发
        await preloadOne(r.src, r.src);
      }
    })();
  }, [imageInfo]);

  const imageColumns = [
    {
      title: "图片",
      dataIndex: "src",
      key: "image",
      width: 80,
      render: (src: string, record: any) => (
        <Image
          src={src}
          alt={record.alt || "图片"}
          width={60}
          height={60}
          className="object-cover rounded"
          preview={{
            mask: "点击预览",
            maskClassName: "rounded",
          }}
          fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0MFY0MEgyMFYyMFoiIGZpbGw9IiNEN0Q3RDciLz4KPHBhdGggZD0iTTI1IDI1SDM1VjM1SDI1VjI1WiIgZmlsbD0iI0E5QTlBOSIvPgo8L3N2Zz4K"
        />
      ),
    },
    {
      title: "链接",
      dataIndex: "src",
      key: "link",
      width: 100,
      render: (src: string) => (
        <Tooltip title={src}>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {src}
          </a>
        </Tooltip>
      ),
    },
    {
      title: "Alt文本",
      dataIndex: "alt",
      key: "alt",
      filteredValue: columnFilters.alt ?? null,
      filters: [
        { text: "Alt为空", value: "empty" },
        { text: "Alt有值", value: "nonempty" },
      ],
      onFilter: (value: any, record: any) => {
        const empty =
          !record.alt || record.alt.trim() === "" || record.alt === "-";
        return value === "empty" ? empty : !empty;
      },
      render: (alt: string) => (
        <div className="max-h-10 overflow-hidden leading-5 line-clamp-2 break-words">
          <span className={alt ? "text-gray-900" : "text-gray-500 italic"}>
            {alt || "无Alt文本"}
          </span>
        </div>
      ),
    },
    {
      title: "尺寸",
      key: "size",
      render: (_: any, record: any) => (
        <Tag color="blue">
          {record.width}×{record.height}
        </Tag>
      ),
    },
    {
      title: "体积",
      key: "bytes",
      sortOrder: sortInfo.field === "bytes" ? sortInfo.order : null,
      sorter: (a: any, b: any) => {
        const va =
          typeof a.size === "number" && !Number.isNaN(a.size) ? a.size : -1;
        const vb =
          typeof b.size === "number" && !Number.isNaN(b.size) ? b.size : -1;
        return va - vb;
      },
      render: (_: any, record: any) => {
        const size = record.size;
        if (typeof size !== "number" || Number.isNaN(size)) {
          return <Tag color="default">加载中</Tag>;
        }
        if (size === 0) {
          return <Tag color="red">加载失败</Tag>;
        }
        const kb = size / 1024;
        const mb = kb / 1024;
        const text = mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
        const color = mb >= 1 ? "red" : kb > 200 ? "orange" : "green";
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "格式",
      key: "format",
      filteredValue: columnFilters.format ?? null,
      filters: [
        { text: "SVG", value: "svg" },
        { text: "WebP", value: "webp" },
        { text: "PNG", value: "png" },
        { text: "JPG", value: "jpg" },
        { text: "其他", value: "other" },
      ],
      onFilter: (value: any, record: any) =>
        (record.format || "other") === value,
      render: (_: any, record: any) => {
        const format = record.format || "other";
        const formatConfig = {
          svg: { color: "purple", text: "SVG" },
          webp: { color: "green", text: "WebP" },
          png: { color: "geekblue", text: "PNG" },
          jpg: { color: "gold", text: "JPG" },
          other: { color: "orange", text: "其他格式" },
        } as const;

        const config =
          formatConfig[format as keyof typeof formatConfig] ||
          formatConfig.other;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  return (
    <div>
      {Object.values(columnFilters).some(v => v && v.length) && (
        <div className="mb-2">
          <Space size={8} wrap>
            {columnFilters.alt?.map(v => (
              <Tag
                key={`alt-${String(v)}`}
                closable
                onClose={() => {
                  const next = { ...columnFilters, alt: null };
                  setColumnFilters(next);
                  setImagePage(1);
                }}
              >
                Alt: {v === "empty" ? "空" : "有值"}
              </Tag>
            ))}
            {columnFilters.format?.map(v => (
              <Tag
                key={`format-${String(v)}`}
                closable
                onClose={() => {
                  const rest = (columnFilters.format || []).filter(
                    x => x !== v
                  );
                  const next = {
                    ...columnFilters,
                    format: rest.length ? rest : null,
                  };
                  setColumnFilters(next);
                  setImagePage(1);
                }}
              >
                格式: {String(v).toUpperCase()}
              </Tag>
            ))}
            <Button
              type="link"
              size="small"
              onClick={() => {
                setColumnFilters({});
                setImagePage(1);
              }}
            >
              清空过滤
            </Button>
          </Space>
        </div>
      )}
      <Table
        columns={imageColumns}
        dataSource={rows}
        rowKey={(record: any) => record.src}
        pagination={{
          current: currentImagePage,
          pageSize,
          onChange: page => setImagePage(page),
          showSizeChanger: false,
          showQuickJumper: false,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        size="small"
        scroll={{ x: 400 }}
        onChange={(pagination, filters, sorter) => {
          setImagePage(pagination.current || 1);
          if (!Array.isArray(sorter)) {
            setSortInfo({
              field: (sorter as any).columnKey,
              order: (sorter as any).order || null,
            });
          }
          setColumnFilters(filters as Record<string, React.Key[] | null>);
        }}
      />
    </div>
  );
};

export default ImageTable;
