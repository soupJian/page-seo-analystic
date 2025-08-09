import React, { useEffect, useRef, useState } from "react";
import { Rect, Text } from "@antv/g";
import {
  Badge,
  BaseBehavior,
  BaseNode,
  BaseTransform,
  CommonEvent,
  CubicHorizontal,
  ExtensionCategory,
  Graph,
  GraphEvent,
  iconfont,
  idOf,
  NodeEvent,
  positionOf,
  register,
  treeToGraphData,
} from "@antv/g6";
import { HeadingInfo } from "../../../types";

// 添加图标字体样式
const style = document.createElement("style");
style.innerHTML = `@import url('${iconfont.css}');`;
document.head.appendChild(style);

interface HeadingMindMapProps {
  headings: HeadingInfo[];
  width?: number | string;
  height?: number | string;
}

// 根节点样式
const RootNodeStyle: any = {
  fill: "#EFF0F0",
  labelFill: "#262626",
  labelFontSize: 24,
  labelFontWeight: 600,
  labelOffsetY: 8,
  labelPlacement: "center",
  ports: [{ placement: "right" }, { placement: "left" }],
  radius: 8,
};

// 普通节点样式
const NodeStyle: any = {
  fill: "transparent",
  labelPlacement: "center",
  labelFontSize: 16,
  ports: [{ placement: "right-bottom" }, { placement: "left-bottom" }],
};

// 树事件
const TreeEvent = {
  COLLAPSE_EXPAND: "collapse-expand",
  ADD_CHILD: "add-child",
};

// 测量文本宽度
let textShape: any;
const measureText = (text: any) => {
  if (!textShape) textShape = new Text({ style: text });
  textShape.attr(text);
  return textShape.getBBox().width;
};

// 获取节点宽度
const getNodeWidth = (nodeId: string, isRoot: boolean) => {
  const padding = isRoot ? 40 : 30;
  const nodeStyle = isRoot ? RootNodeStyle : NodeStyle;

  // 如果是实际文字（包含冒号），使用实际文字长度
  // 如果是ID（如 root-0），则使用默认宽度
  const textToMeasure = nodeId.includes(":") ? nodeId : nodeId;

  return (
    measureText({
      text: textToMeasure,
      fontSize: nodeStyle.labelFontSize,
      fontFamily: "Gill Sans",
    }) + padding
  );
};

// 获取节点尺寸
const getNodeSize = (nodeId: string, isRoot: boolean) => {
  const width = getNodeWidth(nodeId, isRoot);
  const height = isRoot ? 48 : 32;
  return [width, height];
};

// 自定义思维导图节点
class MindmapNode extends BaseNode {
  static defaultStyleProps = {
    showIcon: false,
  } as any;

  constructor(options: any) {
    Object.assign(options.style, MindmapNode.defaultStyleProps);
    super(options);
  }

  get childrenData() {
    return this.context.model.getChildrenData(this.id);
  }

  get rootId() {
    return idOf(this.context.model.getRootsData()[0]);
  }

  isShowCollapse(attributes: any) {
    const { collapsed, showIcon } = attributes;
    return !collapsed && showIcon && this.childrenData.length > 0;
  }

  getCollapseStyle(attributes: any) {
    const { showIcon, color, direction } = attributes;
    if (!this.isShowCollapse(attributes)) return false;
    const [width, height] = this.getSize(attributes);

    return {
      backgroundFill: color,
      backgroundHeight: 12,
      backgroundWidth: 12,
      cursor: "pointer",
      fill: "#fff",
      fontFamily: "iconfont",
      fontSize: 8,
      text: "\ue6e4",
      textAlign: "center" as const,
      transform: (direction === "left"
        ? [["rotate", 90]]
        : [["rotate", -90]]) as any,
      visibility: showIcon ? "visible" : "hidden",
      x: direction === "left" ? -6 : width + 6,
      y: height,
    };
  }

  drawCollapseShape(attributes: any, container: any) {
    const iconStyle = this.getCollapseStyle(attributes) as any;
    const btn = this.upsert("collapse-expand", Badge, iconStyle, container);

    this.forwardEvent(btn, CommonEvent.CLICK, (event: any) => {
      event.stopPropagation();
      this.context.graph.emit(TreeEvent.COLLAPSE_EXPAND, {
        id: this.id,
        collapsed: !attributes.collapsed,
      });
    });
  }

