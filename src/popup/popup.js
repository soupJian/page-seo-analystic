document.addEventListener("DOMContentLoaded", function () {
  const analyzePageBtn = document.getElementById("analyzePage");
  const toggleSidebarBtn = document.getElementById("toggleSidebar");

  // 分析页面按钮点击事件
  analyzePageBtn.addEventListener("click", async function () {
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // 先打开侧边栏
      await chrome.sidePanel.open({ tabId: tab.id });

      // 向content script发送消息开始分析
      await chrome.tabs.sendMessage(tab.id, { action: "analyzePage" });

      // 更新按钮状态
      analyzePageBtn.textContent = "分析中...";
      analyzePageBtn.disabled = true;

      setTimeout(() => {
        analyzePageBtn.textContent = "分析当前页面";
        analyzePageBtn.disabled = false;
      }, 2000);

      // 关闭popup
      window.close();
    } catch (error) {
      console.error("分析页面失败:", error);
      analyzePageBtn.textContent = "分析失败";
      setTimeout(() => {
        analyzePageBtn.textContent = "分析当前页面";
        analyzePageBtn.disabled = false;
      }, 2000);
    }
  });

  // 切换侧边栏按钮点击事件
  toggleSidebarBtn.addEventListener("click", async function () {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // 直接打开侧边栏
      await chrome.sidePanel.open({ tabId: tab.id });

      // 关闭popup
      window.close();
    } catch (error) {
      console.error("切换侧边栏失败:", error);
    }
  });
});
