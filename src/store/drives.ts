/**
 * @file 云盘列表
 */
import { RequestCore } from "@/domains/client";
import { fetch_drive_instance_list } from "@/domains/drive/services";
import { ListCore } from "@/domains/list";

export const driveList = new ListCore(new RequestCore(fetch_drive_instance_list));
