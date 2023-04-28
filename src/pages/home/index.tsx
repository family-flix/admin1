/**
 * @file 管理后台首页
 */
import { createSignal, For } from "solid-js";
// import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetch_unknown_tv_list, UnknownTVItem } from "@/services";
// import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import CopyAndCheckIcon from "@/components/CopyIcon";
import {
  add_aliyun_drive,
  fetch_aliyun_drives,
  AliyunDriveItem,
} from "@/domains/drive/services";
import { Application } from "@/domains/app";
import { ViewCore } from "@/domains/router";
import { PageCore } from "@/domains/router/something";
import { DialogCore } from "@/domains/ui/dialog";
import { FormCore } from "@/domains/ui/form";
import Client from "@/domains/client";
import Helper from "@list-helper/core/core";
// import { useToast } from "@/hooks/use-toast";
// import { copy } from "@/utils/front_end";
// import { Result } from "@/types";
import DriveCard from "@/components/DriveCard";
import Modal from "@/components/SingleModal";

export const HomePage = (props: {
  app: Application;
  router: ViewCore;
  page: PageCore;
}) => {
  const { app, router, page } = props;
  const [count, setCount] = createSignal(0);
  const [driveResponse, setDriveResponse] = createSignal(
    Helper.defaultResponse
  );
  const [unknownTVResponse, setUnknownTVHelper] = createSignal(
    Helper.defaultResponse
  );
  // const { toast } = useToast();

  console.log("[PAGE]home - render");

  setInterval(() => {
    setCount((prev) => prev + 1);
  }, 1000);
  const modal = new DialogCore();
  const form = new FormCore<{ payload: string }>();
  const addingDriveClient = new Client(add_aliyun_drive);
  addingDriveClient.onError((error) => {
    app.tip({
      text: error.message,
    });
  });
  addingDriveClient.onSuccess(() => {
    app.tip({ text: "添加网盘成功" });
  });
  const driveList = new Helper<AliyunDriveItem>(fetch_aliyun_drives);
  driveList.onChange = (nextResponse) => {
    setDriveResponse(nextResponse);
  };
  const unknownTVList = new Helper<UnknownTVItem>(fetch_unknown_tv_list, {
    pageSize: 12,
  });
  unknownTVList.onChange = (nextResponse) => {
    setUnknownTVHelper(nextResponse);
  };
  driveList.init();

  const driveRecords = () => driveResponse().dataSource;
  const unknownTVRecords = () => unknownTVResponse().dataSource;

  return (
    <>
      <div>
        <div class="section">
          <h2 class="my-2 text-2xl">云盘列表{count()}</h2>
          <div class="grid grid-cols-3 gap-2">
            <For each={driveRecords()}>
              {(drive) => {
                return (
                  <div>
                    <DriveCard {...drive} />
                  </div>
                );
              }}
            </For>
            <div class="p-4 bg-white rounded-xl">
              <div class="grid w-full gap-2">
                <Textarea
                  className=""
                  placeholder="请输入云盘信息"
                  onChange={(event) => {
                    form.input("payload", event.target.value);
                  }}
                />
                <div class="grid grid-cols-12">
                  <Button
                    className="col-span-10"
                    variant="default"
                    size="default"
                    onClick={() => {
                      addingDriveClient.submit(form.values);
                    }}
                  >
                    添加云盘
                  </Button>
                  {/* <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger class="col-span2">
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <div class="p-4 w-[360px]">
                                <p>1、在网页端登录阿里云盘</p>
                                <p>2、复制下面代码</p>
                                <p>
                                  3、回到已登录的阿里云盘页面，在浏览器「地址栏」手动输入
                                  `javascript:`
                                </p>
                                <p>4、粘贴复制的代码并回车</p>
                                <div class="mt-2 border rounded-sm bg-gray-200">
                                  <div class="relative">
                                    <div class="overflow-y-auto h-[60px] break-all whitespace-pre-wrap">
                                      {code_get_drive_token}
                                    </div>
                                  </div>
                                </div>
                                <div class="mt-2 flex justify-end">
                                  <CopyAndCheckIcon
                                    on_click={() => {
                                      // copy(code_get_drive_token);
                                    }}
                                  />
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal title="hello" core={modal}>
        <div>Hello</div>
      </Modal>
      {/* <TMDBSearcherDialog
        visible={visible}
        title={
          cur_incorrect_tv_ref.current
            ? `为 ${cur_incorrect_tv_ref.current.name} 修正`
            : "影视剧搜索"
        }
        on_submit={async (t) => {
          if (cur_incorrect_tv_ref.current === null) {
            alert("请先选择要修正的影片");
            return Result.Err("请先选择要修正的影片");
          }
          const r = await bind_searched_tv_for_tv(
            cur_incorrect_tv_ref.current.id,
            t
          );
          if (r.error) {
            alert(r.error.message);
            return r;
          }
          cur_incorrect_tv_ref.current = null;
          unknown_tv_helper.refresh();
          return Result.Ok(true);
        }}
        on_visible_change={(next_visible) => {
          set_visible(next_visible);
        }}
      /> */}
    </>
  );
};

// export default UserProfilePage;
