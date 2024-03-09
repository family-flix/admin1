/**
 * @file 云盘实例
 * 包含所有云盘相关的操作、数据
 */
import { BaseDomain, Handler } from "@/domains/base";
import { RequestCore } from "@/domains/request";
import { Result } from "@/types";
import { FileType } from "@/constants";

import {
  analysisDrive,
  exportDriveInfo,
  refreshDriveProfile,
  setAliyunDriveRefreshToken,
  setDriveRootFolderId,
  updateAliyunDrive,
  DriveItem,
  addFolderInDrive,
  checkInDrive,
  analysisNewFilesInDrive,
  deleteDrive,
  matchParsedMediasInDrive,
  receiveCheckInRewardOfDrive,
  analysisSpecialFilesInDrive,
} from "./services";
import { AliyunDriveFile } from "./types";

enum Events {
  StateChange,
  /** 一些外部输入项改变 */
  ValuesChange,
  FoldersChange,
  PathsChange,
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
  [Events.FoldersChange]: AliyunDriveFile[][];
  [Events.PathsChange]: { file_id: string; name: string }[];
  [Events.Error]: Error;
  [Events.Login]: {};
  [Events.Logout]: void;
  [Events.Completed]: {
    desc: string;
  };
};
type DriveProps = DriveItem & {
  loading?: boolean;
};
type DriveState = DriveItem & {
  loading: boolean;
};
// const helper = new ListCore(new RequestCore(fetchDrives));
export class DriveCore extends BaseDomain<TheTypesOfEvents> {
  static Delay = (props: { id: string }) => {};

  /** 云盘id */
  id: string;
  name: string;
  /** 刮削状态轮询定时器 */
  timer: NodeJS.Timer | null = null;
  /** 云盘状态 */
  state: DriveState;
  /** 表单值 */
  values: Partial<{
    remark: string;
    hidden: number;
    root_folder_id: string;
    root_folder_name: string;
    refresh_token: string;
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
  } & AliyunDriveFile)[][] = [];
  /** 当前选中的文件夹 */
  selectedFolderPos?: number[];
  /** 当前访问路径 */
  paths: {
    file_id: string;
    name: string;
  }[] = [];

  constructor(options: Partial<{ _name: string }> & DriveProps) {
    super(options);

    const { _name, id, name, vip } = options;
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
  async startAnalysis(
    options: {
      target_folders?: AliyunDriveFile[];
      quickly?: boolean;
    } = {}
  ) {
    const { target_folders, quickly = false } = options;
    if (this.state.loading) {
      this.tip({ text: ["索引正在进行中"] });
      return Result.Ok(null);
    }
    this.state.loading = true;
    this.emit(Events.StateChange, { ...this.state });
    const r = await (() => {
      if (quickly) {
        return analysisNewFilesInDrive({ drive_id: this.id });
      }
      return analysisDrive({
        drive_id: this.id,
        target_folders: target_folders
          ? target_folders.map((folder) => {
              const { file_id, name, parent_paths, type } = folder;
              return {
                file_id,
                name,
                type: type === FileType.File ? "file" : "folder",
                parent_paths: parent_paths
                  .map((path) => {
                    return path.name;
                  })
                  .join("/"),
              };
            })
          : undefined,
      });
    })();
    if (r.error) {
      this.state.loading = false;
      this.emit(Events.StateChange, { ...this.state });
      this.tip({ text: ["索引失败", r.error.message] });
      return Result.Err(r.error);
    }
    this.tip({ text: ["开始索引，请等待一段时间后刷新查看"] });
    const { job_id } = r.data;
    return Result.Ok({ job_id });
  }
  /**
   * 索引指定文件/文件夹
   * @param {boolean} [quickly=false] 是否增量索引
   */
  async analysisSpecialFolders(options: { target_folders: AliyunDriveFile[] }) {
    const { target_folders } = options;
    if (this.state.loading) {
      return Result.Err("索引正在进行中");
    }
    this.state.loading = true;
    this.emit(Events.StateChange, { ...this.state });
    const r = await analysisSpecialFilesInDrive({
      drive_id: this.id,
      files: target_folders.map((folder) => {
        const { file_id, name, type } = folder;
        return {
          file_id,
          name,
          type,
        };
      }),
    });
    this.state.loading = false;
    if (r.error) {
      this.emit(Events.StateChange, { ...this.state });
      return Result.Err(r.error);
    }
    const { job_id } = r.data;
    return Result.Ok({ job_id });
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
    const r = await matchParsedMediasInDrive({
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
    return Result.Ok({ job_id });
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
  /** 删除该云盘 */
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
    const { name, user_name, avatar, used_size, total_size, used_percent } = r.data;
    // console.log("[]percent", used_percent);
    // this.tip({ text: ["刷新成功"] });
    return Result.Ok({
      avatar,
      name,
      user_name,
      used_size,
      total_size,
      used_percent,
    });
    // this.emit(Events.StateChange, { ...this.state });
  }
  /** 刷新云盘基本信息 */
  async refresh() {
    const r = await this._refresh();
    if (r.error) {
      this.tip({ text: ["刷新失败", r.error.message] });
      return;
    }
    const { name, user_name, avatar, used_size, total_size, used_percent } = r.data;
    this.state = Object.assign({}, this.state, {
      avatar,
      name,
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
      return Result.Err(r.error.message);
    }
    return Result.Ok({ job_id: r.data.job_id });
    // const r2 = await this._refresh();
    // if (r2.error) {
    //   this.tip({ text: ["领取成功，请手动刷新页面"] });
    //   return;
    // }
    // this.tip({ text: ["领取成功"] });
    // this.emit(Events.StateChange, { ...this.state });
  }
  /** 设置云盘索引根目录 */
  async setRootFolder(file: { file_id: string; name: string }) {
    const r = await setDriveRootFolderId({
      drive_id: this.id,
      root_folder_id: file.file_id,
      root_folder_name: file.name,
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
  /** 输入云盘 refresh_token */
  setRefreshToken(token: string) {
    this.values.refresh_token = token;
  }
  refreshTokenRequest = new RequestCore(setAliyunDriveRefreshToken);
  /** 提交云盘 refresh_token */
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
  curFolder: { file_id: string; name: string } = {
    file_id: "root",
    name: "文件",
  };
  clearFolderColumns() {
    // console.log("clearFolderColumns");
    this.folderColumns = [];
    this.emit(Events.FoldersChange, [...this.folderColumns]);
  }
  /** 选中文件/文件夹 */
  select(folder: { file_id: string; type: FileType; name: string }, index: number[]) {
    if (folder.type === FileType.File) {
      return;
    }
    this.curFolder = folder;
    this.selectedFolderPos = index;
    const [x, y] = index;
    const column = this.folderColumns[x];
    const selected_folder = column[y];
    if (this.paths[x]) {
    }
    this.paths = (() => {
      if (this.paths[x]) {
        const clone = this.paths.slice(0, x + 1);
        clone[x] = folder;
        return clone;
      }
      return this.paths.concat(selected_folder);
    })();
    this.emit(Events.PathsChange, [...this.paths]);
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
    this.values.root_folder_name = value;
  }
  async addFolder() {
    const { root_folder_name: folder_name } = this.values;
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
  onPathsChange(handler: Handler<TheTypesOfEvents[Events.PathsChange]>) {
    return this.on(Events.PathsChange, handler);
  }
  onValuesChange(handler: Handler<TheTypesOfEvents[Events.ValuesChange]>) {
    this.on(Events.ValuesChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "Drive";
  }
}

export * from "./types";
export * from "./services";
export * from "./files";
