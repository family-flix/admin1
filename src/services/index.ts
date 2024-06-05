/**
 *
 */
import dayjs from "dayjs";

import { media_request } from "@/biz/requests/index";
import { FetchParams } from "@/domains/list/typing";
import { Result } from "@/domains/result/index";
import { TmpRequestResp } from "@/domains/request/utils";
import { DriveTypes, MediaErrorTypes, MediaTypes, ReportTypeTexts, ReportTypes } from "@/constants/index";
import { ListResponse, ListResponseWithCursor, MutableRecord, RequestedResource, Unpacked } from "@/types/index";
import { bytes_to_size, query_stringify } from "@/utils/index";

/**
 * 获取电视剧列表
 */
export function fetch_tv_list(params: FetchParams & { name: string }) {
  const { page, pageSize, ...rest } = params;
  return media_request.get<
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
}
export type TVItem = NonNullable<Unpacked<TmpRequestResp<typeof fetch_tv_list>>>["list"][number];

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

/** 刷新电视剧详情 */
export function refreshSeasonProfile(body: { season_id: string }) {
  const { season_id } = body;
  return media_request.post<{ job_id: string }>(`/api/admin/season/${season_id}/refresh_profile`, {});
}
/** 改变电视剧详情 */
export function changeSeasonProfile(body: { season_id: string; unique_id?: number }) {
  const { season_id, unique_id } = body;
  return media_request.post<{ job_id: string }>(`/api/admin/season/${season_id}/set_profile`, {
    unique_id,
  });
}
/** 手动修改电视剧详情 */
export function updateSeasonProfileManually(body: { season_id: string; title?: string; episode_count?: number }) {
  const { season_id, title, episode_count } = body;
  return media_request.post<void>(`/api/admin/season/${season_id}/update`, { name: title, episode_count });
}
/** 删除指定电视剧季 */
export function deleteSeason(body: { season_id: string }) {
  const { season_id } = body;
  return media_request.get<void>(`/api/admin/season/${season_id}/delete`);
}

/**
 * 获取电影列表
 */
export function fetchMovieList(params: FetchParams & { name: string; duplicated: number }) {
  const { page, pageSize, ...rest } = params;
  return media_request.get<
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
}
export type MovieItem = RequestedResource<typeof fetchMoveListProcess>["list"][number];
export function fetchMoveListProcess(r: TmpRequestResp<typeof fetchMovieList>) {
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((movie) => {
      const { persons = [], ...rest } = movie;
      return {
        ...rest,
        persons: persons.slice(0, 5),
        // updated: dayjs(updated).format("YYYY/MM/DD HH:mm"),
      };
    }),
  });
}

/** 删除指定未识别电视剧 */
export function deleteUnknownTV(values: { parsed_tv_id: string }) {
  const { parsed_tv_id } = values;
  return media_request.get(`/api/admin/unknown_tv/${parsed_tv_id}/delete`);
}

export function delete_unknown_episode(body: { id: string }) {
  const { id } = body;
  return media_request.get(`/api/admin/unknown_episode/delete/${id}`, undefined);
}

/**
 * 获取成员列表
 * @param params
 * @returns
 */
