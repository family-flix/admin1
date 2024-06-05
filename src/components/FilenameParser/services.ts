import { media_request } from "@/biz/requests/index";
import { TmpRequestResp } from "@/domains/request/utils";
import { Unpacked } from "@/types/index";

/**
 * 解析文件名
 */
export function parseVideoFilename(body: { name: string; keys?: string[] }) {
  const { name, keys } = body;
  return media_request.post<{
    name: string;
    original_name: string;
    season: string;
    episode: string;
    episode_name: string;
    resolution: string;
    year: string;
    source: string;
    encode: string;
    type: string;
    voice_encode: string;
    episode_count: string;
    subtitle_lang: string;
  }>("/api/admin/parse", { name, keys });
}
export type ParsedVideoInfo = NonNullable<Unpacked<TmpRequestResp<typeof parseVideoFilename>>>;
export type VideoKeys = keyof ParsedVideoInfo;
