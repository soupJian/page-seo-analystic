import React from "react";
import { Card, Image, Typography, Space, Divider } from "antd";
import { HeartFilled, StarFilled, MailOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const SupportCard: React.FC = () => {
  return (
    <Card
      className="support-card"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        border: "none",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      }}
    >
      <div className="text-center p-6">
        {/* 标题区域 */}
        <div className="mb-6">
          <HeartFilled
            style={{
              fontSize: "40px",
              color: "#ff6b6b",
              marginBottom: "16px",
              animation: "pulse 2s infinite",
            }}
          />
          <Title
            level={2}
            style={{
              color: "white",
              margin: 0,
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              fontWeight: 700,
            }}
          >
            为爱发电 ❤️
          </Title>
          <Paragraph
            style={{
              color: "rgba(255,255,255,0.95)",
              margin: "12px 0 0 0",
              fontSize: "18px",
              lineHeight: 1.5,
            }}
          >
            如果这个工具对你有帮助，欢迎支持一下
          </Paragraph>
        </div>

        <Divider style={{ borderColor: "rgba(255,255,255,0.3)" }} />

        {/* 收款码区域 - 一行两个图片 */}
        <div className="flex justify-center gap-8 mb-8">
          {/* 微信支付 */}
          <div className="text-center">
            <div className="mb-3">
              <Image
                src="/wechat-pay.png"
                alt="微信支付二维码"
                width={140}
                height={140}
                style={{
                  borderRadius: "16px",
                  border: "4px solid rgba(255,255,255,0.4)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  objectFit: "cover",
                }}
                className="hover:scale-105 hover:shadow-2xl"
                preview={{
                  mask: "点击预览",
                  maskClassName: "custom-mask",
                }}
                fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgdmlld0JveD0iMCAwIDE0MCAxNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNDAiIGhlaWdodD0iMTQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0zNSAzNUgxMDVWMTA1SDM1VjM1WiIgZmlsbD0iI0Q3RDdENyIvPgo8cGF0aCBkPSJNNDUgNDVIMTAwVjEwMEg0NVY0NVoiIGZpbGw9IiNBOTlBOUE5Ii8+Cjwvc3ZnPgo="
              />
            </div>
            <Text style={{ color: "white", fontWeight: 600, fontSize: "16px" }}>
              微信支付
            </Text>
            <Paragraph
              style={{
                color: "rgba(255,255,255,0.8)",
                margin: "4px 0 0 0",
                fontSize: "14px",
              }}
            >
              扫码即可支持
            </Paragraph>
          </div>

          {/* 支付宝 */}
          <div className="text-center">
            <div className="mb-3">
              <Image
                src="/zhi-pay.jpg"
                alt="支付宝二维码"
                width={140}
                height={140}
                style={{
                  borderRadius: "16px",
                  border: "4px solid rgba(255,255,255,0.4)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  objectFit: "cover",
                }}
                className="hover:scale-105 hover:shadow-2xl"
                preview={{
                  mask: "点击预览",
                  maskClassName: "custom-mask",
                }}
                fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgdmlld0JveD0iMCAwIDE0MCAxNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNDAiIGhlaWdodD0iMTQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0zNSAzNUgxMDVWMTA1SDM1VjM1WiIgZmlsbD0iI0Q3RDdENyIvPgo8cGF0aCBkPSJNNDUgNDVIMTAwVjEwMEg0NVY0NVoiIGZpbGw9IiNBOTlBOUE5Ii8+Cjwvc3ZnPgo="
              />
            </div>
            <Text style={{ color: "white", fontWeight: 600, fontSize: "16px" }}>
              支付宝
            </Text>
            <Paragraph
              style={{
                color: "rgba(255,255,255,0.8)",
                margin: "4px 0 0 0",
                fontSize: "14px",
              }}
            >
              扫码即可支持
            </Paragraph>
          </div>
        </div>

        {/* 祝福语区域 */}
        <div className="text-center">
          <div className="mb-4">
            <StarFilled
              style={{
                fontSize: "24px",
                color: "#ffd700",
                marginRight: "12px",
                animation: "twinkle 1.5s infinite",
              }}
            />
            <Text
              style={{
                color: "rgba(255,255,255,0.95)",
                fontSize: "20px",
                fontWeight: 700,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              祝福老板生意兴隆，日进斗金！
            </Text>
            <StarFilled
              style={{
                fontSize: "24px",
                color: "#ffd700",
                marginLeft: "12px",
                animation: "twinkle 1.5s infinite 0.5s",
              }}
            />
          </div>

          <Paragraph
            style={{
              color: "rgba(255,255,255,0.9)",
              margin: "12px 0 0 0",
              fontSize: "16px",
              lineHeight: 1.6,
            }}
          >
            感谢您的支持，我们会继续努力完善工具功能
            <br />
            让网页分析变得更加简单高效 ✨
          </Paragraph>

          {/* 联系作者 */}
          <div className="mt-6 p-4 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
            <Space direction="vertical" size="small">
              <div className="flex items-center justify-center gap-2">
                <MailOutlined style={{ color: "#ffd700", fontSize: "16px" }} />
                <Text
                  style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px" }}
                >
                  如果你有新的想法可以联系作者哦：
                </Text>
                <a
                  href="mailto:soupjian123@gmail.com"
                  style={{
                    color: "#ffd700",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                  className="hover:underline hover:text-yellow-300 transition-colors"
                >
                  soupjian123@gmail.com
                </a>
              </div>
              <div className="text-center">
                <Text
                  style={{
                    color: "#ffd700",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  💎 已发电用户可以联系作者，可以为您提供技术服务或提供外链哦
                </Text>
              </div>
            </Space>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SupportCard;
