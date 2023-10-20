/**
 * @file 播放器
 */
import debounce from "lodash/fp/debounce";

import { BaseDomain, Handler } from "@/domains/base";
import { MediaSourceProfile } from "@/domains/tv/services";
import { EpisodeResolutionTypes } from "@/domains/tv/constants";
import { Application } from "@/domains/app";

enum Events {
  Mounted,
  /** 改变播放地址（切换剧集或分辨率） */
  UrlChange,
  /** 调整进度 */
  CurrentTimeChange,
  /** 分辨率改变 */
  ResolutionChange,
  /** 音量改变 */
  VolumeChange,
  /** 宽高改变 */
  SizeChange,
  /** 预加载 */
  Preload,
  Ready,
  Loaded,
  /** 播放源加载完成 */
  SourceLoaded,
  /** 准备播放 */
  CanPlay,
  /** 开始播放 */
  Play,
  /** 播放进度改变 */
  Progress,
  /** 暂停 */
  Pause,
  /** 快要结束，这时可以提取加载下一集剧集信息 */
  BeforeEnded,
  /** 播放结束 */
  End,
  Resize,
  /** 发生错误 */
  Error,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Mounted]: boolean;
  [Events.UrlChange]: MediaSourceProfile;
  [Events.CurrentTimeChange]: { currentTime: number };
  [Events.ResolutionChange]: {
    type: EpisodeResolutionTypes;
    text: string;
  };
  [Events.VolumeChange]: { volume: number };
  [Events.SizeChange]: { width: number; height: number };
  [Events.Ready]: void;
  // EpisodeProfile
  [Events.SourceLoaded]: Partial<{
    width: number;
    height: number;
    url: string;
    currentTime: number;
  }>;
  [Events.Loaded]: void;
  [Events.CanPlay]: void;
  [Events.Play]: void;
  [Events.Pause]: { currentTime: number; duration: number };
  [Events.Progress]: {
    currentTime: number;
    duration: number;
    progress: number;
  };
  [Events.Preload]: { url: string };
  [Events.BeforeEnded]: void;
  [Events.End]: {
    current_time: number;
    duration: number;
  };
  [Events.Error]: Error;
  [Events.Resize]: { width: number; height: number };
  [Events.StateChange]: PlayerState;
};

type PlayerProps = {};
type PlayerState = {
  poster?: string;
  width: number;
  height: number;
  ready: boolean;
};

export class PlayerCore extends BaseDomain<TheTypesOfEvents> {
  /** 视频信息 */
  metadata: MediaSourceProfile | null = null;
  static Events = Events;

  private _timer: null | number = null;
  private _playing = false;
  private _canPlay = false;
  get playing() {
    return this._playing;
  }
  private _ended = false;
  private _duration = 0;
  private _currentTime = 0;
  get currentTime() {
    return this._currentTime;
  }
  _mounted = false;
  poster?: string;
  /** 默认是不能播放的，只有用户交互后可以播放 */
  private _target_current_time = 0;
  private _progress = 0;
  private _passPoint = false;
  private _size: { width: number; height: number } = { width: 0, height: 0 };
  private _abstractNode: {
    $node: HTMLVideoElement;
    play: () => void;
    pause: () => void;
    load: (url: string) => void;
    canPlayType: (type: string) => boolean;
    setCurrentTime: (v: number) => void;
    setVolume: (v: number) => void;
  } | null = null;
  private _app: Application;

  get state(): PlayerState {
    return {
      poster: this.poster,
      width: this._size.width,
      height: this._size.height,
      ready: this._canPlay,
    };
  }

  constructor(options: { app: Application }) {
    super();

    const { app } = options;
    this._app = app;
  }

