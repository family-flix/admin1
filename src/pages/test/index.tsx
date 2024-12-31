import axios from "axios";
import { For, JSX, onMount } from "solid-js";
import { MoreVertical } from "lucide-solid";

import { client } from "@/store/request";
import { DropdownMenu, Input } from "@/components/ui";
import { InputCore, CheckboxCore, MenuCore, MenuItemCore, DropdownMenuCore, SelectCore } from "@/domains/ui";
import { TreeCore } from "@/domains/ui/tree";
import * as TreePrimitive from "@/packages/ui/tree";
import * as PopperPrimitive from "@/packages/ui/popper";
import { ViewComponent } from "@/store/types";
import { RequestCore } from "@/domains/request";
import { uploadFileToDrive } from "@/biz/services";
import { Select } from "@/components/ui/select";
import { SelectOptionCore } from "@/domains/ui/select/option";
import { PopperCore } from "@/domains/ui/popper";
import { MediaTypes } from "@/constants";
import { ImageUploadCore } from "@/domains/ui/form/image-upload";
import { ImageUpload } from "@/components/ui/image-upload";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
        label: "sub_child_item",
      }),
    ],
  });
  const menu = new DropdownMenuCore({
    align: "end",
    items: [
      new MenuItemCore({
        label: "测试",
      }),
      new MenuItemCore({
        label: "测试2",
      }),
      new MenuItemCore({
        label: "云盘",
        menu: subMenu,
      }),
      new MenuItemCore({
        label: "云盘2",
        menu: new MenuCore({
          side: "right",
          align: "start",
          items: [
            new MenuItemCore({
              label: "hellloo",
            }),
          ],
        }),
      }),
    ],
  });
  // const tokenRequest = new RequestCore(fetchTokenOfDrive, {});
  // const preuploadRequest = new RequestCore(createWithFolders, {
  //   onSuccess(v) {
  //     console.log(v);
  //   },
  // });
  const uploadRequest = new RequestCore(uploadFileToDrive);
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
    return new SelectOptionCore({
      value,
      label,
    });
  });
  const $select = new SelectCore({
    defaultValue: MediaTypes.Season,
    placeholder: "请选择",
    options: [
      {
        label: "电视剧",
        value: MediaTypes.Season,
      },
      {
        label: "电影",
        value: MediaTypes.Movie,
      },
    ],
  });
  const popper = new PopperCore({
    side: "right",
    align: "end",
  });
  const $upload = ImageUploadCore({});
  // client.get("/api/ping");
  // client.get("/api/ping1");
  // client.get("/api/ping2");
  // client.get("/api/ping3");
  // client.get("/api/ping4");
  // client.get("/api/ping5");
  // client.get("/api/ping6");
  // client.get("/api/ping7");
  // client.get("/api/ping8");
  // client.get("/api/ping9");
  // client.get("/api/ping10");
  // client.get("/api/ping11");
  // client.get("/api/ping12");
  // client.get("/api/ping13");

  return (
    <div class="p-4 bg-white">
      <div
        onClick={(event) => {
          const { pageX, pageY } = event;
          menu.toggle({ x: pageX, y: pageY });
        }}
      >
        Click
      </div>
      <DropdownMenu store={menu}></DropdownMenu>
      <div class="mt-4 w-[120px]">
        <Select store={$select}></Select>
      </div>
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
