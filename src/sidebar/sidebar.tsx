import React from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import SidebarApp from "./SidebarApp";
import "../styles/main.css";

class SidebarManager {
  private container: HTMLElement | null = null;
  private root: any = null;

  constructor() {
    this.init();
  }

  private init() {
    // Use existing container from HTML
    this.container = document.getElementById("sidebar-root");

    if (!this.container) {
      console.error("sidebar-root container not found");
      return;
    }

    // Create React root
    this.root = createRoot(this.container);

    // Render React app
    this.renderApp();
  }

  private renderApp() {
    this.root.render(
      <ConfigProvider locale={zhCN}>
        <SidebarApp onReanalyze={this.handleReanalyze.bind(this)} />
      </ConfigProvider>
    );
  }

  private handleReanalyze() {
    console.log("handleReanalyze");
    // Send message to background script to reanalyze
    chrome.runtime.sendMessage({ action: "REANALYZE" });
  }

  public destroy() {
    if (this.root) {
      this.root.unmount();
    }
  }
}

// Initialize sidebar when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new SidebarManager();
  });
} else {
  new SidebarManager();
}
