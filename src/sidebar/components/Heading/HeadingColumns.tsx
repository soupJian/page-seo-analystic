import React from "react";
import { Card, Tag, Space, Typography } from "antd";
import { HeadingInfo } from "../../../types";

const { Text } = Typography;

interface HeadingColumnsProps {
  headings: HeadingInfo[];
}

const HeadingColumns: React.FC<HeadingColumnsProps> = ({ headings }) => {
  // 按层级分组标题
  const groupedHeadings = headings.reduce((acc, heading) => {
    const level = heading.level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(heading);
    return acc;
  }, {} as Record<number, HeadingInfo[]>);

  // 获取层级标签配置
  const getLevelConfig = (level: number) => {
    const configs = {
      1: { color: "red", text: "H1", icon: "🔴", borderColor: "#ff4d4f" },
      2: { color: "orange", text: "H2", icon: "🟠", borderColor: "#ff7a45" },
      3: { color: "blue", text: "H3", icon: "🔵", borderColor: "#1890ff" },
      4: { color: "green", text: "H4", icon: "🟢", borderColor: "#52c41a" },
      5: { color: "purple", text: "H5", icon: "🟣", borderColor: "#722ed1" },
      6: { color: "geekblue", text: "H6", icon: "🔷", borderColor: "#597ef7" },
    };
    return (
      configs[level as keyof typeof configs] || {
        color: "default",
        text: `H${level}`,
        icon: "⚪",
        borderColor: "#d9d9d9",
      }
    );
  };

  // 按层级顺序排序
  const sortedLevels = Object.keys(groupedHeadings)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {sortedLevels.map(level => {
        const levelHeadings = groupedHeadings[level];
        const config = getLevelConfig(level);

        return (
          <Card
            key={level}
            size="small"
            title={
              <Space>
                <span>{config.icon}</span>
                <Text strong>{config.text}</Text>
                <Tag color={config.color as any}>{levelHeadings.length} 个</Tag>
              </Space>
            }
            className="border-l-4"
            style={{ borderLeftColor: config.borderColor }}
          >
            <div className="space-y-2">
              {levelHeadings.map((heading, index) => (
                <div
                  key={`${level}-${index}`}
                  className="flex items-start gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <Tag color={config.color as any}>{index + 1}</Tag>
                  <div className="flex-1 min-w-0">
                    <Text className="text-sm font-medium text-gray-900">
                      {heading.text}
                    </Text>
                    <div className="mt-1 text-xs text-gray-500">
                      <Tag color="default">{heading.tag}</Tag>
                      <span className="ml-2">层级: {heading.level}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {headings.length === 0 && (
        <Card size="small">
          <div className="text-center text-gray-500 py-8">
            <Text>未找到标题标签</Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HeadingColumns;