  getCountStyle(attributes: any) {
    const { collapsed, color, direction } = attributes;
    const count = this.context.model.getDescendantsData(this.id).length;
    if (!collapsed || count === 0) return false;
    const [width, height] = this.getSize(attributes);
    return {
      backgroundFill: color,
      backgroundHeight: 12,
      backgroundWidth: 12,
      cursor: "pointer",
      fill: "#fff",
      fontSize: 8,
      text: count.toString(),
      textAlign: "center" as const,
      x: direction === "left" ? -6 : width + 6,
      y: height,
    };
  }

  drawCountShape(attributes: any, container: any) {
    const countStyle = this.getCountStyle(attributes) as any;
    const btn = this.upsert("count", Badge, countStyle, container);

    this.forwardEvent(btn, CommonEvent.CLICK, (event: any) => {
      event.stopPropagation();
      this.context.graph.emit(TreeEvent.COLLAPSE_EXPAND, {
        id: this.id,
        collapsed: false,
      });
    });
  }

  // 移除添加节点功能，只保留展开/折叠
  getAddStyle(attributes: any) {
    return false; // 不显示添加按钮
  }

  getAddBarStyle(attributes: any) {
    return false; // 不显示添加条
  }

  drawAddShape(attributes: any, container: any) {
    // 不绘制添加形状
  }

  forwardEvent(target: any, type: any, listener: any) {
    if (target && !Reflect.has(target, "__bind__")) {
      Reflect.set(target, "__bind__", true);
      target.addEventListener(type as any, listener as any);
    }
  }

  getKeyStyle(attributes: any) {
    const [width, height] = this.getSize(attributes);
    const keyShape = super.getKeyStyle(attributes);
    return { width, height, ...keyShape };
  }

  drawKeyShape(attributes: any, container: any) {
    const keyStyle = this.getKeyStyle(attributes);
    return this.upsert("key", Rect, keyStyle, container);
  }

  render(attributes: any = this.parsedAttributes, container: any = this) {
    super.render(attributes, container);

    this.drawCollapseShape(attributes, container);
    this.drawAddShape(attributes, container);
    this.drawCountShape(attributes, container);
  }
}

// 自定义思维导图边
class MindmapEdge extends CubicHorizontal {
  get rootId() {
    return idOf(this.context.model.getRootsData()[0]);
  }

  getKeyPath(attributes: any) {
    // 使用 G6 默认的 CubicHorizontal 曲线，并在末端追加与目标节点标签宽度一致的水平线
    const path = (super.getKeyPath(attributes) as any) ?? [];
    const isRoot = this.targetNode.id === this.rootId;
    const nodes = this.context.model.getNodeData();
    const targetData = nodes.find((n: any) => n.id === this.targetNode.id);
    const labelText = (targetData?.label as string) ?? this.targetNode.id;
    const labelWidth = getNodeWidth(labelText, isRoot);
    const [, tp] = this.getEndpoints(attributes);
    const sign =
      this.sourceNode.getCenter()[0] < this.targetNode.getCenter()[0] ? 1 : -1;
    return [...path, ["L", tp[0] + labelWidth * sign, tp[1]]] as any;
  }
}

// 收缩展开行为
class CollapseExpandTree extends BaseBehavior {
  constructor(context: any, options: any) {
    super(context, options);
    this.bindEvents();
  }

  update(options: any) {
    this.unbindEvents();
    super.update(options);
    this.bindEvents();
  }

  bindEvents() {
    const { graph } = this.context;

    graph.on(NodeEvent.POINTER_ENTER, this.showIcon);
    graph.on(NodeEvent.POINTER_LEAVE, this.hideIcon);
    graph.on(TreeEvent.COLLAPSE_EXPAND, this.onCollapseExpand);
    // 移除添加子节点事件监听
  }

  unbindEvents() {
    const { graph } = this.context;

    graph.off(NodeEvent.POINTER_ENTER, this.showIcon);
    graph.off(NodeEvent.POINTER_LEAVE, this.hideIcon);
    graph.off(TreeEvent.COLLAPSE_EXPAND, this.onCollapseExpand);
    // 移除添加子节点事件监听
  }

  status = "idle";

  showIcon = (event: any) => {
    this.setIcon(event, true);
  };

  hideIcon = (event: any) => {
    this.setIcon(event, false);
  };

  setIcon = (event: any, show: boolean) => {
    if (this.status !== "idle") return;
    const { target } = event;
    const id = target.id;
    const { graph, element } = this.context as any;
    graph.updateNodeData([{ id, style: { showIcon: show } }]);
    if (element) {
      element.draw({ animation: false, silence: true });
    }
  };

  onCollapseExpand = async (event: any) => {
    this.status = "busy";
    const { id, collapsed } = event;
    const { graph } = this.context;
    await graph.frontElement(id);
    if (collapsed) await graph.collapseElement(id);
    else await graph.expandElement(id);
    this.status = "idle";
  };

