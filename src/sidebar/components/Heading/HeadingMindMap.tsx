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

// 按深度分配颜色（根节点灰，其余不同层级不同色）
class AssignColorByDepth extends BaseTransform {
  static defaultOptions = {
    colorsByLevel: [
      "#BFBFBF", // 虚拟根节点
      "#1783FF", // H1 标题
      "#F08F56", // H2 标题
      "#60C42D", // H3 标题
      "#7863FF", // H4 标题
      "#DB9D0D", // H5 标题
      "#00C9C9", // H6 标题
    ],
  } as any;

  constructor(context: any, options: any) {
    super(
      context,
      Object.assign({}, AssignColorByDepth.defaultOptions, options)
    );
  }

  beforeDraw(input: any) {
    const nodes = this.context.model.getNodeData();
    console.log("AssignColorByDepth: 开始分配颜色", {
      nodesCount: nodes.length,
    });

    nodes.forEach((node: any) => {
      // 使用节点的 level 属性来分配颜色，而不是 depth
      const level = node.level || 0;
      node.style ||= {};

      // 如果是虚拟根节点，使用灰色
      if (node.id === "virtual-root") {
        node.style.color = this.options.colorsByLevel[0];
        console.log(`AssignColorByDepth: 根节点 ${node.id} 分配颜色`, {
          color: this.options.colorsByLevel[0],
          label: node.label,
        });
      } else {
        // 根据标题级别分配颜色（H1=1, H2=2, H3=3, H4=4, H5=5, H6=6）
        const colorIndex = Math.min(
          level,
          this.options.colorsByLevel.length - 1
        );
        node.style.color = this.options.colorsByLevel[colorIndex];
        console.log(`AssignColorByDepth: 标题节点 ${node.id} 分配颜色`, {
          level: level,
          tag: node.label?.split(":")[0],
          color: this.options.colorsByLevel[colorIndex],
          label: node.label,
        });
      }
    });

    console.log("AssignColorByDepth: 颜色分配完成");
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
register(
  ExtensionCategory.TRANSFORM,
  "assign-color-by-depth",
  AssignColorByDepth
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
      // 根据内容边界与容器自动缩放
      try {
        const bbox = (graphRef.current as any)?.canvas?.getBBox?.();
        if (bbox) {
          const padding = 20;
          const sx = (newWidth - padding * 2) / (bbox.width || newWidth);
          const sy = (newHeight - padding * 2) / (bbox.height || newHeight);
          const scale = Math.min(sx, sy, 1.0);
          graphRef.current.zoomTo?.(scale, {
            x: newWidth / 2,
            y: newHeight / 2,
          } as any);
        }
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

      console.log("HeadingMindMap: 开始构建标题树", { headings });

      // 测试用例：验证算法是否正确处理多个 H3 标题
      const testCase =
        headings.some(h => h.level === 3) &&
        headings.filter(h => h.level === 3).length > 1;
      if (testCase) {
        console.log("HeadingMindMap: 检测到多个 H3 标题，验证算法", {
          h3Count: headings.filter(h => h.level === 3).length,
          h3Titles: headings.filter(h => h.level === 3).map(h => h.text),
        });
      }

      // 使用栈来维护当前标题层级路径
      const stack: any[] = [];
      const root = {
        id: "virtual-root",
        label: "页面结构",
        collapsed: false,
        children: [],
      };

      stack.push({ node: root, level: 0 });

      headings.forEach((heading, index) => {
        const currentNode = {
          id: `heading-${index}`,
          label: `${heading.tag}: ${heading.text}`,
          level: heading.level,
          collapsed: heading.level >= 4, // H4 及以上默认收缩
          children: [],
        };

        // 找到合适的父节点
        while (
          stack.length > 1 &&
          stack[stack.length - 1].level >= heading.level
        ) {
          stack.pop();
        }

        // 将当前节点添加到父节点
        const parent = stack[stack.length - 1];
        parent.node.children.push(currentNode);

        // 将当前节点推入栈中
        stack.push({ node: currentNode, level: heading.level });

        console.log(
          `HeadingMindMap: 处理标题 ${heading.tag} (${heading.level})`,
          {
            text: heading.text,
            parentLevel: parent.level,
            stackDepth: stack.length,
            parentLabel: parent.node.label,
          }
        );
      });

      console.log("HeadingMindMap: 构建完成的标题树", root);

      // 验证结果：检查是否所有 H3 标题都在同一层级
      if (testCase) {
        const h3Nodes = root.children.filter((child: any) =>
          child.label.startsWith("h3:")
        );
        console.log("HeadingMindMap: 验证结果 - H3 节点", {
          h3NodesCount: h3Nodes.length,
          h3Nodes: h3Nodes.map((n: any) => n.label),
        });
      }

      return root;
    };

    // 移除旧的 buildChildrenForParent 函数，因为新的算法不需要它

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
      // 根据全屏状态动态启用 scroller，非全屏时禁用以保持外层滚动
      scroller: isFullscreen,
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
          const maxRoot = 24;
          const maxNode = 28;
          const truncatedText = isRoot
            ? displayText.length > maxRoot
              ? displayText.substring(0, maxRoot) + "..."
              : displayText
            : displayText.length > maxNode
            ? displayText.substring(0, maxNode) + "..."
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
            // 使用目标节点的 style.color，按深度分配
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
        // 保持舒展的弧线间距；通过缩放适配容器，而不是压缩间距
        getVGap: () => 24,
        getHGap: () => 180,
        animation: false,
      },
      // 行为统一保持，缩放通过按钮控制；滚轮在非全屏时通过外层 wrapper 阻止默认即可
      behaviors: ["drag-canvas", "collapse-expand-tree"],
      transforms: ["assign-color-by-depth"],
      animation: false,
    } as any);

    console.log("HeadingMindMap: 图形创建完成");

    try {
      graph.once(GraphEvent.AFTER_RENDER, () => {
        // 渲染后自适应：根据内容边界与容器大小自动缩放与居中
        try {
          const bbox = (graph as any)?.canvas?.getBBox?.();
          const cw = containerRef.current?.clientWidth || 1;
          const ch = containerRef.current?.clientHeight || 1;
          if (bbox && cw > 0 && ch > 0) {
            const padding = 20; // 给四周留白
            const sx = (cw - padding * 2) / (bbox.width || cw);
            const sy = (ch - padding * 2) / (bbox.height || ch);
            const scale = Math.min(sx, sy, 1.0); // 不超过 1，避免默认放大导致锯齿
            // 将视图缩放并对齐到左中（根节点通常在中心，示例布局会自然居中）
            if (graph.zoomTo) {
              graph.zoomTo(scale, { x: cw / 2, y: ch / 2 } as any);
            }
          }
        } catch {}
        graph.fitView?.();
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
  }, [headings, width, height, isFullscreen]);

  // 监听全屏状态变化，重新设置 canvas 尺寸和 scroller 配置
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

        // 更新 scroller 配置
        if (graphRef.current.updateOptions) {
          graphRef.current.updateOptions({ scroller: isFullscreen });
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
        // 重新布局并根据容器自适应缩放到初始居中
        graphRef.current.layout?.();
        const el = containerRef.current as HTMLDivElement;
        if (el) {
          const w = el.clientWidth;
          const h = el.clientHeight;
          const bbox = (graphRef.current as any)?.canvas?.getBBox?.();
          if (bbox) {
            const padding = 20;
            const sx = (w - padding * 2) / (bbox.width || w);
            const sy = (h - padding * 2) / (bbox.height || h);
            const scale = Math.min(sx, sy, 1.0);
            graphRef.current.zoomTo?.(scale, { x: w / 2, y: h / 2 } as any);
          }
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
      // 在非全屏状态下，不阻止默认滚动，让滚轮事件传播到外层
      if (!isFullscreen) return;

      // 全屏状态下，阻止默认滚动并自己管理缩放
      e.preventDefault();
      if (!graphRef.current) return;

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
