import React from "react";
import { Card, Space, Tag, Row, Col, Typography } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { StructuredDataInfo } from "../../types";

interface StructuredDataCardProps {
  structuredData: StructuredDataInfo[];
}

const StructuredDataCard: React.FC<StructuredDataCardProps> = ({
  structuredData,
}) => {
  if (structuredData.length === 0) {
    return null;
  }

  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined />
          结构化数据
        </Space>
      }
      size="small"
      extra={<Tag color="blue">{structuredData.length} 个结构</Tag>}
    >
      {structuredData.map((item, index) => (
        <Card key={index} size="small" className="mb-2">
          <Space>
            <Tag color="green">{item.type}</Tag>
            {item.name && <Tag color="blue">{item.name}</Tag>}
          </Space>
          {item.products && item.products.length > 0 && (
            <div className="mt-2">
              <Typography.Text strong>产品信息:</Typography.Text>
              {item.products.map((product, pIndex) => (
                <Card key={pIndex} size="small" className="mt-1">
                  <Row gutter={[8, 4]}>
                    <Col span={12}>
                      <Typography.Text strong>名称:</Typography.Text>{" "}
                      {product.name}
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>品牌:</Typography.Text>{" "}
                      {product.brand}
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>价格:</Typography.Text>{" "}
                      {product.price} {product.currency}
                    </Col>
                    <Col span={12}>
                      <Typography.Text strong>SKU:</Typography.Text>{" "}
                      {product.sku}
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          )}
        </Card>
      ))}
    </Card>
  );
};

export default StructuredDataCard;
