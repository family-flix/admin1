/**
 * @file 电视剧
 */
import { BaseDomain, Handler } from "@/domains/base";
import { Result } from "@/types";

import { EpisodeResolutionTypes, EpisodeResolutionTypeTexts } from "./constants";
import {
  TVAndEpisodesProfile,
  MediaSourceProfile,
  update_play_history,
  fetch_episode_profile,
  fetch_tv_and_cur_episode,
  fetch_episodes_of_season,
  TVSeasonProfile,
  TVEpisodeProfile,
} from "./services";

enum Events {
  /** 电视剧详情加载完成 */
  ProfileLoaded,
  /** 切换播放的剧集 */
  EpisodeChange,
  /** 切换播放的剧集 */
  SourceChange,
  /** 分辨率改变 */
  ResolutionChange,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.ProfileLoaded]: TVProps["profile"];
  [Events.SourceChange]: MediaSourceProfile & { currentTime: number };
  [Events.EpisodeChange]: TVProps["profile"]["curEpisode"] & { currentTime: number };
  [Events.ResolutionChange]: MediaSourceProfile & { currentTime: number };
  [Events.StateChange]: TVProps["profile"];
};
type TVState = {};
type TVProps = {
  profile: {
    id: TVAndEpisodesProfile["id"];
    name: TVAndEpisodesProfile["name"];
    overview: TVAndEpisodesProfile["overview"];
    /** 如果存在播放记录，返回当前播放的集数对应季，如果没有播放记录，返回第一季 */
    curSeason: TVSeasonProfile;
    /** 如果存在播放记录，返回当前播放的集数，如果没有播放记录，返回第一季、第一集 */
    curEpisode: TVEpisodeProfile & { currentTime: number; thumbnail: string | null };
    /** 电视剧下所有季 */
    seasons: TVSeasonProfile[];
    /** 当前播放剧集同一季的所有剧集 */
    curEpisodes: TVEpisodeProfile[];
  };
};

export class TVCore extends BaseDomain<TheTypesOfEvents> {
  static async Get(body: { id: string }) {
    const { id } = body;
    if (id === undefined) {
      // const msg = this.tip({ text: ["缺少 tv id 参数"] });
      return Result.Err("缺少电视剧 id");
    }
    // this.id = id;
    const res = await fetch_tv_and_cur_episode({ tv_id: id });
    if (res.error) {
      // const msg = this.tip({ text: ["获取电视剧详情失败", res.error.message] });
      return Result.Err(res.error);
    }
    // const tv = res.data;
    // this.profile = tv;
    // this.emit(Events.ProfileLoaded, { ...this.profile });
    const { name, overview, curSeason, curEpisode, curEpisodes, seasons } = res.data;
    if (curEpisode === null) {
      // const msg = this.tip({ text: ["该电视剧尚未收录影片"] });
      return Result.Err("该电视剧尚未收录影片");
    }
    const tv = new TVCore({
      profile: {
        id,
        name,
        overview,
        curSeason,
        curEpisode,
        seasons,
        curEpisodes,
      },
    });
    return Result.Ok(tv);
  }

  /** 电视剧 id */
  id?: string;
  /** 该电视剧名称、剧集等信息 */
  profile: TVProps["profile"] | null = null;
  curSeason: TVProps["profile"]["curSeason"] | null = null;
  curEpisode: TVProps["profile"]["curEpisode"] | null = null;
  curEpisodes: TVProps["profile"]["curEpisodes"] = [];
  /** 当前播放的视频源 */
  curSource: MediaSourceProfile | null = null;
  /** 当前影片播放进度 */
  currentTime = 0;
  curResolutionType: EpisodeResolutionTypes = "LD";
  /** 正在请求中（获取详情、视频源信息等） */
  private _pending = false;

  constructor(options: Partial<{ name: string } & TVProps> = {}) {
    super();

    const { profile } = options;
    // this.profile = profile;
    // this.curSeason = profile.curSeason;
    // this.curEpisode = profile.curEpisode;
  }

