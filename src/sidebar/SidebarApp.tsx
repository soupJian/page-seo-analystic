import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Alert,
  Spin,
  Pagination,
  Space,
  Typography,
  Divider,
  Empty,
  Result,
  Row,
  Col,
  Statistic,
  Progress,
  Tooltip,
  Image,
} from "antd";
import {
  ReloadOutlined,
  ExportOutlined,
  LinkOutlined,
  PictureOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

// 导入统一类型定义
import { SeoData } from "../types";

interface SidebarAppProps {
  onReanalyze: () => void;
}

const SidebarApp: React.FC<SidebarAppProps> = ({ onReanalyze }) => {
  const [seoData, setSeoData] = useState<SeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePage, setImagePage] = useState(1);
  const [linkPage, setLinkPage] = useState(1);
  const pageSize = 10;

  // 处理重新分析
  const handleReanalyze = () => {
    setLoading(true);
    setError(null);
    setSeoData(null);

    // 延迟一秒后触发重新分析，给用户看到loading效果
    setTimeout(() => {
      onReanalyze();
    }, 1000);
  };

  useEffect(() => {
    // Connect to background script
    const port = chrome.runtime.connect({ name: "sidebar" });

    // Send connection message
    port.postMessage({ type: "SIDEBAR_CONNECTED" });

    // Listen for messages from background script
    const handleMessage = (message: any) => {
      console.log("Sidebar received message:", message);

      if (message.type === "SEO_DATA") {
        setSeoData(message.data);
        setLoading(false);
        setError(null);
      } else if (message.type === "ANALYSIS_ERROR") {
        setError(message.error || "分析失败");
        setLoading(false);
      } else if (message.type === "URL_CHANGED") {
        setLoading(true);
        setError(null);
        setSeoData(null);
      }
    };

    port.onMessage.addListener(handleMessage);

    // Cleanup on unmount
    return () => {
      port.disconnect();
    };
  }, []);

  const exportToExcel = (data: any[], filename: string) => {
    const csvContent = [
      Object.keys(data[0]).join(","),
      ...data.map(row =>
        Object.values(row)
          .map(value => `"${value}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const getHeadingTagColor = (level: number) => {
    switch (level) {
      case 1:
        return "red";
      case 2:
        return "orange";
      case 3:
        return "yellow";
      case 4:
        return "green";
      case 5:
        return "blue";
      case 6:
        return "purple";
      default:
        return "default";
    }
  };

  // Loading state with full-height container
  if (loading) {
    return (
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
          <Title level={4} style={{ margin: 0 }}>
            页面分析工具
          </Title>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px 16px",
          }}
        >
          <Spin
            size="large"
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
          />
          <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
            正在分析页面
          </Title>
          <Text type="secondary">正在收集SEO数据，请稍候...</Text>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
          <Title level={4} style={{ margin: 0 }}>
            页面分析工具
          </Title>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px 16px",
          }}
        >
          <Result
            status="error"
            title="分析失败"
            subTitle={error}
            extra={
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleReanalyze}
              >
                重新分析
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  // No data state
  if (!seoData) {
    return (
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
          <Title level={4} style={{ margin: 0 }}>
            页面分析工具
          </Title>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px 16px",
          }}
        >
          <Result
            status="info"
            title="暂无数据"
            subTitle="点击按钮开始分析当前页面的SEO信息"
            extra={
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleReanalyze}
              >
                开始分析
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const imageColumns = [
    {
      title: "图片",
      dataIndex: "src",
      key: "src",
      width: 80,
      render: (src: string, record: any) => (
        <Image
          src={src}
          alt={record.alt || "图片"}
          width={60}
          height={60}
          style={{ objectFit: "cover", borderRadius: "4px" }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
        />
      ),
    },
    {
      title: "链接",
      dataIndex: "src",
      key: "link",
      render: (src: string) => (
        <Tooltip title={src}>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {src}
          </a>
        </Tooltip>
      ),
    },
    {
      title: "Alt文本",
      dataIndex: "alt",
      key: "alt",
      render: (alt: string) => (
        <Text type={alt ? undefined : "secondary"} italic={!alt}>
          {alt || "无Alt文本"}
        </Text>
      ),
    },
    {
      title: "尺寸",
      key: "size",
      render: (_: any, record: any) => (
        <Tag color="blue">
          {record.width}×{record.height}
        </Tag>
      ),
    },
  ];

  const linkColumns = [
    {
      title: "链接",
      dataIndex: "href",
      key: "href",
      render: (href: string) => (
        <Tooltip title={href}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {href}
          </a>
        </Tooltip>
      ),
    },
    {
      title: "文本",
      dataIndex: "text",
      key: "text",
      render: (text: string) => (
        <Text type={text ? undefined : "secondary"}>{text || "-"}</Text>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "external" ? "blue" : "green"}>
          {type === "external" ? "外部链接" : "内部链接"}
        </Tag>
      ),
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      render: (title: string) => (
        <Text type={title ? undefined : "secondary"}>{title || "-"}</Text>
      ),
    },
  ];

  const paginatedImages = seoData.imageInfo.slice(
    (imagePage - 1) * pageSize,
    imagePage * pageSize
  );
  const paginatedLinks = seoData.linksInfo.slice(
    (linkPage - 1) * pageSize,
    linkPage * pageSize
  );

  const foundAnalytics = seoData.analyticsInfo.filter(tool => tool.found);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
        }}
      >
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Title level={4} style={{ margin: 0 }}>
            页面分析工具
          </Title>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleReanalyze}
          >
            重新分析
          </Button>
        </Space>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* 基本信息 */}
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
              <Col span={12}>
                <Statistic
                  title="页面标题"
                  value={seoData.basicInfo.title || "-"}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="语言"
                  value={seoData.basicInfo.language || "-"}
                />
              </Col>
            </Row>
            <Paragraph style={{ marginTop: 8 }}>
              <Text strong>URL:</Text>
              <br />
              <Text copyable style={{ fontSize: "12px" }}>
                {seoData.basicInfo.url}
              </Text>
            </Paragraph>
          </Card>

          {/* Meta信息 */}
          <Card
            title={
              <Space>
                <InfoCircleOutlined />
                Meta信息
              </Space>
            }
            size="small"
          >
            <Row gutter={[16, 8]}>
              <Col span={24}>
                <Paragraph>
                  <Text strong>描述:</Text>
                  <br />
                  <Text>{seoData.metaInfo.description || "-"}</Text>
                </Paragraph>
              </Col>
              <Col span={12}>
                <Statistic
                  title="关键词"
                  value={seoData.metaInfo.keywords || "-"}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Canonical"
                  value={seoData.metaInfo.canonical || "-"}
                />
              </Col>
            </Row>
          </Card>

          {/* 标题结构 */}
          <Card
            title={
              <Space>
                <InfoCircleOutlined />
                标题结构
              </Space>
            }
            size="small"
            extra={
              <Tag color="blue">{seoData.headingStructure.length} 个标题</Tag>
            }
          >
            {seoData.headingStructure.length > 0 ? (
              <Space wrap>
                {seoData.headingStructure.map((heading, index) => (
                  <Tag
                    key={index}
                    color={getHeadingTagColor(heading.level)}
                    style={{ marginBottom: 4 }}
                  >
                    {heading.tag}: {heading.text}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Empty description="未找到标题标签" />
            )}
          </Card>

          {/* 图片信息 */}
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
                <Tag color="blue">{seoData.imageInfo.length} 张图片</Tag>
                <Button
                  type="link"
                  size="small"
                  icon={<ExportOutlined />}
                  onClick={() => exportToExcel(seoData.imageInfo, "images")}
                >
                  导出
                </Button>
              </Space>
            }
          >
            {seoData.imageInfo.length > 0 ? (
              <>
                <Table
                  columns={imageColumns}
                  dataSource={paginatedImages}
                  pagination={false}
                  size="small"
                  scroll={{ x: 400 }}
                />
                <Pagination
                  current={imagePage}
                  total={seoData.imageInfo.length}
                  pageSize={pageSize}
                  onChange={setImagePage}
                  size="small"
                  style={{ marginTop: 8, textAlign: "center" }}
                />
              </>
            ) : (
              <Empty description="未找到图片" />
            )}
          </Card>

          {/* 链接信息 */}
          <Card
            title={
              <Space>
                <LinkOutlined />
                链接信息
              </Space>
            }
            size="small"
            extra={
              <Space>
                <Tag color="blue">{seoData.linksInfo.length} 个链接</Tag>
                <Button
                  type="link"
                  size="small"
                  icon={<ExportOutlined />}
                  onClick={() => exportToExcel(seoData.linksInfo, "links")}
                >
                  导出
                </Button>
              </Space>
            }
          >
            {seoData.linksInfo.length > 0 ? (
              <>
                <Table
                  columns={linkColumns}
                  dataSource={paginatedLinks}
                  pagination={false}
                  size="small"
                  scroll={{ x: 400 }}
                />
                <Pagination
                  current={linkPage}
                  total={seoData.linksInfo.length}
                  pageSize={pageSize}
                  onChange={setLinkPage}
                  size="small"
                  style={{ marginTop: 8, textAlign: "center" }}
                />
              </>
            ) : (
              <Empty description="未找到链接" />
            )}
          </Card>

          {/* 结构化数据 */}
          {seoData.structuredData.length > 0 && (
            <Card
              title={
                <Space>
                  <InfoCircleOutlined />
                  结构化数据
                </Space>
              }
              size="small"
              extra={
                <Tag color="blue">{seoData.structuredData.length} 个结构</Tag>
              }
            >
              {seoData.structuredData.map((item, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <Space>
                    <Tag color="green">{item.type}</Tag>
                    {item.name && <Tag color="blue">{item.name}</Tag>}
                  </Space>
                  {item.products && item.products.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text strong>产品信息:</Text>
                      {item.products.map((product, pIndex) => (
                        <Card
                          key={pIndex}
                          size="small"
                          style={{ marginTop: 4 }}
                        >
                          <Row gutter={[8, 4]}>
                            <Col span={12}>
                              <Text strong>名称:</Text> {product.name}
                            </Col>
                            <Col span={12}>
                              <Text strong>品牌:</Text> {product.brand}
                            </Col>
                            <Col span={12}>
                              <Text strong>价格:</Text> {product.price}{" "}
                              {product.currency}
                            </Col>
                            <Col span={12}>
                              <Text strong>SKU:</Text> {product.sku}
                            </Col>
                          </Row>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </Card>
          )}

          {/* 分析工具 */}
          {foundAnalytics.length > 0 && (
            <Card
              title={
                <Space>
                  <InfoCircleOutlined />
                  分析工具
                </Space>
              }
              size="small"
              extra={<Tag color="blue">{foundAnalytics.length} 个工具</Tag>}
            >
              <Space wrap>
                {foundAnalytics.map((tool, index) => (
                  <Tag key={index} color="blue">
                    {tool.name}: {tool.id}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}

          {/* 拼写检查 */}
          {seoData.spellCheck.length > 0 && (
            <Card
              title={
                <Space>
                  <WarningOutlined />
                  拼写检查
                </Space>
              }
              size="small"
              extra={
                <Tag color="orange">{seoData.spellCheck.length} 个问题</Tag>
              }
            >
              {seoData.spellCheck.map((item, index) => (
                <Alert
                  key={index}
                  message={`"${item.word}" 可能拼写错误`}
                  description={`建议: ${item.suggestions.join(", ")}`}
                  type="warning"
                  showIcon
                  style={{ marginBottom: 8 }}
                />
              ))}
            </Card>
          )}

          {/* 优化建议 */}
          {seoData.recommendations.length > 0 && (
            <Card
              title={
                <Space>
                  <CheckCircleOutlined />
                  优化建议
                </Space>
              }
              size="small"
              extra={
                <Tag color="green">{seoData.recommendations.length} 条建议</Tag>
              }
            >
              {seoData.recommendations.map((rec, index) => (
                <Alert
                  key={index}
                  message={
                    <Space>
                      <Tag color={getPriorityColor(rec.priority)}>
                        {rec.priority}
                      </Tag>
                      <Tag color="blue">{rec.category}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Paragraph style={{ marginBottom: 4 }}>
                        <Text strong>问题:</Text> {rec.issue}
                      </Paragraph>
                      <Paragraph style={{ marginBottom: 0 }}>
                        <Text strong type="success">
                          建议:
                        </Text>{" "}
                        {rec.suggestion}
                      </Paragraph>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 8 }}
                />
              ))}
            </Card>
          )}
        </Space>
      </div>
    </div>
  );
};

export default SidebarApp;
