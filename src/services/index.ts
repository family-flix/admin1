/**
 *
 */
import { CancelToken } from "axios";
import dayjs from "dayjs";

import { FetchParams } from "@/domains/list/typing";
import { request } from "@/utils/request";
import {
  JSONObject,
  ListResponse,
  ListResponseWithCursor,
  MutableRecord,
  RequestedResource,
  Result,
  Unpacked,
  UnpackedResult,
} from "@/types";
import { EpisodeResolutionTypeTexts, EpisodeResolutionTypes } from "@/domains/tv/constants";
import { DriveTypes, MediaErrorTypes, MediaTypes, ReportTypeTexts, ReportTypes } from "@/constants";
import { bytes_to_size, query_stringify } from "@/utils";

/**
 * 获取电视剧列表
 */
export async function fetch_tv_list(params: FetchParams & { name: string }) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      first_air_date: string;
      popularity: string;
      episode_count: number;
      season_count: number;
      cur_episode_count: number;
      cur_season_count: number;
      episode_sources: number;
      size_count: number;
      size_count_text: string;
      incomplete: boolean;
      need_bind: boolean;
      sync_task: { id: string } | null;
      tips: string[];
    }>
  >("/api/admin/tv/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return resp;
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
export type TVItem = RequestedResource<typeof fetch_tv_list>["list"][number];

/** 获取季列表 */
export async function fetchInvalidTVList(params: FetchParams & Partial<{}>) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      first_air_date: string;
      episodes: {
        id: string;
        name: string;
        episode_text: string;
        sources: { id: string; file_name: string; parent_paths: string; drive: { id: string; name: string } }[];
      }[];
    }>
  >("/api/admin/tv/invalid/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return resp;
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
export type InvalidTVItem = RequestedResource<typeof fetchInvalidTVList>["list"][number];

export function deleteTV(values: { id: string }) {
  const { id } = values;
  return request.get(`/api/admin/tv/${id}/delete`);
}

/** 获取季列表 */
export async function fetchSeasonList(
  params: FetchParams &
    Partial<{
      name: string;
      invalid: number;
      duplicated: number;
    }>
) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<
    ListResponse<{
      id: string;
      tv_id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      air_date: string;
      vote_average: string;
      season_text: string;
      episode_count: number;
      season_count: number;
      cur_episode_count: number;
      tips: string[];
    }>
  >("/api/v2/admin/season/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return resp;
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
export type TVSeasonItem = RequestedResource<typeof fetchSeasonList>["list"][number];

function processSeasonPrepareArchive(season: SeasonPrepareArchiveItemResp) {
  const { id, season_text, poster_path, episode_count, cur_episode_count, name, episodes } = season;
  const drive_group: Record<
    string,
    {
      id: string;
      name: string;
      type: number;
    }
  > = {};
  const total_sources: MediaSource[] = [];
  const processed_episodes = episodes.map((episode) => {
    const { id, name, episode_number, sources } = episode;
    const source_group_by_drive_id: Record<string, MediaSource[]> = {};
    for (let i = 0; i < sources.length; i += 1) {
      const source = sources[i];
      const { drive } = source;
      source_group_by_drive_id[drive.id] = source_group_by_drive_id[drive.id] || [];
      drive_group[drive.id] = drive;
      const payload = {
        id: source.id,
        file_id: source.file_id,
        file_name: source.file_name,
        parent_paths: source.parent_paths,
        size: source.size,
      };
      source_group_by_drive_id[drive.id].push(payload);
    }
    total_sources.push(
      ...sources.map((source) => {
        const payload = {
          id: source.id,
          file_id: source.file_id,
          file_name: source.file_name,
          parent_paths: source.parent_paths,
          size: source.size,
        };
        return payload;
      })
    );
    return {
      id,
      name,
      episode_number,
      drives: Object.keys(source_group_by_drive_id).map((drive_id) => {
        return {
          id: drive_id,
          name: drive_group[drive_id].name,
          sources: source_group_by_drive_id[drive_id],
        };
      }),
    };
  });
  const all_sources = total_sources;
  const source_size_count = all_sources.reduce((total, cur) => {
    return total + cur.size;
  }, 0);
  const is_completed = cur_episode_count === episode_count;
  const drives = Object.values(drive_group);
  return {
    id,
    poster_path,
    name,
    season_text,
    episode_count,
    cur_episode_count,
    episodes: processed_episodes,
    size_count: source_size_count,
    size_count_text: bytes_to_size(source_size_count),
    drives: Object.values(drive_group),
    /** 需要转存到资源盘 */
    need_to_resource: (() => {
      if (!is_completed) {
        return false;
      }
      if (drives.length !== 1) {
        return false;
      }
      const drive = drives[0];
      if (drive.type !== DriveTypes.AliyunBackupDrive) {
        return false;
      }
      return true;
    })(),
    can_archive: (() => {
      if (!is_completed) {
        return false;
      }
      if (drives.length === 0) {
        return false;
      }
      // 所有视频文件都在同一资源盘，才可以进行转存
      if (drives.length !== 1) {
        return false;
      }
      const drive = drives[0];
      if (drive.type !== DriveTypes.AliyunResourceDrive) {
        return false;
      }
      return true;
    })(),
  };
}
export type SeasonPrepareArchiveItem = RequestedResource<typeof fetchSeasonPrepareArchiveList>["list"][number];

function processMoviePrepareArchive(movie: MoviePrepareArchiveItemResp) {
  const { id, name, poster_path, medias } = movie;
  const drive_group: Record<
    string,
    {
      id: string;
      name: string;
      type: number;
    }
  > = {};
  const total_sources: MediaSource[] = [];
  const processed_episodes = medias.map((episode) => {
    const { id, name, sources } = episode;
    const source_group_by_drive_id: Record<string, MediaSource[]> = {};
    for (let i = 0; i < sources.length; i += 1) {
      const source = sources[i];
      const { drive } = source;
      source_group_by_drive_id[drive.id] = source_group_by_drive_id[drive.id] || [];
      drive_group[drive.id] = drive;
      const payload = {
        id: source.id,
        file_id: source.file_id,
        file_name: source.file_name,
        parent_paths: source.parent_paths,
        size: source.size,
      };
      source_group_by_drive_id[drive.id].push(payload);
    }
    total_sources.push(
      ...sources.map((source) => {
        const payload = {
          id: source.id,
          file_id: source.file_id,
          file_name: source.file_name,
          parent_paths: source.parent_paths,
          size: source.size,
        };
        return payload;
      })
    );
    return {
      id,
      name,
      drives: Object.keys(source_group_by_drive_id).map((drive_id) => {
        return {
          id: drive_id,
          name: drive_group[drive_id].name,
          sources: source_group_by_drive_id[drive_id],
        };
      }),
    };
  });
  const all_sources = total_sources;
  const source_size_count = all_sources.reduce((total, cur) => {
    return total + cur.size;
  }, 0);
  const drives = Object.values(drive_group);
  return {
    id,
    name,
    poster_path,
    medias: processed_episodes,
    size_count: source_size_count,
    size_count_text: bytes_to_size(source_size_count),
    drives: Object.values(drive_group),
    /** 需要转存到资源盘 */
    need_to_resource: (() => {
      if (drives.length !== 1) {
        return false;
      }
      const drive = drives[0];
      if (drive.type !== DriveTypes.AliyunBackupDrive) {
        return false;
      }
      return true;
    })(),
    can_archive: (() => {
      if (drives.length === 0) {
        return false;
      }
      // 所有视频文件都在同一资源盘，才可以进行转存
      if (drives.length !== 1) {
        return false;
      }
      const drive = drives[0];
      if (drive.type !== DriveTypes.AliyunResourceDrive) {
        return false;
      }
      return true;
    })(),
  };
}

export type MoviePrepareArchiveItem = RequestedResource<typeof fetchMoviePrepareArchiveList>["list"][number];

type MediaSource = {
  id: string;
  file_id: string;
  file_name: string;
  parent_paths: string;
  size: number;
};
type SeasonPrepareArchiveItemResp = {
  id: string;
  tv_id: string;
  name: string;
  poster_path: string;
  first_air_date: string;
  season_text: string;
  episode_count: number;
  cur_episode_count: number;
  episodes: {
    id: string;
    name: string;
    season_text: number;
    episode_text: number;
    episode_number: number;
    sources: {
      id: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      size: number;
      drive: {
        id: string;
        name: string;
        type: number;
      };
    }[];
  }[];
};
type MoviePrepareArchiveItemResp = {
  id: string;
  tv_id: string;
  name: string;
  poster_path: string;
  air_date: string;
  medias: {
    id: string;
    name: string;
    sources: {
      id: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      size: number;
      drive: {
        id: string;
        name: string;
        type: number;
      };
    }[];
  }[];
};

/** 获取可以归档的季列表 */
export async function fetchSeasonPrepareArchiveList(
  params: FetchParams &
    Partial<{
      name: string;
      invalid: number;
      duplicated: number;
    }>
) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<ListResponse<SeasonPrepareArchiveItemResp>>("/api/admin/season/archive/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return resp;
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map(processSeasonPrepareArchive),
  });
}

