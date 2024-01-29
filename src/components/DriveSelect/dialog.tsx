import { For, createSignal } from "solid-js";

import { Dialog } from "@/components/ui";
import { DialogCore } from "@/domains/ui";
import { RefCore } from "@/domains/cur";
import { driveList } from "@/store/drives";

import { DriveSelectCore } from ".";

export const DriveSelect = (props: { store: DriveSelectCore }) => {
  const { store } = props;

  const transferConfirmDialog = new DialogCore();

  const [driveListState, setDriveListState] = createSignal(driveList.response);
  const [curDrive, setCurDrive] = createSignal(store.ref.value);

  driveList.onStateChange((nextState) => {
    setDriveListState(nextState);
  });
  store.onChange((nextState) => {
    setCurDrive(nextState);
  });

  driveList.initAny();

  return (
    <div>
      <div class="mt-2 space-y-4 h-[320px] overflow-y-auto">
        <For each={driveListState().dataSource}>
          {(drive) => {
            const { id, name, state } = drive;
            return (
              <div
                classList={{
                  "bg-gray-100 border rounded-sm p-2 cursor-pointer hover:bg-gray-200": true,
                  "border-green-500": curDrive()?.id === id,
                }}
                onClick={() => {
                  store.select(drive);
                }}
              >
                <div
                  classList={{
                    "py-2": true,
                  }}
                >
                  <div class="text-xl">{name}</div>
                </div>
                <div class="text-slate-500 text-sm">
                  {state.used_size}/{state.total_size}
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};
