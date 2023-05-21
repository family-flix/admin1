/**
 * @file 对云盘文件进行分析
 * 包含哪些影视剧
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { ListCore } from "@/domains/list";
import { fetch_async_task } from "@/domains/async_task/services";
import { Result } from "@/types";

import {
  analysisDrive,
  exportDriveInfo,
  refreshDriveProfile,
  setAliyunDriveRefreshToken,
  set_drive_root_file_id,
  updateAliyunDrive,
  fetchDrives,
  DriveItem,
  fetchDriveFiles,
  addFolderInDrive,
  checkInDrive,
  analysisDriveQuickly,
} from "./services";
import { TaskStatus } from "@/constants";

enum Events {
  StateChange,
  /** 一些外部输入项改变 */
  ValuesChange,
  FoldersChange,
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
type DriveState = DriveItem & {
  loading: boolean;
};
const helper = new ListCore<DriveItem>(fetchDrives);
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
    response: ListCore.defaultResponse,
    async init() {
      const r = await helper.init();
      if (r.error) {
        return Result.Err(r.error);
      }
      return Result.Ok(
        r.data.dataSource.map((drive) => {
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
    super(options);
    const { id, name } = options;
    this.id = id;
    this.name = name;
    this.state = options;
  }

  /**
   * 开始索引云盘
   * @param {boolean} [quickly=false] 是否增量索引
   */
  async startScrape(quickly: boolean = false) {
    if (this.timer) {
      this.tip({ text: ["索引正在进行中..."] });
      return Result.Ok(null);
    }
    this.tip({ text: ["开始索引，请等待一段时间后刷新查看"] });
    this.state.loading = true;
    this.emit(Events.StateChange, { ...this.state });
    const r = await (() => {
      if (quickly) {
        return analysisDriveQuickly({ drive_id: this.id });
      }
      return analysisDrive({ drive_id: this.id });
    })();
    if (r.error) {
      this.state.loading = false;
      this.emit(Events.StateChange, { ...this.state });
      this.tip({ text: ["索引失败", r.error.message] });
      return Result.Err(r.error);
    }
    const { async_task_id } = r.data;
    this.timer = setInterval(async () => {
      const r = await fetch_async_task(async_task_id);
      if (r.error) {
        this.state.loading = false;
        this.emit(Events.StateChange, { ...this.state });
        this.tip({ text: ["获取索引状态失败", r.error.message] });
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        return;
      }
      if (r.data.status === TaskStatus.Paused) {
        this.state.loading = false;
        this.tip({ text: ["索引被中断"] });
        this.emit(Events.StateChange, { ...this.state });
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
        return;
      }
      if (r.data.status === TaskStatus.Finished) {
        this.state.loading = false;
        this.tip({ text: ["索引完成"] });
        this.emit(Events.StateChange, { ...this.state });
        this.emitCompleted(r.data);
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    }, 3000);
  }
  /** 导出云盘信息（可直接导入其他网站） */
  async export() {
    const r = await exportDriveInfo({ drive_id: this.id });
    if (r.error) {
      this.emit(Events.Error, r.error);
      return;
    }
    this.tip({ text: ["网盘信息已复制到剪贴板"] });
  }
  /** 更新云盘基本信息 */
  async update() {
    const r = await updateAliyunDrive(this.id, this.values);
    this.values = {};
    if (r.error) {
      this.tip({ text: ["更新失败", r.error.message] });
      return Result.Err(r.error.message);
    }
    this.tip({ text: ["更新云盘信息成功"] });
    return Result.Ok("更新云盘信息成功");
  }
  /** 刷新网盘基本信息 */
  async refresh() {
    const r = await refreshDriveProfile({ drive_id: this.id });
    if (r.error) {
      this.tip({ text: ["刷新失败", r.error.message] });
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
    this.tip({ text: ["刷新成功"] });
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
      const text = this.tip({ text: ["缺少 root_folder_id 参数"] });
      return Result.Err(text);
    }
    const r = await set_drive_root_file_id({
      root_folder_id: root_folder_id,
      drive_id: this.id,
    });
    this.values.root_folder_id = null;
    if (r.error) {
      const text = this.tip({ text: ["设置索引根目录失败", r.error.message] });
      return Result.Err(text);
    }
    this.state.initialized = true;
    this.tip({ text: ["更新成功"] });
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
    const r = await setAliyunDriveRefreshToken({
      refresh_token,
      drive_id: this.id,
    });
    if (r.error) {
      this.tip({ text: ["更新失败", r.error.message] });
      return Result.Err(r.error);
    }
    this.tip({ text: ["更新成功"] });
    return Result.Ok(null);
  }
  /** 获取该网盘内的文件/文件夹列表 */
  async _fetch(folder: { file_id: string; name: string }) {
    const { file_id, name } = folder;
    // this.file_id = file_id;
    if (this.list.loading) {
      this.tip({ text: ["正在请求..."] });
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
    const r = await fetchDriveFiles(body);
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
      this.tip({ text: ["获取文件列表失败", r.error.message] });
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
      this.tip({ text: ["请先输入文件夹名称"] });
      return;
    }
    const r = await addFolderInDrive({
      drive_id: this.id,
      name: folder_name,
    });
    if (r.error) {
      this.tip({ text: ["添加文件夹失败", r.error.message] });
      return Result.Err(r.error);
    }
    this.tip({ text: ["添加文件夹成功"] });
    this.fetch({ file_id: "root", name: "文件" });
    return Result.Ok(r.data);
  }
  async checkIn() {
    const r = await checkInDrive({ drive_id: this.id });
    if (r.error) {
      this.tip({ text: ["签到失败", r.error.message] });
      return;
    }
    this.tip({ text: ["签到成功"] });
    this.refresh();
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
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
