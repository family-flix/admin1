/**
 * @file 一个可下拉刷新的滚动容器
 * 必须给固定的高度？
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

type PullToRefreshStep = "pending" | "pulling" | "refreshing" | "releasing";
enum Events {
  ReachBottom,
  Scroll,
  PullToRefresh,
  Refreshing,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.ReachBottom]: void;
  [Events.Scroll]: { scrollTop: number };
  [Events.PullToRefresh]: void;
  [Events.StateChange]: ScrollViewState;
  [Events.Refreshing]: void;
};
type ScrollViewProps = {
  pullToRefresh?: boolean;
  onScroll?: (pos: { scrollTop: number }) => void;
  onReachBottom?: () => void;
};
type ScrollViewState = {
  top: number;
  /** 当前滚动距离顶部的距离 */
  scrollTop: number;
  /** 是否支持下拉刷新 */
  pullToRefresh: boolean;
  /** 下拉刷新的阶段 */
  step: PullToRefreshStep;
};

export class ScrollViewCore extends BaseDomain<TheTypesOfEvents> {
  /** 尺寸信息 */
  rect: Partial<{
    /** 宽度 */
    width: number;
    /** 高度 */
    height: number;
    /** 在 y 轴方向滚动的距离 */
    scrollTop: number;
    /** 内容高度 */
    contentHeight: number;
  }> = {
    width: 0,
    height: 0,
    scrollTop: 0,
    contentHeight: 0,
  };
  canPullToRefresh = false;
  canReachBottom = false;
  /** 下拉刷新相关的状态信息 */
  pullToRefresh: {
    state: PullToRefreshStep;
    /** 开始拖动的起点 y */
    pullStartY: number;
    /** 拖动过程中的 y */
    pullMoveY: number;
    /** 拖动过程 y 方向上移动的距离 */
    dist: number;
    /** 实际移动的距离？ */
    distResisted: number;
  } = {
    state: "pending",
    pullStartY: 0,
    pullMoveY: 0,
    dist: 0,
    distResisted: 0,
  };

  state: ScrollViewState = {
    top: 0,
    step: "pending",
    scrollTop: 0,
    pullToRefresh: false,
  };

  constructor(options: Partial<{ _name: string }> & ScrollViewProps = {}) {
    super(options);

    const { pullToRefresh = false, onScroll, onReachBottom } = options;
    this.state.pullToRefresh = pullToRefresh;
    if (onScroll) {
      this.onScroll(onScroll);
    }
    if (onReachBottom) {
      this.onReachBottom(onReachBottom);
    }
  }

