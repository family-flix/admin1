import { Application } from "@/domains/app";
import { NavigatorCore } from "@/domains/navigator";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { FormCore } from "@/domains/ui/form";
import { InputCore } from "@/domains/ui/input";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
// import { PageView } from "@/components/ui/scroll-view";
import * as Form from "@/components/ui/form";
import { sleep } from "@/utils";
import { Input } from "@/components/ui/input";
import { FormFieldCore } from "@/domains/ui/form/field";
import { Button } from "@/components/ui/button";

export const TestPage = (props: { app: Application; router: NavigatorCore }) => {
  const { app, router } = props;

  const store = new ScrollViewCore();
  const dialog = new TMDBSearcherDialogCore();
  const input1 = new InputCore({
    name: "name",
  });
  const field1 = new FormFieldCore({
    label: "名称",
  });
  const form = new FormCore({
    fields: [],
  });
  store.onPullToRefresh(async () => {
    console.log("onRefreshing");
    await sleep(1200);
    store.stopPullToRefresh();
  });
  store.onReachBottom(() => {
    console.log("reach bottom");
  });
  store.onScroll((scrollTop) => {
    console.log("scroll", scrollTop);
  });
  form.onSubmit((values) => {
    console.log(values);
  });

  return (
    <div class="p-4 bg-white">
      <div>测试哈哈</div>
      <button
        onClick={() => {
          // store.startPullToRefresh();
          form.submit();
        }}
      >
        refresh
      </button>
      <Form.Root store={form}>
        <Form.Field store={field1}>
          <Input store={input1} />
        </Form.Field>
        <Form.Submit store={form}>{/* <Button>提交</Button> */}</Form.Submit>
      </Form.Root>
      <div style={{ height: "1200px" }}></div>
    </div>
  );
};
