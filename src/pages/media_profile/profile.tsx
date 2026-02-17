/**
 * @file 影视剧档案详情
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { ArrowLeft } from "lucide-solid";

import { ViewComponent } from "@/store/types";
import { fetchMediaProfileDetail, fetchMediaProfileDetailProcess, refreshMediaProfileDetail } from "@/biz/services/media_profile";
import { Button, ScrollView, Skeleton, LazyImage } from "@/components/ui";
import { RequestCore } from "@/domains/request";
import { ScrollViewCore, ImageCore, ButtonCore, ImageInListCore } from "@/domains/ui";

export const MediaProfileDetailPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const profileRequest = new RequestCore(fetchMediaProfileDetail, {
    process: fetchMediaProfileDetailProcess,
    onSuccess(v) {
      poster.setURL(v.poster_path);
      setProfile(v);
    },
    onFailed(error) {
      app.tip({ text: ["获取详情失败", error.message] });
    },
  });
  const refreshRequest = new RequestCore(refreshMediaProfileDetail, {
    onSuccess() {
      app.tip({ text: ["刷新成功"] });
      refreshBtn.setLoading(false);
      profileRequest.reload();
    },
    onFailed(error) {
      refreshBtn.setLoading(false);
      app.tip({ text: ["刷新失败", error.message] });
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      refreshBtn.setLoading(true);
      refreshRequest.run({ id: view.query.id });
    },
  });
  const poster = new ImageCore({});
  const personAvatar = new ImageInListCore({});
  const scrollView = new ScrollViewCore({});

  type ProfileType = NonNullable<typeof profileRequest.response>;
  const [profile, setProfile] = createSignal<ProfileType | null>(null);

  onMount(() => {
    profileRequest.run({ id: view.query.id });
  });

  return (
    <ScrollView store={scrollView} class="h-screen py-4 px-8">
      <div class="py-2">
        <div
          class="mb-2 cursor-pointer"
          onClick={() => {
            history.back();
          }}
        >
          <ArrowLeft class="w-6 h-6" />
        </div>
        <Show
          when={!!profile()}
          fallback={
            <div class="flex">
              <Skeleton class="w-[240px] h-[360px] rounded-lg mr-4 object-cover" />
              <div class="flex-1">
                <Skeleton class="w-full h-[48px]"></Skeleton>
                <Skeleton class="mt-6 w-12 h-[36px]"></Skeleton>
                <div class="mt-2 space-y-1">
                  <Skeleton class="w-12 h-[18px]"></Skeleton>
                  <Skeleton class="w-full h-[18px]"></Skeleton>
                  <Skeleton class="w-32 h-[18px]"></Skeleton>
                </div>
              </div>
            </div>
          }
        >
          <div class="flex">
            <div class="mr-4">
              <LazyImage class="overflow-hidden w-[240px] h-[360px] rounded-lg object-cover" store={poster} />
            </div>
            <div class="flex-1">
              <h2 class="text-5xl">{profile()?.name}</h2>
              <Show when={profile()?.original_name}>
                <div class="mt-2 text-xl text-slate-500">{profile()?.original_name}</div>
              </Show>
              <div class="mt-4 flex items-center space-x-4 text-sm text-slate-600">
                <Show when={profile()?.vote_average}>
                  <span>评分: {profile()?.vote_average}</span>
                </Show>
                <Show when={profile()?.air_date}>
                  <span>{profile()?.air_date}</span>
                </Show>
                <Show when={profile()?.source_count}>
                  <span>{profile()?.source_count} 集</span>
                </Show>
              </div>
              <Show when={profile()?.series}>
                <div class="mt-2 text-sm text-slate-500">
                  系列: {profile()!.series!.name}
                </div>
              </Show>
              <Show when={profile()?.genres && profile()!.genres.length > 0}>
                <div class="mt-3 flex flex-wrap gap-2">
                  <For each={profile()?.genres}>
                    {(genre) => <span class="px-2 py-1 text-xs bg-slate-200 rounded">{genre}</span>}
                  </For>
                </div>
              </Show>
              <Show when={profile()?.origin_country && profile()!.origin_country.length > 0}>
                <div class="mt-2 text-sm text-slate-500">
                  地区: {profile()!.origin_country.join(" / ")}
                </div>
              </Show>
              <div class="mt-6 text-2xl">剧情简介</div>
              <div class="mt-2">{profile()?.overview || "暂无简介"}</div>
            </div>
          </div>
          <div class="mt-4">
            <Button store={refreshBtn}>刷新详情</Button>
          </div>
          <Show when={profile()?.persons && profile()!.persons.length > 0}>
            <div class="mt-8">
              <div class="text-2xl">演员</div>
              <div class="mt-2 flex flex-wrap gap-4">
                <For each={profile()?.persons}>
                  {(person) => (
                    <div class="text-sm text-center w-[80px]">
                      <LazyImage
                        class="w-[80px] h-[80px] rounded-full object-cover"
                        store={personAvatar.bind(person.profile_path)}
                        alt={person.name}
                      />
                      <div class="mt-1 truncate">{person.name}</div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
          <Show when={profile()?.episodes && profile()!.episodes.length > 0}>
            <div class="mt-8">
              <div class="text-2xl">剧集列表</div>
              <div class="mt-2 space-y-2">
                <For each={profile()?.episodes}>
                  {(episode) => (
                    <div class="flex items-center space-x-4 py-1">
                      <span class="text-slate-500 w-8">{episode.order}</span>
                      <span>{episode.name}</span>
                      <Show when={episode.air_date}>
                        <span class="text-sm text-slate-400">{episode.air_date}</span>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </Show>
      </div>
      <div class="h-[120px]"></div>
    </ScrollView>
  );
};
