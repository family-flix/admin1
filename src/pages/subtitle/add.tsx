/**
 * @file 上传字幕
 */
import { For, Show, createSignal } from "solid-js";
import { ChevronRight, Eye, Folder, FolderInput, Loader, MoreHorizontal, Scroll, Search, Send } from "lucide-solid";

import { batchUploadSubtitles, validateSubtitleFiles } from "@/services";
import { fetchMovieMediaProfile, fetchSeasonMediaProfile } from "@/services/media";
import { Button, Dialog, DropdownMenu, Input, LazyImage, ScrollView } from "@/components/ui";
import {
  ButtonCore,
  DialogCore,
  ScrollViewCore,
  SelectCore,
  SelectInListCore,
  InputInListCore,
  ImageCore,
} from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { MediaTypes, SubtitleLanguageOptions } from "@/constants";
import { DragZoneCore } from "@/domains/ui/drag-zone";
import { SeasonSelect } from "@/components/SeasonSelect/main";
import { TVSeasonSelectCore } from "@/components/SeasonSelect";
import { RefCore } from "@/domains/cur";
import { Select } from "@/components/ui/select";
import { SubtitlePreview, SubtitleReaderCore } from "@/components/SubtitlePreview";
import { MovieSelect, MovieSelectCore } from "@/components/MovieSelect";
import { ViewComponent } from "@/store/types";
import { createJob } from "@/store/job";
import { padding_zero } from "@/utils";

