import React from "react";
import { Button, Result, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface EmptyStateProps {
  title?: string;
  subTitle?: string;
  onStart: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "页面分析工具",
  subTitle = "点击按钮开始分析当前页面的SEO信息",
  onStart,
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
          status="info"
          title="暂无数据"
          subTitle={subTitle}
          extra={
            <Button type="primary" icon={<ReloadOutlined />} onClick={onStart}>
              开始分析
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default EmptyState;
