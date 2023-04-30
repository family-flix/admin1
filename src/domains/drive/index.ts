/**
 * @file 对云盘文件进行分析
 * 包含哪些影视剧
 */
import { Handler } from "mitt";

import { fetch_async_task } from "@/domains/async_task/services";
import { BaseDomain } from "@/domains/base";
import Helper from "@/domains/list-helper-core";
import { Result } from "@/types";

import {
  analysis_aliyun_drive,
  export_aliyun_drive,
  refresh_drive_profile,
  set_drive_refresh_token,
  set_drive_root_file_id,
  update_aliyun_drive,
  fetch_aliyun_drives,
  AliyunDriveItem,
  fetch_aliyun_drive_files,
  add_folder_in_drive,
} from "./services";

enum Events {
  StateChange,
  /** 一些外部输入项改变 */
  ValuesChange,
  FoldersChange,
  Tip,
  Error,
  Login,
  Logout,
  Completed,
}

type TheTypesOfEvents = {
  [Events.StateChange]: DriveState;
  [Events.ValuesChange]: Partial<{
    root_folder_id: string;
    refresh_token: string;
    folder_name: string;
  }>;
  [Events.FoldersChange]: (DriveFile | DriveFolder)[][];
  [Events.Tip]: string[];
  [Events.Error]: Error;
  [Events.Login]: {};
  [Events.Logout]: void;
  [Events.Completed]: {
    desc: string;
  };
};
type DriveFolder = {
  file_id: string;
  name: string;
  children: (DriveFolder | DriveFile)[];
};
type DriveFile = {
  file_id: string;
  name: string;
};
type DriveState = AliyunDriveItem & {
  loading: boolean;
};
const helper = new Helper<AliyunDriveItem>(fetch_aliyun_drives);
export class Drive extends BaseDomain<TheTypesOfEvents> {
  /** 网盘id */
  id: string;
  /** 刮削状态轮询定时器 */
  timer: NodeJS.Timer | null = null;
  /** 网盘状态 */
  state: DriveState;
  /** 表单值 */
  values: Partial<{
    root_folder_id: string;
    refresh_token: string;
    folder_name: string;
  }> = {};
  /** 文件夹列表相关状态 */
  list: {
    /** 文件列表搜索关键字 */
    keyword: string;
    /** 是否正在请求文件列表 */
    loading: boolean;
    pageSize: number;
    nextMarker: string;
  } = {
    keyword: "",
    loading: false,
    pageSize: 10,
    nextMarker: "",
  };
  /** 文件夹列表 */
  folderColumns: (DriveFolder | DriveFile)[][] = [];

  /** 网盘列表辅助类 */
  static ListHelper = {
    response: Helper.defaultResponse,
    async init() {
      const r = await helper.init();
      const { error, dataSource } = r;
      if (error) {
        return Result.Err(error);
      }
      return Result.Ok(
        dataSource.map((drive) => {
          const d = new Drive({
            ...drive,
            loading: false,
          });
          return d;
        })
      );
    },
  };

  constructor(options: DriveState) {
    super();
    const { id } = options;
    this.id = id;
    this.state = options;
  }

