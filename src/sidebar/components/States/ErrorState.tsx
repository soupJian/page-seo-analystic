import React from "react";
import { Button, Result, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface ErrorStateProps {
  title?: string;
  errorMessage: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "页面分析工具",
  errorMessage,
  onRetry,
}) => {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <Title level={4} className="m-0">
          {title}
        </Title>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center p-10">
        <Result
          status="error"
          title="分析失败"
          subTitle={errorMessage}
          extra={
            <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
              重新分析
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default ErrorState;
