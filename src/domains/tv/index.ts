/**
 * @file 电视剧
 */
import { Result } from "@/types";

import { BaseDomain } from "@/domains/base";
import { UserCore } from "@/domains/user";
import { find_recommended_pathname } from "@/utils";

import { EpisodeResolutionTypes, EpisodeResolutionTypeTexts } from "./constants";
import {
  TVAndEpisodesProfile,
  EpisodeProfile,
  update_play_history,
  fetch_play_history_of_tv,
  fetch_folders_in_special_season,
  fetch_episode_profile,
  fetch_tv_and_episodes_profile,
} from "./services";

enum Events {}
type TheTypesOfEvents = {};
type TVState = {};
type TVProps = {
  id: string;
};

export class TVCore extends BaseDomain<TheTypesOfEvents> {
  /** 电视剧 id */
  id: string = "";
  /** 该电视剧名称、剧集等信息 */
  _info: TVAndEpisodesProfile | null = null;
  /** 当前播放的影片详情 */
  _cur_episode: EpisodeProfile | null = null;
  _current_time = 0;
  /** 发生的错误 */
  // error: Error | null = null;

  user: UserCore | null = null;

  state: TVState = {};

  constructor(options: Partial<{ _name: string } & TVProps> = {}) {
    super(options);
    const { id } = options;
    // this.id = id;
  }
  public get cur_episode() {
    if (this._cur_episode === null) {
      return null;
    }
    return {
      ...this._cur_episode,
      current_time: this._current_time,
    };
  }
  public get info() {
    if (this._info === null) {
      return null;
    }
    return {
      ...this._info,
    };
  }

