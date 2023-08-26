import axios from "axios";
import { For, JSX, onMount } from "solid-js";
import { MoreVertical } from "lucide-solid";

import { Input } from "@/components/ui";
import { InputCore, CheckboxCore, MenuCore, MenuItemCore, DropdownMenuCore } from "@/domains/ui";
import { TreeCore } from "@/domains/ui/tree";
import * as TreePrimitive from "@/packages/ui/tree";
import { ViewComponent } from "@/types";
import { RequestCore } from "@/domains/request";
import { createWithFolders, fetchTokenOfDrive } from "@/domains/drive";
import { upload_file } from "@/services";

export const TestPage: ViewComponent = (props) => {
  const { app } = props;

  const check = new CheckboxCore();
  const tree = new TreeCore();
  const subTree = new TreeCore();
  const subMenu = new MenuCore({
    side: "right",
    align: "start",
    items: [
      new MenuItemCore({
        label: "13822136046",
      }),
    ],
  });
  const menu = new DropdownMenuCore({
    align: "end",
    items: [
      // new MenuItemCore({
      //   label: "测试",
      // }),
      // new MenuItemCore({
      //   label: "云盘",
      // }),
      new MenuItemCore({
        label: "云盘",
        menu: subMenu,
      }),
    ],
  });
  // const tokenRequest = new RequestCore(fetchTokenOfDrive, {});
  // const preuploadRequest = new RequestCore(createWithFolders, {
  //   onSuccess(v) {
  //     console.log(v);
  //   },
  // });
  const uploadRequest = new RequestCore(upload_file);
  const input = new InputCore<File[]>({
    defaultValue: [],
    type: "file",
    async onChange(event) {
      const file = event[0];
      const body = new FormData();
      body.append("file", file);
      // console.log("[PAGE]test - input onChange", file);
      uploadRequest.run(body);
    },
  });

  return (
    <div class="p-4 bg-white">
      <div
        onClick={() => {
          app.tip({ text: ["Hello"] });
        }}
      >
        Click it
      </div>
      <Input store={input} />
      {/* <div class="flex items-center space-x-2">
        <Checkbox id="check" store={check} />
        <label html-for="check">点击选中</label>
      </div> */}
      {/* <TreePrimitive.Root class="text-lg" store={tree}>
        <TreePrimitive.Leaf class="py-2 whitespace-nowrap" store={tree}>
          <TreePrimitive.Switcher class="mr-2 cursor-pointer" store={tree}>
            <TreePrimitive.Arrow />
          </TreePrimitive.Switcher>
          <TreePrimitive.Handler store={tree}>1</TreePrimitive.Handler>
        </TreePrimitive.Leaf>
        <TreePrimitive.Leaf class="py-2 whitespace-nowrap" store={tree}>
          <TreePrimitive.Switcher class="mr-2 cursor-pointer" store={tree}>
            <TreePrimitive.Arrow />
          </TreePrimitive.Switcher>
          <TreePrimitive.Handler store={tree}>2</TreePrimitive.Handler>
          <TreePrimitive.Sub class="pl-4" store={subTree}>
            <TreePrimitive.Leaf class="py-2 whitespace-nowrap" store={subTree}>
              <TreePrimitive.Switcher class="mr-2 cursor-pointer" store={subTree}>
                <TreePrimitive.Arrow />
              </TreePrimitive.Switcher>
              <TreePrimitive.Handler store={subTree}>2-1</TreePrimitive.Handler>
            </TreePrimitive.Leaf>
          </TreePrimitive.Sub>
        </TreePrimitive.Leaf>
      </TreePrimitive.Root>
      <DropdownMenu store={menu}>
        <MoreVertical class="w-4 h-4" />
      </DropdownMenu> */}
      <div class="h-[200px]"></div>
      <div class="h-[2000px]"></div>
    </div>
  );
};
