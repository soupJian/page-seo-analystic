import React from "react";
import { Card, Space, Tag, Empty, Alert } from "antd";
import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { HeadingInfo } from "../../types";
import HeadingMindMap from "../HeadingMindMap";

interface HeadingStructureCardProps {
  headings: HeadingInfo[];
}

const HeadingStructureCard: React.FC<HeadingStructureCardProps> = ({
  headings,
}) => {
  // 分析标题结构问题 - 根据脑图结构判断
  const analyzeHeadingStructure = (headings: HeadingInfo[]) => {
    const issues: string[] = [];

    // 检查是否有多个H1
    const h1Count = headings.filter(h => h.level === 1).length;
    if (h1Count > 1) {
      issues.push(`发现 ${h1Count} 个H1标题，建议只保留一个主要的H1标题`);
    }

    // 检查是否有H1
    if (h1Count === 0) {
      issues.push("页面缺少H1标题，建议添加一个主要的H1标题");
    }

    // 构建层级结构并检查跳跃问题
    const analyzeLevelJumps = (headings: HeadingInfo[]) => {
      const jumps: Array<{
        from: number;
        to: number;
        fromText: string;
        toText: string;
      }> = [];

      // 构建父子关系
      const buildHierarchy = (headings: HeadingInfo[]) => {
        const hierarchy: Array<{
          heading: HeadingInfo;
          children: HeadingInfo[];
        }> = [];

        for (let i = 0; i < headings.length; i++) {
          const current = headings[i];
          const children: HeadingInfo[] = [];

          // 查找当前标题的直接子标题
          for (let j = i + 1; j < headings.length; j++) {
            const next = headings[j];
            if (next.level <= current.level) break; // 遇到同级或更高级的标题，停止查找

            // 如果是直接子标题（只比当前标题高一级）
            if (next.level === current.level + 1) {
              children.push(next);
            }
          }

          hierarchy.push({ heading: current, children });
        }

        return hierarchy;
      };

      const hierarchy = buildHierarchy(headings);

      // 检查每个标题与其子标题之间的层级跳跃
      hierarchy.forEach(({ heading, children }) => {
        children.forEach(child => {
          if (child.level - heading.level > 1) {
            jumps.push({
              from: heading.level,
              to: child.level,
              fromText: heading.text,
              toText: child.text,
            });
          }
        });
      });

      return jumps;
    };

    const levelJumps = analyzeLevelJumps(headings);
    levelJumps.forEach(jump => {
      issues.push(
        `标题层级跳跃过大：从H${jump.from}（${jump.fromText}）直接跳到H${jump.to}（${jump.toText}），建议添加中间层级`
      );
    });

    return issues;
  };

  const structureIssues = analyzeHeadingStructure(headings);
  console.log(headings);

  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined />
          标题结构
        </Space>
      }
      size="small"
      extra={<Tag color="blue">{headings.length} 个标题</Tag>}
    >
      {headings.length > 0 ? (
        <>
          {structureIssues.length > 0 && (
            <Alert
              message="标题结构问题"
              description={
                <ul className="m-0 pl-4">
                  {structureIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              }
              type="warning"
              showIcon
              className="mb-4"
            />
          )}
          <HeadingMindMap headings={headings} width={400} height={300} />
        </>
      ) : (
        <Empty description="未找到标题标签" />
      )}
    </Card>
  );
};

export default HeadingStructureCard;