  async init(id: string) {
    this.id = id;
    // if (!this.user.isLogin) {
    //   this.tip({ text: ["请先登录"] });
    //   return;
    // }
    const resp = await this.fetch_profile();
    if (resp.error) {
      this.tip({ text: ["获取详情失败", resp.error.message] });
      return;
    }
    console.log("[DOMAIN]TV - init", id);
    const { first_episode } = resp.data;
    if (first_episode === null) {
      this.tip({ text: ["该电视剧尚未收录影片"] });
      return;
    }
    const history_resp = await fetch_play_history_of_tv({
      tv_id: this.id,
    });
    if (history_resp.data) {
      const { episode_id, season, current_time } = history_resp.data;
      this._current_time = current_time;
      if (first_episode.season !== season) {
        const folder_resp = await fetch_folders_in_special_season({
          tv_id: this.id,
          season,
        });
        if (folder_resp.data && folder_resp.data.length !== 0) {
          this._info!.folders = folder_resp.data;
        }
      }
      await this.play_episode(episode_id);
      return Result.Ok(null);
    }
    // console.log("[DOMAIN]TV - play first episode", first_episode.id);
    await this.play_episode(first_episode.id);
    return Result.Ok(null);
  }
  async fetch_profile() {
    const resp = await fetch_tv_and_episodes_profile({ tv_id: this.id });
    if (resp.error) {
      // this.error = resp.error;
      return resp;
    }
    this._info = {
      ...resp.data,
    };
    return Result.Ok(this._info);
  }
  /** 播放该电视剧下指定影片 */
  async play_episode(episode_id: string) {
    if (episode_id === this._cur_episode?.id) {
      return;
    }
    const resp = await fetch_episode_profile({
      id: episode_id,
    });
    if (resp.error) {
      // this.error = resp.error;
      this.tip({ text: ["获取影片详情失败", resp.error.message] });
      return;
    }
    this._cur_episode = resp.data;
    return this._cur_episode;
  }
  /** 播放下一集 */
  async play_next_episode() {
    if (this._info === null || this._cur_episode === null) {
      this.tip({ text: ["视频还未加载"] });
      return;
    }
    const { seasons, folders } = this._info;
    const { id: cur_episode_id, season: season_of_cur_episode, parent_paths } = this._cur_episode;
    if (!folders) {
      this.tip({ text: ["没有更多影片了"] });
      return;
    }
    if (folders.length === 0) {
      this.tip({ text: ["没有更多影片了"] });
      return;
    }
    const folder = folders.find((f) => f.parent_paths === parent_paths);
    if (!folder) {
      this.tip({ text: ["加载异常，请刷新后重试"] });
      return;
    }
    const { episodes } = folder;
    const index = episodes.findIndex((e) => e.id === cur_episode_id);
    if (index === -1) {
      return this.play_episode(episodes[0].id);
    }
    const is_last_episode = index === episodes.length - 1;
    if (!is_last_episode) {
      const next_episode = episodes[index + 1];
      return this.play_episode(next_episode.id);
    }
    if (seasons.length === 1) {
      this.tip({ text: ["已经是最后一集了"] });
      return;
    }
    const cur_season_index = seasons.findIndex((s) => s == season_of_cur_episode);
    if (cur_season_index === -1) {
      this.tip({ text: ["已经是最后一集了"] });
      return;
    }
    const next_season = seasons[cur_season_index + 1];
    if (!next_season) {
      this.tip({ text: ["已经是最后一集了"] });
      return;
    }
    await this.load_episodes_of_special_season(next_season);
  }
  /** 播放上一集 */
  async play_prev_episode() {
    if (this._info === null || this._cur_episode === null) {
      this.tip({ text: ["视频还未加载"] });
      return;
    }
    const { seasons, folders } = this._info;
    const { id: cur_episode_id, season: season_of_cur_episode, parent_paths } = this._cur_episode;
    if (!folders) {
      this.tip({ text: ["没有更多影片了"] });
      return;
    }
    if (folders.length === 0) {
      this.tip({ text: ["没有更多影片了"] });
      return;
    }
    const folder = folders.find((f) => f.parent_paths === parent_paths);
    if (!folder) {
      this.tip({ text: ["加载异常，请刷新后重试"] });
      return;
    }
    const { episodes } = folder;
    const index = episodes.findIndex((e) => e.id === cur_episode_id);
    if (index === -1) {
      return this.play_episode(episodes[0].id);
    }
    const is_first_episode = index === 0;
    if (!is_first_episode) {
      const prev_episode = episodes[index - 1];
      return this.play_episode(prev_episode.id);
    }
    if (seasons.length === 1) {
      this.tip({ text: ["已经是第一集了"] });
      return;
    }
    const cur_season_index = seasons.findIndex((s) => s == season_of_cur_episode);
    if (cur_season_index === -1) {
      this.tip({ text: ["已经是第一集了"] });
      return;
    }
    const next_season = seasons[cur_season_index - 1];
    if (!next_season) {
      this.tip({ text: ["已经是第一集了"] });
      return;
    }
    await this.load_episodes_of_special_season(next_season);
  }
  /** 加载指定季下的文件夹 */
  async load_episodes_of_special_season(season: string) {
    if (this._info === null) {
      this.tip({ text: ["视频还未加载"] });
      return;
    }
    if (season === this._cur_episode?.season) {
      return;
    }
    const episodes_same_season_res = await fetch_folders_in_special_season({
      tv_id: this.id,
      season,
    });
    if (episodes_same_season_res.error) {
      this.tip({ text: ["获取影片信息失败，请刷新后重试"] });
      return;
    }
    if (episodes_same_season_res.data.length === 0) {
      this.tip({ text: ["已经是最后一集了"] });
      return;
    }
    this._info.folders = episodes_same_season_res.data;
    const recommended_path = find_recommended_pathname(this._info.folders.map((f) => f.parent_paths));
    const matched_folder = (() => {
      const matched = this._info.folders.find((f) => f.parent_paths === recommended_path);
      if (!matched) {
        return this._info.folders[0];
      }
      return matched;
    })();
    return this.play_episode(matched_folder.episodes[0].id);
  }
  /** 切换分辨率 */
  switch_resolution(target_type: EpisodeResolutionTypes) {
    if (this._cur_episode === null) {
      this.tip({ text: ["视频还未加载完成"] });
      return;
    }
    const { type, other } = this._cur_episode;
    if (type === target_type) {
      this.tip({
        text: [`当前已经是${EpisodeResolutionTypeTexts[target_type]}了`],
      });
      return;
    }
    const matched_resolution = other.find((e) => e.type === target_type);
    if (!matched_resolution) {
      this.tip({ text: [`没有 '${target_type}' 分辨率`] });
      return;
    }
    const { url, type: next_type, width, height } = matched_resolution;
    this._cur_episode = {
      ...this._cur_episode,
      url,
      type: next_type,
      width,
      height,
    };
  }
  /** 更新观看进度 */
  update_play_progress(params: { current_time: number; duration: number }) {
    if (!this.id) {
      return;
    }
    if (this._cur_episode === null) {
      return;
    }
    const { current_time, duration } = params;
    // console.log("[DOMAIN]TVPlay - update_play_progress", params, user.is_login);
    // if (this.user.isLogin) {
    //   update_play_history({
    //     tv_id: this.id,
    //     episode_id: this._cur_episode.id,
    //     current_time,
    //     duration,
    //   });
    // }
  }
}
