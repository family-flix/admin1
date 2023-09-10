/**
 * @file 文件详情
 */
import { Show, createSignal } from "solid-js";

import { RefCore } from "@/domains/cur";
import { AliyunDriveFile } from "@/domains/drive";
import { bytes_to_size } from "@/utils";

export const DriveFileCard = (props: { store: RefCore<AliyunDriveFile> }) => {
  const { store } = props;
  const [state, setState] = createSignal(store.value);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const filepath = () => {
    const file = state();
    if (!file) {
      return [];
    }
    return [...file.parent_paths.map((p) => p.name), file.name].filter(Boolean);
  };
  const size = () => {
    const file = state();
    if (!file) {
      return null;
    }
    return bytes_to_size(file.size);
  };

  return (
    <div>
      <div>
        <div class="">{state()?.file_id}</div>
        <div>{size()}</div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            {filepath().map((p, i) => {
              return (
                <>
                  {p}
                  <Show when={i !== filepath().length - 1}>
                    <span class="mx-4 text-slate-500">/</span>
                  </Show>
                </>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
