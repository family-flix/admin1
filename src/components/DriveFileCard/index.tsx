import { RefCore } from "@/domains/cur";
import { AliyunDriveFile } from "@/domains/drive";
import { createSignal } from "solid-js";

export const DriveFileCard = (props: { store: RefCore<AliyunDriveFile> }) => {
  const { store } = props;
  const [state, setState] = createSignal(store.value);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <div>
      <div>
        <div class="">{state()?.file_id}</div>
        {/* <div class="mt-2 text-lg">{state()?.name}</div> */}
        <div class="mt-4">
          <div class="text-slate-500 text-sm">
            {state()?.parent_paths.map((p) => p.name)}/{state()?.name}
          </div>
        </div>
      </div>
    </div>
  );
};
