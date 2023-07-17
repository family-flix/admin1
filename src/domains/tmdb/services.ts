import { FetchParams } from "@/domains/list/typing";
import { request } from "@/utils/request";
import { ListResponse, RequestedResource } from "@/types";

/**
 * 在 TMDB 搜索影视剧
 * @param params
 * @returns
 */
export async function search_media_in_tmdb(params: FetchParams & { keyword: string; type: "1" | "2" }) {
  const { keyword, page, pageSize, type, ...rest } = params;
  return request.get<
    ListResponse<{
      id: number;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      searched_tv_id: string;
      first_air_date: string;
    }>
  >(`/api/admin/tmdb/search`, {
    ...rest,
    keyword,
    page,
    page_size: pageSize,
    type,
  });
}
export type TheTVInTMDB = RequestedResource<typeof search_media_in_tmdb>["list"][0];
