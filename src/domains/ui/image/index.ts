import { BaseDomain, Handler } from "@/domains/base";

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
  step: ImageStep;
};
const prefix = window.location.origin;
// const prefix = "https://img.funzm.com";
// const DEFAULT_IMAGE1 = prefix + "/placeholder.png";

export enum ImageStep {
  Pending,
  Loading,
  Loaded,
  Failed,
}

export class ImageCore extends BaseDomain<TheTypesOfEvents> {
  static url(url: string) {
    if (url.includes("http")) {
      return url;
    }
    return prefix + url;
  }

  src: string;
  width: number;
  height: number;
  fit: "cover" | "contain";

  step: ImageStep = ImageStep.Pending;
  realSrc?: string;

  get state(): ImageState {
    return {
      src: this.src,
      step: this.step,
      width: this.width,
      height: this.height,
      fit: this.fit,
    };
  }

  constructor(options: Partial<{}> & ImageProps) {
    super();

    const { width, height, src, fit = "cover" } = options;
    this.width = width;
    this.height = height;
    this.src = "";
    this.fit = fit;
    this.realSrc = src;
  }

  updateSrc(src: string) {
    this.realSrc = src;
    this.handleShow();
  }
  /** 图片进入可视区域 */
  handleShow() {
    // console.log("[IMAGE_CORE]handleShow", this.realSrc);
    (() => {
      if (!this.realSrc) {
        this.step = ImageStep.Failed;
        return;
      }
      this.step = ImageStep.Loading;
      this.src = ImageCore.url(this.realSrc);
    })();
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 图片加载完成 */
  handleLoaded() {
    this.step = ImageStep.Loaded;
    this.emit(Events.Loaded);
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 图片加载失败 */
  handleError() {
    this.step = ImageStep.Failed;
    this.emit(Events.StateChange, { ...this.state });
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
