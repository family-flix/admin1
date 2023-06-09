import { FolderInput, MoreHorizontal } from "lucide-solid";

import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { DropdownMenuCore } from "@/domains/ui/dropdown-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { MenuCore } from "@/domains/ui/menu";
import { ViewComponent } from "@/types";
import { For, JSX, onMount } from "solid-js";

export const TestPage: ViewComponent = (props) => {
  const { app, router } = props;

  const dropdownMenu = new DropdownMenuCore({
    _name: "shared-resource-dropdown",
    items: [
      // new MenuItemCore({
      //   label: "查找同名文件夹并建立关联",
      //   onClick() {
      //     sharedResource.bindSelectedFolderInDrive();
      //   },
      // }),
      // new MenuItemCore({
      //   label: "检查同名文件夹",
      //   icon: <Search class="w-4 h-4" />,
      //   onClick() {
      //     // sharedResource.findTheTVHasSameNameWithSelectedFolder();
      //   },
      // }),
      new MenuItemCore({
        label: "转存到默认网盘",
        // onClick() {
        //   sharedResource.transferSelectedFolderToDrive(app.drives[0]);
        // },
      }),
      new MenuItemCore({
        _name: "transfer-to",
        label: "转存到",
        icon: <FolderInput class="w-4 h-4" />,
        menu: new MenuCore({
          _name: "sub-menus",
          side: "right",
          align: "start",
          items: [
            new MenuItemCore({
              label: "123",
            }),
            new MenuItemCore({
              label: "456",
            }),
            new MenuItemCore({
              label: "789",
            }),
          ],
        }),
      }),
    ],
  });

  const values = [
    {
      name: "1",
    },
    {
      name: "2",
    },
    {
      name: "3",
    },
    {
      name: "4",
    },
  ];

  return (
    <div class="p-4 bg-white">
      {/* <For each={values}>
        {(v) => {
          const { name } = v;
          return <InnerElm name={name}>{name}</InnerElm>;
        }}
      </For> */}

      <DropdownMenu store={dropdownMenu}>
        <div class="ml-20 inline-block cursor-pointer">
          <MoreHorizontal class="w-6 h-6 text-gray-600" />
        </div>
      </DropdownMenu>
      <div style={{ height: "1200px" }}></div>
    </div>
  );
};

function InnerElm(props: { name: string } & JSX.HTMLAttributes<HTMLDivElement>) {
  const { name } = props;

  onMount(() => {
    console.log("inner elm mounted", name);
  });

  return <div>{name}</div>;
}
