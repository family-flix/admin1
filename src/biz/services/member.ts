import { media_request } from "@/biz/requests/index";

/**
 * 删除指定成员
 * @returns
 */
export function fetchMemberAccounts(body: { id: string }) {
  const { id } = body;
  return media_request.post<
    {
      provider: string;
      provider_id: string;
      provider_arg1: string;
    }[]
  >("/api/v2/admin/member/delete", { id });
}
