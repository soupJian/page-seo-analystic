// Background Script - 处理侧边栏和消息传递
class BackgroundManager {
  constructor() {
    this.seoData = null;
    this.sidebarPort = null;
    this.init();
  }

  init() {
    // 监听插件图标点击事件
    chrome.action.onClicked.addListener(tab => {
      console.log("插件被点击，标签页ID:", tab.id);

      // 打开侧边栏
      chrome.sidePanel.open({ tabId: tab.id });

      // 延迟发送分析页面消息到content script，确保侧边栏已经打开
      setTimeout(() => {
        console.log("发送分析页面消息到content script");
        chrome.tabs
          .sendMessage(tab.id, { action: "analyzePage" })
          .then(response => {
            console.log("content script响应:", response);
          })
          .catch(error => {
            console.error("发送消息到content script失败:", error);
          });
      }, 100);
    });

    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "setSeoData") {
        this.seoData = request.data;
        console.log("收到SEO数据:", request.data);
        sendResponse({ success: true });
        return true; // 保持消息通道开放
      } else if (request.action === "getSeoData") {
        console.log("侧边栏请求SEO数据:", this.seoData);
        sendResponse({ data: this.seoData });
        return true; // 保持消息通道开放
      } else if (request.action === "sendToSidebar") {
        // 转发消息到sidebar
        console.log("转发消息到sidebar:", request.data);
        this.sendToSidebar(request.data);
        sendResponse({ success: true });
        return true;
      }
    });

    // 监听sidebar的连接
    chrome.runtime.onConnect.addListener(port => {
      if (port.name === "sidebar") {
        console.log("Sidebar已连接");
        this.sidebarPort = port;

        port.onDisconnect.addListener(() => {
          console.log("Sidebar已断开连接");
          this.sidebarPort = null;
        });
      }
    });
  }

  sendToSidebar(data) {
    if (this.sidebarPort) {
      try {
        this.sidebarPort.postMessage(data);
        console.log("消息已发送到sidebar:", data);
      } catch (error) {
        console.error("发送消息到sidebar失败:", error);
        this.sidebarPort = null;
      }
    } else {
      console.warn("Sidebar未连接，无法发送消息");
    }
  }
}

// 初始化背景管理器
new BackgroundManager();