export async function fetchPartialSeasonPrepareArchive(values: { id: string }) {
  const { id } = values;
  const r = await request.get<SeasonPrepareArchiveItemResp>(`/api/admin/season/archive/${id}/partial`);
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok(processSeasonPrepareArchive(r.data));
}

/** 获取可以归档的电影列表 */
export async function fetchMoviePrepareArchiveList(
  params: FetchParams &
    Partial<{
      name: string;
      invalid: number;
      duplicated: number;
    }>
) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<ListResponse<MoviePrepareArchiveItemResp>>("/api/admin/movie/archive/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return resp;
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map(processMoviePrepareArchive),
  });
}

export async function fetchPartialMoviePrepareArchive(values: { id: string }) {
  const { id } = values;
  const r = await request.get<MoviePrepareArchiveItemResp>(`/api/admin/movie/archive/${id}/partial`);
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok(processMoviePrepareArchive(r.data));
}

/*
 * 获取电视剧部分详情
 */
export async function fetchPartialTV(params: { tv_id: string }) {
  const { tv_id } = params;
  const resp = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      first_air_date: string;
      popularity: string;
      episode_count: number;
      season_count: number;
      cur_episode_count: number;
      cur_season_count: number;
      episode_sources: number;
      size_count: number;
      size_count_text: string;
      incomplete: boolean;
      need_bind: boolean;
      sync_task: { id: string } | null;
      tips: string[];
    }>
  >(`/api/admin/tv/${tv_id}/partial`);
  if (resp.error) {
    return resp;
  }
  return Result.Ok(resp.data);
}

/*
 * 获取电视剧部分详情
 */
export async function fetchPartialSeason(params: { season_id: string }) {
  const { season_id } = params;
  const resp = await request.get<{
    id: string;
    // tv_id: string;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string;
    season_text: string;
    air_date: string;
    vote_average: string;
    episode_count: number;
    // season_count: number;
    cur_episode_count: number;
    // cur_season_count: number;
    // episode_sources: number;
    // size_count: number;
    // size_count_text: string;
    // incomplete: boolean;
    // need_bind: boolean;
    // sync_task: { id: string } | null;
    tips: string[];
  }>(`/api/admin/season/${season_id}/partial`);
  if (resp.error) {
    return resp;
  }
  return Result.Ok(resp.data);
}

/**
 * tv 列表中的元素
 */
export type PartialSearchedTVFromTMDB = UnpackedResult<Unpacked<ReturnType<typeof search_tv_in_tmdb>>>["list"][number];
export type PartialSearchedTV = Omit<
  PartialSearchedTVFromTMDB,
  "id" | "search_tv_in_tmdb_then_save" | "original_country"
> & {
  id: string;
  created: string;
  updated: string;
};

export function delete_tv(body: {
  tv_id: string;
  /** 删除电视剧同时还要删除云盘内文件 */
  include_file?: boolean;
}) {
  const { tv_id, include_file } = body;
  return request.get<void>(`/api/admin/tv/delete/${tv_id}`);
}

/** 刷新电视剧详情 */
export function refreshSeasonProfile(body: { season_id: string }) {
  const { season_id } = body;
  return request.post<{ job_id: string }>(`/api/admin/season/${season_id}/refresh_profile`, {});
}
/** 改变电视剧详情 */
export function changeSeasonProfile(body: { season_id: string; unique_id?: number }) {
  const { season_id, unique_id } = body;
  return request.post<{ job_id: string }>(`/api/admin/season/${season_id}/set_profile`, {
    unique_id,
  });
}
/** 手动修改电视剧详情 */
export function updateSeasonProfileManually(body: { season_id: string; title?: string; episode_count?: number }) {
  const { season_id, title, episode_count } = body;
  return request.post<void>(`/api/admin/season/${season_id}/update`, { name: title, episode_count });
}
/** 删除指定电视剧季 */
export function deleteSeason(body: { season_id: string }) {
  const { season_id } = body;
  return request.get<void>(`/api/admin/season/${season_id}/delete`);
}

/**
 * 获取电影列表
 */
export async function fetchMovieList(params: FetchParams & { name: string; duplicated: number }) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      air_date: string;
      vote_average: number;
      runtime: number;
      persons: {
        id: string;
        name: string;
        profile_path: string;
        order: number;
      }[];
    }>
  >("/api/v2/admin/movie/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return resp;
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map((movie) => {
      const { persons = [], ...rest } = movie;
      return {
        ...rest,
        persons: persons.slice(0, 5),
        // updated: dayjs(updated).format("YYYY/MM/DD HH:mm"),
      };
    }),
  });
}
export type MovieItem = RequestedResource<typeof fetchMovieList>["list"][number];

