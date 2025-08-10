import React from "react";
import { Card, Typography } from "antd";
import { StarFilled } from "@ant-design/icons";

const { Text, Title } = Typography;

const ComingSoonCard: React.FC = () => {
  return (
    <Card
      className="coming-soon-card"
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
        <div className="text-center mb-4">
          <StarFilled
            style={{
              fontSize: "28px",
              color: "#ffd700",
              marginBottom: "8px",
              animation: "twinkle 2s infinite",
            }}
          />
          <Title
            level={4}
            style={{
              color: "white",
              margin: 0,
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              fontWeight: 700,
            }}
          >
            敬请期待 ✨
          </Title>
        </div>

        {/* 功能模块 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-2xl mb-2">🌐</div>
            <Text style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>
              多语言配置
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "12px",
                display: "block",
                marginTop: "4px",
              }}
            >
              支持多国语言
            </Text>
          </div>

          <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-2xl mb-2">💝</div>
            <Text style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>
              为爱发电站点
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "12px",
                display: "block",
                marginTop: "4px",
              }}
            >
              提供外链支持
            </Text>
          </div>

          <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-2xl mb-2">🤖</div>
            <Text style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>
              AI分析
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "12px",
                display: "block",
                marginTop: "4px",
              }}
            >
              智能网页分析
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ComingSoonCard;
