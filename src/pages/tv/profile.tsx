/**
 * @file 电视剧详情
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { LucideEdit3 as Edit3, LucideLoader as Loader, LucideTrash as Trash } from "lucide-solid";

import { ViewComponent } from "@/types";
import { Button } from "@/components/ui/button";
import { Element } from "@/components/ui/element";
import { LazyImage } from "@/components/ui/image";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import {
  fetch_files_of_tv,
  fetch_file_profile_of_tv,
  delete_aliyun_file,
  fetch_tv_profile,
  TVProfile,
  delete_parsed_tv_of_tv,
  delete_tv,
  refresh_tv_profile,
  fetch_episodes_of_season,
} from "@/services";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { RequestCore } from "@/domains/client";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DialogCore } from "@/domains/ui/dialog";
import { SelectionCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxCore } from "@/domains/ui/checkbox";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { ScrollView } from "@/components/ui/scroll-view";
import { Skeleton } from "@/components/ui/skeleton";
import { ListView } from "@/components/ListView";
import { createJob } from "@/store";
import { appendAction } from "@/store/actions";

export const TVProfilePage: ViewComponent = (props) => {
  const { app, view, router } = props;

  const sourceList = new ListCore(new RequestCore(fetch_files_of_tv), {
    page: 1,
    search: {
      id: view.params.id,
    },
    onStateChange(state) {
      setSourceResponse(state);
    },
  });
  const sourceProfileRequest = new RequestCore(fetch_file_profile_of_tv, {
    onFailed(error) {
      app.tip({ text: ["获取文件详情失败", error.message] });
    },
    onSuccess(v) {
      setSourceProfile(v);
    },
  });
  const curEpisodeList = new ListCore(new RequestCore(fetch_episodes_of_season));
  const profileRequest = new RequestCore(fetch_tv_profile, {
    onFailed(error) {
      app.tip({ text: ["获取电视剧详情失败", error.message] });
    },
    onSuccess(v) {
      setProfile(v);
      if (v.seasons.length === 0) {
        return;
      }
      curEpisodeList.init({
        tv_id: view.params.id,
        season_id: v.seasons[0].id,
      });
    },
  });
  const curFile = new SelectionCore<TVProfile["sources"][number]>();
  const curParsedTV = new SelectionCore<TVProfile["parsed_tvs"][number]>();
  const updateTVProfileRequest = new RequestCore(refresh_tv_profile, {
    onLoading(loading) {
      tmdbSearchDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["更新详情失败", error.message] });
    },
    onSuccess(v) {
      app.tip({ text: ["开始更新详情"] });
      createJob({
        job_id: v.job_id,
        onFinish() {
          profileRequest.reload();
        },
      });
      tmdbSearchDialog.hide();
    },
  });
  const tmdbSearchDialog = new TMDBSearcherDialogCore({
    onOk(searched_tv) {
      const id = view.params.id as string;
      if (!id) {
        app.tip({ text: ["更新详情失败", "缺少电视剧 id"] });
        return;
      }
      updateTVProfileRequest.run({
        tv_id: id,
        tmdb_id: searched_tv.id,
      });
    },
  });
  const btn1 = new ButtonCore({
    onClick() {
      if (profileRequest.response) {
        tmdbSearchDialog.input(profileRequest.response.name);
      }
      tmdbSearchDialog.show();
    },
  });
  const refreshProfileRequest = new RequestCore(refresh_tv_profile, {
    onLoading(loading) {
      refreshProfileBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["刷新成功"],
      });
      profileRequest.reload();
    },
    onFailed(error) {
      app.tip({
        text: ["刷新失败", error.message],
      });
    },
  });
  const refreshProfileBtn = new ButtonCore({
    onClick() {
      refreshProfileRequest.run({ tv_id: view.params.id });
    },
  });
  const deleteFileRequest = new RequestCore(delete_aliyun_file, {
    onLoading(loading) {
      deleteConfirmDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["删除文件失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["删除文件成功"] });
      deleteConfirmDialog.hide();
      const targetFile = curFile.value;
      if (!targetFile) {
        return;
      }
      const target = sourceList.response.dataSource.find((item) => item.file_id === targetFile.file_id);
      if (!target) {
        return;
      }
      // sourceList.deleteItem(target);
    },
  });
  const deleteTVRequest = new RequestCore(delete_tv, {
    onLoading(loading) {
      deleteTVConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["删除成功"],
      });
      deleteTVConfirmDialog.hide();
      appendAction("deleteTV", {
        tv_id: view.params.id,
      });
      router.back();
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
  });
  const deleteTVBtn = new ButtonCore({
    onClick() {
      deleteTVConfirmDialog.show();
    },
  });
  const deleteTVConfirmDialog = new DialogCore({
    title: "确认删除该电视剧吗？",
    onOk() {
      deleteTVRequest.run({ tv_id: view.params.id });
    },
  });
  const deleteConfirmDialog = new DialogCore({
    title: "确认删除文件吗？",
    onOk() {
      if (!curFile.value) {
        return;
      }
      deleteFileRequest.run({
        file_id: curFile.value.file_id,
      });
    },
  });
  const deleteBtn = new ButtonInListCore<TVProfile["sources"][number]>({
    onClick(record) {
      curFile.select(record);
      deleteConfirmDialog.setTitle(`确认删除 '${record.file_name}' 吗？`);
      deleteConfirmDialog.show();
    },
  });
  const updateSourceDialog = new DialogCore({
    title: "详情",
    footer: false,
  });
  const updateParsedTVBtn = new ButtonInListCore<TVProfile["parsed_tvs"][number]>({
    onClick(record) {
      // curFile.select(record);
      // updateSourceDialog.show();
      // sourceProfileRequest.run({ tv_id: view.params.id, id: record.file_id });
    },
  });
  const deleteParsedTVBtn = new ButtonInListCore<TVProfile["parsed_tvs"][number]>({
    onClick(record) {
      curParsedTV.select(record);
      parsedTVDeletingDialog.setTitle(`确认删除 '${record.name || record.original_name}' 吗？`);
      parsedTVDeletingDialog.show();
    },
  });
  const updateBtn = new ButtonInListCore<TVProfile["sources"][number]>({
    onClick(record) {
      curFile.select(record);
      updateSourceDialog.show();
      sourceProfileRequest.run({ tv_id: view.params.id, id: record.file_id });
    },
  });
  const checkbox = new CheckboxCore();
  const parsedTVDeletingRequest = new RequestCore(delete_parsed_tv_of_tv, {
    onLoading(loading) {
      parsedTVDeletingDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["删除失败", error.message] });
    },
    onSuccess() {
      parsedTVDeletingDialog.hide();
      updateSourceDialog.hide();
      profileRequest.reload();
      app.tip({ text: ["删除成功"] });
    },
    onCompleted() {
      parsedTVDeletingDialog.okBtn.setLoading(false);
    },
  });
  const parsedTVDeletingDialog = new DialogCore({
    title: "确认删除吗？",
    onOk() {
      if (!curParsedTV.value) {
        return;
      }
      parsedTVDeletingDialog.okBtn.setLoading(true);
      parsedTVDeletingRequest.run({
        tv_id: view.params.id,
        id: curParsedTV.value.id,
      });
    },
  });
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      curEpisodeList.loadMore();
    },
  });

  const [profile, setProfile] = createSignal<TVProfile | null>(null);
  const [curEpisodeResponse, setCurEpisodeResponse] = createSignal(curEpisodeList.response);
  const [sourceResponse, setSourceResponse] = createSignal(sourceList.response);
  const [sourceProfile, setSourceProfile] = createSignal(sourceProfileRequest.response);

  curEpisodeList.onStateChange((nextResponse) => {
    setCurEpisodeResponse(nextResponse);
  });

  onMount(() => {
    const { id } = view.params;
    profileRequest.run({ tv_id: id });
  });

  return (
    <>
      <ScrollView class="h-screen p-8" store={scrollView}>
        <div class="">
          <Show
            when={!!profile()}
            fallback={
              <div class="relative">
                <div class="">
                  <div>
                    <div class="relative z-3">
                      <div class="flex">
                        <Skeleton class="w-[240px] h-[360px] rounded-lg mr-4 object-cover" />
                        <div class="flex-1 mt-4">
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
                      <LazyImage
                        class="overflow-hidden w-[240px] rounded-lg mr-4 object-cover"
                        src={profile()?.poster_path ?? undefined}
                      />
                      <div class="flex-1 mt-4">
                        <h2 class="text-5xl">{profile()?.name}</h2>
                        <div class="mt-6 text-2xl">剧情简介</div>
                        <div class="mt-2">{profile()?.overview}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="relative z-3 mt-4">
                <div class="space-x-4">
                  <Button store={btn1}>搜索 TMDB</Button>
                  <a href={`https://www.themoviedb.org/tv/${profile()?.tmdb_id}`}>前往 TMDB 页面</a>
                  <Button store={refreshProfileBtn}>刷新详情</Button>
                  <Button store={deleteTVBtn}>删除电视剧</Button>
                </div>
                <div class="mt-4 flex w-full pb-4 overflow-x-auto space-x-4">
                  <For each={profile()?.seasons}>
                    {(season) => {
                      const { id, name } = season;
                      return (
                        <div
                          class=""
                          onClick={() => {
                            curEpisodeList.init({
                              tv_id: view.params.id,
                              season_id: id,
                            });
                          }}
                        >
                          <div class="text-xl whitespace-nowrap">{name}</div>
                        </div>
                      );
                    }}
                  </For>
                </div>
                <ListView store={curEpisodeList}>
                  <For each={curEpisodeResponse().dataSource}>
                    {(episode) => {
                      const { id, name, episode_number, sources } = episode;
                      return (
                        <div>
                          {episode_number}、{name}
                          <div class="pl-4">
                            <For each={sources}>
                              {(source) => {
                                return (
                                  <div>
                                    <span
                                      onClick={() => {
                                        router.push(`/play/${source.file_id}`);
                                      }}
                                    >
                                      {source.parent_paths}/{source.file_name}
                                    </span>
                                  </div>
                                );
                              }}
                            </For>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </ListView>
              </div>
            </div>
            {/* <div class="mt-8 text-xl">关联解析结果列表</div>
            <div class="mt-4 space-y-1">
              <Show when={!!profile()}>
                <For each={profile()?.parsed_tvs}>
                  {(parsed_tv) => {
                    const { file_name, name, original_name, correct_name } = parsed_tv;
                    return (
                      <div class="flex items-center space-x-2 text-slate-800">
                        <div>{name || original_name}</div>
                        <div class="flex items-center space-x-1">
                          <Element store={updateParsedTVBtn.bind(parsed_tv)}>
                            <Edit3 class="w-4 h-4 cursor-pointer" />
                          </Element>
                          <Element store={deleteParsedTVBtn.bind(parsed_tv)}>
                            <Trash class="w-4 h-4 cursor-pointer" />
                          </Element>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </Show>
            </div> */}
            {/* <div class="mt-8 text-xl">文件列表</div>
            <div class="mt-4 space-y-1">
              <For each={sourceResponse().dataSource}>
                {(source) => {
                  const { file_name, drive, parent_paths } = source;
                  return (
                    <div class="flex items-center space-x-2 text-slate-800">
                      <div>
                        <span class="text-slate-800 mr-2">{drive.name}</span>
                        <span>
                          {parent_paths}/{file_name}
                        </span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <Element store={updateBtn.bind(source)}>
                          <Edit3 class="w-4 h-4 cursor-pointer" />
                        </Element>
                        <Element store={deleteBtn.bind(source)}>
                          <Trash class="w-4 h-4 cursor-pointer" />
                        </Element>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
            <Show when={!sourceResponse().noMore}>
              <div
                class="py-2 text-center cursor-pointer"
                onClick={() => {
                  sourceList.loadMore();
                }}
              >
                更多
              </div>
            </Show> */}
          </Show>
        </div>
      </ScrollView>
      <TMDBSearcherDialog store={tmdbSearchDialog} />
      <Dialog store={deleteTVConfirmDialog}>
        <div class="flex items-center space-x-2">
          <Checkbox id="delete" store={checkbox} />
          <label html-for="delete">同时删除云盘内文件</label>
        </div>
      </Dialog>
      <Dialog store={deleteConfirmDialog}>
        <div class="flex items-center space-x-2">
          <Checkbox id="delete" store={checkbox} />
          <label html-for="delete">同时删除云盘内文件</label>
        </div>
      </Dialog>
      <Dialog store={parsedTVDeletingDialog}>
        <div class="space-y-1">
          <div>删除关联的解析电视剧</div>
          <div>同时还会删除解析电视剧关联的所有季、集</div>
          <div>请仅在需要重新索引关联的文件时进行删除操作</div>
        </div>
      </Dialog>
    </>
  );
};
