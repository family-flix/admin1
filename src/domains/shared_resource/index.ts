/**
 * @file 阿里云 分享资源
 */
import { BaseDomain, Handler } from "@/domains/base";
import { DriveCore } from "@/domains/drive";
import { Result } from "@/types";
import { sleep } from "@/utils";

import {
  build_link_between_shared_files_with_folder,
  check_has_same_name_tv,
  fetch_resource_files,
  AliyunFolderItem,
  save_shared_files,
  search_resource_files,
} from "./services";

enum Events {
  /** 输入分享链接 */
  Input,
  LoadingChange,
  /** 获取文件列表成功 */
  StateChange,
  /** 分享文件夹绑定云盘内文件夹成功 */
  BindSuccess,
  /** 展示指定电视剧详情 */
  ShowTVProfile,
  Tip,
  Error,
}
type TheTypesOfEvents = {
  [Events.Input]: string;
  [Events.LoadingChange]: boolean;
  [Events.Tip]: string;
  [Events.Error]: Error;
  [Events.BindSuccess]: void;
  [Events.ShowTVProfile]: {
    /** 电视剧id */
    id: string;
    /** 名称 */
    name: string;
    /** 海报 */
    poster: string;
    /** 概述 */
    overview: string;
    /** 首播时间 */
    firstAirDate: string;
  };
  [Events.StateChange]: SharedResourceState;
};
type SharedResourceState = {
  url?: string;
  loading: boolean;
  paths: {
    file_id: string;
    name: string;
    type?: "file" | "folder";
  }[];
  files: AliyunFolderItem[];
  next_marker: string;
};
type SharedResourceProps = {
  url: string;
};

export class SharedResourceCore extends BaseDomain<TheTypesOfEvents> {
  /** 分享链接 */
  url?: string;
  /** 提取码 */
  code?: string;
  /** 当前展示的文件夹列表所属的文件夹 id */
  file_id: string = "";
  /** 用来获取当前文件夹下一页的标志 */
  next_marker: string = "";
  /** 当前展示的文件夹列表 */
  files: AliyunFolderItem[] = [];
  /** 当前访问的文件夹列表所在路径 */
  paths: {
    file_id: string;
    name: string;
    type?: "file" | "folder";
  }[] = [];
  /** 右键选中的文件夹 */
  selectedFolder: {
    file_id: string;
    name: string;
    type?: "file" | "folder";
  } | null = null;
  /** 是否处于请求中 */
  loading = false;

  get state(): SharedResourceState {
    return {
      url: this.url,
      loading: this.loading,
      paths: this.paths,
      files: this.files,
      next_marker: this.next_marker,
    };
  }

  constructor(options: Partial<{ name: string } & SharedResourceProps> = {}) {
    super();
  }

