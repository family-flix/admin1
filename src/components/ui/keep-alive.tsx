import { createSignal, JSX } from "solid-js";

import { ViewCore } from "@/domains/view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { cn } from "@/utils";

import { PageView } from "./scroll-view";

const scrollView = new ScrollViewCore();

export function KeepAliveView(
  props: {
    //     parent: ViewCore;
    store: ViewCore;
    index: number;
  } & JSX.HTMLAttributes<HTMLDivElement>
) {
  const { store, index, style } = props;

  // const [state, setState] = useState(store.state);
  const [visible, setVisible] = createSignal(false);
  const [hidden, setHidden] = createSignal(false);

  // store.onStateChange((nextState) => {
  //   setState(nextState);
  // });
  store.onHide(() => {
    setHidden(true);
  });
  setTimeout(() => {
    setVisible(true);
  }, 200);

  const className = cn(
    visible ? "mounted" : "",
    hidden ? "unmounted" : "",
    props.class
  );

  return (
    <div class={className}>
      <PageView
        store={scrollView}
        class={className}
        style={{
          "z-index": index,
        }}
        data-state={visible ? "open" : "closed"}
      >
        {props.children}
      </PageView>
    </div>
  );
}
