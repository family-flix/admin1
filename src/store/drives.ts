/**
 * @file 云盘列表
 */
import { RequestCore } from "@/domains/request";
import { fetchDriveInstanceList } from "@/domains/drive/services";
import { ListCore } from "@/domains/list";

export const driveList = new ListCore(new RequestCore(fetchDriveInstanceList));
