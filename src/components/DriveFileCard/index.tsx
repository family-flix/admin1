/**
 * @file 文件详情
 */
import { Show, createSignal, onMount } from "solid-js";
import { Binary, Trash } from "lucide-solid";

import { setParsedTVSeasonProfile } from "@/services";
import { Button, LazyImage } from "@/components/ui";
import { TMDBSearcher, TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import { RefCore } from "@/domains/cur";
import { AliyunDriveFile, DriveCore, fetchFileProfile } from "@/domains/drive";
import { ButtonCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { bytes_to_size } from "@/utils";
import { TMDBSearcherCore } from "@/domains/tmdb";
import { createJob } from "@/store";

export const DriveFileCard = (props: {
  store: RefCore<AliyunDriveFile>;
  drive: DriveCore;
  onDeleting?: (file: AliyunDriveFile) => void;
  onTip?: (msg: { text: string[] }) => void;
}) => {
  const { store, drive, onDeleting, onTip } = props;

  const fileProfileRequest = new RequestCore(fetchFileProfile);
  const setParsedTVProfileRequest = new RequestCore(setParsedTVSeasonProfile, {
    beforeRequest() {
      seasonProfileChangeSelectDialog.okBtn.setLoading(true);
    },
    onSuccess(v) {
      createJob({
        job_id: v.job_id,
        onFinish() {
          if (onTip) {
            onTip({
              text: ["设置完成"],
            });
          }
          seasonProfileChangeSelectDialog.okBtn.setLoading(false);
          seasonProfileChangeSelectDialog.hide();
        },
      });
    },
    onFailed(error) {
      if (onTip) {
        onTip({
          text: ["设置失败", error.message],
        });
      }
      seasonProfileChangeSelectDialog.okBtn.setLoading(false);
    },
  });
  const deletingBtn = new ButtonCore({
    onClick() {
      if (onDeleting) {
        onDeleting(store.value!);
      }
    },
  });
  const setProfileBtn = new ButtonCore({
    onClick() {
      seasonProfileChangeSelectDialog.show();
    },
  });
  const seasonProfileChangeSelectDialog = new TMDBSearcherDialogCore({
    onOk(profile) {
      const file = fileProfileRequest.response;
      if (!file) {
        if (onTip) {
          onTip({
            text: ["请先获取文件详情"],
          });
        }
        return;
      }
      seasonProfileChangeSelectDialog.okBtn.setLoading(true);
      setParsedTVProfileRequest.run({
        file_id: file.id,
        unique_id: profile.id,
      });
    },
  });

  const [state, setState] = createSignal(store.value);
  const [profile, setProfile] = createSignal(fileProfileRequest.response);

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  fileProfileRequest.onStateChange((nextState) => {
    setProfile(nextState.response);
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
    fileProfileRequest.run({
      file_id: store.value.file_id,
      drive_id: drive.id,
    });
  });

  return (
    <div>
      <div>
        <div class="mt-4 text-lg break-all">{state()?.name}</div>
        <div class="">{state()?.file_id}</div>
        <div>{size()}</div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
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
          <div class="mt-8 space-y-2">
            <Show when={profile()?.parsed_tv}>
              <div>
                <Show when={profile()?.parsed_tv?.profile} fallback={<div>该文件夹可能是电视剧</div>}>
                  <div>关联了电视剧</div>
                  <div class="flex">
                    <div class="mr-4">
                      <LazyImage class="w-[120px] object-fit" src={profile()?.parsed_tv?.profile?.poster_path} />
                    </div>
                    <div>{profile()?.parsed_tv?.profile?.name}</div>
                  </div>
                </Show>
              </div>
            </Show>
            <Show when={profile()?.parsed_episode}>
              <div>
                <Show when={profile()?.parsed_episode}>
                  <div>电视剧剧集</div>
                  <div class="flex">
                    <div>{profile()?.parsed_episode?.episode_text}</div>
                  </div>
                </Show>
              </div>
            </Show>
          </div>
        </Show>
      </div>
      <div class="mt-4 flex items-center space-x-2">
        <Button store={deletingBtn} variant="subtle" icon={<Trash class="w-4 h-4" />}>
          删除
        </Button>
        <Button store={setProfileBtn} variant="subtle" icon={<Binary class="w-4 h-4" />}>
          关联电视剧
        </Button>
        {/* <Button store={deletingBtn} variant="subtle" icon={<Play class="w-4 h-4" />}>
          播放
        </Button> */}
      </div>
      <TMDBSearcherDialog store={seasonProfileChangeSelectDialog} />
    </div>
  );
};
