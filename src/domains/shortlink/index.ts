import { FetchParams } from "@/domains/list/typing";
import { request } from "@/utils/request";
import { ListResponse, RequestedResource, Result } from "@/types";

export async function create_link(url: string) {
  const res = await request.post<{
    url: string;
  }>("/api/admin/short_link", {
    url,
  });
  if (res.error) {
    return Result.Err(res.error.message);
  }
  return Result.Ok(res.data.url);
}
