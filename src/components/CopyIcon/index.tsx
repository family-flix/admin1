// import { useRef, useState } from "react";
// import { Check, Copy } from "lucide-react";

import { noop } from "@/utils";
import { createSignal } from "solid-js";

const CopyAndCheckIcon = (props: { on_click: () => void }) => {
  const { on_click = noop } = props;

  const [check_visible, set_check_visible] = createSignal(false);
  // const timer_ref = useRef<NodeJS.Timeout | null>(null);

  return (
    <div
      onClick={() => {
        if (check_visible) {
          return;
        }
        // if (timer_ref.current) {
        //   return;
        // }
        on_click();
        set_check_visible(true);
        // timer_ref.current = setTimeout(() => {
        //   set_check_visible(false);
        //   clearTimeout(timer_ref.current!);
        // }, 1000);
      }}
    >
      {check_visible ? <div>✅</div> : <div>❎</div>}
    </div>
  );
};

export default CopyAndCheckIcon;
