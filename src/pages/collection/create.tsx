/**
 * @file 创建影视剧集合
 */
import { For, Show, createSignal } from "solid-js";
import { Film, Tv2, X } from "lucide-solid";

import { Button, Dialog, Input, LazyImage, Textarea } from "@/components/ui";
import { MovieSelect } from "@/components/MovieSelect";
import { TVSeasonSelect } from "@/components/SeasonSelect";
import { ButtonCore } from "@/domains/ui";
import { ViewComponent } from "@/types";

import { CollectionFormCore } from "./core";

export const CollectionCreatePage: ViewComponent = (props) => {
  const { app, view } = props;

  const collectionForm = new CollectionFormCore({});

  const [state, setState] = createSignal(collectionForm.state);

  collectionForm.onStateChange((nextState) => {
    setState(nextState);
  });
  collectionForm.onLoading((loading) => {
    submitBtn.setLoading(loading);
  });
  collectionForm.onTip((msg) => {
    app.tip(msg);
  });

  const submitBtn = new ButtonCore({
    onClick() {
      collectionForm.create();
    },
  });

  return (
    <>
      <div class="h-screen p-8">
        <h1 class="text-2xl">创建集合</h1>
        <div class="w-[520px] mx-auto">
          <div class="space-y-4">
            <div class="space-y-2">
              <div>标题</div>
              <Input store={collectionForm.fields.title} />
            </div>
            <div class="space-y-2">
              <div>描述</div>
              <Textarea store={collectionForm.fields.desc} />
            </div>
            <div class="space-y-2">
              <div>排序</div>
              <Input store={collectionForm.fields.sort} />
            </div>
            <div class="space-y-2">
              <div>内容</div>
              <div>
                <Show
                  when={state().medias.length}
                  fallback={
                    <div class="flex space-x-2">
                      <div
                        class="cursor-pointer"
                        onClick={() => {
                          collectionForm.seasonSelectDialog.show();
                        }}
                      >
                        <Tv2 class="w-4 h-4" />
                      </div>
                      <div
                        class="cursor-pointer"
                        onClick={() => {
                          collectionForm.movieSelectDialog.show();
                        }}
                      >
                        <Film class="w-4 h-4" />
                      </div>
                    </div>
                  }
                >
                  <div class="grid gap-2 grid-cols-6">
                    <For each={state().medias}>
                      {(media) => {
                        const { id, type, name, poster_path } = media;
                        return (
                          <div class="relative">
                            <div class="relative">
                              <LazyImage class="w-[78px] rounded-sm" src={poster_path} />
                              <div class="absolute left-0 top-0">{type === 1 ? "电视剧" : "电影"}</div>
                            </div>
                            <div class="mt-2">
                              <div>{name}</div>
                            </div>
                            <div
                              class="absolute z-10 right-0 top-0 p-1 rounded-full bg-white cursor-pointer"
                              onClick={() => {
                                collectionForm.removeMedia(media);
                              }}
                            >
                              <X class="w-2 h-2" />
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                  <div class="flex mt-2 space-x-2">
                    <div
                      class="cursor-pointer"
                      onClick={() => {
                        collectionForm.seasonSelectDialog.show();
                      }}
                    >
                      <Tv2 class="w-4 h-4" />
                    </div>
                    <div
                      class="cursor-pointer"
                      onClick={() => {
                        collectionForm.movieSelectDialog.show();
                      }}
                    >
                      <Film class="w-4 h-4" />
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </div>
          <div class="mt-12">
            <Button store={submitBtn}>提交</Button>
          </div>
        </div>
      </div>
      <Dialog store={collectionForm.seasonSelectDialog}>
        <div class="w-[520px]">
          <TVSeasonSelect store={collectionForm.seasonSelect} />
        </div>
      </Dialog>
      <Dialog store={collectionForm.movieSelectDialog}>
        <div class="w-[520px]">
          <MovieSelect store={collectionForm.movieSelect} />
        </div>
      </Dialog>
    </>
  );
};
