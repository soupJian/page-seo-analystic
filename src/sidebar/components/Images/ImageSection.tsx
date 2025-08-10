import React, { useRef } from "react";
import { Card, Space, Button, Empty } from "antd";
import { PictureOutlined, ExportOutlined } from "@ant-design/icons";
import { ImageInfo } from "../../../types";
import ImageTable, { ImageTableRef } from "./ImageTable.tsx";

interface ImageSectionProps {
  imageInfo: ImageInfo[];
  onExport: (data: any[], filename: string) => void;
}

const ImageSection: React.FC<ImageSectionProps> = ({ imageInfo, onExport }) => {
  const imageTableRef = useRef<ImageTableRef>(null);

  const handleExport = () => {
    if (imageTableRef.current) {
      const currentData = imageTableRef.current.getCurrentDisplayData();
      onExport(currentData, "images");
    } else {
      // 如果没有引用，导出原始数据
      onExport(imageInfo, "images");
    }
  };

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
      {imageInfo.length > 0 ? (
        <ImageTable
          ref={imageTableRef}
          imageInfo={imageInfo}
          onExport={onExport}
        />
      ) : (
        <Empty description="未找到图片" />
      )}
    </Card>
  );
};

export default ImageSection;