export const HomeSubtitleUploadPage: ViewComponent = (props) => {
  const { app, view } = props;

  const filenameValidatingRequest = new RequestCore(validateSubtitleFiles, {
    onFailed(error) {
      app.tip({
        text: ["校验失败", error.message],
      });
    },
    onSuccess(filenames) {
      for (let i = 0; i < filenames.length; i += 1) {
        const file = filenames[i];
        const e1 = episodeSelect.bind(file.filename, { defaultValue: file.episode_text || "" });
        if (e1 && curMedia.value) {
          const order = file.episode_text.match(/E([0-9]{1,})/);
          if (!order) {
            return;
          }
          const matched = curMedia.value.episodes.find((e) => e.episode_number === Number(order[1]));
          if (!matched) {
            return;
          }
          e1.setValue(matched.id);
        }
        const e2 = langSelect.bind(file.filename, { defaultValue: file.language || "" });
        if (e2) {
          e2.setValue(file.language);
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
          seasonSelect.clear();
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
  const seasonProfileRequest = new RequestCore(fetchSeasonMediaProfile);
  const movieProfileRequest = new RequestCore(fetchMovieMediaProfile);
  const curMedia = new RefCore<{
    id: string;
    type: MediaTypes;
    name: string;
    poster_path: string;
    episodes: { id: string; episode_number: number }[];
  }>();
  const uploadZone = new DragZoneCore({
    onChange(files) {
      seasonController.clear();
      langController.clear();
      langSelect.clear();
      seasonSelect.clear();
      filenameValidatingRequest.run({
        filenames: files.map((file) => file.name),
      });
    },
  });
  const mediaSelect = new SelectInListCore<string, string>({
    defaultValue: null,
  });
  const episodeSelect = new SelectInListCore<string, string>({
    defaultValue: "",
  });
  const langSelect = new SelectInListCore<string, string>({
    options: SubtitleLanguageOptions,
  });
  const seasonSelectBtn = new ButtonCore({
    onClick() {
      seasonSelectDialog.show();
    },
  });
  const seasonSelectDialog = new DialogCore({
    title: "选择电视剧",
    async onOk() {
      const season = seasonSelect.value;
      if (!season) {
        app.tip({
          text: ["请选择电视剧"],
        });
        return;
      }
      const r = await seasonProfileRequest.run({ season_id: season.id });
      if (r.error) {
        app.tip({
          text: ["获取详情失败", r.error.message],
        });
        return;
      }
      const { episodes } = r.data;
      episodeSelect.setOptions(
        episodes.map((episode) => {
          return {
            value: episode.id,
            label: `${episode.episode_number}、${episode.name}`,
          };
        })
      );
      curMedia.select({
        id: season.id,
        type: MediaTypes.Season,
        name: season.name,
        poster_path: season.poster_path,
        episodes,
      });
      seasonSelectDialog.hide();
    },
  });
  const seasonSelect = new TVSeasonSelectCore({});
  const movieSelectBtn = new ButtonCore({
    onClick() {
      movieSelectDialog.show();
    },
  });
  const movieSelectDialog = new DialogCore({
    title: "选择电视剧",
    onOk() {
      const movie = movieSelect.value;
      if (!movie) {
        app.tip({
          text: ["请选择电视剧"],
        });
        return;
      }
      poster.setURL(movie.poster_path);
      curMedia.select({
        id: movie.id,
        type: MediaTypes.Movie,
        name: movie.name,
        poster_path: movie.poster_path,
        episodes: [],
      });
      movieSelectDialog.hide();
    },
  });
  const movieSelect = new MovieSelectCore({});
  const submitBtn = new ButtonCore({
    onClick() {
      if (!filenameValidatingRequest.response) {
        return;
      }
      const selectedMedia = curMedia.value;
      if (!selectedMedia) {
        app.tip({
          text: ["选择"],
        });
        return;
      }
      if (selectedMedia.type === MediaTypes.Season) {
        const values = filenameValidatingRequest.response.map((f) => {
          const { filename } = f;
          const episode_id = episodeSelect.getValue(f.filename);
          const language = langSelect.getValue(f.filename);
          const file = uploadZone.files.find((f) => f.name === filename);
          const errors: string[] = [];
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
          media_id: selectedMedia.id,
          type: MediaTypes.Season,
          files: values.map((v) => {
            const { filename, episode_id, language, file } = v;
            return {
              filename,
              episode_id: episode_id!,
              language: language!,
              file: file!,
            };
          }),
        });
        return;
      }
      if (selectedMedia.type === MediaTypes.Movie) {
        const values = filenameValidatingRequest.response.map((f) => {
          const { filename } = f;
          const language = langSelect.getValue(f.filename);
          const file = uploadZone.files.find((f) => f.name === filename);
          const errors: string[] = [];
          if (language === null) {
            errors.push(`请为 ${filename} 选择语言`);
          }
          if (!file) {
            errors.push(`${filename} 没有匹配的文件`);
          }
          return {
            filename,
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
          media_id: selectedMedia.id,
          type: MediaTypes.Movie,
          files: values.map((v) => {
            const { filename, language, file } = v;
            return {
              filename,
              language: language!,
              file: file!,
            };
          }),
        });
        return;
      }
      app.tip({
        text: ["请先选择关联的影视剧"],
      });
    },
  });
  const seasonController = new SelectCore<string>({
    defaultValue: null,
    onChange(v) {
      mediaSelect.setValue(v);
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
  const poster = new ImageCore({});

  const [state, setState] = createSignal(uploadZone.state);
  const [selectedMedia, setSelectedSeason] = createSignal(curMedia.value);
  const [results, setResults] = createSignal(filenameValidatingRequest.response);

  uploadZone.onStateChange((nextState) => {
    setState(nextState);
  });
  filenameValidatingRequest.onResponseChange((v) => {
    setResults(v);
  });
  curMedia.onStateChange((nextState) => {
    setSelectedSeason(nextState);
  });

  return (
    <>
      <ScrollView store={scrollView} class="relative h-screen p-8">
        <h1 class="text-2xl">上传字幕</h1>
        <div class="flex space-x-4 mt-8 w-full">
          <div class="flex items-center flex-1 space-x-2">
            <Show
              when={selectedMedia()}
              fallback={
                <div class="space-x-2">
                  <Button store={seasonSelectBtn}>选择关联的电视剧</Button>
                  <Button store={movieSelectBtn}>选择关联的电影</Button>
                </div>
              }
            >
              <div class="flex">
                <div class="w-[120px] mr-4">
                  <LazyImage store={poster} />
                </div>
                <div class="flex-1">
                  <div>{selectedMedia()?.name}</div>
                  <div class="space-x-2">
                    <Button store={seasonSelectBtn}>重新选择电视</Button>
                    <Button store={movieSelectBtn}>重新选择电影</Button>
                  </div>
                </div>
              </div>
            </Show>
          </div>
          <div class="flex-1">
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
                      <Select store={langController} />
                    </div>
                  </div>
                  <div class="space-y-2 mt-8">
                    <For each={results()}>
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
                            <Show when={selectedMedia()?.type === MediaTypes.Season}>
                              <div>
                                <Select store={episodeSelect.bind(filename)} />
                              </div>
                            </Show>
                            <div>
                              <Select store={langSelect.bind(filename)} />
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>
        <div class="absolute bottom-0 py-4">
          <div class="flex rows-reverse">
            <Button store={submitBtn}>上传</Button>
          </div>
        </div>
      </ScrollView>
      <Dialog store={seasonSelectDialog}>
        <div class=" w-[520px]">
          <SeasonSelect store={seasonSelect} />
        </div>
      </Dialog>
      <Dialog store={movieSelectDialog}>
        <div class=" w-[520px]">
          <MovieSelect store={movieSelect} />
        </div>
      </Dialog>
      <Dialog store={subtitlePreview}>
        <div class=" w-[520px]">
          <SubtitlePreview store={fileReader} />
        </div>
      </Dialog>
      <Dialog store={uploadLoadingDialog}>
        <div class="flex flex-col items-center w-[520px]">
          <div>
            <Loader class="w-8 h-8 animate animate-spin" />
          </div>
          <div class="mt-4">正在上传中，请等待</div>
        </div>
      </Dialog>
    </>
  );
};
