// Background Script - 处理侧边栏和消息传递
class BackgroundManager {
  constructor() {
    this.seoData = null;
    this.init();
  }

  init() {
    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "sendDataToSidebar") {
        this.seoData = request.data;
        sendResponse({ success: true });
        return true; // 保持消息通道开放
      } else if (request.action === "getSeoData") {
        sendResponse({ data: this.seoData });
        return true; // 保持消息通道开放
      }
    });
  }
}

// 初始化背景管理器
new BackgroundManager();