  async fetchProfile(id: string) {
    if (id === undefined) {
      const msg = this.tip({ text: ["缺少 tv id 参数"] });
      return Result.Err(msg);
      // return Result.Err("缺少电视剧 id");
    }
    this.id = id;
    const res = await fetch_tv_and_cur_episode({ tv_id: id });
    if (res.error) {
      const msg = this.tip({ text: ["获取电视剧详情失败", res.error.message] });
      // return Result.Err(res.error);
      return Result.Err(msg);
    }
    // const tv = res.data;
    // this.profile = tv;
    // this.emit(Events.ProfileLoaded, { ...this.profile });
    const { name, overview, curSeason, curEpisode, curEpisodes, seasons } = res.data;
    if (curEpisode === null) {
      const msg = this.tip({ text: ["该电视剧尚未收录影片"] });
      // return Result.Err("该电视剧尚未收录影片");
      return Result.Err(msg);
    }
    this.profile = {
      id,
      name,
      overview,
      curSeason,
      curEpisode,
      curEpisodes,
      seasons,
    };
    // this.currentTime = curEpisode.currentTime;
    this.curSeason = curSeason;
    // this.curEpisode = curEpisode;
    this.emit(Events.ProfileLoaded, { ...this.profile });
    this.emit(Events.StateChange, { ...this.profile });
    return Result.Ok({ ...this.profile });
  }