/** 刷新电影详情 */
export function refreshMovieProfile(body: { movie_id: string }) {
  const { movie_id } = body;
  return request.post<{ job_id: string }>(`/api/admin/movie/${movie_id}/refresh_profile`, {});
}
/** 改变电影详情 */
export function changeMovieProfile(body: { movie_id: string; unique_id: number }) {
  const { movie_id, unique_id } = body;
  return request.post<{ job_id: string }>(`/api/admin/movie/${movie_id}/set_profile`, {
    unique_id,
  });
}
/** 手动更新电影详情 */
export function updateMovieProfile(body: { movie_id: string; name: string }) {
  const { movie_id, name } = body;
  return request.post(`/api/admin/movie/${movie_id}/update`, {
    name,
  });
}

export function delete_movie(body: { movie_id: string }) {
  const { movie_id } = body;
  return request.post(`/api/admin/movie/${movie_id}/delete`, {});
}

/**
 * 获取无法识别的 tv
 */
export async function fetchUnknownSeasonMediaList(params: FetchParams & { type: MediaTypes }) {
  const { page, pageSize, ...rest } = params;
  const r = await request.post<
    ListResponse<{
      id: string;
      name: string;
      season_text: string;
      sources: {
        id: string;
        name: string;
        original_name: string;
        season_text: string;
        episode_text: string;
        file_name: string;
        parent_paths: string;
        profile: null | {};
        drive: {
          id: string;
          name: string;
        };
      }[];
    }>
  >(`/api/v2/admin/parsed_media/list`, {
    ...rest,
    type: MediaTypes.Season,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, season_text, sources } = tv;
      return {
        id,
        name,
        season_text,
        sources,
      };
    }),
  });
}

/**
 * 获取无法识别的 tv
 */
export async function fetchUnknownMovieMediaList(params: FetchParams & { type: MediaTypes }) {
  const { page, pageSize, ...rest } = params;
  const r = await request.post<
    ListResponse<{
      id: string;
      name: string;
      season_text: string;
      sources: {
        id: string;
        name: string;
        original_name: string;
        season_text: string;
        episode_text: string;
        file_name: string;
        parent_paths: string;
        profile: null | {};
        drive: {
          id: string;
          name: string;
        };
      }[];
    }>
  >(`/api/v2/admin/parsed_media/list`, {
    ...rest,
    type: MediaTypes.Movie,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, season_text, sources } = tv;
      return {
        id,
        name,
        season_text,
        sources,
      };
    }),
  });
}
export type UnknownSeasonMediaItem = RequestedResource<typeof fetchUnknownSeasonMediaList>["list"][0];

/** 删除所有未识别电视剧 */
export function deleteUnknownTVList() {
  return request.get("/api/admin/unknown_tv/delete");
}

/** 删除指定未识别电视剧 */
export function deleteUnknownTV(values: { parsed_tv_id: string }) {
  const { parsed_tv_id } = values;
  return request.get(`/api/admin/unknown_tv/${parsed_tv_id}/delete`);
}

/**
 * 获取无法识别的季
 */
export async function fetchUnknownSeasonList(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await request.get<
    ListResponse<{
      id: string;
      name: string;
      season_number: string;
    }>
  >(`/api/admin/unknown_season/list`, {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, season_number } = tv;
      return {
        id,
        name,
        season_number,
      };
    }),
  });
}
export type UnknownSeasonItem = RequestedResource<typeof fetchUnknownSeasonList>["list"][0];

/** 删除所有未识别电视剧季 */
export function delete_unknown_season_list() {
  return request.get("/api/admin/unknown_season/delete");
}

/**
 * 获取无法识别的电影
 */
export async function fetch_unknown_movie_list(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      drive: {
        id: string;
        name: string;
        avatar: string;
      };
    }>
  >(`/api/admin/unknown_movie/list`, {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, original_name, file_id, file_name, parent_paths, drive } = tv;
      return {
        id,
        name: name || original_name,
        file_id,
        file_name,
        parent_paths,
        drive,
      };
    }),
  });
}
export type UnknownMovieItem = RequestedResource<typeof fetch_unknown_movie_list>["list"][0];

export async function fetch_unknown_episode_list(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      season_number: string;
      episode_number: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      drive: {
        id: string;
        name: string;
        avatar: string;
      };
    }>
  >(`/api/admin/unknown_episode/list`, {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, original_name, episode_number, season_number, file_id, file_name, parent_paths, drive } = tv;
      return {
        id,
        name: name || original_name,
        episode_number,
        season_number,
        file_id,
        file_name,
        parent_paths,
        drive,
      };
    }),
  });
}
export type UnknownEpisodeItem = RequestedResource<typeof fetch_unknown_episode_list>["list"][0];

export function delete_unknown_episode(body: { id: string }) {
  const { id } = body;
  return request.get(`/api/admin/unknown_episode/delete/${id}`, undefined);
}
export function delete_unknown_episode_list() {
  return request.get(`/api/admin/unknown_episode/delete`);
}

/** 删除所有未识别电影 */
export function delete_unknown_movie_list() {
  return request.get("/api/admin/unknown_movie/delete");
}
/**
 * 删除指定未知电影
 * @param body
 */
export function delete_unknown_movie(body: { id: string }) {
  const { id } = body;
  return request.get(`/api/admin/unknown_movie/delete/${id}`, undefined);
}

/**
 * 更新季数
 * @param body
 * @returns
 */
export function update_unknown_season_number(body: { id: string; season_number: string }) {
  const { id, season_number } = body;
  return request.post<void>(`/api/admin/unknown_season/update/${id}`, {
    season_number,
  });
}

/**
 * 获取未识别的影视剧详情
 * @param body
 */
export function fetch_unknown_tv_profile(body: { id: string }) {
  const { id } = body;
  return request.get<{
    id: string;
    name: string;
    file_id?: string;
    file_name?: string;
    folders: {
      paths: string;
      episodes: {
        id: string;
        file_id: string;
        file_name: string;
        episode: string;
        season: string;
      }[];
    }[];
  }>(`/api/admin/unknown_tv/${id}`);
}
export type UnknownTVProfile = RequestedResource<typeof fetch_unknown_tv_profile>;

/**
 * 在 TMDB 搜索影视剧
 * @param params
 * @returns
 */
export async function search_tv_in_tmdb(params: FetchParams & { keyword: string }) {
  const { keyword, page, pageSize, ...rest } = params;
  return request.get<
    ListResponse<{
      id: number;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      searched_tv_id: string;
    }>
  >(`/api/admin/tmdb/search`, {
    ...rest,
    keyword,
    page,
    page_size: pageSize,
  });
}

export type MatchedTVOfTMDB = RequestedResource<typeof search_tv_in_tmdb>["list"][0];

/**
 * 给指定未知 tv 绑定一个 tmdb 的搜索结果
 */
export async function setProfileForUnknownMovie(id: string, body: { unique_id: number | string }) {
  return request.post(`/api/admin/unknown_movie/${id}/set_profile`, body);
}

