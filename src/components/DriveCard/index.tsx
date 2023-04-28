/**
 * @file 云盘卡片，包含对云盘的业务逻辑
 */
import { onMount } from "solid-js";
// import { useEffect, useRef } from "react";
// import { RefreshCw } from "lucide-react";
// import { useRouter } from "next/router";

import { Drive } from "@/domains/drive";
import {
  AliyunDriveItem,
  set_drive_root_file_id,
} from "@/domains/drive/services";
// import { useToast } from "@/hooks/use-toast";
import LazyImage from "@/components/LazyImage";
import { Button } from "@/components/ui/button";
// import Modal from "@/components/Modal";
import { Input } from "@/components/ui/input";
import FolderMenu from "@/components/FolderMenu";
import { ContextMenuCore } from "@/domains/ui/context-menu";
import { MoreHorizontalIcon } from "@/components/icons/more-horizontal";
import { LoaderIcon } from "@/components/icons/loader";

const DriveCard = (props: AliyunDriveItem) => {
  const { id, user_name, avatar, total_size, used_size } = props;
  // const { toast } = useToast();

  // const drive_ref = useRef(new Drive({ id }));
  const drive = new Drive({ id });
  const contextMenu = new ContextMenuCore([
    {
      label: "详情",
      on_click: () => {
        // router.push(`/admin/drive/${id}`);
      },
    },
    {
      label: "导出",
      on_click() {
        drive.export();
      },
    },
    {
      label: "刷新",
      on_click() {
        drive.refresh();
      },
    },
    {
      label: "修改 refresh_token",
      on_click() {
        // drive.update_refresh_token(),
      },
    },
    {
      label: "查看重复影片",
      on_click() {
        // router.push(`/admin/drive/duplicate/${id}`);
      },
    },
  ]);

  console.log("");

  onMount(() => {
    drive.onError((error) => {
      // toast({
      //   title: error.message,
      // });
    });
    drive.onTip((msg) => {
      // toast({
      //   title: msg,
      // });
    });
    drive.onCompleted((data) => {
      // toast({
      //   title: "刮削完成",
      //   description: `${data.desc} 完成`,
      // });
    });
  });

  return (
    <div class="relative p-4 bg-white rounded-xl">
      <div
        onContextMenu={(event) => {
          const { x, y } = event;
          contextMenu.show({ x, y });
        }}
      >
        <div class="">
          <div class="absolute top-2 right-2">
            <MoreHorizontalIcon class="w-6 h-6 text-gray-600" />
          </div>
          <div class="flex">
            <LazyImage
              className="overflow-hidden w-16 h-16 mr-4 rounded"
              src={avatar}
              alt={user_name}
            />
            <div>
              <div class="text-xl">{user_name}</div>
              <div class="flex items-center space-x-2">
                <p>
                  {used_size}/{total_size}
                </p>
                <div
                  class="cursor-pointer"
                  onClick={async (event) => {
                    event.stopPropagation();
                    drive.refresh();
                  }}
                >
                  {/* <RefreshCw class="mr-2 h-4 w-4 opacity-70" /> */}
                </div>
              </div>
              <div class="mt-4 space-x-2">
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={async (event) => {
                    event.stopPropagation();
                    drive.startScrape();
                  }}
                >
                  <LoaderIcon class="w-4 h-4" />
                  刮削
                </Button>
                {/* <Modal
                  title="设置索引文件夹"
                  trigger={
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={async (event) => {
                        event.stopPropagation();
                      }}
                    >
                      设置索引文件夹
                    </Button>
                  }
                  on_ok={() => {
                    return drive.submit_root_folder();
                  }}
                >
                  <Input
                    onChange={(event) => {
                      drive.set_root_folder_id(event.target.value);
                    }}
                  />
                </Modal> */}
                {/* <Modal
                  title="修改 refresh_token"
                  trigger={
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={async (event) => {
                        event.stopPropagation();
                      }}
                    >
                      修改token
                    </Button>
                  }
                  on_ok={() => {
                    return drive.submit_refresh_token();
                  }}
                >
                  <Input
                    onChange={(event) => {
                      drive.set_refresh_token(event.target.value);
                    }}
                  />
                </Modal> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveCard;
