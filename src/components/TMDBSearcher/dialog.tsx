import {
  Root,
  Content,
  Header,
  Title,
  Footer,
  Submit,
} from "@/components/ui/dialog";

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
    <Root store={store.dialog}>
      <Content class="sm:max-w-[425px] xl:max-w-[728px]" store={store.dialog}>
        <TMDBSearcher store={store.tmdb} />
        <Show when={state().showFooter}>
          <Footer>
            <Submit store={store.dialog}>确定</Submit>
          </Footer>
        </Show>
      </Content>
    </Root>
  );
}