/**
 * 给指定 tv 绑定一个 tmdb 的搜索结果
 */
export async function bind_profile_for_unknown_tv(
  id: string,
  profile: { source?: number; unique_id: string | number }
) {
  const { unique_id } = profile;
  return request.post(`/api/admin/unknown_tv/${id}/set_profile`, {
    unique_id,
  });
}

/**
 * 修改未识别电视剧名称并索引
 */
export async function modifyUnknownTVName(id: string, body: { name: string }) {
  return request.post(`/api/admin/unknown_tv/${id}/update`, body);
}

/**
 * 获取指定电视剧关联的文件列表
 */
export async function fetch_files_of_tv(body: { id: string; page: number; page_size: number }) {
  const { id, page, page_size } = body;
  return request.get<
    ListResponse<{
      id: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      drive: {
        id: string;
        name: string;
      };
    }>
  >(`/api/admin/tv/${id}/source`, {
    page,
    page_size,
  });
}

/**
 * 获取指定电视剧关联的文件详情
 */
export async function fetch_file_profile_of_tv(body: { tv_id: string; id: string }) {
  const { tv_id, id } = body;
  const r = await request.get<{
    id: string;
    file_id: string;
    file_name: string;
    parsed_tv: {
      id: string;
      name: string;
      original_name: string;
      correct_name: string;
      file_id: string;
      file_name: string;
    };
  }>(`/api/admin/tv/${tv_id}/source/${id}`);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { file_id, file_name, parsed_tv } = r.data;
  const { name, original_name } = parsed_tv;
  return Result.Ok({
    id,
    file_id,
    file_name,
    parsed_tv: {
      id: parsed_tv.id,
      name: name || original_name,
    },
  });
}

/**
 * 删除指定未知电视剧的指定文件
 */
export async function delete_parsed_tv_of_tv(body: { tv_id: string; id: string }) {
  const { tv_id, id } = body;
  const r = await request.get<null>(`/api/admin/tv/${tv_id}/parsed_tv/delete/${id}`);
  if (r.error) {
    return Result.Err(r.error);
  }
  return Result.Ok(null);
}

/**
 * 获取成员列表
 * @param params
 * @returns
 */
export async function fetchMemberList(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const res = await request.get<
    ListResponse<{
      id: string;
      remark: string;
      inviter: null | {
        id: string;
        remark: string;
      };
      disabled: boolean;
      tokens: {
        id: string;
        token: string;
        used: boolean;
      }[];
    }>
  >("/api/admin/member/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (res.error) {
    return Result.Err(res.error);
  }
  return Result.Ok({
    ...res.data,
    list: res.data.list,
  });
}
export type MemberItem = RequestedResource<typeof fetchMemberList>["list"][0];

/**
 * 添加成员
 * @param body
 * @returns
 */
export function add_member(body: { remark: string }) {
  return request.post<{ id: string }>("/api/admin/member/add", body);
}

/**
 * 生成成员授权链接
 * @param body
 * @returns
 */
export function create_member_auth_link(body: { id: string }) {
  return request.post<{ id: string }>("/api/admin/member/token/add", body);
}

/**
 *
 * @param body
 * @returns
 */
export async function fetch_aliyun_drive_files(body: {
  drive_id: string;
  file_id: string;
  next_marker: string;
  name?: string;
  page_size?: number;
}) {
  const { drive_id, file_id, name, next_marker, page_size = 24 } = body;
  const r = await request.get<{
    items: {
      file_id: string;
      name: string;
      next_marker: string;
      parent_file_id: string;
      size: number;
      type: "folder" | "file";
      thumbnail: string;
    }[];
    next_marker: string;
  }>(`/api/admin/drive/files/${drive_id}`, {
    name,
    file_id,
    next_marker,
    page_size,
  });
  return r;
}

export async function fetch_shared_files(body: { url: string; file_id: string; next_marker: string }) {
  const { url, file_id, next_marker } = body;
  const r = await request.get<{
    items: {
      file_id: string;
      name: string;
      next_marker: string;
      parent_file_id: string;
      size: number;
      type: "folder" | "file";
      thumbnail: string;
    }[];
    next_marker: string;
  }>("/api/admin/shared_files", { url, file_id, next_marker });
  return r;
}
export type AliyunFolderItem = RequestedResource<typeof fetch_shared_files>["items"][0];

/**
 * 获取云盘文件临平
 */
export async function fetch_drive_files(body: { drive_id: string; file_id: string; name: string }) {
  const { drive_id, file_id, name } = body;
  return request.get(`/api/admin/aliyun/files/${file_id}`, { name, drive_id });
}

/**
 * 执行一次同步任务（将分享资源新增的视频文件转存到云盘目标文件夹中）
 */
export async function patch_added_files(body: {
  /** 分享链接 */
  url: string;
  /** 检查是否有新增文件的文件夹 id */
  file_id: string;
  /** 检查是否有新增文件的文件夹名称 */
  file_name: string;
}) {
  return request.get("/api/admin/shared_file/diff", body);
}

/**
 * 根据给定的文件夹名称，在云盘中找到有类似名字的文件夹
 * @param body
 * @returns
 */
export function find_folders_has_same_name(body: { name: string }) {
  return request.get<{ name: string; file_id: string }>("/api/admin/shared_file/find_folder_has_same_name", body);
}
export type FolderItem = RequestedResource<typeof find_folders_has_same_name>;

/**
 *
 * @param body
 * @returns
 */
export async function build_link_between_shared_files_with_folder(body: {
  /** 分享链接 */
  url: string;
  /** 分享文件夹 id */
  file_id: string;
  /** 分享文件夹名称 */
  file_name: string;
  /** 要建立关联的文件夹名称 */
  target_file_name?: string;
  target_file_id?: string;
}) {
  return request.post("/api/admin/shared_file/link", body);
}

/**
 * 判断是否有同名文件夹
 */
export async function check_has_same_name_tv(body: {
  /** 检查是否有新增文件的文件夹名称 */
  file_name: string;
}) {
  return request.post<null | TVItem>("/api/admin/shared_file/check_same_name", body);
}

/**
 * 获取可以建立同步任务的文件夹转存记录
 */
export function fetch_folder_can_add_sync_task(body: { page: number; page_size: number; name?: string[] }) {
  const { page, page_size, name } = body;
  return request.post<
    ListResponse<{
      id: string;
      url: string;
      file_id: string;
      name: string;
    }>
  >("/api/admin/tv/enabled_shared_file/list", {
    page,
    page_size,
    name,
  });
}
export type FolderCanAddingSyncTaskItem = RequestedResource<typeof fetch_folder_can_add_sync_task>["list"][number];

/**
 * 执行一次分享资源的同步任务
 * @param body
 * @returns
 */
export function runSyncTask(body: { id: string }) {
  const { id } = body;
  return request.get<{ job_id: string }>(`/api/admin/sync_task/${id}/run`);
}

/**
 * 更新所有电视剧详情
 */
