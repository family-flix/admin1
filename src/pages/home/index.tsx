/**
 * @file 管理后台首页
 */
import { createSignal, For, Show } from "solid-js";

import { DriveCard } from "@/components/DriveCard";
import { ViewComponent } from "@/types";

export const HomePage: ViewComponent = (props) => {
  const { app, view } = props;
  const [drives, setDrives] = createSignal(app.drives);
  view.onShow(() => {
    console.log("home page show");
  });
  view.onHide(() => {
    console.log("home page hide");
  });
  app.onDrivesChange((nextDrives) => {
    setDrives(nextDrives);
  });
  app.fetchDrives();

  return (
    <div class="">
      <h1 class="text-2xl">云盘列表</h1>
      <div class="mt-8">
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