  bindAbstractNode(node: PlayerCore["_abstractNode"]) {
    this._abstractNode = node;
  }
  /** 开始播放 */
  async play() {
    if (this._abstractNode === null) {
      return;
    }
    if (this.playing) {
      return;
    }
    this._abstractNode.play();
  }
  /** 暂停播放 */
  async pause() {
    if (this._abstractNode === null) {
      return;
    }
    this._abstractNode.pause();
  }
  /** 改变音量 */
  changeVolume(v: number) {
    if (this._abstractNode === null) {
      return;
    }
    this._abstractNode.setVolume(v);
  }
  setPoster(url: string | null) {
    if (url === null) {
      return;
    }
    this.poster = url;
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 改变当前进度 */
  setCurrentTime(currentTime: number = 0) {
    if (this._abstractNode === null) {
      return;
    }
    this._currentTime = currentTime;
    this._abstractNode.setCurrentTime(currentTime);
  }
  setSize(size: { width: number; height: number }) {
    if (
      this._size.width !== 0 &&
      this._size.width === size.width &&
      this._size.height !== 0 &&
      this._size.height === size.height
    ) {
      return;
    }
    this._size = size;
    this.emit(Events.SizeChange, size);
    this.emit(Events.StateChange, { ...this.state });
  }
  setResolution(values: { type: EpisodeResolutionTypes; text: string }) {
    this.emit(Events.ResolutionChange, values);
  }
  loadSource(video: MediaSourceProfile) {
    this.metadata = video;
    this._canPlay = false;
    this.emit(Events.UrlChange, video);
  }
  preloadSource(url: string) {
    this.emit(Events.Preload, { url });
  }
  canPlayType(type: string) {
    if (!this._abstractNode) {
      return false;
    }
    return this._abstractNode.canPlayType(type);
  }
  load(url: string) {
    if (!this._abstractNode) {
      return false;
    }
    this._abstractNode.load(url);
  }
  node() {
    if (!this._abstractNode) {
      return null;
    }
    return this._abstractNode.$node;
  }
  handleTimeUpdate({ currentTime, duration }: { currentTime: number; duration: number }) {
    if (currentTime === 0) {
      return;
    }
    if (this._currentTime === currentTime) {
      return;
    }
    this._currentTime = currentTime;
    if (typeof duration === "number" && !Number.isNaN(duration)) {
      this._duration = duration;
    }
    const progress = Math.floor((currentTime / this._duration) * 100);
    this._progress = progress;
    this.emit(Events.Progress, {
      currentTime: this._currentTime,
      duration: this._duration,
      progress: this._progress,
    });
    // console.log("[DOMAIN]Player - time update", progress);
    if (currentTime + 10 >= this._duration) {
      if (this._passPoint) {
        return;
      }
      this.emit(Events.BeforeEnded);
      this._passPoint = true;
      return;
    }
    this._passPoint = false;
  }
  setMounted() {
    this._mounted = true;
    this.emit(Events.Mounted);
  }
  handlePause({ currentTime, duration }: { currentTime: number; duration: number }) {
    this.emit(Events.Pause, { currentTime, duration });
  }
  handleVolumeChange(cur_volume: number) {
    this.emit(Events.VolumeChange, { volume: cur_volume });
  }
  handleResize(size: { width: number; height: number }) {
    // const { width, height } = size;
    // const h = Math.ceil((height / width) * this._app.size.width);
    // this._size = {
    //   width: this._app.size.width,
    //   height: h,
    // };
    // this.emit(Events.Resize, this._size);
    // this.emit(Events.StateChange, { ...this.state });
  }
  /** 视频播放结束 */
  handleEnd() {
    this._playing = false;
    this._ended = true;
    this.emit(Events.End, {
      current_time: this._currentTime,
      duration: this._duration,
    });
  }
  handleLoadedmetadata() {
    this.emit(Events.SourceLoaded);
  }
  handleLoad() {
    this.emit(Events.Loaded);
  }
  handleCanPlay() {
    if (this._canPlay) {
      return;
    }
    this._canPlay = true;
    this.emit(Events.CanPlay);
    this.emit(Events.StateChange, { ...this.state });
  }
  handlePlay() {
    this.emit(Events.Play);
  }
  handleError(msg: string) {
    // console.log("[DOMAIN]Player - throwError", msg);
    this.emit(Events.Error, new Error(msg));
  }

  onReady(handler: Handler<TheTypesOfEvents[Events.Ready]>) {
    return this.on(Events.Ready, handler);
  }
  onLoaded(handler: Handler<TheTypesOfEvents[Events.Loaded]>) {
    return this.on(Events.Loaded, handler);
  }
  onProgress(handler: Handler<TheTypesOfEvents[Events.Progress]>) {
    return this.on(Events.Progress, handler);
  }
  onCanPlay(handler: Handler<TheTypesOfEvents[Events.CanPlay]>) {
    return this.on(Events.CanPlay, handler);
  }
  onUrlChange(handler: Handler<TheTypesOfEvents[Events.UrlChange]>) {
    return this.on(Events.UrlChange, handler);
  }
  onPreload(handler: Handler<TheTypesOfEvents[Events.Preload]>) {
    return this.on(Events.Preload, handler);
  }
  onBeforeEnded(handler: Handler<TheTypesOfEvents[Events.BeforeEnded]>) {
    return this.on(Events.BeforeEnded, handler);
  }
  onSizeChange(handler: Handler<TheTypesOfEvents[Events.SizeChange]>) {
    return this.on(Events.SizeChange, handler);
  }
  onVolumeChange(handler: Handler<TheTypesOfEvents[Events.VolumeChange]>) {
    return this.on(Events.VolumeChange, handler);
  }
  onPause(handler: Handler<TheTypesOfEvents[Events.Pause]>) {
    return this.on(Events.Pause, handler);
  }
  onResolutionChange(handler: Handler<TheTypesOfEvents[Events.ResolutionChange]>) {
    return this.on(Events.ResolutionChange, handler);
  }
  onPlay(handler: Handler<TheTypesOfEvents[Events.Play]>) {
    return this.on(Events.Play, handler);
  }
  onSourceLoaded(handler: Handler<TheTypesOfEvents[Events.SourceLoaded]>) {
    return this.on(Events.SourceLoaded, handler);
  }
  onCurrentTimeChange(handler: Handler<TheTypesOfEvents[Events.CurrentTimeChange]>) {
    return this.on(Events.CurrentTimeChange, handler);
  }
  onEnd(handler: Handler<TheTypesOfEvents[Events.End]>) {
    return this.on(Events.End, handler);
  }
  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    return this.on(Events.Error, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onMounted(handler: Handler<TheTypesOfEvents[Events.Mounted]>) {
    return this.on(Events.Mounted, handler);
  }
}
