/**
 * @file 文件详情
 */
import { JSXElement, Show, createSignal, onMount } from "solid-js";
import { AlertCircle, Binary, CheckCircle2, Lightbulb, Trash } from "lucide-solid";

import { fetchFileProfile } from "@/services/drive";
import { LazyImage } from "@/components/ui";
import { RefCore } from "@/domains/cur";
import { AliyunDriveFile, DriveCore } from "@/domains/drive";
import { RequestCore } from "@/domains/request";
import { bytes_to_size, is_video_file } from "@/utils";
import { MediaTypes } from "@/constants";
import { ImageCore } from "@/domains/ui";

export const DriveFileCard = (props: {
  store: RefCore<AliyunDriveFile>;
  drive: DriveCore;
  footer: JSXElement;
  onTip?: (msg: { text: string[] }) => void;
}) => {
  const { store, drive, footer } = props;

  const fileProfileRequest = new RequestCore(fetchFileProfile);
  const poster = new ImageCore({});

  const [state, setState] = createSignal(store.value);
  const [profile, setProfile] = createSignal(fileProfileRequest.response);

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  fileProfileRequest.onStateChange((v) => {
    setProfile(v.response);
    poster.setURL(v.response?.media?.poster_path);
  });

  const filepath = () => {
    const file = state();
    if (!file) {
      return [];
    }
    return [...file.parent_paths.map((p) => p.name)].filter(Boolean);
  };
  const size = () => {
    const file = state();
    if (!file) {
      return null;
    }
    return bytes_to_size(file.size);
  };

  onMount(() => {
    if (!store.value) {
      return;
    }
    const file = store.value;
    if (!is_video_file(file.name)) {
      return;
    }
    fileProfileRequest.run({
      file_id: file.file_id,
      drive_id: drive.id,
    });
  });

  return (
    <div>
      <div class="space-y-4">
        <div class="text-lg break-all">{state()?.name}</div>
        <div class="">{state()?.file_id}</div>
        <div>{size()}</div>
        <div class="">
          <div class="flex items-center flex-wrap mt-2 text-sm">
            {filepath().map((p, i) => {
              return (
                <>
                  {p}
                  <Show when={i !== filepath().length - 1}>
                    <span class="mx-4 text-slate-500">/</span>
                  </Show>
                </>
              );
            })}
          </div>
        </div>
        <Show when={profile()}>
          <div class="space-y-2">
            <Show
              when={profile()?.media}
              fallback={
                <Show when={profile()?.unknown_media}>
                  <div class="flex">
                    <div class="mr-4">
                      <div class="w-[120px] h-[180px]" />
                    </div>
                    <div>
                      <div>{profile()?.unknown_media?.name}</div>
                      <div class="flex items-center">
                        <AlertCircle class="w-4 h-4 mr-1 text-red-800" />
                        <div>{profile()?.unknown_media?.type === MediaTypes.Movie ? "电影" : "电视剧"}</div>
                      </div>
                      <div>{profile()?.unknown_media?.episode_text}</div>
                      <div>没有匹配到详情信息</div>
                    </div>
                  </div>
                </Show>
              }
            >
              <div class="flex">
                <div class="mr-4">
                  <LazyImage class="w-[120px] h-[180px]" store={poster} />
                </div>
                <div>
                  <div class="text-lg">{profile()?.media?.name}</div>
                  <div>{profile()?.media?.type === MediaTypes.Movie ? "电影" : "电视剧"}</div>
                  <div class="text-sm">
                    <Show
                      when={profile()?.media?.episode_name}
                      fallback={
                        <div>
                          <div class="flex items-center">
                            <AlertCircle class="w-4 h-4 mr-1 text-red-800" />
                            <span>{profile()?.media?.episode_text}</span>
                          </div>
                        </div>
                      }
                    >
                      <div class="flex items-center">
                        <CheckCircle2 class="w-4 h-4 mr-1 text-green-800" />
                        <span>{profile()?.media?.episode_name}</span>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </Show>
      </div>
      {footer}
    </div>
  );
};