  /** 开始刮削网盘 */
  async startScrape() {
    if (this.timer) {
      this.emit(Events.Tip, ["索引正在进行中..."]);
      return;
    }
    this.emit(Events.Tip, ["开始索引，请等待一段时间后刷新查看"]);
    this.state.loading = true;
    this.emit(Events.StateChange, { ...this.state });
    const resp = await analysis_aliyun_drive({ aliyun_drive_id: this.id });
    if (resp.error) {
      this.state.loading = false;
      this.emit(Events.StateChange, { ...this.state });
      this.emit(Events.Tip, ["索引失败", resp.error.message]);
      return;
    }
    const { async_task_id } = resp.data;
    this.timer = setInterval(async () => {
      const r = await fetch_async_task(async_task_id);
      if (r.error) {
        this.state.loading = false;
        this.emit(Events.StateChange, { ...this.state });
        this.emit(Events.Tip, ["获取索引状态失败", r.error.message]);
        if (this.timer) {
          clearTimeout(this.timer);
        }
        return;
      }
      if (r.data.status === "Pause") {
        this.state.loading = false;
        this.emit(Events.Tip, ["索引被中断"]);
        this.emit(Events.StateChange, { ...this.state });
        if (this.timer) {
          clearInterval(this.timer);
        }
        return;
      }
      if (r.data.status === "Finished") {
        this.state.loading = false;
        this.emit(Events.Tip, ["索引完成"]);
        this.emit(Events.StateChange, { ...this.state });
        this.emitCompleted(r.data);
        if (this.timer) {
          clearInterval(this.timer);
        }
      }
    }, 3000);
  }
  /** 导出网盘信息 */
  async export() {
    const r = await export_aliyun_drive({ aliyun_drive_id: this.id });
    if (r.error) {
      this.emit(Events.Error, r.error);
      return;
    }
    // copy(JSON.stringify(r.data));
    this.emit(Events.Tip, ["网盘信息已复制到剪贴板"]);
  }
  async update() {
    const r = await update_aliyun_drive(this.id, this.values);
    this.values = {};
    if (r.error) {
      this.emitError(r.error.message);
      return Result.Err(r.error.message);
    }
    this.emitTip("更新云盘信息成功");
    return Result.Ok("更新云盘信息成功");
  }
  /** 刷新网盘基本信息 */
  async refresh() {
    const r = await refresh_drive_profile({ aliyun_drive_id: this.id });
    if (r.error) {
      this.emit(Events.Tip, ["刷新失败", r.error.message]);
      return;
    }
    const { user_name, avatar, used_size, total_size, used_percent } = r.data;
    this.state = Object.assign({}, this.state, {
      avatar,
      user_name,
      used_size,
      total_size,
      used_percent,
    });
    this.emit(Events.Tip, ["刷新成功"]);
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 输入网盘根目录 id */
  inputRootFolder(folder: { file_id: string }) {
    const { file_id } = folder;
    this.values.root_folder_id = file_id;
    this.emit(Events.ValuesChange, {
      ...this.values,
    });
  }
  /** 设置网盘索引根目录 */
  async setRootFolder() {
    const { root_folder_id } = this.values;
    if (!root_folder_id) {
      this.emit(Events.Tip, ["缺少 root_folder_id 参数"]);
      return Result.Err("缺少 root_folder_id 参数");
    }
    const r = await set_drive_root_file_id({
      root_folder_id: root_folder_id,
      drive_id: this.id,
    });
    this.values.root_folder_id = null;
    if (r.error) {
      this.emit(Events.Tip, ["设置索引根目录失败", r.error.message]);
      return Result.Err(r.error);
    }
    this.state.initialized = true;
    this.emit(Events.Tip, ["更新成功"]);
    this.emit(Events.StateChange, { ...this.state });
    return Result.Ok(null);
  }
  /** 输入网盘 refresh_token */
  setRefreshToken(token: string) {
    this.values.refresh_token = token;
  }
  /** 提交网盘 refresh_token */
  async submitRefreshToken() {
    const { refresh_token } = this.values;
    if (!refresh_token) {
      return Result.Err("缺少 refresh_token 参数");
    }
    const r = await set_drive_refresh_token({
      refresh_token,
      drive_id: this.id,
    });
    if (r.error) {
      this.emitError(r.error.message);
      return Result.Err(r.error);
    }
    this.emitTip("更新成功");
    return Result.Ok(null);
  }
  /** 获取该网盘内的文件/文件夹列表 */
  async _fetch(folder: { file_id: string; name: string }) {
    const { file_id, name } = folder;
    // this.file_id = file_id;
    if (this.list.loading) {
      this.emit(Events.Tip, ["正在请求..."]);
      return;
    }
    const body = (() => {
      return {
        name: this.list.keyword ?? undefined,
        drive_id: this.id,
        file_id,
        page_size: this.list.pageSize,
        next_marker: this.list.nextMarker,
      };
    })();
    this.list.loading = true;
    const r = await fetch_aliyun_drive_files(body);
    this.list.loading = false;
    if (r.error) {
      return r;
    }
    return r;
  }
  async fetch(folder: { file_id: string; name: string }, index = 0) {
    const { file_id = "root", name = "文件" } = folder;
    this.list.nextMarker = "";

    const r = await this._fetch(folder);
    if (r.error) {
      this.emit(Events.Tip, ["获取文件列表失败", r.error.message]);
      return;
    }
    // 初始化
    if (this.folderColumns.length === 0) {
      this.folderColumns = [[{ file_id, name, children: [] }]];
      this.emit(Events.FoldersChange, [...this.folderColumns]);
      return;
    }

    this.list.nextMarker = r.data.next_marker;
    this.folderColumns = (() => {
      const existingFolder = this.folderColumns[index].find(
        (p) => p.file_id === file_id
      );
      console.log(
        "[]before modify folder columns",
        this.folderColumns,
        r.data.items,
        index
      );
      if (existingFolder) {
      }
      if (index === 0) {
        return this.folderColumns.concat([r.data.items]);
      }
      const parentColumns = this.folderColumns.slice(0, index);
      return parentColumns.concat([r.data.items]);
    })();
    this.emit(Events.FoldersChange, [...this.folderColumns]);
  }
  async search(keyword: string) {
    // this.list.keyword = keyword;
    // const r = await this._fetch(this.file_id);
    // this.keyword = "";
    // if (r.error) {
    //   return r;
    // }
    // this.files = this.files = r.data.items;
    // this.paths = [];
    // this.next_marker = r.data.next_marker;
    // return Result.Ok(null);
  }
  async loadMore() {
    // const r = await this._fetch(this.file_id);
    // if (r.error) {
    //   return r;
    // }
    // this.files = this.files.concat(r.data.items);
    // this.next_marker = r.data.next_marker;
    // return Result.Ok(null);
  }
  inputNewFolderName(value: string) {
    this.values.folder_name = value;
  }
  async addFolder() {
    const { folder_name } = this.values;
    if (!folder_name) {
      this.emit(Events.Tip, ["请先输入文件夹名称"]);
      return;
    }
    const r = await add_folder_in_drive({
      drive_id: this.id,
      name: folder_name,
    });
    if (r.error) {
      this.emit(Events.Tip, ["添加文件夹失败", r.error.message]);
      return Result.Err(r.error);
    }
    this.emit(Events.Tip, ["添加文件夹成功"]);
    this.fetch({ file_id: "root", name: "文件" });
    return Result.Ok(r.data);
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
  emitTip(msg: string) {
    this.emit(Events.Tip, [msg]);
  }
  onTip(handler: Handler<TheTypesOfEvents[Events.Tip]>) {
    this.on(Events.Tip, handler);
  }
  emitError(msg: string) {
    this.emit(Events.Error, new Error(msg));
  }
  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    this.on(Events.Error, handler);
  }
  emitCompleted(result: TheTypesOfEvents[Events.Completed]) {
    this.emit(Events.Completed, result);
  }
  onCompleted(handler: Handler<TheTypesOfEvents[Events.Completed]>) {
    this.on(Events.Completed, handler);
  }
  onFolderColumnChange(
    handler: Handler<TheTypesOfEvents[Events.FoldersChange]>
  ) {
    this.on(Events.FoldersChange, handler);
  }
  onValuesChange(handler: Handler<TheTypesOfEvents[Events.ValuesChange]>) {
    this.on(Events.ValuesChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "Drive";
  }
}
