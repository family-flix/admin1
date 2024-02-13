/**
 * @file 一个可下拉刷新的滚动容器
 * 必须给固定的高度？
 */
import { BaseDomain, Handler } from "@/domains/base";

type PullToRefreshStep = "pending" | "pulling" | "refreshing" | "releasing";
enum Events {
  ReachBottom,
  Scroll,
  PullToRefresh,
  PullToBack,
  Refreshing,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.ReachBottom]: void;
  [Events.Scroll]: { scrollTop: number };
  [Events.PullToRefresh]: void;
  [Events.PullToBack]: void;
  [Events.StateChange]: ScrollViewState;
  [Events.Refreshing]: void;
};
type ScrollViewProps = {
  pullToRefresh?: boolean;
  onScroll?: (pos: { scrollTop: number }) => void;
  onReachBottom?: () => void;
  onPullToRefresh?: () => void;
  onPullToBack?: () => void;
};
type ScrollViewState = {
  top: number;
  left: number;
  /** 当前滚动距离顶部的距离 */
  scrollTop: number;
  scrollable: boolean;
  /** 是否支持下拉刷新 */
  pullToRefresh: boolean;
  pullToBack: {
    enabled: boolean;
    canBack: boolean;
    width: number;
    height: number;
  };
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
  scrollable = true;
  /** 下拉刷新相关的状态信息 */
  pullToRefresh: {
    state: PullToRefreshStep;
    /** 开始拖动的起点 y */
    pullStartY: number;
    /** 开始拖动的起点 x */
    pullStartX: number;
    /** 拖动过程中的 y */
    pullMoveY: number;
    /** 拖动过程中的 x */
    pullMoveX: number;
    /** 拖动过程 x 方向上移动的距离 */
    distX: number;
    /** 拖动过程 y 方向上移动的距离 */
    distY: number;
    /** 实际移动的距离？ */
    distResisted: number;
  } = {
    state: "pending",
    pullStartX: 0,
    pullStartY: 0,
    pullMoveX: 0,
    pullMoveY: 0,
    distX: 0,
    distY: 0,
    distResisted: 0,
  };
  /** 滚动到底部的阈值 */
  threshold = 120;
  private _pullToRefresh = false;

  state: ScrollViewState = {
    top: 0,
    left: 0,
    step: "pending",
    scrollTop: 0,
    pullToRefresh: false,
    pullToBack: {
      enabled: false,
      canBack: false,
      width: 0,
      height: 192,
    },
    scrollable: true,
  };

  constructor(options: Partial<{ _name: string }> & ScrollViewProps = {}) {
    super(options);

    const { pullToRefresh = false, onScroll, onReachBottom, onPullToRefresh, onPullToBack } = options;
    this.canPullToRefresh = pullToRefresh;
    this.state.pullToRefresh = pullToRefresh;
    if (onScroll) {
      this.onScroll(onScroll);
    }
    if (onReachBottom) {
      this.onReachBottom(onReachBottom);
    }
    if (onPullToRefresh) {
      this.canPullToRefresh = true;
      this.state.pullToRefresh = true;
      this.onPullToRefresh(onPullToRefresh);
    }
    if (onPullToBack) {
      this.state.pullToBack.enabled = true;
      this.onPullToBack(onPullToBack);
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
    (() => {
      if (x < 30) {
        // this._pullToRefresh = false;
        this.state.scrollable = false;
        this._pullToRefresh = false;
        this.emit(Events.StateChange, { ...this.state });
      }
    })();
    if (this.state.pullToRefresh === false) {
      this._pullToRefresh = false;
    }
    if (state !== "pending") {
      this._pullToRefresh = false;
    }
    // console.log("[DOMAIN]ui/scroll-view - start pulling", { x, y });
    // y 方向滚动了一定距离，不可能可以下拉刷新
    if (this.rect.scrollTop) {
      this._pullToRefresh = false;
    }
    this.pullToRefresh.pullStartY = y;
    this.pullToRefresh.pullStartX = x;
  }
  _disablePullToBack = false;
  _disablePullToRefresh = false;
  isPullToRefresh = false;
  isPullToBack = false;
  pulling(
    pos: { x: number; y: number },
    lifetimes: Partial<{
      onCanPull: () => void;
    }> = {}
  ) {
    const { x: curX, y: curY } = pos;
    const { pullStartX = 0, pullStartY = 0 } = this.pullToRefresh;
    const pullingDistance = (() => {
      const distance: { x: number; y: number } = {
        x: 0,
        y: 0,
      };
      distance.y = curY - pullStartY;
      distance.x = curX - pullStartX;
      return distance;
    })();
    (() => {
      if (this.isPullToBack || this.isPullToBack) {
        return;
      }
      if (pullingDistance.x > 10 && this.state.pullToBack.enabled) {
        if (!this._disablePullToBack) {
          this.isPullToBack = true;
          this._disablePullToRefresh = true;
        }
      }
      if (Math.abs(pullingDistance.y) > 10) {
        if (!this._disablePullToRefresh) {
          this._disablePullToBack = true;
          if (this._pullToRefresh && pullingDistance.y > 10) {
            this.isPullToRefresh = true;
          }
        }
      }
    })();

    // console.log("[DOMAIN]ui/scroll-view - pulling", isPullToRefresh);
    if (this.isPullToBack) {
      this.state.scrollable = false;
      this.pullToRefresh.distX = pullingDistance.x;
      const distance = this.pullToRefresh.distX;
      // const h = this.state.pullToBack.height;
      this.state.pullToBack.canBack = false;
      if (distance >= 62) {
        this.state.pullToBack.canBack = true;
      }
      const scaleFactor = 0.008;
      const scaledDistance = distance / (1 + Math.abs(distance) * scaleFactor);
      const distanceX = scaledDistance >= 0 ? scaledDistance : 0;
      this.state.pullToBack.width = distanceX;
      this.state.pullToBack.height = (() => {
        const i = 192 - distance;
        if (i <= 58) {
          return 58;
        }
        return i;
      })();
      console.log("[DOMAIN]ui/scroll-view - pulling", distanceX);
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    if (!this.isPullToRefresh) {
      return;
    }
    if (this.canPullToRefresh === false) {
      return;
    }
    if (this.pullToRefresh.state === "refreshing") {
      return;
    }
    this.pullToRefresh.pullMoveY = curY;
    if (this.pullToRefresh.state === "pending") {
      this.pullToRefresh.state = "pulling";
    }
    this.pullToRefresh.distY = pullingDistance.y;
    if (this.pullToRefresh.distY <= 0) {
      return;
    }
    const distThreshold = 60;
    const distMax = 80;
    const distResisted =
      resistanceFunction(this.pullToRefresh.distY / distThreshold) * Math.min(distMax, this.pullToRefresh.distY);
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
  }
  async endPulling() {
    // console.log("[DOMAIN]ui/scroll-view - endPulling", this.state.left);
    if (this.state.pullToBack.canBack) {
      this.emit(Events.PullToBack);
    }
    this.state.pullToBack.canBack = false;
    this.state.pullToBack.width = 0;
    this.state.pullToBack.height = 192;
    this.state.scrollable = true;
    this.pullToRefresh.pullStartX = 0;
    this.pullToRefresh.pullMoveX = 0;
    this.pullToRefresh.distX = 0;
    this._disablePullToRefresh = false;
    this._disablePullToBack = false;
    this._pullToRefresh = true;
    this.isPullToBack = false;
    this.isPullToRefresh = false;
    this.emit(Events.StateChange, { ...this.state });
    if (this.canPullToRefresh === false) {
      return;
    }
    if (["refreshing"].includes(this.pullToRefresh.state)) {
      return;
    }
    if (["pending", "pulling"].includes(this.pullToRefresh.state)) {
      this.pullToRefresh.pullStartY = 0;
      this.pullToRefresh.pullMoveY = 0;
      this.pullToRefresh.distY = 0;
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
  handleScroll(event: { scrollTop: number }) {
    const { scrollTop } = event;
    this.emit(Events.Scroll, { scrollTop });
    const { height = 0, contentHeight = 0 } = this.rect;
    // console.log("[DOMAIN]ui/scroll-view - scroll", scrollTop, height, contentHeight);
    if (scrollTop + height + this.threshold >= contentHeight) {
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
  enablePullToBack() {
    this.state.pullToBack.enabled = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  disablePullToBack() {
    this.state.pullToBack.enabled = false;
    this.emit(Events.StateChange, { ...this.state });
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
    this.pullToRefresh.distY = 60;
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
  scrollTo(position: Partial<{ left: number; top: number }>) {
    console.log("请在 connect 中实现该方法");
  }

  onScroll(handler: Handler<TheTypesOfEvents[Events.Scroll]>) {
    return this.on(Events.Scroll, handler);
  }
  onReachBottom(handler: Handler<TheTypesOfEvents[Events.ReachBottom]>) {
    // console.log("register onReachBottom", this._name);
    return this.on(Events.ReachBottom, handler);
  }
  onPullToRefresh(handler: Handler<TheTypesOfEvents[Events.PullToRefresh]>) {
    this.state.pullToRefresh = true;
    return this.on(Events.PullToRefresh, handler);
  }
  onPullToBack(handler: Handler<TheTypesOfEvents[Events.PullToBack]>) {
    this.state.pullToBack.enabled = true;
    return this.on(Events.PullToBack, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}

function resistanceFunction(t: number) {
  return Math.min(1, t / 2.5);
}
