/**
 * @file 对云盘文件进行分析
 * 包含哪些影视剧
 */
import { Handler } from "mitt";

import { fetch_async_task } from "@/domains/async_task/services";
import { BaseDomain } from "@/domains/base";
import { Result } from "@/types";

import {
  analysis_aliyun_drive,
  export_aliyun_drive,
  refresh_aliyun_drive,
  set_drive_refresh_token,
  set_drive_root_file_id,
  update_aliyun_drive,
} from "./services";

export enum Events {
  Tip,
  Error,
  Login,
  Logout,
  Completed,
}
type TheTypeOfEvent = {
  [Events.Tip]: string[];
  [Events.Error]: Error;
  [Events.Login]: {};
  [Events.Logout]: void;
  [Events.Completed]: {
    desc: string;
  };
};
export class Drive extends BaseDomain<TheTypeOfEvent> {
  /** 网盘id */
  id: string;
  /** 刮削状态轮询定时器 */
  timer: NodeJS.Timer | null = null;
  values: Partial<{
    root_folder_id: string;
    refresh_token: string;
  }> = {};

  constructor(options: { id: string }) {
    super();

    this.id = options.id;
  }
  /** 开始刮削网盘 */
  async startScrape() {
    if (this.timer) {
      return this.emitError("索引正在进行中...");
    }
    this.emitTip("开始刮削，请等待一段时间后刷新查看");
    const resp = await analysis_aliyun_drive({ aliyun_drive_id: this.id });
    if (resp.error) {
      return this.emitError(resp.error.message);
    }
    const { async_task_id } = resp.data;
    this.timer = setInterval(async () => {
      const r = await fetch_async_task(async_task_id);
      if (r.error) {
        this.emitError(r.error.message);
        if (this.timer) {
          clearTimeout(this.timer);
        }
        return;
      }
      if (r.data.status !== "Finished") {
        return;
      }
      this.emitTip("索引完成");
      this.emitCompleted(r.data);
      if (this.timer) {
        clearInterval(this.timer);
      }
    }, 3000);
  }
  /** 导出网盘信息 */
  async export() {
    const r = await export_aliyun_drive({ aliyun_drive_id: this.id });
    if (r.error) {
      this.emitError(r.error.message);
      return;
    }
    // copy(JSON.stringify(r.data));
    this.emitTip("复制成功");
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

  async refresh() {
    const r = await refresh_aliyun_drive({ aliyun_drive_id: this.id });
    if (r.error) {
      this.emitError(r.error.message);
      return;
    }
    this.emitTip("刷新成功");
  }
  setRootFolderId(id: string) {
    this.values.root_folder_id = id;
  }
  async submitRootFolder() {
    const { root_folder_id } = this.values;
    if (!root_folder_id) {
      return Result.Err("缺少 root_folder_id 参数");
    }
    const r = await set_drive_root_file_id({
      root_folder_id: root_folder_id,
      drive_id: this.id,
    });
    if (r.error) {
      this.emitError(r.error.message);
      return Result.Err(r.error);
    }
    this.emitTip("更新成功");
    return Result.Ok(null);
  }
  setRefreshToken(token: string) {
    this.values.refresh_token = token;
  }
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
  emitTip(msg: string) {
    this.emit(Events.Tip, [msg]);
  }
  onTip(handler: Handler<TheTypeOfEvent[Events.Tip]>) {
    this.on(Events.Tip, handler);
  }
  emitError(msg: string) {
    this.emit(Events.Error, new Error(msg));
  }
  onError(handler: Handler<TheTypeOfEvent[Events.Error]>) {
    this.on(Events.Error, handler);
  }
  emitCompleted(result: TheTypeOfEvent[Events.Completed]) {
    this.emit(Events.Completed, result);
  }
  onCompleted(handler: Handler<TheTypeOfEvent[Events.Completed]>) {
    this.on(Events.Completed, handler);
  }

  get [Symbol.toStringTag]() {
    return "Domain";
  }
}