export function refreshSeasonProfiles() {
  return request.get<{ job_id: string }>("/api/admin/season/refresh_profile");
}

/**
 * 更新所有电影详情
 */
export function refreshMovieProfiles() {
  return request.get<{ job_id: string }>("/api/admin/movie/refresh_profile");
}

/**
 * 转存指定季到指定云盘
 */
export function transferSeasonToAnotherDrive(body: { season_id: string; target_drive_id: string }) {
  const { season_id, target_drive_id } = body;
  return request.post<{ job_id: string }>(`/api/admin/season/${season_id}/transfer`, {
    target_drive_id,
  });
}

/**
 * 转存指定电影到指定云盘
 */
export function transferMovieToAnotherDrive(body: { movie_id: string; target_drive_id: string }) {
  const { movie_id, target_drive_id } = body;
  return request.post<{ job_id: string }>(`/api/admin/movie/${movie_id}/transfer`, {
    target_drive_id,
  });
}

/**
 * 移动指定电视剧到资源盘
 */
export function moveSeasonToResourceDrive(body: { season_id: string }) {
  const { season_id } = body;
  return request.post<{ job_id: string }>(`/api/admin/season/${season_id}/to_resource_drive`, {});
}

/**
 * 移动指定电影到资源盘
 */
export function moveMovieToResourceDrive(body: { movie_id: string }) {
  const { movie_id } = body;
  return request.post<{ job_id: string }>(`/api/admin/movie/${movie_id}/to_resource_drive`, {});
}

/**
 * 删除指定成员
 * @returns
 */
export function delete_member(body: { id: string }) {
  const { id } = body;
  return request.get(`/api/admin/member/delete/${id}`);
}

export function updateMemberPermission(values: { member_id: string; permissions: string[] }) {
  const { member_id, permissions } = values;
  const body = {
    permissions,
  };
  return request.post(`/api/admin/member/${member_id}/permission/update`, body);
}

/**
 * 是否已经有管理员
 */
export function has_admin() {
  return request.get<{ existing: boolean }>(`/api/admin/user/existing`);
}

export function delete_aliyun_file(body: { file_id: string }) {
  const { file_id } = body;
  return request.get(`/api/admin/aliyun/delete/${file_id}`);
}

export async function fetchSeasonProfile(body: { season_id: string }) {
  const { season_id } = body;
  const r = await request.get<{
    id: string;
    name: string;
    overview: string;
    poster_path: null;
    backdrop_path: null;
    original_language: string;
    air_date: string;
    tmdb_id: number;
    // incomplete: boolean;
    seasons: {
      id: string;
      name: string;
      overview: string;
      season_number: number;
    }[];
    episodes: {
      id: string;
      name: string;
      overview: string;
      episode_number: string;
      air_date: string;
      runtime: number;
      sources: {
        id: string;
        file_id: string;
        file_name: string;
        parent_paths: string;
        size: number;
        created: string;
        drive: {
          id: string;
          name: string;
          avatar: string;
        };
      }[];
    }[];
  }>(`/api/admin/season/${season_id}`);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { id, name, overview, poster_path, backdrop_path, air_date, tmdb_id, seasons, episodes } = r.data;
  return Result.Ok({
    id,
    name,
    overview,
    poster_path,
    backdrop_path,
    air_date,
    tmdb_id,
    seasons,
    episodes,
  });
}
export type TVProfile = RequestedResource<typeof fetchSeasonProfile>;
export type SeasonInTVProfile = RequestedResource<typeof fetchSeasonProfile>["seasons"][number];

export async function deleteEpisode(body: { id: string }) {
  const { id } = body;
  return request.get(`/api/admin/episode/${id}/delete`);
}

/**
 * 获取指定电视剧、指定季下的剧集，支持分页
 * @param body
 * @returns
 */
export function fetchEpisodesOfSeason(body: { tv_id: string; season_id: string } & FetchParams) {
  const { tv_id, season_id, ...rest } = body;
  return request.get<
    ListResponse<{
      id: string;
      name: string;
      overview: string;
      episode_number: string;
      first_air_date: string;
      runtime: number;
      sources: {
        id: string;
        file_id: string;
        file_name: string;
        parent_paths: string;
        size: number;
        drive: {
          id: string;
          name: string;
          avatar: string;
        };
      }[];
    }>
  >(`/api/admin/tv/${tv_id}/season/${season_id}/episodes`, rest);
}
export type EpisodeItemInSeason = RequestedResource<typeof fetchEpisodesOfSeason>["list"][number];

export async function fetchSourcePreviewInfo(body: { id: string }) {
  const { id } = body;
  const r = await request.get<{
    url: string;
    thumbnail: string;
    type: EpisodeResolutionTypes;
    width: number;
    height: number;
    other: {
      url: string;
      thumbnail: string;
      type: EpisodeResolutionTypes;
      width: number;
      height: number;
    }[];
  }>(`/api/admin/source/${id}/preview`);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { url, width, height, type, other, thumbnail } = r.data;
  return Result.Ok({
    file_id: id,
    url,
    width,
    height,
    type,
    typeText: EpisodeResolutionTypeTexts[type],
    thumbnail,
    resolutions: other.map((r) => {
      const { url, width, height, type, thumbnail } = r;
      return {
        file_id: id,
        url,
        width,
        height,
        type,
        typeText: EpisodeResolutionTypeTexts[type],
        thumbnail,
      };
    }),
  });
}

export async function fetchReportList(params: FetchParams) {
  const r = await request.get<
    ListResponse<{
      id: string;
      type: ReportTypes;
      member: {
        id: string;
        name: string;
      };
      data: string;
      answer: string;
      movie?: {
        id: string;
        name: string;
        poster_path: string;
      };
      tv?: {
        id: string;
        name: string;
        poster_path: string;
      };
      season?: {
        id: string;
        tv_id: string;
        name: string;
        poster_path: string;
        season_text: string;
      };
      episode?: {
        id: string;
        episode_text: string;
      };
      created: string;
    }>
  >(`/api/admin/report/list`, params);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { list, ...rest } = r.data;
  return Result.Ok({
    ...rest,
    list: list.map((report) => {
      const { id, type, answer, member, data, movie, season, episode, created } = report;
      return {
        id,
        type,
        typeText: ReportTypeTexts[type],
        answer,
        member,
        data,
        movie,
        season,
        episode,
        created: dayjs(created).format("YYYY-MM-DD HH:mm:ss"),
      };
    }),
  });
}
export type ReportItem = RequestedResource<typeof fetchReportList>["list"][number];

export function fetchReportProfile(params: { report_id: string }) {
  const { report_id } = params;
  return request.get(`/api/admin/report/${report_id}`);
}

export async function fetch_shared_files_histories(body: FetchParams) {
  const r = await request.get<
    ListResponse<{
      id: string;
      url: string;
      title: string;
      created: string;
    }>
  >("/api/admin/shared_file/list", body as unknown as JSONObject);
  if (r.error) {
    return Result.Err(r.error);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((f) => {
      const { created, ...rest } = f;
      return {
        ...rest,
        // created: relative_time_from_now(created),
      };
    }),
  });
}
export type SharedFileHistoryItem = RequestedResource<typeof fetch_shared_files_histories>["list"][0];

