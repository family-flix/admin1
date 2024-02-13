import axios from "axios";
import { For, JSX, onMount } from "solid-js";
import { MoreVertical } from "lucide-solid";

import { client } from "@/store/request";
import { Input } from "@/components/ui";
import { InputCore, CheckboxCore, MenuCore, MenuItemCore, DropdownMenuCore, SelectCore } from "@/domains/ui";
import { TreeCore } from "@/domains/ui/tree";
import * as TreePrimitive from "@/packages/ui/tree";
import * as PopperPrimitive from "@/packages/ui/popper";
import { ViewComponent } from "@/store/types";
import { RequestCore } from "@/domains/request";
import { upload_file } from "@/services";
import { Select } from "@/components/ui/select";
import { SelectItemCore } from "@/domains/ui/select/item";
import { PopperCore } from "@/domains/ui/popper";

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
  const options = [
    {
      value: 1,
      label: "Light",
    },
    {
      value: 2,
      label: "Dark",
    },
  ].map((opt) => {
    const { label, value } = opt;
    return new SelectItemCore({
      value,
      label,
    });
  });
  const select = new SelectCore({
    defaultValue: null,
    // options,
    options: [],
  });
  const popper = new PopperCore({
    side: "right",
    align: "end",
  });
  client.get("/api/ping");
  client.get("/api/ping1");
  client.get("/api/ping2");
  client.get("/api/ping3");
  client.get("/api/ping4");
  client.get("/api/ping5");
  client.get("/api/ping6");
  client.get("/api/ping7");
  client.get("/api/ping8");
  client.get("/api/ping9");
  client.get("/api/ping10");
  client.get("/api/ping11");
  client.get("/api/ping12");
  client.get("/api/ping13");

  return (
    <div class="p-4 bg-white">
      <img class="w-8" src="https://media-t.funzm.com/poster/615-1.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/615-2.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/615-3.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/615-4.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/615-5.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/615-6.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/615-7.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/615.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/670.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/693-1.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/693-2.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/693-3.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/693-4.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/693-5.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/693-6.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/693-7.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/693-8.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/693.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/1398.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/1398-1.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/1398-2.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/1398-3.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/1398-4.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/1398-5.jpg" />
      <img class="w-8" src="https://media-t.funzm.com/poster/1398-6.jpg" />
      {/* <div
        onClick={() => {
          app.tip({ text: ["Hello"] });
        }}
      >
        Click it
      </div>
      <Input store={input} /> */}
      {/* <div
        onClick={() => {
          popper.place();
        }}
      >
        Show
      </div> */}
      {/* <PopperPrimitive.Root>
        <div class="ml-12 mt-12">
          <PopperPrimitive.Anchor class="inline-block" store={popper}>
            参考元素
          </PopperPrimitive.Anchor>
        </div>
        <PopperPrimitive.Content store={popper}>
          <div>Content after show</div>
        </PopperPrimitive.Content>
      </PopperPrimitive.Root> */}
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
