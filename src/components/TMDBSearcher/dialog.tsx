import * as Dialog from "@/components/ui/dialog";

import { TMDBSearcherDialogCore } from "./store";
import { TMDBSearcher } from "./searcher";
import { Show, createSignal } from "solid-js";

export function TMDBSearcherDialog(props: { store: TMDBSearcherDialogCore }) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <Dialog.Root store={store.dialog}>
      <Dialog.Portal store={store.dialog}>
        <Dialog.Overlay store={store.dialog} />
        <Dialog.Content
          class="sm:max-w-[425px] xl:max-w-[728px]"
          store={store.dialog}
        >
          <TMDBSearcher store={store.tmdb} />
          <Show when={state().showFooter}>
            <Dialog.Footer>
              <Dialog.Submit store={store.dialog}>确定</Dialog.Submit>
            </Dialog.Footer>
          </Show>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
