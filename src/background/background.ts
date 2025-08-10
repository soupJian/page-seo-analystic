// 背景脚本 - 管理扩展生命周期和消息传递

// 导入统一类型定义
import {
  PageData,
  BackgroundMessage,
  SidebarMessage
} from '../types';

class BackgroundManager {
  private pageDataCache: Map<number, PageData> = new Map();
  private sidebarPorts: Map<number, chrome.runtime.Port> = new Map();

  constructor() {
    this.init();
  }

  private init(): void {
    // 监听扩展图标点击事件
    chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
      if (tab.id && tab.url) {
        try {
          // 打开侧边栏
          await chrome.sidePanel.open({ tabId: tab.id });

          // 注入内容脚本
          await this.injectContentScript(tab.id);

        } catch (error) {
          // 静默处理错误
        }
      }
    });

    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((
      request: BackgroundMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: any) => void
    ) => {
      console.log("onMessage", request);
      const tabId = sender.tab?.id;

      // 对于REANALYZE消息，不需要检查tabId，因为它是从sidebar发送的
      if (request.action === "REANALYZE") {
        console.log("REANALYZE received");

        // 获取当前活动标签页的ID
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            const activeTabId = tabs[0].id;
            console.log("Active tab ID:", activeTabId);

            // 清除旧数据
            this.pageDataCache.delete(activeTabId);

            // 通知sidebar开始重新分析
            this.sendToSidebar(activeTabId, {
              type: "URL_CHANGED",
              message: "正在重新分析页面..."
            });

            // 请求content script重新分析页面
            chrome.tabs.sendMessage(activeTabId, { action: "analyzePage" }, () => {
              if (chrome.runtime.lastError) {
                this.sendToSidebar(activeTabId, {
                  type: "ANALYSIS_ERROR",
                  error: "无法连接到页面内容脚本，请刷新页面并重新打开插件"
                });
              }
            });
          } else {
            console.log("No active tab found");
          }
        });

        sendResponse({ success: true });
        return true;
      }

      // 对于其他消息，需要检查tabId
      if (!tabId) return false;

      if (request.action === "setPageData") {
        // 存储页面数据
        this.pageDataCache.set(tabId, request.data!);

        // 转发到对应的sidebar
        this.sendToSidebar(tabId, {
          type: "PAGE_DATA",
          data: request.data
        });

        sendResponse({ success: true });
        return true;

      } else if (request.action === "getPageData") {
        // 获取页面数据
        const data = this.pageDataCache.get(tabId);
        sendResponse({ data: data || null });
        return true;

      } else if (request.action === "analyzeUrl") {
        // 分析URL变化
        // 清除旧数据
        this.pageDataCache.delete(tabId);

        // 通知sidebar URL变化
        this.sendToSidebar(tabId, {
          type: "URL_CHANGED",
          message: request.url
        });

        // 触发内容脚本重新分析（处理SPA路由变更不触发onUpdated的情况）
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { action: "analyzePage" }, () => {
            if (chrome.runtime.lastError) {
              this.sendToSidebar(tabId, {
                type: "ANALYSIS_ERROR",
                error: "无法连接到页面内容脚本，请刷新页面并重新打开插件"
              });
            }
          });
        }, 800);

        sendResponse({ success: true });
        return true;
      }

      return false;
    });

    // 监听来自sidebar的连接
    chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
      if (port.name === "sidebar") {
        // 获取当前活动标签页
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            const tabId = tabs[0].id;
            this.sidebarPorts.set(tabId, port);

            // 监听端口断开
            port.onDisconnect.addListener(() => {
              this.sidebarPorts.delete(tabId);
            });

            // 监听来自sidebar的消息
            port.onMessage.addListener((message: SidebarMessage) => {
              if (message.type === 'SIDEBAR_CONNECTED') {
                // 如果有缓存数据，立即发送
                const cachedData = this.pageDataCache.get(tabId);
                if (cachedData) {
                  this.sendToSidebar(tabId, {
                    type: "PAGE_DATA",
                    data: cachedData
                  });
                } else {
                  // 如果没有缓存数据，请求content script分析页面
                  chrome.tabs.sendMessage(tabId, { action: "analyzePage" }, () => {
                    if (chrome.runtime.lastError) {
                      this.sendToSidebar(tabId, {
                        type: "ANALYSIS_ERROR",
                        error: "无法连接到页面内容脚本，请刷新页面并重新打开插件"
                      });
                    }
                  });
                }
              }
            });

            // 如果有缓存数据，立即发送
            const cachedData = this.pageDataCache.get(tabId);
            if (cachedData) {
              this.sendToSidebar(tabId, {
                type: "PAGE_DATA",
                data: cachedData
              });
            } else {
              // 如果没有缓存数据，请求content script分析页面
              chrome.tabs.sendMessage(tabId, { action: "analyzePage" }, () => {
                if (chrome.runtime.lastError) {
                  this.sendToSidebar(tabId, {
                    type: "ANALYSIS_ERROR",
                    error: "无法连接到页面内容脚本，请刷新页面并重新打开插件"
                  });
                }
              });
            }
          }
        });
      }
    });

    // 监听标签页更新事件
    chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (changeInfo.status === 'complete') {
        // 页面加载完成，清除旧数据
        this.pageDataCache.delete(tabId);

        // 如果这个标签页有sidebar连接，通知URL变化
        if (this.sidebarPorts.has(tabId)) {
          this.sendToSidebar(tabId, {
            type: "URL_CHANGED",
            message: "页面已更新，正在重新分析..."
          });

          // 延迟分析页面，确保内容加载完成
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: "analyzePage" }, () => {
              if (chrome.runtime.lastError) {
                this.sendToSidebar(tabId, {
                  type: "ANALYSIS_ERROR",
                  error: "无法连接到页面内容脚本，请刷新页面并重新打开插件"
                });
              }
            });
          }, 1000);
        }
      }
    });

    // 监听标签页激活事件（切换标签页）
    chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.TabActiveInfo) => {
      const tabId = activeInfo.tabId;

      // 检查是否有sidebar连接到这个标签页
      if (this.sidebarPorts.has(tabId)) {
        // 检查是否有缓存数据
        const cachedData = this.pageDataCache.get(tabId);
        if (cachedData) {
          this.sendToSidebar(tabId, {
            type: "PAGE_DATA",
            data: cachedData
          });
        } else {
          // 请求content script分析页面
          chrome.tabs.sendMessage(tabId, { action: "analyzePage" }, () => {
            if (chrome.runtime.lastError) {
              this.sendToSidebar(tabId, {
                type: "ANALYSIS_ERROR",
                error: "无法连接到页面内容脚本，请刷新页面并重新打开插件"
              });
            }
          });
        }
      } else {
        // 尝试为当前激活的标签页建立sidebar连接
        // 这通常发生在用户切换标签页后，sidebar需要重新连接到新标签页
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id === tabId) {
            // 检查是否有缓存的sidebar端口
            const existingPort = Array.from(this.sidebarPorts.values())[0];
            if (existingPort) {
              this.sidebarPorts.set(tabId, existingPort);

              // 检查是否有缓存数据
              const cachedData = this.pageDataCache.get(tabId);
              if (cachedData) {
                this.sendToSidebar(tabId, {
                  type: "PAGE_DATA",
                  data: cachedData
                });
              } else {
                chrome.tabs.sendMessage(tabId, { action: "analyzePage" }, () => {
                  if (chrome.runtime.lastError) {
                    this.sendToSidebar(tabId, {
                      type: "ANALYSIS_ERROR",
                      error: "无法连接到页面内容脚本，请刷新页面并重新打开插件"
                    });
                  }
                });
              }
            }
          }
        });
      }
    });

    // 监听标签页关闭事件
    chrome.tabs.onRemoved.addListener((tabId: number) => {
      this.pageDataCache.delete(tabId);
      this.sidebarPorts.delete(tabId);
    });
  }

  private sendToSidebar(tabId: number, message: SidebarMessage): void {
    const port = this.sidebarPorts.get(tabId);
    if (port) {
      try {
        port.postMessage(message);
      } catch (error) {
        this.sidebarPorts.delete(tabId);
      }
    }
  }

  private async injectContentScript(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
    } catch (error) {
      // 静默处理错误
    }
  }
}

// 初始化背景管理器 - 使用IIFE避免全局变量冲突
(function () {
  'use strict';
  new BackgroundManager();
})(); 