import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollView } from "@/components/ui/scroll-view";
import { ButtonCore } from "@/domains/ui/button";
import { InputCore } from "@/domains/ui/input";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { ViewComponent } from "@/types";

/**
 * @file 云盘详情页面
 */
export const DriveProfilePage: ViewComponent = (props) => {
  const { app, view } = props;

  const input = new InputCore();
  const btn = new ButtonCore({
    onClick() {
      if (!input.value) {
        app.tip({
          text: ["请输入要查询的文件名"],
        });
        return;
      }
    },
  });
  const scrollView = new ScrollViewCore();

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8">
        <div>
          <Input store={input} />
          <Button store={btn}></Button>
        </div>
      </ScrollView>
    </>
  );
};
