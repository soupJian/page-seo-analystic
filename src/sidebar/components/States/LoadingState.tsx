import React from "react";
import { Spin, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface LoadingStateProps {
  title?: string;
  subtitle?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  title = "页面分析工具",
  subtitle = "正在收集页面数据，请稍候...",
}) => {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <Title level={4} className="m-0">
          {title}
        </Title>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center p-10">
        <Spin
          size="large"
          indicator={<LoadingOutlined className="text-5xl" spin />}
        />
        <Title level={5} className="mt-4 mb-2">
          正在分析页面
        </Title>
        <Typography.Text type="secondary">{subtitle}</Typography.Text>
      </div>
    </div>
  );
};

export default LoadingState;