  /** 播放该电视剧下指定影片 */
  async playEpisode(episode: TVEpisodeProfile, extra: { currentTime?: number; thumbnail?: string | null } = {}) {
    // 只有继续播放时，才有这两个参数
    const { currentTime = 0, thumbnail = null } = extra;
    console.log("[PAGE](play/index) - play episode");
    if (!this.profile) {
      const msg = this.tip({ text: ["请先调用 fetchProfile 获取详情"] });
      return Result.Err(msg);
    }
    const { id: episodeId } = episode;
    if (this.curEpisode && episodeId === this.curEpisode.id) {
      this.tip({
        text: [this.profile.name, this.curEpisode.episode],
      });
      return Result.Ok(this.curEpisode);
    }
    const res = await fetch_episode_profile({
      id: episodeId,
    });
    if (res.error) {
      this.tip({
        text: ["获取影片详情失败", res.error.message],
      });
      return Result.Err(res.error);
    }
    this.profile.curEpisode = { ...episode, currentTime, thumbnail };
    this.curEpisode = { ...episode, currentTime, thumbnail };
    this.curSource = (() => {
      const { file_id } = res.data;
      if (this.curResolutionType === "LD") {
        const { url, type, typeText, width, height, thumbnail, resolutions } = res.data;
        return {
          url,
          file_id,
          type,
          typeText,
          width,
          height,
          thumbnail,
          resolutions,
        };
      }
      const { resolutions } = res.data;
      const matched_resolution = resolutions.find((e) => e.type === this.curResolutionType);
      if (!matched_resolution) {
        const { url, type, typeText, width, height, thumbnail } = resolutions[0];
        return {
          url,
          file_id,
          type,
          typeText,
          width,
          height,
          thumbnail,
          resolutions,
        };
      }
      const { url, type, typeText, width, height, thumbnail } = matched_resolution;
      return {
        url,
        file_id,
        type,
        typeText,
        width,
        height,
        thumbnail,
        resolutions,
      };
    })();
    // this.tip({
    //   text: [this.profile.name, this.curEpisode.episode],
    // });
    // console.log("[DOMAIN]TV - playEpisode");
    if (!this.curEpisode.thumbnail && this.curSource.thumbnail) {
      this.curEpisode.thumbnail = this.curSource.thumbnail;
    }
    this.emit(Events.EpisodeChange, { ...this.curEpisode });
    this.emit(Events.SourceChange, { ...this.curSource, currentTime });
    this.emit(Events.StateChange, { ...this.profile });
    return Result.Ok(this.curEpisode);
  }
  /** 获取下一剧集 */
  async getNextEpisode() {
    if (this.profile === null || this.curEpisode === null) {
      return Result.Err("请先调用 fetchProfile 方法");
    }
    const { seasons } = this.profile;
    const { id, season_id } = this.curEpisode;
    const curSeason = seasons.find((season) => {
      return season.id === season_id;
    });
    if (!curSeason) {
      return Result.Err("获取异常，没有找到当前剧集所在季");
    }
    const { episodes } = curSeason;
    const index = episodes.findIndex((e) => e.id === id);
    if (index === -1) {
      return Result.Err("获取异常，没有找到当前剧集所在季");
    }
    const is_last_episode = index === episodes.length - 1;
    if (!is_last_episode) {
      const next_episode = episodes[index + 1];
      return Result.Ok(next_episode);
    }
    if (seasons.length === 1) {
      return Result.Err("已经是最后一集了");
    }
    // const cur_season_index = seasons.findIndex((s) => s == season_of_cur_episode);
    const cur_season_index = seasons.indexOf(curSeason);
    if (cur_season_index === -1) {
      return Result.Err("获取异常，没有找到当前剧集所在季");
    }
    const next_season = seasons[cur_season_index + 1];
    if (!next_season) {
      return Result.Err("获取异常，没有找到下一季");
    }
    const r = await this.fetchEpisodesOfSeason(next_season);
    if (r.error) {
      return Result.Err(r.error);
    }
    if (r.data.length === 0) {
      return Result.Err("已经是最后一集了");
    }
    const nextCurEpisode = r.data[0];
    return Result.Ok(nextCurEpisode);
  }
  /** 获取下一剧集 */
  async getPrevEpisode() {
    if (this.profile === null || this.curEpisode === null) {
      return Result.Err("请先调用 fetchProfile 方法");
    }
    const { seasons } = this.profile;
    const { id, season_id } = this.curEpisode;
    const curSeason = seasons.find((season) => {
      return season.id === season_id;
    });
    if (!curSeason) {
      return Result.Err("获取异常，没有找到当前剧集所在季");
    }
    const { episodes } = curSeason;
    const index = episodes.findIndex((e) => e.id === id);
    if (index === -1) {
      return Result.Err("获取异常，没有找到当前剧集所在季");
    }
    const isFirstEpisode = index === episodes.length - 1;
    if (!isFirstEpisode) {
      const prevEpisode = episodes[index - 1];
      return Result.Ok(prevEpisode);
    }
    if (seasons.length === 1) {
      return Result.Err("已经是第一集了");
    }
    const curSeasonIndex = seasons.indexOf(curSeason);
    if (curSeasonIndex === -1) {
      return Result.Err("获取异常，没有找到上一季");
    }
    const prevSeason = seasons[curSeasonIndex + 1];
    if (!prevSeason) {
      return Result.Err("获取异常，没有找到上一季");
    }
    const r = await this.fetchEpisodesOfSeason(prevSeason);
    if (r.error) {
      return Result.Err(r.error);
    }
    if (r.data.length === 0) {
      return Result.Err("已经是第一集了");
    }
    // 这里有问题，应该获取上一季最后一集，但是剧集是分页的，没法获取最后一集，或者让后端返
    const prevEpisode = r.data[0];
    return Result.Ok(prevEpisode);
  }
  /** 播放下一集 */
  async playNextEpisode() {
    if (this._pending) {
      this.tip({ text: ["正在加载下一集"] });
      return;
    }
    this._pending = true;
    const nextEpisodeRes = await this.getNextEpisode();
    if (nextEpisodeRes.error) {
      this.tip({ text: ["视频还未加载"] });
      this._pending = false;
      return;
    }
    const nextEpisode = nextEpisodeRes.data;
    if (nextEpisode === null) {
      this._pending = false;
      return Result.Err("没有找到可播放剧集");
    }
    // this.currentTime = 0;
    await this.playEpisode(nextEpisode, { currentTime: 0, thumbnail: null });
    this._pending = false;
    return Result.Ok(null);
  }
  /** 播放上一集 */
  async playPrevEpisode() {
    if (this._pending) {
      this.tip({ text: ["正在加载上一集"] });
      return;
    }
    this._pending = true;
    const prevEpisodeRes = await this.getPrevEpisode();
    if (prevEpisodeRes.error) {
      this.tip({ text: ["视频还未加载"] });
      this._pending = false;
      return;
    }
    const prevEpisode = prevEpisodeRes.data;
    if (prevEpisode === null) {
      this._pending = false;
      return Result.Err("没有找到可播放剧集");
    }
    // this.currentTime = 0;
    await this.playEpisode(prevEpisode, { currentTime: 0, thumbnail: null });
    this._pending = false;
    return Result.Ok(null);
  }
  /** 加载指定季下的文件夹并返回第一集 */
  async fetchEpisodesOfSeason(season: TVProps["profile"]["curSeason"]) {
    if (this.id === undefined) {
      return Result.Err("缺少 tv id 参数");
    }
    if (this.profile === null) {
      return Result.Err("视频还未加载");
    }
    if (this.curSeason && this.curSeason.id === season.id) {
      return Result.Err("重复点击");
    }
    const episodes_res = await fetch_episodes_of_season({
      tv_id: this.id,
      season_id: season.id,
      page: 1,
      pageSize: 20,
    });
    if (episodes_res.error) {
      const msg = this.tip({
        text: ["获取剧集列表，请刷新后重试"],
      });
      return Result.Err(msg);
    }
    const { list } = episodes_res.data;
    if (list.length === 0) {
      const msg = this.tip({
        text: ["该季没有剧集"],
      });
      return Result.Err(msg);
    }
    this.curEpisodes = list;
    this.curSeason = season;
    this.profile.curSeason = season;
    this.profile.curEpisodes = list;
    this.emit(Events.StateChange, { ...this.profile });
    return Result.Ok(list);
  }
  /** 预加载指定影片 */
  async preloadNextEpisode() {
    const r = await this.getNextEpisode();
    if (r.error) {
      return Result.Err(r.error);
    }
    return Result.Ok(r.data);
  }
  setCurResolution(type: EpisodeResolutionTypes) {
    this.curResolutionType = type;
  }
  /** 切换分辨率 */
  switchResolution(target_type: EpisodeResolutionTypes) {
    // console.log("switchResolution 1");
    if (this.profile === null || this.curSource === null) {
      const msg = this.tip({ text: ["视频还未加载完成"] });
      return Result.Err(msg);
    }
    // console.log("switchResolution 2");
    const { type, resolutions } = this.curSource;
    if (type === target_type) {
      const msg = this.tip({
        text: [`当前已经是${EpisodeResolutionTypeTexts[target_type]}了`],
      });
      return Result.Err(msg);
    }
    // console.log("switchResolution 3");
    this.curResolutionType = target_type;
    const matched_resolution = resolutions.find((e) => e.type === target_type);
    if (!matched_resolution) {
      const msg = this.tip({ text: [`没有 '${target_type}' 分辨率`] });
      return Result.Err(msg);
    }
    // console.log("switchResolution 4");
    const { url, type: nextType, typeText, width, height, thumbnail } = matched_resolution;
    this.curSource = {
      url,
      file_id: this.curSource.file_id,
      type: nextType,
      typeText,
      width,
      height,
      thumbnail,
      resolutions,
    };
    this.emit(Events.SourceChange, { ...this.curSource, currentTime: this.currentTime });
    this.emit(Events.ResolutionChange, {
      ...this.curSource,
      currentTime: this.currentTime,
    });
    return Result.Ok(null);
  }
  setCurrentTime(currentTime: number) {
    this.currentTime = currentTime;
  }
  updatePlayProgressForce(values: Partial<{ currentTime: number; duration: number }> = {}) {
    const { currentTime = this.currentTime, duration } = values;
    // console.log("[DOMAIN]TVPlay - update_play_progress", currentTime);
    if (!this.id) {
      return;
    }
    if (this.curEpisode === null) {
      return;
    }
    if (this.curSource === null) {
      return;
    }
    const { id: episode_id } = this.curEpisode;
    const { file_id } = this.curSource;
    update_play_history({
      tv_id: this.id,
      episode_id,
      current_time: currentTime,
      duration,
      file_id,
    });
  }
  /** 更新观看进度 */
  updatePlayProgress = throttle_1(10 * 1000, (values: Partial<{ currentTime: number; duration: number }> = {}) => {
    this.updatePlayProgressForce(values);
  });
  getTitle(): [string, string, string] {
    if (this.profile === null || this.curEpisode === null) {
      return ["加载中", "", ""];
    }
    const { episode, season } = this.curEpisode;
    const { name } = this.profile;
    return [episode, season, name];
  }

  onSourceChange(handler: Handler<TheTypesOfEvents[Events.SourceChange]>) {
    return this.on(Events.SourceChange, handler);
  }
  onResolutionChange(handler: Handler<TheTypesOfEvents[Events.ResolutionChange]>) {
    return this.on(Events.ResolutionChange, handler);
  }
  onProfileLoaded(handler: Handler<TheTypesOfEvents[Events.ProfileLoaded]>) {
    return this.on(Events.ProfileLoaded, handler);
  }
  onEpisodeChange(handler: Handler<TheTypesOfEvents[Events.EpisodeChange]>) {
    return this.on(Events.EpisodeChange, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}

function throttle_1(delay: number, fn: Function) {
  let canInvoke = true;

  setInterval(() => {
    canInvoke = true;
  }, delay);

  return (...args: unknown[]) => {
    if (canInvoke === false) {
      return;
    }
    fn(...args);
    canInvoke = false;
  };
}
