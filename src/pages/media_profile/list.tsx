/**
 * @file 影视剧档案列表
 */
import { createSignal } from "solid-js";

import { MediaSearchCore } from "@/biz/media_search";
import { MediaSearchView } from "@/components/MediaSelect/searcher";
import { ViewComponent } from "@/store/types";
import { ScrollView } from "@/components/ui";
import { ScrollViewCore } from "@/domains/ui";

export const MediaProfileListPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const mediaSearch = new MediaSearchCore();
  const scrollView = new ScrollViewCore();

  const [state, setState] = createSignal(mediaSearch.state);

  mediaSearch.onStateChange((nextState) => {
    setState(nextState);
  });
  scrollView.onReachBottom(async () => {
    await mediaSearch.$list.loadMore();
    scrollView.finishLoadingMore();
  });
  mediaSearch.onSelect((media) => {
    history.push("root.media_profile.media_profile_profile", { id: media.id });
  });
  mediaSearch.$list.init();

  return (
    <ScrollView class="h-screen p-8" store={scrollView}>
      <h1 class="text-2xl">影视剧档案列表</h1>
      <div class="mt-8">
        <MediaSearchView store={mediaSearch} />
      </div>
    </ScrollView>
  );
};
