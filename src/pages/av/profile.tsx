/**
 * @file AV详情
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { ArrowLeft, Play, Trash } from "lucide-solid";

import { ViewComponent } from "@/store/types";
import { appendAction } from "@/store/actions";
import {
  AVProfile,
  fetchAVMediaProfile,
  deleteMedia,
  refreshMediaProfile,
  setMediaProfile,
  fetchAVMediaProfileProcess,
} from "@/biz/services/media";
import { deleteParsedMediaSource } from "@/biz/services/parsed_media";
import { Button, Dialog, Skeleton, LazyImage, ScrollView } from "@/components/ui";
import { TMDBSearcherView } from "@/components/TMDBSearcher";
import { TMDBSearcherCore } from "@/biz/tmdb";
import { DialogCore, ButtonCore, ScrollViewCore, ImageCore, ImageInListCore } from "@/domains/ui";
import { RefCore } from "@/domains/ui/cur";
import { RequestCore } from "@/domains/request";
import { MediaTypes } from "@/constants/index";

export const AVProfilePage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const profileRequest = new RequestCore(fetchAVMediaProfile, {
    process: fetchAVMediaProfileProcess,
    onSuccess(v) {
      poster.setURL(v.poster_path);
      setProfile(v);
    },
  });
  const profileChangeRequest = new RequestCore(setMediaProfile, {
    onLoading(loading) {
      profileChangeDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["更改详情成功"] });
      profileChangeDialog.hide();
      profileRequest.reload();
    },
    onFailed(error) {
      app.tip({ text: ["更改详情失败", error.message] });
    },
  });
  const sourceDeletingRequest = new RequestCore(deleteParsedMediaSource, {
    onSuccess() {
      const theSource = sourceRef.value;
      if (!theSource) {
        app.tip({ text: ["删除成功，请刷新页面"] });
        return;
      }
      profileRequest.modifyResponse((response) => {
        return {
          ...response,
          sources: response.sources.filter((source) => {
            return source.id !== theSource.id;
          }),
        };
      });
      app.tip({ text: ["删除成功"] });
    },
  });
  const profileRefreshRequest = new RequestCore(refreshMediaProfile, {
    onSuccess() {
      profileRefreshBtn.setLoading(false);
      app.tip({ text: ["刷新详情成功"] });
      profileRequest.reload();
    },
    onFailed(error) {
      profileRefreshBtn.setLoading(false);
      app.tip({ text: ["刷新详情失败", error.message] });
    },
  });
  const deletingRequest = new RequestCore(deleteMedia, {
    onLoading(loading) {
      deletingConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["删除成功"] });
      deletingConfirmDialog.hide();
      appendAction("deleteMovie", {
        movie_id: view.query.id,
      });
      history.back();
    },
    onFailed(error) {
      app.tip({ text: ["删除失败", error.message] });
    },
  });
  const sourceRef = new RefCore<{ id: string; file_id: string }>();
  const poster = new ImageCore({});
  const personAvatar = new ImageInListCore({});
  const profileRefreshBtn = new ButtonCore({
    onClick() {
      app.tip({ text: ["开始刷新"] });
      profileRefreshBtn.setLoading(true);
      profileRefreshRequest.run({ media_id: view.query.id });
    },
  });
  const deletingBtn = new ButtonCore({
    onClick() {
      deletingConfirmDialog.show();
    },
  });
  const deletingConfirmDialog = new DialogCore({
    title: "删除AV",
    onOk() {
      deletingRequest.run({ media_id: view.query.id });
    },
  });
  const searcher = TMDBSearcherCore({
    type: MediaTypes.AV,
  });
  const profileChangeDialog = new DialogCore({
    onOk() {
      const id = view.query.id as string;
      if (!id) {
        app.tip({ text: ["更新详情失败", "缺少 id"] });
        return;
      }
      const media = searcher.cur;
      if (!media) {
        app.tip({ text: ["请选择详情"] });
        return;
      }
      profileChangeRequest.run({
        media_id: id,
        media_profile: {
          id: String(media.id),
          type: media.type,
          name: media.name,
        },
      });
    },
  });
  const profileChangeBtn = new ButtonCore({
    onClick() {
      if (profileRequest.response) {
        searcher.$input.setValue(profileRequest.response.name);
      }
      profileChangeDialog.show();
    },
  });
  const scrollView = new ScrollViewCore({});
  profileRequest.onStateChange((v) => {
    setProfile(v.response);
  });

  const [profile, setProfile] = createSignal<AVProfile | null>(null);

  onMount(() => {
    profileRequest.run({ av_id: view.query.id });
  });

  return (
    <>
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
              <div class="relative">
                <div class="">
                  <div>
                    <div class="relative z-3">
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
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <div class="relative">
              <div class="">
                <div>
                  <div class="relative z-3">
                    <div class="flex">
                      <div class="mr-4 ">
                        <LazyImage
                          class="overflow-hidden w-[240px] h-[360px] rounded-lg object-cover"
                          store={poster}
                        />
                      </div>
                      <div class="flex-1">
                        <h2 class="text-5xl">{profile()?.name}</h2>
                        <div class="mt-4 flex items-center space-x-4 text-sm text-slate-600">
                          <Show when={profile()?.vote_average}>
                            <span>评分: {profile()?.vote_average}</span>
                          </Show>
                          <Show when={profile()?.air_date}>
                            <span>{profile()?.air_date}</span>
                          </Show>
                        </div>
                        <Show when={profile()?.genres && profile()!.genres.length > 0}>
                          <div class="mt-3 flex flex-wrap gap-2">
                            <For each={profile()?.genres}>
                              {(genre) => <span class="px-2 py-1 text-xs bg-slate-200 rounded">{genre.label}</span>}
                            </For>
                          </div>
                        </Show>
                        <div class="mt-6 text-2xl">剧情简介</div>
                        <div class="mt-2">{profile()?.overview || "暂无简介"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="relative z-3 mt-4">
                <div class="flex items-center space-x-4">
                  <Button store={profileRefreshBtn}>刷新详情</Button>
                  <Button store={deletingBtn} variant="subtle">
                    删除
                  </Button>
                </div>
                <div class="mt-8 text-2xl">可播放源</div>
                <div class="mt-4 space-y-2">
                  <For each={profile()?.sources}>
                    {(source) => {
                      const { id, file_id, file_name, parent_paths, drive } = source;
                      return (
                        <div class="">
                          <div class="flex items-center space-x-4 text-slate-500">
                            <span class="break-all" title={`[${drive.name}]${parent_paths}/${file_name}`}>
                              [{drive.name}]{parent_paths}/{file_name}
                            </span>
                            <div class="flex items-center space-x-2">
                              <div
                                class="p-1 cursor-pointer"
                                title="播放"
                                onClick={() => {
                                  history.push("root.preview", { drive_id: drive.id, file_id });
                                }}
                              >
                                <Play class="w-4 h-4" />
                              </div>
                              <div
                                class="p-1 cursor-pointer"
                                title="删除源"
                                onClick={() => {
                                  sourceRef.select(source);
                                  sourceDeletingRequest.run({
                                    parsed_media_source_id: id,
                                  });
                                }}
                              >
                                <Trash class="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
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
                            store={personAvatar.bind(person.profile_path ? `/api/proxy/javbus?url=${encodeURIComponent(person.profile_path)}` : "")}
                            alt={person.name}
                          />
                          <div class="mt-1 truncate">{person.name}</div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </Show>
        </div>
      </ScrollView>
      <Dialog store={profileChangeDialog}>
        <div class="w-[520px]">
          <TMDBSearcherView store={searcher} />
        </div>
      </Dialog>
      <Dialog store={deletingConfirmDialog}>
        <div class="w-[520px]">
          <div>确认删除吗？</div>
          <div>该操作不删除视频文件</div>
          <div>请仅在需要重新索引关联的文件时进行删除操作</div>
        </div>
      </Dialog>
    </>
  );
};
