import { For, Show, createSignal } from "solid-js";
import { Film, Tv2, X } from "lucide-solid";

import { Button, Dialog, Input, LazyImage, Textarea } from "@/components/ui";
import { MovieSelect } from "@/components/MovieSelect";
import { SeasonSelect } from "@/components/SeasonSelect";
import { SimpleSelect } from "@/components/ui/simple-select";
import { ButtonCore, ImageInListCore } from "@/domains/ui";
import { CollectionTypes } from "@/constants";
import { ViewComponent } from "@/types";

import { CollectionFormCore } from "./core";

export const CollectionEditPage: ViewComponent = (props) => {
  const { app, view } = props;

  const collectionForm = new CollectionFormCore({});
  const poster = new ImageInListCore({});
  const submitBtn = new ButtonCore({
    onClick() {
      collectionForm.edit(view.query.id);
    },
  });

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
  collectionForm.profileRequest.run({
    collection_id: view.query.id,
  });

  return (
    <>
      <div class="h-screen p-8">
        <h1 class="text-2xl">编辑集合</h1>
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
              <div>类型</div>
              <SimpleSelect store={collectionForm.fields.type} />
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
                      {(movie) => {
                        const { id, name, poster_path } = movie;
                        return (
                          <div class="relative">
                            <div class="">
                              <LazyImage class="w-[78px] rounded-sm" store={poster.bind(poster_path)} />
                            </div>
                            <div class="mt-2">
                              <div>{name}</div>
                            </div>
                            <div
                              class="absolute z-10 right-0 top-0 p-1 rounded-full bg-white cursor-pointer"
                              onClick={() => {
                                collectionForm.removeMedia(movie);
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
          <SeasonSelect store={collectionForm.seasonSelect} />
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
