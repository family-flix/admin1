import { Show, createSignal } from "solid-js";

import { Dialog } from "@/components/ui/dialog";

import { TMDBSearcherDialogCore } from "./store";
import { TMDBSearcher } from "./searcher";

export function TMDBSearcherDialog(props: { store: TMDBSearcherDialogCore }) {
  const { store } = props;

  return (
    <Dialog store={store.dialog}>
      <TMDBSearcher store={store.tmdb} />
    </Dialog>
  );
}