  setRect(rect: Partial<{ width: number; height: number; contentHeight: number }>) {
    this.rect = {
      ...this.rect,
      ...rect,
    };
  }
  startPull(pos: { x: number; y: number }) {
    const { x, y } = pos;
    const { state } = this.pullToRefresh;
    if (this.canPullToRefresh === false) {
      return;
    }
    // 手指在边缘时可能是滑动切换页面
    if (x < 30) {
      return;
    }
    if (state !== "pending") {
      return;
    }
    if (this.rect.scrollTop) {
      return;
    }
    this.pullToRefresh.pullStartY = y;
  }
  pulling(
    pos: { x: number; y: number },
    lifetimes: Partial<{
      onCanPull: () => void;
    }> = {}
  ) {
    if (this.canPullToRefresh === false) {
      return;
    }
    const { onCanPull } = lifetimes;
    const { x: curX, y: curY } = pos;
    const { pullStartY } = this.pullToRefresh;
    if (this.pullToRefresh.state === "refreshing") {
      return;
    }
    this.pullToRefresh.pullMoveY = curY;
    if (this.pullToRefresh.state === "pending") {
      this.pullToRefresh.state = "pulling";
    }
    if (pullStartY && curY) {
      this.pullToRefresh.dist = curY - pullStartY;
    }
    if (this.pullToRefresh.dist <= 0) {
      return;
    }
    //     if (onCanPull) {
    //       onCanPull();
    //     }
    const distThreshold = 60;
    const distMax = 80;
    const distResisted =
      resistanceFunction(this.pullToRefresh.dist / distThreshold) * Math.min(distMax, this.pullToRefresh.dist);
    this.pullToRefresh.distResisted = distResisted;
    if (this.pullToRefresh.state === "pulling" && distResisted > distThreshold) {
      this.pullToRefresh.state = "releasing";
    }
    if (this.pullToRefresh.state === "releasing" && distResisted <= distThreshold) {
      this.pullToRefresh.state = "pulling";
    }
    this.state.top = distResisted;
    this.state.step = this.pullToRefresh.state;
    this.emit(Events.StateChange, { ...this.state });
    //     this.emitValuesChange();
  }
  async endPulling() {
    if (this.canPullToRefresh === false) {
      return;
    }
    if (["refreshing"].includes(this.pullToRefresh.state)) {
      return;
    }
    if (["pending", "pulling"].includes(this.pullToRefresh.state)) {
      this.pullToRefresh.pullStartY = 0;
      this.pullToRefresh.pullMoveY = 0;
      this.pullToRefresh.dist = 0;
      this.pullToRefresh.distResisted = 0;
      this.pullToRefresh.state = "pending";
      this.state.top = 0;
      this.state.step = this.pullToRefresh.state;
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    // if (
    //   this.pullToRefresh.state === "releasing" &&
    //   this.pullToRefresh.distResisted > 60
    // ) {
    // }
    this.startPullToRefresh();
  }
  /** 页面滚动时调用 */
  scroll(event: { scrollTop: number }) {
    const { scrollTop } = event;
    this.emit(Events.Scroll, { scrollTop });
    const { height = 0, contentHeight = 0 } = this.rect;
    if (scrollTop + height + 120 >= contentHeight) {
      if (this.canReachBottom === false) {
        this.emit(Events.ReachBottom);
      }
      this.canReachBottom = true;
    } else {
      this.canReachBottom = false;
    }
    this.rect.scrollTop = scrollTop;
    this.state.scrollTop = scrollTop;
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 启用下拉刷新 */
  enablePullToRefresh() {
    this.canPullToRefresh = true;
  }
  /** 禁用下拉刷新 */
  disablePullToRefresh() {
    this.canPullToRefresh = false;
  }
  /**
   * 开始下拉刷新
   * 调用后触发下拉刷新动画，效果与用户手动下拉刷新一致
   */
  startPullToRefresh() {
    if (this.canPullToRefresh === false) {
      return;
    }
    this.pullToRefresh.pullStartY = 0;
    this.pullToRefresh.pullMoveY = 0;
    this.pullToRefresh.dist = 60;
    this.pullToRefresh.distResisted = 60;
    this.pullToRefresh.state = "refreshing";
    this.state.top = 60;
    this.state.step = this.pullToRefresh.state;
    this.emit(Events.PullToRefresh);
    this.emit(Events.StateChange, { ...this.state });
  }
  /**
   * 结束下拉刷新
   */
  stopPullToRefresh() {
    this.pullToRefresh.state = "pending";
    this.state.top = 0;
    this.state.step = this.pullToRefresh.state;
    this.emit(Events.StateChange, { ...this.state });
  }

  onScroll(handler: Handler<TheTypesOfEvents[Events.Scroll]>) {
    this.on(Events.Scroll, handler);
  }
  onReachBottom(handler: Handler<TheTypesOfEvents[Events.ReachBottom]>) {
    this.on(Events.ReachBottom, handler);
  }
  onPullToRefresh(handler: Handler<TheTypesOfEvents[Events.PullToRefresh]>) {
    this.on(Events.PullToRefresh, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}

function resistanceFunction(t: number) {
  return Math.min(1, t / 2.5);
}
