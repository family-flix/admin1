/**
 * @file 电视剧详情
 */
import { For, Show, createSignal, onMount } from "solid-js";

import { RequestedResource, Result, ViewComponent } from "@/types";
import { request } from "@/utils/request";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/LazyImage";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import { bind_searched_tv_for_tv } from "@/services";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { RequestCore } from "@/domains/client";
import { ButtonCore } from "@/domains/ui/button";

async function fetch_tv_profile(body: { tv_id: string }) {
  const { tv_id } = body;
  const r = await request.get<{
    id: string;
    name: string;
    overview: string;
    poster_path: null;
    backdrop_path: null;
    original_language: string;
    first_air_date: string;
    incomplete: boolean;
    seasons: {
      id: string;
      name: string;
      overview: string;
      episodes: {
        id: string;
        name: string;
        overview: string;
      }[];
    }[];
  }>(`/api/admin/tv/${tv_id}`);
  return r;
}
type TVProfile = RequestedResource<typeof fetch_tv_profile>;
async function delete_episode_in_tv(body: { id: string; tv_id: string }) {
  const { id, tv_id } = body;
  const r = await request.get(`/api/admin/tv/episode/${id}`, { tv_id });
  return r;
}

export const TVProfilePage: ViewComponent = (props) => {
  const { app, view } = props;
  // const [profile, set_profile] = useState<TVProfile | null>(null);
  // const [visible, set_visible] = useState(false);
  // const cur_episode_ref = useRef<TVProfile["episodes"][0] | null>(null);

  const request = new RequestCore(fetch_tv_profile, {
    onFailed(error) {
      app.tip({ text: ["获取电视剧详情失败", error.message] });
    },
    onSuccess(v) {
      set_profile(v);
    },
  });
  const request2 = new RequestCore(bind_searched_tv_for_tv, {
    onFailed(error) {
      app.tip({ text: ["更新详情失败", error.message] });
    },
    onSuccess(v) {
      app.tip({ text: ["更新详情成功"] });
      request.reload();
    },
  });
  const dialog = new TMDBSearcherDialogCore({
    onOk(searched_tv) {
      const id = view.params.id as string;
      if (!id) {
        app.tip({ text: ["更新详情失败", "缺少电视剧 id"] });
        return;
      }
      request2.run(id, searched_tv);
      bind_searched_tv_for_tv(id, searched_tv);
      dialog.hide();
    },
  });
  const btn1 = new ButtonCore({
    onClick() {
      if (request.response) {
        dialog.input(request.response.name);
      }
      dialog.show();
    },
  });

  const [profile, set_profile] = createSignal<TVProfile | null>(null);

  onMount(() => {
    const { id } = view.params;
    request.run({ tv_id: id });
  });

  return (
    <>
      <div class="">
        <div class="">
          <Show when={!!profile()}>
            <div class="relative">
              <div
                class=""
                style={
                  {
                    // "background-image": `url('${profile().backdrop_path}')`,
                    // "background-size": "auto",
                    // backgroundPosition: "left calc((50vw - 170px) - 340px) top",
                  }
                }
              >
                <div
                // style={{
                //   background:
                //     "linear-gradient(to right, rgba(52.5, 157.5, 157.5, 1) calc((50vw - 170px) - 340px), rgba(52.5, 157.5, 157.5, 0.84) 50%, rgba(52.5, 157.5, 157.5, 0.84) 100%)",
                // }}
                >
                  {/* <div class="absolute z-2 inset-0 backdrop-blur-lg w-full h-full" /> */}
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
                  {/* <TVFormDialog trigger={<Button>修改</Button>} /> */}
                </div>
                <div class="mt-4 space-y-4">
                  <For each={profile()?.seasons}>
                    {(season) => {
                      const { name, overview, episodes } = season;
                      return (
                        <div class="rounded border border-slate-400">
                          <div class="p-4 bg-slate-300">
                            <div class="text-2xl">{name}</div>
                          </div>
                          <div class="space-y-1 px-4">
                            <For each={episodes}>
                              {(episode) => {
                                const { id, name, overview } = episode;
                                return (
                                  <div class="py-2">
                                    <p class="text-lg">{name}</p>
                                    <p class="">{overview}</p>
                                  </div>
                                );
                              }}
                            </For>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            </div>
          </Show>
        </div>
        <TMDBSearcherDialog store={dialog} />
      </div>
    </>
  );
};
