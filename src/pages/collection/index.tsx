/**
 * @file 电影列表
 */
import { createSignal, For } from "solid-js";
import { Award, BookOpen, Calendar, Clock, RotateCw, Search, Star } from "lucide-solid";

import { CollectionItem, deleteCollection, fetchCollectionList } from "@/services/collection";
import { LazyImage, Input, Button, Skeleton, ScrollView, ListView, Checkbox, Dialog } from "@/components/ui";
import {
  InputCore,
  ButtonCore,
  ButtonInListCore,
  ScrollViewCore,
  CheckboxCore,
  DialogCore,
  CheckboxGroupCore,
} from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { ViewComponent } from "@/types";
import { collectionCreatePage, collectionEditPage, consumeAction, driveList, pendingActions } from "@/store";
import { DriveCore } from "@/domains/drive";

export const CollectionListPage: ViewComponent = (props) => {
  const { app, view } = props;

  const collectionList = new ListCore(new RequestCore(fetchCollectionList), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
  const collectionDeletingRequest = new RequestCore(deleteCollection, {
    onLoading(loading) {
      deletingConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["删除成功"],
      });
      deletingConfirmDialog.hide();
      const theCollection = collectionRef.value;
      if (!theCollection) {
        return;
      }
      collectionList.deleteItem((item) => {
        if (item.id === theCollection.id) {
          return true;
        }
        return false;
      });
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
  });
  const collectionRef = new RefCore<CollectionItem>();
  const nameSearchInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入名称搜索",
    onEnter() {
      searchBtn.click();
    },
  });
  const searchBtn = new ButtonCore({
    onClick() {
      collectionList.search({ name: nameSearchInput.value });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      collectionList.reset();
      nameSearchInput.clear();
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      collectionList.refresh();
    },
  });
  const editBtn = new ButtonInListCore<CollectionItem>({
    onClick(record) {
      collectionEditPage.query = {
        id: record.id,
      };
      app.showView(collectionEditPage);
    },
  });
  const deletingConfirmDialog = new DialogCore({
    title: "删除集合",
    onOk() {
      if (!collectionRef.value) {
        return;
      }
      collectionDeletingRequest.run({
        collection_id: collectionRef.value.id,
      });
    },
  });
  const deleteBtn = new ButtonInListCore<CollectionItem>({
    onClick(record) {
      collectionRef.select(record);
      deletingConfirmDialog.show();
    },
  });
  const gotoCollectionCreatePage = new ButtonCore({
    onClick() {
      app.showView(collectionCreatePage);
    },
  });
  const scrollView = new ScrollViewCore();

  const [state, setState] = createSignal(collectionList.response);

  view.onShow(() => {
    const { deleteMovie } = pendingActions;
    if (!deleteMovie) {
      return;
    }
    consumeAction("deleteMovie");
    collectionList.deleteItem((movie) => {
      if (movie.id === deleteMovie.movie_id) {
        return true;
      }
      return false;
    });
  });
  scrollView.onReachBottom(() => {
    collectionList.loadMore();
  });
  collectionList.onStateChange((nextState) => {
    setState(nextState);
  });
  collectionList.init();
  driveList.initAny();

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8">
        <h1 class="text-2xl">集合列表</h1>
        <div class="mt-8">
          <div class="flex items-center space-x-2">
            <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
              刷新
            </Button>
            <Button class="space-x-1" store={gotoCollectionCreatePage}>
              新增集合
            </Button>
          </div>
          <div class="flex items-center space-x-2 mt-4">
            <Input class="" store={nameSearchInput} />
            <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
              搜索
            </Button>
            <Button class="" store={resetBtn}>
              重置
            </Button>
          </div>
          <div class="mt-4">
            <ListView
              store={collectionList}
              skeleton={
                <div>
                  <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                    <div class="flex">
                      <div class="overflow-hidden mr-2 rounded-sm">
                        <Skeleton class="w-[180px] h-[272px]" />
                      </div>
                      <div class="flex-1 p-4">
                        <Skeleton class="h-[36px] w-[180px]"></Skeleton>
                        <div class="mt-2 space-y-1">
                          <Skeleton class="h-[24px] w-[120px]"></Skeleton>
                          <Skeleton class="h-[24px] w-[240px]"></Skeleton>
                        </div>
                        <div class="flex items-center space-x-4 mt-2">
                          <Skeleton class="w-10 h-6"></Skeleton>
                          <Skeleton class="w-10 h-6"></Skeleton>
                          <Skeleton class="w-10 h-6"></Skeleton>
                        </div>
                        <div class="flex space-x-2 mt-6">
                          <Skeleton class="w-24 h-8"></Skeleton>
                          <Skeleton class="w-24 h-8"></Skeleton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <div class="space-y-4">
                <For each={state().dataSource}>
                  {(collection) => {
                    const { id, title, desc, medias } = collection;
                    return (
                      <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                        <div class="flex">
                          <div class="flex-1 w-0 p-4">
                            <h2 class="text-2xl text-slate-800">{title}</h2>
                            <div class="mt-2 flex space-x-2">
                              <For each={medias}>
                                {(media) => {
                                  const { id, name, poster_path } = media;
                                  return (
                                    <div>
                                      <div>
                                        <LazyImage class="w-[78px] rounded-sm" src={poster_path} />
                                        <div class="mt-2">{name}</div>
                                      </div>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                            <div class="space-x-2 mt-6">
                              <Button
                                store={editBtn.bind(collection)}
                                variant="subtle"
                                icon={<BookOpen class="w-4 h-4" />}
                              >
                                编辑
                              </Button>
                              <Button
                                store={deleteBtn.bind(collection)}
                                variant="subtle"
                                icon={<BookOpen class="w-4 h-4" />}
                              >
                                删除
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </ListView>
          </div>
        </div>
      </ScrollView>
      <Dialog store={deletingConfirmDialog}>
        <div class="w-[520px]">
          <div>确认删除该集合吗？</div>
        </div>
      </Dialog>
    </>
  );
};
