import { For, JSX, onMount } from "solid-js";
import { FolderInput, MoreHorizontal } from "lucide-solid";

import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { DropdownMenuCore } from "@/domains/ui/dropdown-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { MenuCore } from "@/domains/ui/menu";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxCore } from "@/domains/ui/checkbox";
import { PurePopover } from "@/components/ui/popover";
import { ViewComponent } from "@/types";

export const TestPage: ViewComponent = (props) => {
  const { app, router } = props;

  const check = new CheckboxCore();

  return (
    <div class="p-4 bg-white">
      <div
        onClick={() => {
          app.tip({ text: ["Hello"] });
        }}
      >
        Click it
      </div>
      {/* <div class="flex items-center space-x-2">
        <Checkbox id="check" store={check} />
        <label html-for="check">点击选中</label>
      </div> */}
      <div class="h-[200px]"></div>
      <PurePopover content={<div class="b">Hello Content</div>}>
        <div class="a">Hello</div>
      </PurePopover>
      <div class="h-[2000px]"></div>
    </div>
  );
};