export function fetchMemberList(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      remark: string;
      email: string | null;
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
  >("/api/v2/admin/member/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
}
export type MemberItem = NonNullable<Unpacked<TmpRequestResp<typeof fetchMemberList>>>["list"][number];

/**
 * 添加成员
 * @param body
 * @returns
 */
export function createMember(body: { remark: string }) {
  return media_request.post<{ id: string; account: { id: string; pwd: string } }>("/api/v2/admin/member/add", body);
}

/**
 * 生成成员授权链接
 * @param body
 * @returns
 */
export function createMemberAuthToken(body: { id: string }) {
  return media_request.post<{ id: string }>("/api/v2/admin/member/add_token", body);
}
/**
 * 更新所有电视剧详情
 */
export function refreshSeasonProfiles() {
  return media_request.get<{ job_id: string }>("/api/admin/season/refresh_profile");
}

/**
 * 更新所有电影详情
 */
export function refreshMovieProfiles() {
  return media_request.get<{ job_id: string }>("/api/admin/movie/refresh_profile");
}

/**
 * 转存指定季到指定云盘
 */
export function transferSeasonToAnotherDrive(body: { season_id: string; target_drive_id: string }) {
  const { season_id, target_drive_id } = body;
  return media_request.post<{ job_id: string }>(`/api/admin/season/${season_id}/transfer`, {
    target_drive_id,
  });
}

/**
 * 转存指定电影到指定云盘
 */
export function transferMovieToAnotherDrive(body: { movie_id: string; target_drive_id: string }) {
  const { movie_id, target_drive_id } = body;
  return media_request.post<{ job_id: string }>(`/api/admin/movie/${movie_id}/transfer`, {
    target_drive_id,
  });
}

/**
 * 移动指定电视剧到资源盘
 */
export function moveSeasonToResourceDrive(body: { season_id: string }) {
  const { season_id } = body;
  return media_request.post<{ job_id: string }>(`/api/admin/season/${season_id}/to_resource_drive`, {});
}

/**
 * 移动指定电影到资源盘
 */
export function moveMovieToResourceDrive(body: { movie_id: string }) {
  const { movie_id } = body;
  return media_request.post<{ job_id: string }>(`/api/admin/movie/${movie_id}/to_resource_drive`, {});
}

/**
 * 删除指定成员
 * @returns
 */
export function deleteMember(body: { id: string }) {
  const { id } = body;
  return media_request.post("/api/v2/admin/member/delete", { id });
}

export function updateMemberPermission(values: { member_id: string; permissions: string[] }) {
  const { member_id, permissions } = values;
  return media_request.post(`/api/v2/admin/member/update_permission`, {
    member_id,
    permissions,
  });
}

/**
 * 是否已经有管理员
 */
export function hasAdmin() {
  return media_request.get<{ existing: boolean }>("/api/admin/user/existing");
}

export function fetchSeasonProfile(body: { season_id: string }) {
  const { season_id } = body;
  return media_request.get<{
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
}
export type TVProfile = RequestedResource<typeof fetchSeasonProfileProcess>;
export type SeasonInTVProfile = RequestedResource<typeof fetchSeasonProfileProcess>["seasons"][number];
export function fetchSeasonProfileProcess(r: TmpRequestResp<typeof fetchSeasonProfile>) {
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

export function fetchReportList(params: FetchParams) {
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      type: ReportTypes;
      member: {
        id: string;
        name: string;
      };
      data: string;
      answer: string;
      media?: {
        id: string;
        type: MediaTypes;
        name: string;
        poster_path: string;
      };
      media_source?: {
        id: string;
        name: string;
        order: number;
      };
      created: string;
    }>
  >("/api/v2/admin/report/list", params);
}
export type ReportItem = RequestedResource<typeof fetchReportListProcess>["list"][number];
export function fetchReportListProcess(r: TmpRequestResp<typeof fetchReportList>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { list, ...rest } = r.data;
  return Result.Ok({
    ...rest,
    list: list.map((report) => {
      const { id, type, answer, data, created, media, media_source, member } = report;
      return {
        id,
        type,
        typeText: ReportTypeTexts[type],
        answer,
        member,
        data,
        media,
        media_source,
        created: dayjs(created).format("YYYY-MM-DD HH:mm:ss"),
      };
    }),
  });
}

export function fetch_shared_files_histories(body: FetchParams) {
  return media_request.get<
    ListResponse<{
      id: string;
      url: string;
      title: string;
      created: string;
    }>
  >("/api/admin/shared_file/list", body);
}
export type SharedFileHistoryItem = NonNullable<
  Unpacked<TmpRequestResp<typeof fetch_shared_files_histories>>
>["list"][0];

export function fetch_shared_files_transfer_list(body: FetchParams) {
  return media_request.get<
    ListResponse<{
      id: string;
      url: string;
      name: string;
      created: string;
    }>
  >("/api/admin/shared_file_save/list", body);
}
export type SharedFileTransferItem = RequestedResource<typeof fetchSharedFilesTransferListProcess>["list"][0];
export function fetchSharedFilesTransferListProcess(r: TmpRequestResp<typeof fetch_shared_files_transfer_list>) {
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

export function upload_file(body: FormData) {
  return media_request.post("/api/admin/upload", body);
}

export function notify_test(values: { text: string; token: string }) {
  const { text, token } = values;
  return media_request.post(`/api/admin/notify/test`, { text, token });
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
  /** 开放注册 */
  can_register?: boolean;
  /** 无需邀请码 */
  no_need_invitation_code?: boolean;
};

/**
 * 获取用户配置
 */
export function fetchSettings() {
  return media_request.post<UserSettings>("/api/v2/admin/settings/profile", {});
}

/**
 * 更新用户配置
 */
export function updateSettings(values: Partial<UserSettings>) {
  const {
    push_deer_token,
    extra_filename_rules,
    ignore_files_when_sync,
    max_size_when_sync,
    can_register,
    no_need_invitation_code,
  } = values;
  return media_request.post("/api/v2/admin/settings/update", {
    push_deer_token,
    extra_filename_rules,
    ignore_files_when_sync,
    max_size_when_sync,
    can_register,
    no_need_invitation_code,
  });
}

export function pushMessageToMembers(values: { content: string }) {
  return media_request.post("/api/admin/notify", values);
}

type AnswerPayload = Partial<{
  content: string;
  media_id: string;
}>;
export function replyReport(
  values: {
    report_id: string;
  } & AnswerPayload
) {
  const { report_id, content, media_id } = values;
  return media_request.post(`/api/v2/admin/report/reply`, {
    id: report_id,
    content,
    media_id,
  });
}

/**
 * 获取权限列表
 */
export function fetchPermissionList(params: FetchParams) {
  const { pageSize, ...restParams } = params;
  return media_request.post<
    ListResponse<{
      code: string;
      desc: string;
    }>
  >("/api/admin/permission/list", {
    page_size: pageSize,
    ...restParams,
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
  return media_request.post("/api/admin/permission/add", body);
}

/**
 * 校验字幕文件名是否合法
 */
export function validateSubtitleFiles(values: { filenames: string[] }) {
  const { filenames } = values;
  return media_request.post<
    {
      filename: string;
      season_text: string;
      episode_text: string;
      language: string;
    }[]
  >("/api/v2/admin/subtitle/parse", {
    filenames,
  });
}

export function batchUploadSubtitles(values: {
  media_id: string;
  type: MediaTypes;
  files: {
    filename: string;
    episode_id?: string;
    language: string;
    file: File;
  }[];
}) {
  const { media_id, type, files } = values;
  const body = new FormData();
  body.append("media_id", media_id);
  body.append("type", String(type));
  for (const data of files) {
    const { file, filename, language } = data;
    body.append("files", file);
    const payload: { filename: string; language: string; episode_id?: string } = {
      filename,
      language,
    };
    if (type === MediaTypes.Season && data.episode_id) {
      payload.episode_id = data.episode_id;
    }
    body.append("payloads", JSON.stringify(payload));
  }
  return media_request.post<{ job_id: string }>("/api/v2/admin/subtitle/batch_create", body);
}

export function fetchSubtitleList(params: FetchParams) {
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      type: MediaTypes;
      name: string;
      poster_path: string;
      sources: {
        id: string;
        name: string;
        order: number;
        subtitles: {
          id: string;
          type: number;
          unique_id: string;
          language: string;
        }[];
      }[];
    }>
  >("/api/v2/admin/subtitle/list", params);
}
export type SubtitleItem = NonNullable<Unpacked<TmpRequestResp<typeof fetchSubtitleList>>>["list"][number];

export function deleteSubtitle(values: { subtitle_id: string }) {
  const { subtitle_id } = values;
  return media_request.post("/api/v2/admin/subtitle/delete", {
    subtitle_id,
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
  return media_request.post<{ job_id: string }>(`/api/admin/file/${file_id}/set_episode_profile`, {
    source,
    unique_id,
    season_number,
    episode_number,
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

export function fetchInvalidMediaList(params: FetchParams) {
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      type: MediaErrorTypes;
      unique_id: string;
      profile: string;
    }>
  >("/api/admin/media_error/list", params);
}
export type MediaErrorItem = RequestedResource<typeof fetchInvalidMediaListProcess>["list"][number];
export function fetchInvalidMediaListProcess(r: TmpRequestResp<typeof fetchInvalidMediaList>) {
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
      };
    }),
  });
}

/** 删除季详情 */
export function deleteSeasonProfileInMediaError(values: { id: string; profile_id: string }) {
  return media_request.post<null | {}>("/api/admin/media_error/season_profile/delete", values);
}

/** 删除剧集详情 */
export function deleteEpisodeProfileInMediaError(values: { id: string; profile_id: string }) {
  return media_request.post<null | {}>("/api/admin/media_error/episode_profile/delete", values);
}

/** 删除电影详情 */
export function deleteMovieProfileInMediaError(values: { id: string; profile_id: string }) {
  return media_request.post<null | {}>("/api/admin/media_error/movie_profile/delete", values);
}

/** 获取播放记录列表 */
export function fetchMemberHistoryList(values: { member_id: string }) {
  return media_request.post<
    ListResponseWithCursor<{
      id: string;
      current_time: number;
      duration: number;
      name: string;
      poster_path: string;
      type: number;
      source: string;
      updated: string;
    }>
  >("/api/v2/admin/member/histories", values);
}
