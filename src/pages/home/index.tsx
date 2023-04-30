/**
 * @file 管理后台首页
 */
import { createSignal, For, Show } from "solid-js";
import { HelpCircle } from "lucide-solid";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { RequestClient } from "@/domains/client";
import Helper from "@list-helper/core/core";
// import { useToast } from "@/hooks/use-toast";
// import { copy } from "@/utils/front_end";
// import { Result } from "@/types";
import DriveCard from "@/components/DriveCard";
import Modal from "@/components/SingleModal";
import { NavigatorCore } from "@/domains/navigator";
import { Drive } from "@/domains/drive";

export const HomePage = (props: {
  app: Application;
  router: NavigatorCore;
  view: ViewCore;
  page: PageCore;
}) => {
  const { app, view, page } = props;
  const [count, setCount] = createSignal(0);
  const [hidden, setHidden] = createSignal(view.hidden);
  const [drives, setDrives] = createSignal(app.drives);
  // const { toast } = useToast();
  app.onDrivesChange((nextDrives) => {
    setDrives(nextDrives);
  });

  console.log("[PAGE]home - render");
  view.onShow(() => {
    setHidden(false);
  });
  view.onHide(() => {
    setHidden(true);
  });
  setInterval(() => {
    setCount((prev) => prev + 1);
  }, 1000);
  const modal = new DialogCore();
  const form = new FormCore<{ payload: string }>();
  const addingDriveClient = new RequestClient(add_aliyun_drive);
  addingDriveClient.onError((error) => {
    app.tip({
      text: [error.message],
    });
  });
  addingDriveClient.onSuccess(() => {
    app.tip({ text: ["添加网盘成功"] });
  });
  app.fetchDrives();

  return (
    <Show when={!hidden()}>
      <div>
        <div class="section">
          <h2 class="my-2 text-2xl">云盘列表{count()}</h2>
          <div class="grid grid-cols-2 gap-2">
            <For each={drives()}>
              {(drive) => {
                return (
                  <div>
                    <DriveCard app={app} core={drive} />
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </Show>
  );
};
