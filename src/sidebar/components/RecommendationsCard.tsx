import React from "react";
import { Card, Space, Tag, Alert, Pagination, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { RecommendationInfo } from "../../types";

const { Paragraph } = Typography;

interface RecommendationsCardProps {
  recommendations: RecommendationInfo[];
  recommendationImagePage: Record<number, number>;
  onRecommendationImagePageChange: (index: number, page: number) => void;
}

const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
  recommendationImagePage,
  onRecommendationImagePageChange,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "blue";
    }
  };

  // 解析优化建议中的图片链接
  const parseImageUrls = (suggestion: string) => {
    const urlMatch = suggestion.match(
      /需要优化的图片：(.+?)(?:\s+等\d+张图片)?$/
    );
    if (!urlMatch) return { text: suggestion, urls: [] };

    const urlText = urlMatch[1];
    const urls = urlText.split(", ").filter(url => url.trim());
    const text = suggestion.replace(
      /需要优化的图片：.+?(?:\s+等\d+张图片)?$/,
      ""
    );

    return { text: text.trim(), urls };
  };

  return (
    <Card
      title={
        <Space>
          <CheckCircleOutlined />
          优化建议
        </Space>
      }
      size="small"
      extra={<Tag color="green">{recommendations.length} 条建议</Tag>}
    >
      {recommendations.map((rec, index) => {
        const { text, urls } = parseImageUrls(rec.suggestion);
        const currentPage = recommendationImagePage[index] || 1;
        const urlPageSize = 3; // 每页显示3个链接
        const totalPages = Math.ceil(urls.length / urlPageSize);
        const paginatedUrls = urls.slice(
          (currentPage - 1) * urlPageSize,
          currentPage * urlPageSize
        );

        return (
          <Alert
            key={index}
            message={
              <Space>
                <Tag color={getPriorityColor(rec.priority)}>{rec.priority}</Tag>
                <Tag color="blue">{rec.category}</Tag>
              </Space>
            }
            description={
              <div>
                <Paragraph className="mb-1">
                  <Typography.Text strong>问题:</Typography.Text> {rec.issue}
                </Paragraph>
                <Paragraph className="mb-0">
                  <Typography.Text strong type="success">
                    建议:
                  </Typography.Text>{" "}
                  {text}
                </Paragraph>
                {urls.length > 0 && (
                  <div className="mt-2">
                    <Typography.Text strong>需要优化的图片:</Typography.Text>
                    <div className="mt-1">
                      {paginatedUrls.map((url, urlIndex) => (
                        <div key={urlIndex} className="mb-1">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 no-underline text-xs break-all"
                          >
                            {url}
                          </a>
                        </div>
                      ))}
                      {totalPages > 1 && (
                        <Pagination
                          current={currentPage}
                          total={urls.length}
                          pageSize={urlPageSize}
                          onChange={page => {
                            onRecommendationImagePageChange(index, page);
                          }}
                          size="small"
                          className="mt-2"
                          showSizeChanger={false}
                          showQuickJumper={false}
                          showTotal={(total, range) =>
                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                          }
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            }
            type="info"
            showIcon
            className="mb-2"
          />
        );
      })}
    </Card>
  );
};

export default RecommendationsCard;
