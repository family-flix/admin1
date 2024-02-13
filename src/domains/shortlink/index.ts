import { client } from "@/store/request";
import { Result } from "@/types";

export async function create_link(url: string) {
  const res = await client.post<{
    url: string;
  }>("/api/admin/short_link", {
    url,
  });
  if (res.error) {
    return Result.Err(res.error.message);
  }
  return Result.Ok(res.data.url);
}
