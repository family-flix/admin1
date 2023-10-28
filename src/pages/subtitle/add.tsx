/**
 * @file 上传字幕
 */
import { For, Show, createSignal } from "solid-js";
import { ChevronRight, Eye, Folder, FolderInput, Loader, MoreHorizontal, Scroll, Search, Send } from "lucide-solid";

import { TVSeasonItem, batchUploadSubtitles, validateSubtitleFiles } from "@/services";
import { Button, Dialog, DropdownMenu, Input, LazyImage, ScrollView } from "@/components/ui";
import { ButtonCore, DialogCore, ScrollViewCore, SelectCore, SelectInListCore, InputInListCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ViewComponent } from "@/types";
import { createJob, driveList } from "@/store";
import { SubtitleLanguageOptions } from "@/constants";
import { DragZoneCore } from "@/domains/ui/drag-zone";
import { TVSeasonSelect } from "@/components/SeasonSelect/main";
import { TVSeasonSelectCore } from "@/components/SeasonSelect";
import { RefCore } from "@/domains/cur";
import { Select } from "@/components/ui/select";
import { SubtitlePreview, SubtitleReaderCore } from "@/components/SubtitlePreview";

export const HomeSubtitleUploadPage: ViewComponent = (props) => {
  const { app, view } = props;

  const filenameValidatingRequest = new RequestCore(validateSubtitleFiles, {
    onFailed(error) {
      app.tip({
        text: ["校验失败", error.message],
      });
    },
    onSuccess(v) {
      const { tvs, drives, files } = v;
      if (tvs.length) {
        const first = tvs[0];
        // @ts-ignore
        tvSelect.select({
          id: first.id,
          name: first.name,
          poster_path: first.poster_path,
        });
        // curSeason.select({
        //   id: first.id,
        //   name: first.name,
        //   poster_path: first.poster_path,
        // });
        const seasonOptions = first.seasons.map((s) => {
          const { id, season_text } = s;
          return {
            value: id,
            label: season_text,
          };
        });
        seasonSelect.setOptions(seasonOptions);
        seasonController.setOptions(seasonOptions);
        const episodeOptions = first.episodes.map((s) => {
          const { id, episode_text } = s;
          return {
            value: id,
            label: episode_text,
          };
        });
        episodeSelect.setOptions(episodeOptions);
      }
      if (drives.length) {
        driveSelect.setValue(drives[0].id);
      }
      for (let i = 0; i < files.length; i += 1) {
        const file = v.files[i];
        const s = seasonSelect.bind(file);
        if (file.season) {
          s.setValue(file.season.id);
        }
        const e = episodeSelect.bind(file);
        if (file.episode) {
          e.setValue(file.episode.id);
        }
        const l = langSelect.bind(file);
        if (file.language) {
          l.setValue(file.language);
        }
      }
    },
  });
  const batchUploadSubtitleRequest = new RequestCore(batchUploadSubtitles, {
    onSuccess(v) {
      createJob({
        job_id: v.job_id,
        onFinish() {
          app.tip({
            text: ["上传完成"],
          });
          uploadLoadingDialog.hide();
          filenameValidatingRequest.clear();
          seasonController.clear();
          langController.clear();
          tvSelect.clear();
          driveSelect.clear();
        },
      });
    },
    onFailed(error) {
      app.tip({
        text: ["上传失败", error.message],
      });
      uploadLoadingDialog.hide();
    },
  });
  const curSeason = new RefCore<{ id: string; name: string; poster_path: string }>();
  const uploadZone = new DragZoneCore({
    onChange(files) {
      seasonController.clear();
      langController.clear();
      langSelect.clear();
      tvSelect.clear();
      filenameValidatingRequest.run({
        filenames: files.map((file) => file.name),
      });
    },
  });
  const seasonSelect = new SelectInListCore<{ filename: string }, string>({
    defaultValue: null,
  });
  const episodeSelect = new SelectInListCore<{ filename: string }, string>({
    defaultValue: null,
  });
  const langSelect = new SelectInListCore<{ filename: string }, string>({
    options: SubtitleLanguageOptions,
  });
  const driveSelect = new SelectCore({
    defaultValue: null,
    options: driveList.response.dataSource.map((drive) => {
      const { id, name } = drive;
      return {
        value: id,
        label: name,
      };
    }),
  });
  const tvSelectBtn = new ButtonCore({
    onClick() {
      tvSelectDialog.show();
    },
  });
  const tvSelectDialog = new DialogCore({
    title: "选择电视剧",
    onOk() {
      if (!tvSelect.value) {
        app.tip({
          text: ["请选择电视剧"],
        });
        return;
      }
      // curSeason.select(tvSelect.value);
      tvSelectDialog.hide();
    },
  });
  const tvSelect = new TVSeasonSelectCore({});
  const submitBtn = new ButtonCore({
    onClick() {
      if (!filenameValidatingRequest.response) {
        return;
      }
      if (!tvSelect.value) {
        app.tip({
          text: ["请选择电视剧"],
        });
        return;
      }
      if (!driveSelect.value) {
        app.tip({
          text: ["请选择云盘"],
        });
        return;
      }
      const values = filenameValidatingRequest.response.files.map((f) => {
        const { filename } = f;
        const season_id = seasonSelect.getValue(f);
        const episode_id = episodeSelect.getValue(f);
        const language = langSelect.getValue(f);
        const file = uploadZone.files.find((f) => f.name === filename);
        const errors: string[] = [];
        if (season_id === null) {
          errors.push(`请为 ${filename} 选择季`);
        }
        if (episode_id === null) {
          errors.push(`请为 ${filename} 选择集`);
        }
        if (language === null) {
          errors.push(`请为 ${filename} 选择语言`);
        }
        if (!file) {
          errors.push(`${filename} 没有匹配的文件`);
        }
        return {
          filename,
          season_id,
          episode_id,
          language,
          file,
          errors,
        };
      });
      const errors = values.reduce((total, cur) => {
        return total.concat(cur.errors);
      }, [] as string[]);
      if (errors.length !== 0) {
        app.tip({
          text: errors,
        });
        return;
      }
      uploadLoadingDialog.show();
      batchUploadSubtitleRequest.run({
        tv_id: tvSelect.value.id,
        drive_id: driveSelect.value,
        files: values.map((v) => {
          const { filename, season_id, episode_id, language, file } = v;
          return {
            filename,
            season_id: season_id!,
            episode_id: episode_id!,
            language: language!,
            file: file!,
          };
        }),
      });
    },
  });
  const seasonController = new SelectCore<string>({
    defaultValue: null,
    onChange(v) {
      seasonSelect.setValue(v);
    },
  });
  const langController = new SelectCore({
    defaultValue: null,
    options: SubtitleLanguageOptions,
    onChange(v) {
      langSelect.setValue(v);
    },
  });
  const subtitlePreview = new DialogCore({
    title: "内容预览",
    footer: false,
  });
  const uploadLoadingDialog = new DialogCore({
    title: "上传字幕",
    footer: false,
    closeable: false,
  });
  const fileReader = new SubtitleReaderCore({});
  const scrollView = new ScrollViewCore();

  const [state, setState] = createSignal(uploadZone.state);
  const [selectedSeason, setSelectedSeason] = createSignal(tvSelect.value);
  const [results, setResults] = createSignal(filenameValidatingRequest.response);

  //   tvSelect.onSelect((nextState) => {
  //     setSelectedSeason(nextState);
  //   });
  driveList.onStateChange((nextResponse) => {
    const options = nextResponse.dataSource.map((drive) => {
      const { id, name } = drive;
      return {
        value: id,
        label: name,
      };
    });
    driveSelect.setOptions(options);
  });
  uploadZone.onStateChange((nextState) => {
    setState(nextState);
  });
  tvSelect.onClear(() => {
    setSelectedSeason(null);
  });
  tvSelect.onSelect((nextState) => {
    setSelectedSeason(nextState);
  });
  filenameValidatingRequest.onResponseChange((v) => {
    setResults(v);
  });
  // curSeason.onStateChange((nextState) => {
  //   setSelectedSeason(nextState);
  // });

  driveList.initAny();

  return (
    <>
      <ScrollView store={scrollView} class="relative h-screen p-8">
        <h1 class="text-2xl">上传字幕</h1>
        <div class="mt-8">
          <div
            classList={{
              "relative w-full min-h-[180px] rounded-sm bg-slate-200 border border-2 cursor-pointer": true,
              "border-green-500 border-dash": state().hovering,
            }}
            onDragOver={(event) => {
              event.preventDefault();
              uploadZone.handleDragover();
            }}
            onDragLeave={() => {
              uploadZone.handleDragleave();
            }}
            onDrop={(event) => {
              event.preventDefault();
              uploadZone.handleDrop(Array.from(event.dataTransfer?.files || []));
            }}
          >
            <Show
              when={!!results()}
              fallback={
                <div class="absolute inset-0 flex items-center justify-center cursor-pointer">
                  <div class="p-4 text-center">
                    <p>将文件拖拽至此或点击选择文件</p>
                    <input type="file" class="absolute inset-0 opacity-0" />
                  </div>
                </div>
              }
            >
              <div class="p-4">
                <div class="p-4 bg-white rounded-sm space-y-2">
                  <div>
                    <Select store={seasonController} />
                  </div>
                  <div>
                    <Select store={langController} />
                  </div>
                </div>
                <div class="space-y-2 mt-8">
                  <For each={results()?.files}>
                    {(result) => {
                      const { filename } = result;
                      return (
                        <div class="p-4 bg-white rounded-sm space-y-2">
                          <div class="flex items-center space-x-2">
                            <div class="break-all">{filename}</div>
                            <div
                              class=""
                              onClick={() => {
                                const file = uploadZone.getFileByName(filename);
                                if (!file) {
                                  app.tip({
                                    text: ["没有匹配的文件"],
                                  });
                                  return;
                                }
                                subtitlePreview.setTitle(filename);
                                subtitlePreview.show();
                                fileReader.read(file);
                              }}
                            >
                              <Eye class="w-4 h-4" />
                            </div>
                          </div>
                          <div>
                            <Select store={seasonSelect.bind(result, { defaultValue: "" })} />
                          </div>
                          <div>
                            <Select store={episodeSelect.bind(result, { defaultValue: "" })} />
                          </div>
                          <div>
                            <Select store={langSelect.bind(result)} />
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            </Show>
          </div>
          <div class="flex items-center space-x-2">
            <Show when={selectedSeason()}>
              <div class="flex">
                <div class="w-[120px] mr-4">
                  <LazyImage src={selectedSeason()?.poster_path} />
                </div>
                <div class="flex-1">
                  <div>{selectedSeason()?.name}</div>
                  <Button store={tvSelectBtn}>重新选择</Button>
                </div>
              </div>
            </Show>
          </div>
          <div class="py-4">
            <Select store={driveSelect} />
          </div>
        </div>
        <div class="absolute bottom-0 py-4">
          <div class="flex rows-reverse">
            <Button store={submitBtn}>上传</Button>
          </div>
        </div>
      </ScrollView>
      <Dialog store={tvSelectDialog}>
        <TVSeasonSelect store={tvSelect} />
      </Dialog>
      <Dialog store={subtitlePreview}>
        <SubtitlePreview store={fileReader} />
      </Dialog>
      <Dialog store={uploadLoadingDialog}>
        <div class="flex flex-col items-center">
          <div>
            <Loader class="w-8 h-8 animate animate-spin" />
          </div>
          <div class="mt-4">正在上传中，请等待</div>
        </div>
      </Dialog>
    </>
  );
};