  /** 输入分享文件链接 */
  input(url: string) {
    this.url = url;
    this.emit(Events.Input, url);
  }
  inputCode(code: string) {
    this.code = code;
    this.emit(Events.Input, code);
  }
  async _fetch(file_id: string) {
    this.file_id = file_id;
    if (this.loading) {
      return Result.Err("正在加载中");
    }
    if (!this.url) {
      return Result.Err("请先指定分享链接");
    }
    this.loading = true;
    this.emit(Events.LoadingChange, this.loading);
    const [r] = await Promise.all([
      fetch_resource_files({
        url: this.url,
        code: this.code,
        file_id,
        next_marker: this.next_marker,
      }),
      sleep(1200),
    ]);
    this.loading = false;
    this.emit(Events.LoadingChange, this.loading);
    if (r.error) {
      return Result.Err(r.error);
    }
    return Result.Ok(r.data);
  }
  reset() {
    this.paths = [];
    this.files = [];
  }
  /** 获取分享资源根目录下文件夹列表 */
  async fetch(
    file: Partial<{
      file_id: string;
      name: string;
      type: "file" | "folder";
    }> = {}
  ) {
    const { file_id = "root", name = "分享文件", type = "folder" } = file;
    if (type === "file") {
      const msg = this.tip({
        text: ["仅文件夹可点击"],
      });
      return Result.Err(msg);
    }
    if (!this.url) {
      const msg = this.tip({
        text: ["请先指定分享链接"],
      });
      return Result.Err(msg);
    }
    this.next_marker = "";
    const existing_index = this.paths.findIndex((p) => p.file_id === file_id);
    const r = await this._fetch(file_id);
    if (r.error) {
      const msg = this.tip({ text: ["获取资源失败", r.error.message] });
      return Result.Err(msg);
    }
    (() => {
      if (this.paths.length === 0) {
        this.paths = [{ file_id, name }];
        return;
      }
      if (existing_index !== -1) {
        this.paths = this.paths.slice(0, existing_index + 1);
        return;
      }
      this.paths = this.paths.concat([{ file_id, name }]);
    })();
    this.files = [...r.data.items];
    this.next_marker = r.data.next_marker;
    this.emit(Events.StateChange, { ...this.state });
    return Result.Ok(null);
  }
  async loadMore() {
    if (!this.url) {
      const msg = this.tip({ text: ["请先指定分享链接"] });
      return Result.Err(msg);
    }
    const r = await this._fetch(this.file_id);
    if (r.error) {
      this.emit(Events.Tip, r.error.message);
      return;
    }
    this.files = this.files.concat(r.data.items);
    this.next_marker = r.data.next_marker;
    this.emit(Events.StateChange, { ...this.state });
  }
  async search(keyword: string) {
    if (!this.url) {
      const msg = this.tip({ text: ["请先指定分享链接"] });
      return Result.Err(msg);
    }
    const r = await search_resource_files({
      url: this.url,
      code: this.code,
      keyword,
    });
    if (r.error) {
      this.emit(Events.Tip, r.error.message);
      return;
    }
    this.files = r.data.items;
    this.next_marker = "";
    this.emit(Events.StateChange, { ...this.state });
  }
  bindSelectedFolderInDrive() {
    if (this.selectedFolder === null) {
      const msg = this.tip({ text: ["请先选择要关联的文件夹"] });
      return Result.Err(msg);
    }
    this.bindFolderInDrive(this.selectedFolder);
    return Result.Ok(null);
  }
  /**
   * 将分享文件夹和云盘内同名文件夹进行关联
   */
  async bindFolderInDrive(file: { file_id: string; name: string; type?: "file" | "folder" }) {
    const { file_id, name, type } = file;
    if (!this.url) {
      this.tip({ text: ["请先输入分享链接"] });
      return;
    }
    if (type === "file") {
      this.tip({ text: ["只有文件夹能进行关联"] });
      return;
    }
    const r = await build_link_between_shared_files_with_folder({
      url: this.url,
      file_id,
      file_name: name,
    });
    if (r.error) {
      this.emit(Events.Tip, r.error.message);
      return;
    }
    this.tip({
      text: ["关联成功"],
    });
  }
  findTheTVHasSameNameWithSelectedFolder() {
    if (this.selectedFolder === null) {
      this.tip({ text: ["请先选择要关联的文件夹"] });
      return;
    }
    this.findTheTVHasSameName(this.selectedFolder);
  }
  /**
   * 在云盘内查找同名影视剧
   */
  async findTheTVHasSameName(file: { file_id: string; name: string }) {
    const { name } = file;
    const r = await check_has_same_name_tv({
      file_name: name,
    });
    if (r.error) {
      this.tip({ text: ["查找同名文件夹失败", r.error.message] });
      return;
    }
    const theTVHasSameName = r.data;
    if (theTVHasSameName === null) {
      this.tip({ text: ["没有同名影视剧"] });
      return;
    }
    const { id, name: n, original_name, poster_path, overview, first_air_date } = theTVHasSameName;
    this.emit(Events.ShowTVProfile, {
      id,
      name: n || original_name,
      poster: poster_path,
      overview,
      firstAirDate: first_air_date,
    });
  }
  /** 选择指定的文件夹 */
  selectFolder(folder: { file_id: string; name: string }) {
    this.selectedFolder = folder;
  }
  /** 将指定文件转存到指定云盘 */
  async transferSelectedFolderToDrive(drive: DriveCore) {
    if (!this.url) {
      const msg = this.tip({ text: ["请先指定分享链接"] });
      return Result.Err(msg);
    }
    if (!this.selectedFolder) {
      const msg = this.tip({ text: ["请先指定转存文件"] });
      return Result.Err(new Error(msg));
    }
    const resp = await save_shared_files({
      url: this.url,
      code: this.code,
      file_id: this.selectedFolder.file_id,
      file_name: this.selectedFolder.name,
      drive_id: drive.id,
    });
    if (resp.error) {
      const msg = this.tip({ text: ["转存失败", resp.error.message] });
      return Result.Err(msg);
    }
    this.tip({
      text: ["开始转存任务"],
    });
    return Result.Ok(resp.data);
  }
  clear() {
    this.url = "";
    this.files = [];
    this.paths = [];
    this.emit(Events.StateChange, { ...this.state });
  }

  onInput(handler: Handler<TheTypesOfEvents[Events.Input]>) {
    return this.on(Events.Input, handler);
  }
  onLoadingChange(handler: Handler<TheTypesOfEvents[Events.LoadingChange]>) {
    return this.on(Events.LoadingChange, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onBindSuccess(handler: Handler<TheTypesOfEvents[Events.BindSuccess]>) {
    return this.on(Events.BindSuccess, handler);
  }
  onShowTVProfile(handler: Handler<TheTypesOfEvents[Events.ShowTVProfile]>) {
    return this.on(Events.ShowTVProfile, handler);
  }
}

export * from "./services";
