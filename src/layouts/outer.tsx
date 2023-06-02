import { RouteView } from "@/components/ui/route-view";
import { ViewComponent } from "@/types";
import { For, createSignal } from "solid-js";

export const EmptyLayout: ViewComponent = (props) => {
  const { app, router, view } = props;
  const [subViews, setSubViews] = createSignal(view.subViews);

  view.onSubViewsChange((nextSubViews) => {
    // console.log("[LAYOUT]MainLayout - subViewsChanged", nextSubViews.length);
    setSubViews(nextSubViews);
  });

  return (
    <div class="w-screen space-y-4">
      <For each={subViews()}>
        {(subView) => {
          const PageContent = subView.component as ViewComponent;
          return (
            <RouteView store={subView}>
              <PageContent app={app} router={router} view={subView} />
            </RouteView>
          );
        }}
      </For>
    </div>
  );
};
