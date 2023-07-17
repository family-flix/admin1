/**
 * @file 云盘实例
 * 包含所有云盘相关的操作、数据
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { TaskStatus } from "@/constants";
import { sleep } from "@/utils";
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
  deleteDrive,
  matchMediaFilesMedia,
  receiveCheckInRewardOfDrive,
} from "./services";

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
type DriveProps = DriveItem & {
  loading?: boolean;
};
type DriveState = DriveItem & {
  loading: boolean;
};
const helper = new ListCore(new RequestCore(fetchDrives));
export class DriveCore extends BaseDomain<TheTypesOfEvents> {
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
          const d = new DriveCore({
            ...drive,
            loading: false,
          });
          return d;
        })
      );
    },
    async refresh() {
      const r = await helper.refresh();
      if (r.error) {
        return Result.Err(r.error);
      }
      return Result.Ok(
        r.data.dataSource.map((drive) => {
          const d = new DriveCore({
            ...drive,
            loading: false,
          });
          return d;
        })
      );
    },
  };

  /** 网盘id */
  id: string;
  name: string;
  /** 刮削状态轮询定时器 */
  timer: NodeJS.Timer | null = null;
  /** 网盘状态 */
  state: DriveState;
  /** 表单值 */
  values: Partial<{
    // root_folder_id: string;
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
  folderColumns: ({
    selected?: boolean;
  } & (DriveFolder | DriveFile))[][] = [];
  /** 当前选中的文件夹 */
  selectedFolderPos?: number[];

  constructor(options: Partial<{ _name: string }> & DriveProps) {
    super(options);

    const { _name, id, name } = options;
    this.id = id;
    this.name = name;
    if (_name) {
      this._name = _name;
    }
    this.state = {
      ...options,
      loading: false,
    };
  }

  /**
   * 开始索引云盘
   * @param {boolean} [quickly=false] 是否增量索引
   */
  async startScrape(quickly: boolean = false) {
    if (this.state.loading) {
      this.tip({ text: ["索引正在进行中..."] });
      return Result.Ok(null);
    }
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
    this.tip({ text: ["开始索引，请等待一段时间后刷新查看"] });
    const { job_id } = r.data;
    return Result.Ok(job_id);
    // this.timer = setInterval(async () => {
    //   const r = await fetch_job_profile(job_id);
    //   if (r.error) {
    //     this.state.loading = false;
    //     this.emit(Events.StateChange, { ...this.state });
    //     this.tip({ text: ["获取索引状态失败", r.error.message] });
    //     if (this.timer) {
    //       clearTimeout(this.timer);
    //       this.timer = null;
    //     }
    //     return;
    //   }
    //   if (r.data.status === TaskStatus.Paused) {
    //     this.state.loading = false;
    //     this.tip({ text: ["索引被中断"] });
    //     this.emit(Events.StateChange, { ...this.state });
    //     if (this.timer) {
    //       clearInterval(this.timer);
    //       this.timer = null;
    //     }
    //     return;
    //   }
    //   if (r.data.status === TaskStatus.Finished) {
    //     this.state.loading = false;
    //     this.tip({ text: ["索引完成"] });
    //     this.emit(Events.StateChange, { ...this.state });
    //     this.emitCompleted(r.data);
    //     if (this.timer) {
    //       clearInterval(this.timer);
    //       this.timer = null;
    //     }
    //   }
    // }, 3000);
    // return Result.Ok(null);
  }
  finishAnalysis() {
    this.state.loading = false;
    this.tip({ text: ["索引完成"] });
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 搜索云盘内解析得到的影视剧 */
  async matchMediaFilesProfile() {
    if (this.state.loading) {
      this.tip({ text: ["匹配正在进行中..."] });
      return Result.Ok(null);
    }
    this.state.loading = true;
    this.emit(Events.StateChange, { ...this.state });
    const r = await matchMediaFilesMedia({
      drive_id: this.id,
    });
    if (r.error) {
      this.state.loading = false;
      this.emit(Events.StateChange, { ...this.state });
      this.tip({ text: ["匹配失败", r.error.message] });
      return Result.Err(r.error);
    }
    this.tip({ text: ["开始匹配，请等待一段时间后刷新查看"] });
    const { job_id } = r.data;
    return Result.Ok(job_id);
  }
  finishMediaMatch() {
    this.state.loading = false;
    this.tip({ text: ["匹配完成"] });
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 导出云盘信息（可直接导入其他网站） */
  async export() {
    const r = await exportDriveInfo({ drive_id: this.id });
    if (r.error) {
      const msg = this.tip({ text: ["导出失败", r.error.message] });
      return Result.Err(msg);
    }
    return Result.Ok(r.data);
  }
  async delete() {
    const r = await deleteDrive({ drive_id: this.id });
    if (r.error) {
      const msg = this.tip({ text: ["删除失败", r.error.message] });
      return Result.Err(msg);
    }
    this.tip({ text: ["删除成功"] });
    return Result.Ok(null);
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
  async _refresh() {
    const r = await refreshDriveProfile({ drive_id: this.id });
    if (r.error) {
      // this.tip({ text: ["刷新失败", r.error.message] });
      return Result.Err(r.error);
    }
    const { user_name, avatar, used_size, total_size, used_percent } = r.data;
    console.log("[]percent", used_percent);
    // this.tip({ text: ["刷新成功"] });
    return Result.Ok({
      avatar,
      user_name,
      used_size,
      total_size,
      used_percent,
    });
    // this.emit(Events.StateChange, { ...this.state });
  }
  /** 刷新网盘基本信息 */
  async refresh() {
    const r = await this._refresh();
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
  async receiveRewards() {
    const r = await receiveCheckInRewardOfDrive({ drive_id: this.id });
    if (r.error) {
      this.tip({ text: ["领取失败", r.error.message] });
      return;
    }
    const r2 = await this._refresh();
    if (r2.error) {
      this.tip({ text: ["领取成功，请手动刷新页面"] });
      return;
    }
    this.tip({ text: ["领取成功"] });
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 输入网盘根目录 id */
  // inputRootFolder(folder: { file_id: string }) {
  //   const { file_id } = folder;
  //   this.values.root_folder_id = file_id;
  //   this.emit(Events.ValuesChange, {
  //     ...this.values,
  //   });
  // }
  /** 设置网盘索引根目录 */
  async setRootFolder(file_id: string) {
    // const { root_folder_id } = this.values;
    // if (!root_folder_id) {
    //   const text = this.tip({ text: ["缺少 root_folder_id 参数"] });
    //   return Result.Err(text);
    // }
    const r = await set_drive_root_file_id({
      root_folder_id: file_id,
      drive_id: this.id,
    });
    // this.values.root_folder_id = null ?? undefined;
    if (r.error) {
      // const text = this.tip({ text: ["设置索引根目录失败", r.error.message] });
      return Result.Err(r.error);
    }
    this.state.initialized = true;
    // this.tip({ text: ["更新成功"] });
    this.emit(Events.StateChange, { ...this.state });
    return Result.Ok(null);
  }
  /** 输入网盘 refresh_token */
  setRefreshToken(token: string) {
    this.values.refresh_token = token;
  }
  refreshTokenRequest = new RequestCore(setAliyunDriveRefreshToken);
  /** 提交网盘 refresh_token */
  async submitRefreshToken() {
    const { refresh_token } = this.values;
    if (!refresh_token) {
      return Result.Err("缺少 refresh_token 参数");
    }
    const r = await this.refreshTokenRequest.run({
      refresh_token,
      drive_id: this.id,
    });
    if (r.error) {
      this.tip({ text: ["修改 refresh_token 失败", r.error.message] });
      return Result.Err(r.error);
    }
    this.tip({ text: ["修改 refresh_token 成功"] });
    return Result.Ok(null);
  }
  /** 获取该网盘内的文件/文件夹列表 */
  async _fetch(folder: { file_id: string; name: string }) {
    const { file_id, name } = folder;
    // this.file_id = file_id;
    if (this.list.loading) {
      // this.tip({ text: ["正在请求..."] });
      return Result.Err("正在请求...");
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
      return Result.Err(r.error);
    }
    const { items, next_marker } = r.data;
    return Result.Ok({
      items,
      next_marker,
    });
  }
  async fetch(folder: { file_id: string; name: string }, index = 0) {
    console.log("[DOMAIN]Drive - fetch", index);
    const { file_id, name } = folder;
    this.list.nextMarker = "";
    const r = await this._fetch(folder);
    if (r.error) {
      this.tip({ text: ["获取文件列表失败", r.error.message] });
      return;
    }
    const { items, next_marker } = r.data;
    this.list.nextMarker = next_marker;
    // 初始化
    if (this.folderColumns.length === 0) {
      this.folderColumns = [
        [
          {
            file_id,
            name,
          },
        ],
        r.data.items,
      ];
      this.emit(Events.FoldersChange, [...this.folderColumns]);
      return;
    }
    this.folderColumns = (() => {
      // const existingFolder = this.folderColumns[index].find((p) => p.file_id === file_id);
      // console.log("[]before modify folder columns", this.folderColumns, r.data.items, index);
      // if (existingFolder) {
      // }
      if (index === 0) {
        return [this.folderColumns[0]].concat([items]);
      }
      const parentColumns = this.folderColumns.slice(0, index + 1);
      // console.log(parentColumns);
      return parentColumns.concat([items]);
    })();
    for (let i = 0; i < this.folderColumns.length; i += 1) {
      const column = this.folderColumns[i];
      for (let j = 0; j < column.length; j += 1) {
        const f = column[j];
        f.selected = false;
      }
    }
    if (this.selectedFolderPos) {
      const [x, y] = this.selectedFolderPos;
      const matched = this.folderColumns[x][y];
      matched.selected = true;
    }
    this.emit(Events.FoldersChange, [...this.folderColumns]);
  }
  clearFolderColumns() {
    // console.log("clearFolderColumns");
    this.folderColumns = [];
    this.emit(Events.FoldersChange, [...this.folderColumns]);
  }
  /** 选中文件/文件夹 */
  select(folder: { file_id: string }, index: number[]) {
    const { file_id } = folder;
    // const [x, y] = index;
    // const selectedFolder = this.folderColumns[x][y];
    // selectedFolder.selected = true;
    this.selectedFolderPos = index;
    // this.emit(Events.FoldersChange, [...this.folderColumns]);
    // if ()
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
      const msg = this.tip({ text: ["请先输入文件夹名称"] });
      return Result.Err(msg);
    }
    const r = await addFolderInDrive({
      drive_id: this.id,
      name: folder_name,
    });
    if (r.error) {
      const msg = this.tip({ text: ["添加文件夹失败", r.error.message] });
      return Result.Err(msg);
    }
    this.tip({ text: ["添加文件夹成功"] });
    this.fetch({ file_id: "root", name: "文件" });
    return Result.Ok(r.data);
  }
  async checkIn() {
    const r = await checkInDrive({ drive_id: this.id });
    if (r.error) {
      const msg = this.tip({ text: ["签到失败", r.error.message] });
      return Result.Err(msg);
    }
    const r2 = await this._refresh();
    if (r2.error) {
      const msg = this.tip({ text: ["刷新失败", r2.error.message] });
      return Result.Err(msg);
    }
    const { user_name, avatar, used_size, total_size, used_percent } = r2.data;
    this.state = Object.assign({}, this.state, {
      avatar,
      user_name,
      used_size,
      total_size,
      used_percent,
    });
    this.emit(Events.StateChange, { ...this.state });
    this.tip({ text: ["签到成功"] });
    return Result.Ok(null);
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
  onFolderColumnChange(handler: Handler<TheTypesOfEvents[Events.FoldersChange]>) {
    this.on(Events.FoldersChange, handler);
  }
  onValuesChange(handler: Handler<TheTypesOfEvents[Events.ValuesChange]>) {
    this.on(Events.ValuesChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "Drive";
  }
}
