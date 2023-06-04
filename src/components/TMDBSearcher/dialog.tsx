import { Show, createSignal } from "solid-js";

import { Dialog } from "@/components/ui/dialog";

import { TMDBSearcherDialogCore } from "./store";
import { TMDBSearcher } from "./searcher";

export function TMDBSearcherDialog(props: { store: TMDBSearcherDialogCore }) {
  const { store } = props;

  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    setState(nextState);
  });

  return (
    <Dialog store={store.dialog}>
      <TMDBSearcher store={store.tmdb} />
    </Dialog>
  );
}