  // 移除添加子节点功能
  // addChild 方法已删除
}

// 按分支分配颜色
class AssignColorByBranch extends BaseTransform {
  static defaultOptions = {
    colors: [
      "#1783FF",
      "#F08F56",
      "#D580FF",
      "#00C9C9",
      "#7863FF",
      "#DB9D0D",
      "#60C42D",
      "#FF80CA",
      "#2491B3",
      "#17C76F",
    ],
  };

  constructor(context: any, options: any) {
    super(
      context,
      Object.assign({}, AssignColorByBranch.defaultOptions, options)
    );
  }

  beforeDraw(input: any) {
    const nodes = this.context.model.getNodeData();

    if (nodes.length === 0) return input;

    let colorIndex = 0;
    const dfs = (nodeId: any, color: any) => {
      const node = nodes.find(datum => datum.id == nodeId);
      if (!node) return;

      node.style ||= {};
      node.style.color =
        color || this.options.colors[colorIndex++ % this.options.colors.length];
      node.children?.forEach((childId: any) =>
        dfs(childId, (node.style as any)?.color)
      );
    };

    nodes
      .filter((node: any) => node.depth === 1)
      .forEach((rootNode: any) => dfs(rootNode.id, undefined));

    return input;
  }
}

// 注册自定义组件
register(ExtensionCategory.NODE, "mindmap", MindmapNode);
register(ExtensionCategory.EDGE, "mindmap", MindmapEdge);
register(
  ExtensionCategory.BEHAVIOR,
  "collapse-expand-tree",
  CollapseExpandTree
);
register(
  ExtensionCategory.TRANSFORM,
  "assign-color-by-branch",
  AssignColorByBranch
);

// 获取节点方向
const getNodeSide = (nodeData: any, parentData: any) => {
  if (!parentData) return "center";

  const nodePositionX = positionOf(nodeData)[0];
  const parentPositionX = positionOf(parentData)[0];
  return parentPositionX > nodePositionX ? "left" : "right";
};

