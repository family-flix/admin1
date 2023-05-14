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
import { Button } from "@/components/ui/button";

export function TMDBSearcherDialog(props: { store: TMDBSearcherDialogCore }) {
  const { store } = props;
  return (
    <Root store={store.dialog}>
      <Content class="sm:max-w-[425px] xl:max-w-[728px]" store={store.dialog}>
        <TMDBSearcher store={store.tmdb} />
        <Footer>
          <Submit store={store.dialog}>确定</Submit>
        </Footer>
      </Content>
    </Root>
  );
}
