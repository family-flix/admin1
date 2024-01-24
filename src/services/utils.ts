import { DriveTypes, MediaTypes } from "@/constants";
import { bytes_to_size } from "@/utils";

import { MediaSource, MediaPrepareArchiveItemResp } from "./media";

export function processMediaPrepareArchive(season: MediaPrepareArchiveItemResp) {
  const { id, type, name, poster_path, air_date, episode_count, cur_episode_count, sources: episodes } = season;
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
    const { id, name, order: episode_number, files } = episode;
    const source_group_by_drive_id: Record<string, MediaSource[]> = {};
    for (let i = 0; i < files.length; i += 1) {
      const source = files[i];
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
      ...files.map((source) => {
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
    type,
    name,
    air_date,
    poster_path,
    episode_count,
    cur_episode_count,
    episodes: processed_episodes,
    size_count: source_size_count,
    size_count_text: bytes_to_size(source_size_count),
    drives: Object.values(drive_group),
    /** 需要转存到资源盘 */
    need_to_resource: (() => {
      if (type === MediaTypes.Season && !is_completed) {
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
      if (type === MediaTypes.Season && !is_completed) {
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

