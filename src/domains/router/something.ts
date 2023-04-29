import { Handler } from "mitt";
import debounce from "lodash/fp/debounce";

import { sleep } from "@/utils";
import { BaseDomain } from "@/domains/base";

export type PullToRefreshStep =
  | "pending"
  | "pulling"
  | "refreshing"
  | "releasing";
export type PageOptions = {
  scrollTop: number;
  yDistance: number;
  state: PullToRefreshStep;
  query: Record<string, string>;
  params: Record<string, string>;
};

enum PageEvent {
  /** 页面加载 */
  Ready,
  /** 页面隐藏 */
  Hidden,
  /** 页面展示 */
  Show,
  /** 页面销毁 */
  Destroy,
  /** 页面滚动 */
  Scroll,
  /** 页面下拉 */
  PullDown,
  /** 下拉刷新 */
  PullToRefresh,
  /** 页面触底 */
  ReachBottom,
}
type TheTypesOfPageEvent = {
  [PageEvent.Ready]: Record<string, string>;
  [PageEvent.Show]: void;
  [PageEvent.Hidden]: void;
  [PageEvent.Destroy]: void;
  [PageEvent.Scroll]: { scrollTop: number };
  [PageEvent.PullDown]: {
    yDistance: number;
    state: string;
  };
  [PageEvent.PullToRefresh]: void;
  [PageEvent.ReachBottom]: void;
};

export class PageCore extends BaseDomain<TheTypesOfPageEvent> {
  /** 页面尺寸信息 */
  client: {
    /** 页面宽度 */
    width: number;
    /** 页面高度 */
    height: number;
    /** 在 y 轴方向滚动的距离 */
    scrollTop: number;
    /** 内容高度 */
    contentHeight: number;
  } = {
    width: 0,
    height: 0,
    scrollTop: 0,
    contentHeight: 0,
  };
  query: PageOptions["query"];
  params: PageOptions["params"];
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

  constructor(options: Partial<PageOptions>) {
    super();

    const { query, params } = options;
    this.query = query;
    this.params = params;
  }

  /** 设置页面标题 */
  setTitle(title: string) {
    document.title = title;
  }
  /** PullToRefresh 相关逻辑 */
  handleTouchStart(pos: { x: number; y: number }) {
    const { x, y } = pos;
    const { state } = this.pullToRefresh;
    // 手指在边缘时可能是滑动切换页面
    if (x < 30) {
      return;
    }
    if (state !== "pending") {
      return;
    }
    if (this.client.scrollTop) {
      return;
    }
    this.pullToRefresh.pullStartY = y;
  }
  /** 移动 */
  handleTouchMove(
    pos: { x: number; y: number },
    lifetimes: Partial<{
      onCanPull: () => void;
    }> = {}
  ) {
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
    // console.log(this.pullToRefresh.dist);
    if (onCanPull) {
      onCanPull();
    }
    const distThreshold = 60;
    const distMax = 80;
    const distResisted =
      resistanceFunction(this.pullToRefresh.dist / distThreshold) *
      Math.min(distMax, this.pullToRefresh.dist);
    this.pullToRefresh.distResisted = distResisted;
    if (
      this.pullToRefresh.state === "pulling" &&
      distResisted > distThreshold
    ) {
      this.pullToRefresh.state = "releasing";
    }
    if (
      this.pullToRefresh.state === "releasing" &&
      distResisted <= distThreshold
    ) {
      this.pullToRefresh.state = "pulling";
    }
    this.emitPullDown({
      yDistance: distResisted,
      state: this.pullToRefresh.state,
    });
  }
  async handleTouchEnd() {
    // console.log(
    //   "[DOMAIN]Page - onTouchEnd",
    //   this.pullToRefresh.state,
    //   this.pullToRefresh.distResisted
    // );
    if (["refreshing"].includes(this.pullToRefresh.state)) {
      return;
    }
    if (["pending", "pulling"].includes(this.pullToRefresh.state)) {
      this.pullToRefresh.pullStartY = 0;
      this.pullToRefresh.pullMoveY = 0;
      this.pullToRefresh.dist = 0;
      this.pullToRefresh.distResisted = 0;
      this.pullToRefresh.state = "pending";
      this.emitPullDown({
        yDistance: 0,
        state: this.pullToRefresh.state,
      });
      return;
    }
    if (
      this.pullToRefresh.state === "releasing" &&
      this.pullToRefresh.distResisted > 60
    ) {
      (async () => {
        // console.log(
        //   "[DOMAIN]Page - prepare invoke refresh listeners",
        //   this.refreshListeners.length
        // );
        this.emit(PageEvent.PullToRefresh);
        await sleep(1200);
        this.pullToRefresh.state = "pending";
        this.emitPullDown({
          yDistance: 0,
          state: this.pullToRefresh.state,
        });
      })();
    }
    this.pullToRefresh.pullStartY = 0;
    this.pullToRefresh.pullMoveY = 0;
    this.pullToRefresh.dist = 60;
    this.pullToRefresh.distResisted = 60;
    this.pullToRefresh.state = "refreshing";
    this.emitPullDown({
      yDistance: 60,
      state: this.pullToRefresh.state,
    });
  }
  onTouchCancel() {}

  emitReady = debounce(100, () => {
    this.emit(PageEvent.Ready, {
      ...this.query,
      ...this.params,
    });
  });
  onReady(handler: Handler<TheTypesOfPageEvent[PageEvent.Ready]>) {
    this.on(PageEvent.Ready, handler);
  }
  onPullToRefresh(
    handler: Handler<TheTypesOfPageEvent[PageEvent.PullToRefresh]>
  ) {
    this.on(PageEvent.PullToRefresh, handler);
  }
  emitPageScroll(event: { scrollTop: number }) {
    const { scrollTop } = event;
    if (scrollTop + this.client.height + 120 >= this.client.contentHeight) {
      this.emitReachBottom();
    }
    this.client.scrollTop = scrollTop;
    this.emit(PageEvent.Scroll, {
      scrollTop,
    });
  }
  onPageScroll(handler: Handler<TheTypesOfPageEvent[PageEvent.Scroll]>) {
    this.on(PageEvent.Scroll, handler);
  }
  emitReachBottom = debounce(400, () => {
    this.emit(PageEvent.ReachBottom);
  });
  onReachBottom(handler: Handler<TheTypesOfPageEvent[PageEvent.ReachBottom]>) {
    this.on(PageEvent.ReachBottom, handler);
  }
  emitHidden() {
    this.emit(PageEvent.Hidden);
  }
  onHidden(handler: Handler<TheTypesOfPageEvent[PageEvent.Hidden]>) {
    this.on(PageEvent.Hidden, handler);
  }
  emitDestroy() {
    this.emit(PageEvent.Destroy);
  }
  onDestroy(handler: Handler<TheTypesOfPageEvent[PageEvent.Destroy]>) {
    this.on(PageEvent.Destroy, handler);
  }
  emitPullDown(data: TheTypesOfPageEvent[PageEvent.PullDown]) {
    this.emit(PageEvent.PullDown, data);
  }
  onPullDown(handler: Handler<TheTypesOfPageEvent[PageEvent.PullDown]>) {
    this.on(PageEvent.PullDown, handler);
  }
}

export function resistanceFunction(t: number) {
  return Math.min(1, t / 2.5);
}
