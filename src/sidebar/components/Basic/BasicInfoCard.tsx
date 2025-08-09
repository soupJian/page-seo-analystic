import React from "react";
import { Card, Space, Row, Col, Typography } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { BasicInfo, MetaInfo } from "../../../types";

const { Paragraph } = Typography;

interface BasicInfoCardProps {
  basicInfo: BasicInfo;
  metaInfo: MetaInfo;
}

const BasicInfoCard: React.FC<BasicInfoCardProps> = ({
  basicInfo,
  metaInfo,
}) => {
  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined />
          基本信息
        </Space>
      }
      size="small"
    >
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Paragraph>
            <Typography.Text strong>页面标题:</Typography.Text>
            <br />
            <Typography.Text>{basicInfo.title || "-"}</Typography.Text>
          </Paragraph>
        </Col>
      </Row>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Paragraph>
            <Typography.Text strong>Meta描述:</Typography.Text>
            <br />
            <Typography.Text>{metaInfo.description || "-"}</Typography.Text>
          </Paragraph>
        </Col>
      </Row>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Paragraph>
            <Typography.Text strong>关键词:</Typography.Text>
            <br />
            <Typography.Text>{metaInfo.keywords || "-"}</Typography.Text>
          </Paragraph>
        </Col>
      </Row>
      <Row gutter={[16, 8]}>
        <Col span={12}>
          <Paragraph>
            <Typography.Text strong>当前URL:</Typography.Text>
            <br />
            <Typography.Text copyable className="text-xs break-all">
              {basicInfo.url}
            </Typography.Text>
          </Paragraph>
        </Col>
        <Col span={12}>
          <Paragraph>
            <Typography.Text strong>Canonical URL:</Typography.Text>
            <br />
            {metaInfo.canonical ? (
              <Typography.Text copyable className="text-xs break-all">
                {metaInfo.canonical}
              </Typography.Text>
            ) : (
              <Typography.Text className="text-xs text-gray-500">
                -
              </Typography.Text>
            )}
          </Paragraph>
        </Col>
      </Row>
    </Card>
  );
};

export default BasicInfoCard;
