import { client } from "@/store/request";
import { FetchParams } from "@/domains/list/typing";
import { ListResponse, RequestedResource, Result, Unpacked, UnpackedResult } from "@/types";
import { episode_to_chinese_num, relative_time_from_now, season_to_chinese_num } from "@/utils";

import { EpisodeResolutionTypes, EpisodeResolutionTypeTexts } from "./constants";

/**
 * 获取电视剧列表
 */
export async function fetch_tv_list(params: FetchParams & { name: string }) {
  const { page, pageSize, ...rest } = params;
  const resp = await client.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      backdrop_path: string;
      first_air_date: string;
    }>
  >("/api/tv/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return Result.Err(resp.error);
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map((tv) => {
      const { ...rest } = tv;
      return {
        ...rest,
        // updated: dayjs(updated).format("YYYY/MM/DD HH:mm"),
      };
    }),
  });
}
export type TVItem = RequestedResource<typeof fetch_tv_list>["list"][0];

/**
 * 获取电视剧及包含的剧集详情
 * @param params
 */
export async function fetch_tv_and_cur_episode(params: { tv_id: string }) {
  // console.log("[]fetch_tv_profile params", params);
  const { tv_id } = params;
  const r = await client.get<{
    id: string;
    name: string;
    overview: string;
    poster_path: string;
    popularity: number;
    /** 电视剧所有季 */
    seasons: {
      id: string;
      name: string;
      overview: string;
      air_date: string;
      episodes: {
        id: string;
        name: string;
        overview: string;
        season_number: string;
        episode_number: string;
        season_id: string;
        sources: {
          id: string;
          file_id: string;
          file_name: string;
        }[];
      }[];
    }[];
    /** 会根据用户播放历史返回正在播放的剧集，或第一集 */
    cur_episode: {
      id: string;
      name: string;
      overview: string;
      /** 第几季 */
      season_number: string;
      /** 第几集 */
      episode_number: string;
      season_id: string;
      /** 当前进度 */
      current_time: number;
      /** 当前进度截图 */
      thumbnail: string | null;
      /** 可播放的视频源 */
      sources: {
        id: string;
        file_id: string;
        file_name: string;
      }[];
    };
    cur_season: {
      id: string;
      name: string;
      overview: string;
      air_date: string;
    };
  }>(`/api/tv/play/${tv_id}`);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { id, name, overview, seasons, cur_season, cur_episode } = r.data;
  const matchedSeason = seasons.find((season) => {
    return season.id === cur_season.id;
  });
  return Result.Ok({
    id,
    name,
    overview,
    curSeason: {
      ...(matchedSeason || cur_season),
      episodes: [],
    },
    curEpisodes: (() => {
      // 大概率会走这里
      if (matchedSeason) {
        return matchedSeason.episodes.map((episode) => {
          const { id, name, overview, season_number, episode_number, season_id, sources } = episode;
          const d = {
            id,
            name,
            overview,
            season_id,
            season: season_to_chinese_num(season_number),
            episode: episode_to_chinese_num(episode_number),
            sources,
          };
          return d;
        });
      }
      return [];
    })(),
    curEpisode: (() => {
      if (cur_episode === null) {
        return null;
      }
      const { id, name, overview, season_number, episode_number, current_time, sources, season_id, thumbnail } =
        cur_episode;
      const d = {
        id,
        name,
        overview,
        currentTime: current_time,
        thumbnail,
        season_id,
        season: season_to_chinese_num(season_number),
        episode: episode_to_chinese_num(episode_number),
        sources,
      };
      return d;
    })(),
    seasons: seasons.map((season) => {
      const { id, name, overview, episodes } = season;
      return {
        id,
        name,
        overview,
        episodes: episodes.map((episode) => {
          const { id, name, overview, season_number, episode_number, sources, season_id } = episode;
          const d = {
            id,
            name,
            overview,
            season_id,
            season: season_to_chinese_num(season_number),
            episode: episode_to_chinese_num(episode_number),
            sources,
          };
          return d;
        }),
      };
    }),
  });
}
/** 电视剧详情 */
export type TVAndEpisodesProfile = UnpackedResult<Unpacked<ReturnType<typeof fetch_tv_and_cur_episode>>>;
export type TVSeasonProfile = UnpackedResult<Unpacked<ReturnType<typeof fetch_tv_and_cur_episode>>>["seasons"][number];
export type TVEpisodeProfile = UnpackedResult<
  Unpacked<ReturnType<typeof fetch_tv_and_cur_episode>>
>["curEpisodes"][number];

/**
 * 获取影片「播放源」信息，包括播放地址、宽高等信息
 */
export async function fetch_episode_profile(params: { id: string; type?: EpisodeResolutionTypes }) {
  // console.log("[]fetch_episode_profile", params);
  const { id } = params;
  const res = await client.get<{
    id: string;
    name: string;
    // parent_file_id: string;
    /** 缩略图 */
    thumbnail: string;
    season_number: string;
    episode_number: string;
    /** 影片阿里云盘文件 id */
    file_id: string;
    /** 影片分辨率 */
    type: EpisodeResolutionTypes;
    /** 影片播放地址 */
    url: string;
    /** 影片宽度 */
    width: number;
    /** 影片高度 */
    height: number;
    /** 该影片其他分辨率 */
    other: {
      id: string;
      file_id: string;
      /** 影片分辨率 */
      type: EpisodeResolutionTypes;
      thumbnail: string;
      /** 影片播放地址 */
      url: string;
      /** 影片宽度 */
      width: number;
      /** 影片高度 */
      height: number;
    }[];
  }>(`/api/episode/${id}`, {
    type: params.type,
  });
  if (res.error) {
    return Result.Err(res.error);
  }
  const { url, file_id, width, height, thumbnail, type, other } = res.data;
  return Result.Ok({
    url,
    file_id,
    type,
    typeText: EpisodeResolutionTypeTexts[type],
    width,
    height,
    thumbnail,
    resolutions: other.map((t) => {
      const { url, width, height, thumbnail, type } = t;
      return {
        url,
        type,
        typeText: EpisodeResolutionTypeTexts[t.type],
        width,
        height,
        thumbnail,
      };
    }),
  });
}
export type MediaSourceProfile = UnpackedResult<Unpacked<ReturnType<typeof fetch_episode_profile>>>;