export async function fetch_shared_files_transfer_list(body: FetchParams) {
  const r = await request.get<
    ListResponse<{
      id: string;
      url: string;
      name: string;
      created: string;
    }>
  >("/api/admin/shared_file_save/list", body as unknown as JSONObject);
  if (r.error) {
    return Result.Err(r.error);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((f) => {
      const { created, ...rest } = f;
      return {
        ...rest,
        created: dayjs(created).format("YYYY-MM-DD HH:mm"),
      };
    }),
  });
}
export type SharedFileTransferItem = RequestedResource<typeof fetch_shared_files_transfer_list>["list"][0];

export async function fetchMovieProfile(body: { movie_id: string }) {
  const { movie_id } = body;
  const r = await request.get<{
    id: string;
    name: string;
    overview: string;
    poster_path: null;
    backdrop_path: null;
    original_language: string;
    air_date: string;
    tmdb_id: number;
    sources: {
      id: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      size: number;
      drive: {
        id: string;
        name: string;
        avatar: string;
      };
    }[];
  }>(`/api/admin/movie/${movie_id}`);
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const source_size_count = r.data.sources.reduce((count, cur) => {
    return count + cur.size;
  }, 0);
  return Result.Ok({
    ...r.data,
    source_size_count,
    source_size_text: bytes_to_size(source_size_count),
  });
}
export type MovieProfile = RequestedResource<typeof fetchMovieProfile>;

export function upload_file(body: FormData) {
  return request.post("/api/admin/upload", body);
}

export function upload_subtitle_for_episode(params: {
  tv_id: string;
  season_text: string;
  episode_text: string;
  lang: string;
  drive_id: string;
  file: File;
}) {
  const { tv_id, drive_id, lang, season_text, episode_text, file } = params;
  const body = new FormData();
  body.append("file", file);
  body.append("drive", drive_id);
  body.append("lang", lang);
  body.append("season_text", season_text);
  body.append("episode_text", episode_text);
  const search = query_stringify({
    tv_id,
    drive_id,
    lang,
    season_text,
    episode_text,
  });
  return request.post(`/api/admin/episode/subtitle/add?${search}`, body);
}

export function upload_subtitle_for_movie(params: { movie_id: string; drive_id: string; lang: string; file: File }) {
  const { movie_id, drive_id, lang, file } = params;
  const body = new FormData();
  body.append("file", file);
  return request.post(`/api/admin/movie/${movie_id}/subtitle/add?drive_id=${drive_id}&lang=${lang}`, body);
}

export function notify_test(values: { text: string; token: string }) {
  const { text, token } = values;
  return request.post(`/api/admin/notify/test`, { text, token });
}

type UserSettings = {
  /**
   * PushDeer token
   */
  push_deer_token: string;
  /**
   * filename parse rules
   */
  extra_filename_rules: string;
  ignore_files_when_sync: string;
  max_size_when_sync: number;
};

/**
 * 获取用户配置
 */
export function fetchSettings() {
  return request.get<UserSettings>("/api/admin/settings");
}

/**
 * 更新用户配置
 */
export function updateSettings(values: Partial<UserSettings>) {
  const { push_deer_token, extra_filename_rules, ignore_files_when_sync, max_size_when_sync } = values;
  return request.post(`/api/admin/settings/update`, {
    push_deer_token,
    extra_filename_rules,
    ignore_files_when_sync,
    max_size_when_sync,
  });
}

export function pushMessageToMembers(values: { content: string }) {
  return request.post("/api/admin/notify", values);
}

/**
 * 更新用户配置
 */
export function deleteExpiredSourceFiles() {
  return request.post(`/api/admin/settings/expired_file/delete`, {});
}

export function sync_folder(values: { drive_id: string; file_id: string }) {
  const { drive_id, file_id } = values;
  return request.get<{ job_id: string }>(`/api/admin/file/${file_id}/sync`, { drive_id });
}

type AnswerPayload = Partial<{
  content: string;
  season: {
    id: string;
    tv_id: string;
    name: string;
    first_air_date: string;
    poster_path: string;
  };
  movie: {
    id: string;
    name: string;
    first_air_date: string;
    poster_path: string;
  };
}>;
export function replyReport(
  values: {
    report_id: string;
  } & AnswerPayload
) {
  const { report_id, content, movie, season } = values;
  return request.post(`/api/admin/report/${report_id}/reply`, {
    content,
    movie,
    season,
  });
}

/**
 * 获取权限列表
 */
export async function fetchPermissionList(params: FetchParams) {
  const { pageSize, ...restParams } = params;
  const r = await request.get<
    ListResponse<{
      code: string;
      desc: string;
    }>
  >("/api/admin/permission/list", {
    page_size: pageSize,
    ...restParams,
  });
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const { page, total, no_more, list } = r.data;
  return Result.Ok({
    page,
    page_size: pageSize,
    total,
    no_more,
    list,
  });
}

/**
 * 新增权限
 */
export function addPermission(values: { desc: string }) {
  const { desc } = values;
  const body = {
    desc,
  };
  return request.post("/api/admin/permission/add", body);
}

/**
 * 校验字幕文件名是否合法
 */
export function validateSubtitleFiles(values: { tv_id?: string; filenames: string[] }) {
  const { tv_id, filenames } = values;
  return request.post<{
    files: {
      filename: string;
      season: {
        id: string;
        name: string;
      } | null;
      season_text: string;
      episode: {
        id: string;
        name: string;
      } | null;
      episode_text: string;
      language: string;
    }[];
    tvs: {
      id: string;
      name: string;
      original_name: string;
      poster_path: string;
      seasons: {
        id: string;
        season_text: string;
      }[];
      episodes: {
        id: string;
        episode_text: string;
      }[];
    }[];
    drives: {
      id: string;
    }[];
  }>("/api/admin/subtitle/validate", {
    tv_id,
    filenames,
  });
}

export function batchUploadSubtitles(params: {
  tv_id: string;
  drive_id: string;
  files: {
    filename: string;
    season_id: string;
    episode_id: string;
    language: string;
    file: File;
  }[];
}) {
  const { tv_id, drive_id, files } = params;
  const body = new FormData();
  for (const payload of files) {
    const { file, ...restPayload } = payload;
    const { episode_id } = restPayload;
    if (payload.file) {
      body.append(episode_id, payload.file);
    }
    body.append("payloads", JSON.stringify(restPayload));
  }
  body.append("drive", drive_id);
  body.append("tv", tv_id);
  const search = query_stringify({
    tv_id,
    drive_id,
  });
  return request.post<{ job_id: string }>(`/api/admin/subtitle/batch_add?${search}`, body);
}

