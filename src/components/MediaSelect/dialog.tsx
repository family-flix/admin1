import { Show, createSignal } from "solid-js";

import { Dialog } from "@/components/ui/dialog";

import { MediaSelectCore } from "./store";
import { MediaSearchView } from "./searcher";

export function MediaSelectDialog(props: { store: MediaSelectCore }) {
  const { store } = props;

  return (
    <Dialog store={store.dialog}>
      <div class="w-[520px]">
        <MediaSearchView store={store.searcher} />
      </div>
    </Dialog>
  );
}
