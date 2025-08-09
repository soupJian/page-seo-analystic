import React, { useState } from "react";
import {
  Table,
  Tag,
  Image,
  Tooltip,
  Pagination,
  Space,
  Typography,
  Select,
  Button,
} from "antd";
import { ExportOutlined } from "@antv/icons-react";
import { ImageInfo } from "../../types";

interface ImageTableProps {
  imageInfo: ImageInfo[];
  onExport: (data: any[], filename: string) => void;
}

const ImageTable: React.FC<ImageTableProps> = ({ imageInfo, onExport }) => {
  const [imageFilter, setImageFilter] = useState("");
  const [currentImagePage, setImagePage] = useState(1);
  const pageSize = 10;

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
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
        />
      ),
    },
    {
      title: "链接",
      dataIndex: "src",
      key: "link",
      render: (src: string) => (
        <Tooltip title={src}>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
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
      title: "格式",
      key: "format",
      render: (_: any, record: any) => {
        const format = record.format || "other";
        const formatConfig = {
          svg: { color: "purple", text: "SVG" },
          webp: { color: "green", text: "WebP" },
          other: { color: "orange", text: "其他格式" },
        };

        const config =
          formatConfig[format as keyof typeof formatConfig] ||
          formatConfig.other;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  // 图片过滤逻辑
  const filteredImages = imageInfo.filter(img => {
    const hasEmptyAlt = !img.alt || img.alt.trim() === "" || img.alt === "-";
    const format = img.format || "other";

    if (imageFilter === "empty-alt") {
      return hasEmptyAlt;
    } else if (imageFilter === "not-optimized") {
      return format !== "svg" && format !== "webp";
    } else if (imageFilter === "svg") {
      return format === "svg";
    } else if (imageFilter === "webp") {
      return format === "webp";
    }
    return true;
  });

  const paginatedImages = filteredImages.slice(
    (currentImagePage - 1) * pageSize,
    currentImagePage * pageSize
  );

  return (
    <div>
      <div className="mb-2">
        <Space>
          <Typography.Text strong>过滤:</Typography.Text>
          <Select
            value={imageFilter}
            onChange={setImageFilter}
            className="w-36"
            size="small"
          >
            <Select.Option value="">全部图片</Select.Option>
            <Select.Option value="empty-alt">Alt为空</Select.Option>
            <Select.Option value="not-optimized">未优化格式</Select.Option>
            <Select.Option value="svg">SVG格式</Select.Option>
            <Select.Option value="webp">WebP格式</Select.Option>
          </Select>
          <Typography.Text type="secondary">
            (显示 {filteredImages.length} / {imageInfo.length})
          </Typography.Text>
        </Space>
      </div>
      <Table
        columns={imageColumns}
        dataSource={paginatedImages}
        pagination={false}
        size="small"
        scroll={{ x: 400 }}
      />
      <Pagination
        current={currentImagePage}
        total={filteredImages.length}
        pageSize={pageSize}
        onChange={page => {
          setImagePage(page);
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

export default ImageTable;
