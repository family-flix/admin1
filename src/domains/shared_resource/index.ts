import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { Drive } from "@/domains/drive";
import { Result } from "@/types";

import {
  build_link_between_shared_files_with_folder,
  check_has_same_name_tv,
  fetch_shared_files,
  AliyunFolderItem,
  save_shared_files,
} from "./services";

enum Events {
  /** 输入分享链接 */
  Input,
  /** 获取文件列表成功 */
  RefreshSuccess,
  /** 分享文件夹绑定网盘内文件夹成功 */
  BindSuccess,
  /** 展示指定电视剧详情 */
  ShowTVProfile,
  Tip,
  Error,
}
type TheTypesOfEvents = {
  [Events.Input]: string;
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
  [Events.RefreshSuccess]: {
    url: string;
    paths: {
      file_id: string;
      name: string;
    }[];
    files: AliyunFolderItem[];
  };
};

export class SharedResource extends BaseDomain<TheTypesOfEvents> {
  /** 分享链接 */
  url: string;
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

  constructor() {
    super();
    // const { url } = options;
    // this.url = url;
  }

  /** 输入分享文件链接 */
  input(url: string) {
    this.url = url;
    this.emit(Events.Input, url);
  }

  async _fetch(file_id: string) {
    this.file_id = file_id;
    if (this.loading) {
      // this.emit(Events.Tip, "正在加载中");
      return Result.Err(new Error("正在加载中"));
    }
    this.loading = true;
    const r = await fetch_shared_files({
      url: this.url,
      file_id,
      next_marker: this.next_marker,
    });
    this.loading = false;
    if (r.error) {
      // this.emit(Events.Error, r.error);
      return Result.Err(r.error);
    }
    return r;
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
      this.emit(Events.Tip, "仅文件夹可点击");
      return;
    }
    this.next_marker = "";
    const existing_index = this.paths.findIndex((p) => p.file_id === file_id);
    const r = await this._fetch(file_id);
    if (r.error) {
      this.emit(Events.Tip, r.error.message);
      return;
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
    this.emit(Events.RefreshSuccess, {
      url: this.url,
      paths: [...this.paths],
      files: [...this.files],
    });
    // return Result.Ok(null);
  }
  async loadMore() {
    const r = await this._fetch(this.file_id);
    if (r.error) {
      this.emit(Events.Tip, r.error.message);
      return;
    }
    this.files = this.files.concat(r.data.items);
    this.next_marker = r.data.next_marker;
    this.emit(Events.RefreshSuccess, {
      url: this.url,
      paths: [...this.paths],
      files: [...this.files],
    });
  }
  bindSelectedFolderInDrive() {
    if (this.selectedFolder === null) {
      this.tip({ text: ["请先选择要关联的文件夹"] });
      return;
    }
    this.bindFolderInDrive(this.selectedFolder);
  }
  /**
   * 将分享文件夹和网盘内同名文件夹进行关联
   */
  async bindFolderInDrive(file: {
    file_id: string;
    name: string;
    type?: "file" | "folder";
  }) {
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
   * 在网盘内查找同名影视剧
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
    const {
      id,
      name: n,
      original_name,
      poster_path,
      overview,
      first_air_date,
    } = r.data;
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
  /** 将指定文件转存到指定网盘 */
  async transferSelectedFolderToDrive(drive: Drive) {
    if (!this.url) {
      this.tip({ text: ["请先指定分享链接"] });
      return;
    }
    if (!this.selectFolder) {
      this.tip({ text: ["请先指定转存文件"] });
      return;
    }
    const resp = await save_shared_files({
      url: this.url,
      file_id: this.selectedFolder.file_id,
      file_name: this.selectedFolder.name,
      drive_id: drive.id,
    });
    if (resp.error) {
      this.tip({ text: ["转存失败", resp.error.message] });
      return;
    }
    this.tip({
      text: ["转存成功"],
    });
  }

  onInput(handler: Handler<TheTypesOfEvents[Events.Input]>) {
    this.on(Events.Input, handler);
  }
  onSuccess(handler: Handler<TheTypesOfEvents[Events.RefreshSuccess]>) {
    this.on(Events.RefreshSuccess, handler);
  }
  onBindSuccess(handler: Handler<TheTypesOfEvents[Events.BindSuccess]>) {
    this.on(Events.BindSuccess, handler);
  }
  onShowTVProfile(handler: Handler<TheTypesOfEvents[Events.ShowTVProfile]>) {
    this.on(Events.ShowTVProfile, handler);
  }
}
