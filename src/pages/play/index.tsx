/**
 * @file 视频文件播放页面
 */
import { createSignal, onCleanup, onMount } from "solid-js";
import { ArrowLeft } from "lucide-solid";

import { fetchSourcePreviewInfo } from "@/services/parsed_media";
import { Video } from "@/components/ui";
import { RequestCore } from "@/domains/request";
import { PlayerCore } from "@/domains/player";
import { ViewComponent } from "@/store/types";

export const MediaPlayingPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const player = new PlayerCore({ app });
  const fileRequest = new RequestCore(fetchSourcePreviewInfo, {
    onSuccess(v) {
      setProfile(v);
      player.setSize({
        width: v.width,
        height: v.height,
      });
      player.loadSource(v);
    },
    onFailed(error) {
      app.tip({
        text: ["获取播放信息失败", error.message],
      });
    },
  });

  const [profile, setProfile] = createSignal(fileRequest.response);

  // console.log("[PAGE]play - useInitialize");
  app.onHidden(() => {
    player.pause();
    // tv.updatePlayProgress();
  });
  app.onShow(() => {
    console.log("[PAGE]play - app.onShow", player.currentTime);
    // 锁屏后 currentTime 不是锁屏前的
    player.setCurrentTime(player.currentTime);
  });
  view.onHidden(() => {
    player.pause();
  });
  // view.onUnmounted(() => {
  //   player.destroy();
  // });
  // video.onMounted(() => {
  //   connect(videoRef.current!, player);
  // });
  player.onCanPlay(() => {
    if (!view.state.visible) {
      return;
    }
    // console.log("[PAGE]play - player.onCanPlay");
    // cover.hide();
    player.play();
  });
  player.onPause(({ currentTime, duration }) => {
    console.log("[PAGE]play - player.onPause", currentTime, duration);
  });
  player.onEnd(() => {
    console.log("[PAGE]play - player.onEnd");
  });
  player.onVolumeChange(({ volume }) => {
    console.log("[PAGE]play - player.onVolumeChange", volume);
  });
  player.onSizeChange(({ height }) => {
    console.log("[PAGE]play - player.onSizeChange");
  });
  player.onResolutionChange(({ type }) => {
    console.log("[PAGE]play - player.onResolutionChange", type);
    //     player.setCurrentTime(movie.currentTime);
  });
  player.onSourceLoaded(() => {
    console.log("[PAGE]play - player.onSourceLoaded", player.currentTime);
    player.setCurrentTime(player.currentTime);
  });
  player.onError((error) => {
    console.log("[PAGE]play - player.onError");
    app.tip({ text: ["视频加载错误", error.message] });
    player.pause();
  });
  player.onUrlChange(async ({ url, thumbnail }) => {
    const $video = player.node()!;
    console.log("[PAGE]play - player.onUrlChange", url, $video);
    //   player.setCurrentTime(player.currentTime);
    if (player.canPlayType("application/vnd.apple.mpegurl")) {
      player.load(url);
      return;
    }
    const mod = await import("hls.js");
    const Hls2 = mod.default;
    if (Hls2.isSupported() && url.includes("m3u8")) {
      // console.log("[PAGE]TVPlaying - need using hls.js");
      const Hls = new Hls2({ fragLoadingTimeOut: 2000 });
      Hls.attachMedia($video);
      Hls.on(Hls2.Events.MEDIA_ATTACHED, () => {
        Hls.loadSource(url);
      });
      return;
    }
    player.load(url);
  });
  // console.log("[PAGE]tv/play - before fetch tv profile", view.query.id);
  onMount(() => {
    console.log("[PAGE]play/index - onMount", view.query.id);
    fileRequest.run({ id: view.query.id });
  });
  onCleanup(() => {
    console.log("[PAGE]play/index - onCleanup", view.query.id);
  });

  return (
    <div>
      <div class="relative flex flex-wrap w-full h-screen bg-[#14161a]">
        <div
          class="z-10 absolute top-6 left-6 cursor-pointer"
          onClick={() => {
            history.back();
            // rootView.uncoverPrevView();
          }}
        >
          <ArrowLeft class="w-6 h-6 text-white" />
        </div>
        <div class="z-0 relative flex-1 flex items-center w-full h-full bg-black">
          <Video store={player}></Video>
        </div>
        {/* <div class="profile p-4 h-full w-[380px] md:w-[240px] overflow-y-auto">
          <div v-if="profile">
            <div class="text-3xl text-white">{profile()?.typeText}</div>
            <div class="seasons flex items-center space-x-2 mt-4"></div>
            <div class="episodes flex flex-wrap mt-2" v-if="profile"></div>
          </div>
        </div> */}
      </div>
    </div>
  );
};
