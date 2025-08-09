import React from "react";
import { Card, Space, Tag, Alert } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { SpellCheckInfo } from "../../types";

interface SpellCheckCardProps {
  spellCheck: SpellCheckInfo[];
}

const SpellCheckCard: React.FC<SpellCheckCardProps> = ({ spellCheck }) => {
  if (!spellCheck || spellCheck.length === 0) return null;

  return (
    <Card
      title={
        <Space>
          <WarningOutlined />
          拼写检查
        </Space>
      }
      size="small"
      extra={<Tag color="orange">{spellCheck.length} 个问题</Tag>}
    >
      {spellCheck.map((item, index) => (
        <Alert
          key={index}
          message={`"${item.word}" 可能拼写错误`}
          description={`建议: ${item.suggestions.join(", ")}`}
          type="warning"
          showIcon
          className="mb-2"
        />
      ))}
    </Card>
  );
};

export default SpellCheckCard;