/**
 * 获取指定 tv、指定 season 下的所有影片
 */
export async function fetch_episodes_of_season(params: { tv_id: string; season_id: string } & FetchParams) {
  const { tv_id, season_id, page, pageSize } = params;
  const resp = await client.get<
    ListResponse<{
      id: string;
      name: string;
      overview: string;
      season_number: string;
      episode_number: string;
      season_id: string;
      sources: {
        id: string;
        file_id: string;
        file_name: string;
      }[];
    }>
  >("/api/episode/list", {
    tv_id,
    season_id,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return Result.Err(resp.error);
  }
  const { list } = resp.data;
  return Result.Ok({
    list: list.map((episode) => {
      const { id, name, overview, season_number, episode_number, sources, season_id } = episode;
      const d = {
        id,
        name,
        overview,
        season_id,
        season: season_to_chinese_num(season_number),
        episode: episode_to_chinese_num(episode_number),
        sources,
      };
      return d;
    }),
  });
}

/**
 * 获取影片播放地址
 */
export async function fetch_episode_play_url(params: { tv_id: string; season: string; episode: string }) {
  console.log("[]fetch_episode_play_url params", params);
  const { tv_id, season, episode } = params;
  const resp = await client.get<
    {
      type: string;
      url: string;
    }[]
  >(`/api/tv/play/${tv_id}`, { season, episode });
  if (resp.error) {
    return resp;
  }
  console.log("[]fetch_episode_play_url success", resp.data);
  return resp;
}

/**
 * 更新播放记录
 */
export async function update_play_history(params: {
  tv_id: string;
  episode_id: string;
  /** 视频当前时间 */
  current_time: number;
  duration?: number;
  file_id: string;
}) {
  const { tv_id, episode_id, current_time, duration, file_id } = params;
  return client.post<null>("/api/history/update", {
    tv_id,
    episode_id,
    current_time,
    duration,
    file_id,
  });
}

/**
 * 获取播放记录
 */
export async function fetch_play_history_of_tv(params: { tv_id: string }) {
  const { tv_id } = params;
  const r = await client.get<{
    id: string;
    tv_id: string;
    episode_id: string;
    season: string;
    episode: string;
    current_time: number;
    duration: number;
  }>("/api/history", { tv_id });
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    current_time: r.data.current_time || 0,
    episode: episode_to_chinese_num(r.data.episode),
  });
}
export type TVPlayHistory = RequestedResource<typeof fetch_play_history_of_tv>;

/**
 * 隐藏指定 tv
 * @param body
 * @returns
 */
export function hidden_tv(body: { id: string }) {
  const { id } = body;
  return client.get(`/api/tv/hidden/${id}`);
}

/**
 * 获取当前用户影片播放记录
 * @param params
 * @returns
 */
export async function fetch_play_histories(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await client.get<
    ListResponse<{
      id: string;
      /** 电视剧名称 */
      name: string;
      /** 电视剧海报地址 */
      poster_path: string;
      /** 电视剧id */
      tv_id: string;
      /** 影片id */
      episode_id: string;
      /** 该集总时长 */
      duration: number;
      /** 看到该电视剧第几集 */
      episode_number: string;
      /** 该集是第几季 */
      season_number: string;
      /** 播放记录当前集进度 */
      current_time: number;
      /** 播放记录更新时间 */
      updated: string;
      /** 当前总集数 */
      cur_episode_count: number;
      /** 该剧集当前季总集数 */
      episode_count: number;
      /** 最新一集添加时间 */
      latest_episode: string;
      /** 电视剧首播日期 */
      first_air_date: string;
      /** 该季首播日期 */
      air_date: string;
      /** 看过后是否有更新 */
      has_update: number;
      thumbnail: string;
    }>
  >("/api/history/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  const { list, total } = r.data;
  return Result.Ok({
    page,
    pageSize,
    total,
    list: list.map((history) => {
      const {
        id,
        name,
        tv_id,
        episode_id,
        poster_path,
        updated,
        has_update,
        episode_number,
        season_number,
        cur_episode_count,
        episode_count,
        duration,
        current_time,
        thumbnail,
      } = history;
      return {
        id,
        name,
        tv_id,
        episode_id,
        poster_path,
        cur_episode_count,
        episode_count,
        episode: episode_to_chinese_num(episode_number),
        season: season_to_chinese_num(season_number),
        updated: relative_time_from_now(updated),
        has_update: !!has_update,
        currentTime: current_time,
        percent: parseFloat((current_time / duration).toFixed(2)) * 100 + "%",
        thumbnail,
      };
    }),
  });
}
export type PlayHistoryItem = RequestedResource<typeof fetch_play_histories>["list"][0];
