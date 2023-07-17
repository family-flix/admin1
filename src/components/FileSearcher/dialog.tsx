import { Dialog } from "@/components/ui/dialog";

import { FileSearcherCore } from "./store";
import { FileSearcher } from "./searcher";

export function FileSearchDialog(props: { store: FileSearcherCore }) {
  const { store } = props;

  return (
    <Dialog store={store.dialog}>
      <FileSearcher store={store} />
    </Dialog>
  );
}