export function fetchSubtitleList(params: FetchParams) {
  return request.post<
    ListResponse<{
      id: string;
      name: string;
      poster_path: string;
      season_text: string;
      episodes: {
        id: string;
        episode_text: string;
        subtitles: {
          id: string;
          file_id: string;
          name: string;
          language: string;
        }[];
      }[];
    }>
  >("/api/admin/subtitle/list", params);
}
export type SubtitleItem = RequestedResource<typeof fetchSubtitleList>["list"][number];

// export const foo = new FakeRequest<
//   FetchParams,
//   void,
//   ListResponse<{
//     id: string;
//     name: string;
//     poster_path: string;
//     season_text: string;
//     episodes: {
//       id: string;
//       episode_text: string;
//       subtitles: {
//         id: string;
//         file_id: string;
//         name: string;
//         language: string;
//       }[];
//     }[];
//   }>
// >({
//   client,
//   payload: {
//     hostname: "",
//     url: "",
//     methods: "GET",
//     // params: {},
//     // body: {},
//   },
// });
// foo.send({ page: 2 });
// foo.cancel();

export function deleteSubtitle(values: { subtitle_id: string }) {
  const { subtitle_id } = values;
  return request.get(`/api/admin/subtitle/${subtitle_id}/delete`);
}

/** 获取同步任务列表 */
export function fetchSyncTaskList(params: FetchParams & { in_production: number; invalid: number; name: string }) {
  return request.get<
    ListResponse<{
      id: string;
      resource_file_id: string;
      resource_file_name: string;
      drive_file_id: string;
      drive_file_name: string;
      url: string;
      invalid: number;
      season: null | {
        id: string;
        tv_id: string;
        name: string;
        overview: string;
        air_date: string;
        poster_path: string;
        cur_episode_count: number;
        episode_count: number;
      };
      drive: {
        id: string;
      };
    }>
  >(`/api/admin/sync_task/list`, params);
}
export type SyncTaskItem = RequestedResource<typeof fetchSyncTaskList>["list"][number];

/** 给指定同步任务覆盖另一个分享资源 */
export function overrideResourceForSyncTask(values: {
  id: string;
  url: string;
  resource_file_id?: string;
  resource_file_name?: string;
}) {
  const { id, url, resource_file_id, resource_file_name } = values;
  return request.post<{}>(`/api/admin/sync_task/${id}/override_resource`, {
    url,
    resource_file_id,
    resource_file_name,
  });
}

/** 获取同步任务列表 */
export function fetchPartialSyncTask(params: { id: string }) {
  return request.get<{
    id: string;
    resource_file_id: string;
    resource_file_name: string;
    drive_file_id: string;
    drive_file_name: string;
    url: string;
    invalid: number;
    season: null | {
      id: string;
      tv_id: string;
      name: string;
      overview: string;
      air_date: string;
      poster_path: string;
      cur_episode_count: number;
      episode_count: number;
    };
    drive: {
      id: string;
    };
  }>(`/api/admin/sync_task/${params.id}/partial`, {});
}

/**
 * 添加分享资源的同步任务
 * @param body
 * @returns
 */
export function createSyncTaskWithUrl(body: {
  url: string;
  resource_file_id?: string;
  resource_file_name?: string;
  drive_file_id?: string;
  drive_file_name?: string;
  drive_id?: string;
}) {
  const { url, resource_file_id, resource_file_name, drive_file_id, drive_file_name, drive_id } = body;
  return request.post<{}>(`/api/admin/sync_task/create`, {
    url,
    resource_file_id,
    resource_file_name,
    drive_file_id,
    drive_file_name,
    drive_id,
  });
}

/** 获取同步任务列表 */
export function updateSyncTask(params: { id: string; season_id: string }) {
  const { id, season_id } = params;
  return request.get<{
    id: string;
    resource_file_id: string;
    resource_file_name: string;
    drive_file_id: string;
    drive_file_name: string;
    url: string;
    season: null | {
      id: string;
      name: string;
      overview: string;
      poster_path: string;
    };
    drive: {
      id: string;
    };
  }>(`/api/admin/sync_task/${id}/update`, { season_id });
}

/**
 * 执行所有电视剧同步任务
 */
export function runSyncTaskList() {
  return request.get<{ job_id: string }>("/api/admin/sync_task/run");
}

/** 标记同步任务已完结 */
export function completeSyncTask(params: { id: string }) {
  const { id } = params;
  return request.get<{}>(`/api/admin/sync_task/${id}/complete`, {});
}

/** 删除同步任务 */
export function deleteSyncTask(params: { id: string }) {
  const { id } = params;
  return request.get<{}>(`/api/admin/sync_task/${id}/delete`, {});
}

export function deleteSourceFile(params: { id: string }) {
  const { id } = params;
  return request.get(`/api/admin/source/${id}/delete`);
}
/** 删除指定云盘下所有解析结果文件 */
export function deleteSourceFiles(params: { drive_id: string; season_id: string }) {
  const { drive_id, season_id } = params;
  return request.get(`/api/admin/source/delete`, { drive_id, season_id });
}

export function fetchCollectionList(params: FetchParams) {
  return request.post<
    ListResponse<{
      id: string;
      title: string;
      desc?: string;
      medias: {
        id: string;
        type: number;
        name: string;
        poster_path: string;
      }[];
    }>
  >("/api/admin/collection/list", params);
}
export type CollectionItem = RequestedResource<typeof fetchCollectionList>["list"][number];

export function createCollection(values: {
  title: string;
  sort: number;
  desc?: string;
  medias: { id: string; tv_id?: string }[];
}) {
  const { title, sort, desc, medias } = values;
  return request.post("/api/admin/collection/create", {
    title,
    desc,
    sort,
    medias,
  });
}
export function fetchCollectionProfile(values: { id: string }) {
  const { id } = values;
  return request.post<{
    id: string;
    title: string;
    desc?: string;
    sort?: number;
    medias: {
      id: string;
      type: number;
      name: string;
      poster_path: string;
    }[];
  }>(`/api/admin/collection/${id}`, {});
}
export function editCollection(values: {
  id: string;
  title: string;
  desc?: string;
  sort?: number;
  medias: { id: string; tv_id?: string }[];
}) {
  const { id, title, desc, sort, medias } = values;
  return request.post(`/api/admin/collection/${id}/edit`, {
    title,
    desc,
    sort,
    medias,
  });
}

export function deleteCollection(values: { id: string }) {
  const { id } = values;
  return request.post(`/api/admin/collection/${id}/delete`, {});
}

export function setParsedTVSeasonProfile(values: { file_id: string; source?: number; unique_id: number | string }) {
  const { file_id, source, unique_id } = values;
  return request.post<{ job_id: string }>(`/api/admin/file/${file_id}/set_season_profile`, {
    source,
    unique_id,
  });
}

