import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  StateChange,
  StartLoad,
  Loaded,
  Error,
}
type TheTypesOfEvents = {
  [Events.StateChange]: ImageState;
  [Events.StartLoad]: void;
  [Events.Loaded]: void;
  [Events.Error]: void;
};
type ImageProps = {
  /** 图片宽度 */
  width: number;
  /** 图片高度 */
  height: number;
  /** 图片地址 */
  src?: string;
  /** 说明 */
  alt?: string;
  /** 模式 */
  fit?: "cover" | "contain";
};
type ImageState = ImageProps & {
  loading: boolean;
  failed: boolean;
  loaded: boolean;
};
// const prefix = window.location.origin;
const prefix = "https://img.funzm.com";
const DEFAULT_IMAGE1 = prefix + "/placeholder.png";

export class ImageCore extends BaseDomain<TheTypesOfEvents> {
  src: string;
  width: number;
  height: number;
  fit: "cover" | "contain";

  loading: boolean = false;
  failed: boolean = false;
  loaded: boolean = false;
  realSrc?: string;

  get state(): ImageState {
    return {
      src: this.src,
      width: this.width,
      height: this.height,
      loading: this.loading,
      failed: this.failed,
      loaded: this.loaded,
    };
  }

  constructor(options: Partial<{}> & ImageProps) {
    super();

    const { width, height, src, fit = "cover" } = options;
    this.width = width;
    this.height = height;
    this.src = DEFAULT_IMAGE1;
    this.fit = fit;
    this.realSrc = src;
  }

  load(src: string) {}

  /** 图片进入可视区域 */
  handleShow() {
    // console.log("[IMAGE_CORE]handleShow", this.realSrc);
    if (this.realSrc === undefined) {
      return;
    }
    // this.load(this.realSrc);
    this.src = (() => {
      if (this.realSrc.includes("http")) {
        return this.realSrc;
      }
      return prefix + this.realSrc;
    })();
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 图片加载完成 */
  handleLoaded() {
    this.emit(Events.Loaded);
  }
  /** 图片加载失败 */
  handleError() {
    this.emit(Events.Error);
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onStartLoad(handler: Handler<TheTypesOfEvents[Events.StartLoad]>) {
    return this.on(Events.StartLoad, handler);
  }
  onLoad(handler: Handler<TheTypesOfEvents[Events.Loaded]>) {
    return this.on(Events.Loaded, handler);
  }
  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    return this.on(Events.Error, handler);
  }
}
