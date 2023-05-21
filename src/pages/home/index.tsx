/**
 * @file 管理后台首页
 */
import { createSignal, For, Show } from "solid-js";
import { HelpCircle } from "lucide-solid";

// import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import CopyAndCheckIcon from "@/components/CopyIcon";
import { addAliyunDrive } from "@/domains/drive/services";
import { DialogCore } from "@/domains/ui/dialog";
import { FormCore } from "@/domains/ui/form";
import { RequestCore } from "@/domains/client";
import { DriveCard } from "@/components/DriveCard";
import { ViewComponent } from "@/types";

export const HomePage: ViewComponent = (props) => {
  const { app, view } = props;
  const [count, setCount] = createSignal(0);
  const [drives, setDrives] = createSignal(app.drives);
  const modal = new DialogCore();
  const form = new FormCore<{ payload: string }>();
  const addingDriveClient = new RequestCore(addAliyunDrive);
  app.onDrivesChange((nextDrives) => {
    setDrives(nextDrives);
  });
  setInterval(() => {
    setCount((prev) => prev + 1);
  }, 1000);
  addingDriveClient.onTip((msg) => {
    app.tip(msg);
  });
  app.fetchDrives();

  return (
    <div>
      <div class="section">
        <h2 class="my-2 text-2xl">云盘列表{count()}</h2>
        <div class="grid grid-cols-2 gap-2">
          <For each={drives()}>
            {(drive) => {
              return <DriveCard app={app} store={drive} />;
            }}
          </For>
        </div>
      </div>
    </div>
  );
};