export function setFileEpisodeProfile(values: {
  file_id: string;
  source?: number;
  unique_id: number | string;
  season_number: number;
  episode_number: number;
}) {
  const { file_id, source, unique_id, season_number, episode_number } = values;
  return request.post<{ job_id: string }>(`/api/admin/file/${file_id}/set_episode_profile`, {
    source,
    unique_id,
    season_number,
    episode_number,
  });
}

export function setFileMovieProfile(values: { file_id: string; source?: number; unique_id: number | string }) {
  const { file_id, source, unique_id } = values;
  return request.post<{ job_id: string }>(`/api/admin/file/${file_id}/set_movie_profile`, {
    source,
    unique_id,
  });
}

type TVProfileError = {
  id: string;
  name: string | null;
  poster_path: string | null;
  tv_count: number;
  tvs: {
    id: string;
    name: string | null;
    poster_path: string | null;
    season_count: number;
    episode_count: number;
  }[];
};
type EpisodeProfileError = {
  id: string;
  name: string | null;
  poster_path: string | null;
  season_number: number | null;
  episode_number: number | null;
  episode_count: number;
  episodes: {
    id: string;
    tv_id: string;
    name: string | null;
    poster_path: string | null;
    season_id: string;
    season_text: string;
    episode_text: string;
    source_count: number;
  }[];
};
type SeasonProfileError = {
  id: string;
  name: string | null;
  poster_path: string | null;
  season_number: number | null;
  season_count: number;
  seasons: {
    id: string;
    tv_id: string;
    name: string | null;
    poster_path: string | null;
    episode_count: number;
  }[];
};
type MovieProfileError = {
  id: string;
  name: string | null;
  poster_path: string | null;
  movies: {
    id: string;
    name: string | null;
    poster_path: string | null;
    source_count: number;
  }[];
};

type TVError = {
  id: string;
  name: string | null;
  poster_path: string | null;
  texts: string[];
};
type SeasonError = {
  id: string;
  name: string | null;
  poster_path: string | null;
  tv_id: string;
  season_text: string;
  texts: string[];
};
type EpisodeError = {
  id: string;
  name: string | null;
  poster_path: string | null;
  tv_id: string;
  season_id: string;
  season_text: string;
  episode_text: string;
  texts: string[];
};
type MovieError = {
  id: string;
  name: string | null;
  poster_path: string | null;
  texts: string[];
};

export async function fetchInvalidMediaList(params: FetchParams) {
  const r = await request.post<
    ListResponseWithCursor<{
      id: string;
      type: MediaErrorTypes;
      unique_id: string;
      profile: string;
    }>
  >("/api/admin/media_error/list", params);
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const { next_marker, list } = r.data;
  type MediaErrorPayload = MutableRecord<{
    [MediaErrorTypes.TVProfile]: TVProfileError[];
    [MediaErrorTypes.SeasonProfile]: SeasonProfileError[];
    [MediaErrorTypes.EpisodeProfile]: EpisodeProfileError[];
    [MediaErrorTypes.MovieProfile]: MovieProfileError[];
    [MediaErrorTypes.TV]: TVError;
    [MediaErrorTypes.Season]: SeasonError;
    [MediaErrorTypes.Episode]: EpisodeError;
    [MediaErrorTypes.Movie]: MovieError;
  }>;
  return Result.Ok({
    next_marker,
    list: list.map((media) => {
      const { id, type, unique_id, profile } = media;
      const json = JSON.parse(profile);
      const { type: t, data: payload } = (() => {
        if (type === MediaErrorTypes.TVProfile) {
          const data = json as TVProfileError[];
          return {
            type: MediaErrorTypes.TVProfile,
            data,
          } as MediaErrorPayload;
        }
        if (type === MediaErrorTypes.SeasonProfile) {
          const data = json as SeasonProfileError[];
          return {
            type: MediaErrorTypes.Season,
            data,
          };
        }
        if (type === MediaErrorTypes.EpisodeProfile) {
          const data = json as EpisodeProfileError[];
          return {
            type: MediaErrorTypes.EpisodeProfile,
            data,
          } as MediaErrorPayload;
        }
        if (type === MediaErrorTypes.MovieProfile) {
          const data = json as MovieProfileError[];
          return {
            type: MediaErrorTypes.MovieProfile,
            data,
          } as MediaErrorPayload;
        }
        if (type === MediaErrorTypes.TV) {
          const { id, name, poster_path, texts } = json as {
            id: string;
            name: string;
            poster_path: string;
            texts: string[];
          };
          return {
            type: MediaErrorTypes.TV,
            data: {
              id,
              name,
              poster_path,
              texts,
            },
          } as MediaErrorPayload;
        }
        if (type === MediaErrorTypes.Season) {
          const { id, name, poster_path, season_text, tv_id, texts } = json as {
            id: string;
            name: string;
            poster_path: string;
            season_text: string;
            tv_id: string;
            texts: string[];
          };
          return {
            type: MediaErrorTypes.Season,
            data: {
              id,
              name,
              poster_path,
              season_text,
              tv_id,
              texts,
            },
          } as MediaErrorPayload;
        }
        if (type === MediaErrorTypes.Episode) {
          const { id, name, poster_path, season_text, episode_text, season_id, tv_id, texts } = json as {
            id: string;
            name: string;
            poster_path: string;
            season_text: string;
            episode_text: string;
            tv_id: string;
            season_id: string;
            texts: string[];
          };
          return {
            type: MediaErrorTypes.Episode,
            data: {
              id,
              name,
              poster_path,
              season_text,
              episode_text,
              season_id,
              tv_id,
              texts,
            },
          } as MediaErrorPayload;
        }
        if (type === MediaErrorTypes.Movie) {
          const { id, name, poster_path, texts } = json as {
            id: string;
            name: string;
            poster_path: string;
            texts: string[];
          };
          return {
            type: MediaErrorTypes.Movie,
            data: {
              id,
              name,
              poster_path,
              texts,
            },
          } as MediaErrorPayload;
        }
        return {
          type: MediaErrorTypes.Unknown,
          data: null,
        };
      })();
      return {
        id,
        type,
        unique_id,
        data: payload,
      } as { id: string; unique_id: string } & MediaErrorPayload;
    }),
  });
}
export type MediaErrorItem = RequestedResource<typeof fetchInvalidMediaList>["list"][number];

/** 删除剧集详情 */
export function deleteTVProfileInMediaError(values: { id: string; profile_id: string }) {
  return request.post<null | {}>("/api/admin/media_error/tv_profile/delete", values);
}

/** 删除季详情 */
export function deleteSeasonProfileInMediaError(values: { id: string; profile_id: string }) {
  return request.post<null | {}>("/api/admin/media_error/season_profile/delete", values);
}

/** 删除剧集详情 */
export function deleteEpisodeProfileInMediaError(values: { id: string; profile_id: string }) {
  return request.post<null | {}>("/api/admin/media_error/episode_profile/delete", values);
}

/** 删除电影详情 */
export function deleteMovieProfileInMediaError(values: { id: string; profile_id: string }) {
  return request.post<null | {}>("/api/admin/media_error/movie_profile/delete", values);
}
