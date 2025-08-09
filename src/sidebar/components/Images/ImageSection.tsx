import React from "react";
import { Card, Space, Tag, Button, Empty } from "antd";
import { PictureOutlined, ExportOutlined } from "@ant-design/icons";
import { ImageInfo } from "../../../types";
import ImageTable from "./ImageTable.tsx";

interface ImageSectionProps {
  imageInfo: ImageInfo[];
  onExport: (data: any[], filename: string) => void;
}

const ImageSection: React.FC<ImageSectionProps> = ({ imageInfo, onExport }) => {
  return (
    <Card
      title={
        <Space>
          <PictureOutlined />
          图片信息
        </Space>
      }
      size="small"
      extra={
        <Space>
          <Tag color="blue">{imageInfo.length} 张图片</Tag>
          <Button
            type="link"
            size="small"
            icon={<ExportOutlined />}
            onClick={() => onExport(imageInfo, "images")}
          >
            导出
          </Button>
        </Space>
      }
    >
      {imageInfo.length > 0 ? (
        <ImageTable imageInfo={imageInfo} />
      ) : (
        <Empty description="未找到图片" />
      )}
    </Card>
  );
};

export default ImageSection;
