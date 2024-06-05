/**
 * @file 云盘列表
 */
import { fetchDriveList, fetchDriveListProcess } from "@/biz/drive/services";
import { DriveCore } from "@/biz/drive/index";
import { TmpRequestResp } from "@/domains/request/utils";
import { Result } from "@/domains/result";
import { RequestCore } from "@/domains/request/index";
import { ListCore } from "@/domains/list/index";

import { client } from "./request";

function fetchDriveInstanceList(r: TmpRequestResp<typeof fetchDriveList>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const r2 = fetchDriveListProcess(r);
  if (r2.error) {
    return Result.Err(r2.error.message);
  }
  const { list, ...rest } = r2.data;
  return Result.Ok({
    ...rest,
    list: list.map((drive) => {
      return new DriveCore(drive);
    }),
  });
}
export const driveList = new ListCore(new RequestCore(fetchDriveList, { process: fetchDriveInstanceList, client }), {
  search: {
    hidden: 0,
  },
});