const HeadingMindMap: React.FC<HeadingMindMapProps> = ({
  headings,
  width = "100%",
  height = "100%",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 简单防抖实现
  const debounce = <T extends (...args: any[]) => void>(fn: T, delay = 150) => {
    let timer: number | undefined;
    return (...args: Parameters<T>) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  };

  const updateGraphViewport = () => {
    if (!graphRef.current || !containerRef.current) return;
    const newWidth = containerRef.current.clientWidth;
    const newHeight = containerRef.current.clientHeight;
    try {
      if (graphRef.current.resize) {
        graphRef.current.resize(newWidth, newHeight);
      } else if (graphRef.current.changeSize) {
        graphRef.current.changeSize(newWidth, newHeight);
      }
      // 重新布局，避免重叠
      try {
        graphRef.current.layout?.();
      } catch {}
      // 归一缩放到 1，再自适应
      try {
        graphRef.current.zoomTo?.(1, {
          x: newWidth / 2,
          y: newHeight / 2,
        } as any);
      } catch {}
      graphRef.current.fitView?.();
    } catch (error) {
      console.error("更新图形尺寸失败:", error);
    }
  };

  const debouncedUpdateRef = useRef<(() => void) | null>(null);
  if (!debouncedUpdateRef.current) {
    debouncedUpdateRef.current = debounce(updateGraphViewport, 180);
  }

  useEffect(() => {
    if (!containerRef.current || headings.length === 0) return;

    console.log("HeadingMindMap: 开始渲染脑图", {
      headingsCount: headings.length,
    });

    // 清理之前的图形（加保护，避免内部插件未实例化时报错）
    if (graphRef.current) {
      try {
        graphRef.current.destroy?.();
      } catch (e) {
        console.warn("HeadingMindMap: 销毁旧图形时发生错误，已忽略", e);
      }
    }

    // 构建思维导图数据 - 按照层级结构构建，支持展开/收缩
    const buildMindMapData = (headings: HeadingInfo[]) => {
      if (headings.length === 0) return null;

      // 找到所有 H1 标题作为根节点
      const h1Headings = headings.filter(h => h.level === 1);

      if (h1Headings.length === 0) {
        // 如果没有 H1，使用第一个标题作为根节点
        const rootHeading = headings[0];
        return {
          id: "root",
          label: `${rootHeading.tag}: ${rootHeading.text}`,
          collapsed: false, // 根节点默认展开
          children: buildChildrenForParent(rootHeading, headings, 1),
        };
      }

      // 如果有多个 H1，创建多个根节点
      if (h1Headings.length > 1) {
        return {
          id: "virtual-root",
          label: "页面结构",
          collapsed: false, // 虚拟根节点默认展开
          children: h1Headings.map((h1, index) => ({
            id: `root-${index}`,
            label: `${h1.tag}: ${h1.text}`,
            collapsed: false, // H1 默认展开
            children: buildChildrenForParent(h1, headings, index + 1),
          })),
        };
      }

      // 单个 H1 的情况
      const rootHeading = h1Headings[0];
      return {
        id: "root",
        label: `${rootHeading.tag}: ${rootHeading.text}`,
        collapsed: false, // H1 默认展开
        children: buildChildrenForParent(rootHeading, headings, 1),
      };
    };

    // 为指定父节点构建子节点
    const buildChildrenForParent = (
      parentHeading: HeadingInfo,
      allHeadings: HeadingInfo[],
      parentIndex: number
    ) => {
      const children: any[] = [];
      const parentLevel = parentHeading.level;

      // 找到当前标题在数组中的位置
      const parentIndexInArray = allHeadings.findIndex(
        h => h === parentHeading
      );

      // 查找直接子节点（下一级标题）
      for (let i = parentIndexInArray + 1; i < allHeadings.length; i++) {
        const heading = allHeadings[i];

        // 如果遇到同级或更高级的标题，停止查找
        if (heading.level <= parentLevel) {
          break;
        }

        // 如果是直接子节点（只比父节点高一级）
        if (heading.level === parentLevel + 1) {
          const childNode = {
            id: `heading-${parentIndex}-${i}`,
            label: `${heading.tag}: ${heading.text}`,
            level: heading.level,
            collapsed: heading.level >= 3, // H3 及以上默认收缩
            children: buildChildrenForParent(heading, allHeadings, i),
          };
          children.push(childNode);
        }
      }

      return children;
    };

    const data = buildMindMapData(headings);

    if (!data) {
      console.log("HeadingMindMap: 没有数据可渲染");
      return;
    }

    console.log("HeadingMindMap: 构建的数据", data);

    const rootId = data.id;

    // 配置图形 - 使用自定义组件
    console.log("HeadingMindMap: 开始创建图形");
    const graph = new Graph({
      container: containerRef.current,
      width: containerRef.current?.clientWidth,
      height: containerRef.current?.clientHeight,
      // 统一启用 scroller，避免在销毁时因插件未创建导致的 destroy 报错
      scroller: true,
      data: treeToGraphData(data),
      node: {
        type: "mindmap",
        style: function (this: any, d: any) {
          const id = idOf(d);
          const direction = getNodeSide(d, this.getParentData(id, "tree"));
          const isRoot = idOf(d) === rootId;

          // 获取实际显示的文字，限制长度为50个字符
          const displayText: string =
            (d.label as string) || (idOf(d) as string);
          const truncatedText =
            displayText.length > 50
              ? displayText.substring(0, 50) + "..."
              : displayText;

          return {
            direction,
            labelText: truncatedText,
            size: getNodeSize(truncatedText, isRoot) as any,
            labelFontFamily: "Gill Sans",
            // 通过设置节点标签背景来扩大交互区域
            labelBackground: true,
            labelBackgroundFill: "transparent",
            labelPadding:
              direction === "left" ? [2, 0, 10, 40] : [2, 40, 10, 0],
            ...(isRoot ? RootNodeStyle : NodeStyle),
          };
        },
      },
      edge: {
        type: "mindmap",
        style: {
          lineWidth: 3,
          stroke: function (this: any, data: any) {
            return this.getNodeData(data.target)?.style?.color || "#99ADD1";
          },
        },
      },
      layout: {
        type: "mindmap",
        direction: "H",
        getHeight: () => 30,
        // 使用节点 ID（示例即使用 idOf）计算尺寸，得到更统一的宽度
        getWidth: (node: any) => getNodeWidth(node.id, node.id === rootId),
        // 间距严格对齐示例
        getVGap: () => 6,
        getHGap: () => 60,
        animation: false,
      },
      // 行为统一保持，缩放通过按钮控制；滚轮在非全屏时通过外层 wrapper 阻止默认即可
      behaviors: ["drag-canvas", "collapse-expand-tree"],
      transforms: ["assign-color-by-branch"],
      animation: false,
    } as any);

    console.log("HeadingMindMap: 图形创建完成");

    try {
      graph.once(GraphEvent.AFTER_RENDER, () => {
        graph.fitView();
      });

      graph.render();
      console.log("HeadingMindMap: 脑图渲染成功");
    } catch (error) {
      console.error("HeadingMindMap: 脑图渲染失败", error);
    }

    graphRef.current = graph;

    // 清理函数
    return () => {
      if (graphRef.current) {
        try {
          graphRef.current.destroy?.();
        } catch (e) {
          console.warn("HeadingMindMap: 卸载时销毁图形发生错误，已忽略", e);
        }
      }
    };
  }, [headings, width, height]);

  // 监听全屏状态变化，重新设置 canvas 尺寸
  useEffect(() => {
    if (graphRef.current && containerRef.current) {
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;

      // 更新图形尺寸 - 使用正确的 API
      try {
        if (graphRef.current.resize) {
          graphRef.current.resize(newWidth, newHeight);
        } else if (graphRef.current.changeSize) {
          graphRef.current.changeSize(newWidth, newHeight);
        } else {
          console.log("无法更新图形尺寸，只重新居中");
        }

        // 重新居中
        setTimeout(() => {
          if (graphRef.current && graphRef.current.fitView) {
            graphRef.current.fitView();
          }
        }, 100);
      } catch (error) {
        console.error("全屏时更新图形尺寸失败:", error);
      }
    }
  }, [isFullscreen]);

  // 控制按钮事件处理
  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.getZoom();
      const newZoom = Math.min(currentZoom * 1.2, 3); // 最大放大3倍
      graphRef.current.zoomTo(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.getZoom();
      const newZoom = Math.max(currentZoom * 0.8, 0.1); // 最小缩小到0.1倍
      graphRef.current.zoomTo(newZoom);
    }
  };

  const handleReset = () => {
    if (graphRef.current) {
      try {
        // 重置视图时重新布局，避免在尺寸切换后出现的重叠
        if (graphRef.current.layout) {
          graphRef.current.layout();
        }
        graphRef.current.fitView?.();
      } catch {}
    }
  };

  const handleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);

    // 通知侧边栏调整宽度
    try {
      const evt = new CustomEvent("pa:mindmap-fullscreen", {
        detail: { fullscreen: next },
      });
      window.dispatchEvent(evt);
    } catch {}

    // 统一交给防抖的 viewport 更新逻辑
    setTimeout(() => debouncedUpdateRef.current?.(), 50);
  };

  if (headings.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center border border-dashed border-gray-300 rounded text-gray-500">
        暂无标题数据
      </div>
    );
  }

  // 包裹容器，用于控制非全屏时禁用滚轮缩放
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleWheel = (e: WheelEvent) => {
      // 统一拦截，自己管理缩放
      e.preventDefault();
      if (!graphRef.current || !isFullscreen) return;

      try {
        const currentZoom = graphRef.current.getZoom?.() ?? 1;
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.1, Math.min(3, currentZoom * factor));

        const rect = (
          containerRef.current as HTMLDivElement
        ).getBoundingClientRect();
        const point = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        } as any;
        if (graphRef.current.zoomTo) {
          graphRef.current.zoomTo(newZoom, point);
        } else if (graphRef.current.zoom) {
          const delta = newZoom / currentZoom;
          graphRef.current.zoom(delta, point);
        }
      } catch (err) {
        console.warn("滚轮缩放失败", err);
      }
    };

    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      wrapper.removeEventListener("wheel", handleWheel as EventListener);
    };
  }, [isFullscreen]);

  // 监听容器尺寸变化，自动调整画布尺寸（防抖）
  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;
    const observer = new ResizeObserver(() => {
      debouncedUpdateRef.current?.();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`${
        isFullscreen
          ? "w-screen h-screen fixed top-0 left-0 z-50 bg-white"
          : "w-full h-[300px] relative border border-gray-200 rounded overflow-hidden overscroll-contain"
      }`}
    >
      {/* 控制按钮 */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="px-3 py-1 border border-gray-300 rounded bg-white cursor-pointer text-xs hover:bg-gray-50"
          title="放大"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="px-3 py-1 border border-gray-300 rounded bg-white cursor-pointer text-xs hover:bg-gray-50"
          title="缩小"
        >
          -
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1 border border-gray-300 rounded bg-white cursor-pointer text-xs hover:bg-gray-50"
          title="重置"
        >
          ⟲
        </button>
        <button
          onClick={handleFullscreen}
          className="px-3 py-1 border border-gray-300 rounded bg-white cursor-pointer text-xs hover:bg-gray-50"
          title={isFullscreen ? "退出全屏" : "全屏"}
        >
          {isFullscreen ? "⤓" : "⤢"}
        </button>
      </div>

      {/* 画布容器 */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default HeadingMindMap;
