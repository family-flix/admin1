import { client } from "@/store/request";
import { Result } from "@/types";

/**
 * 用户登录
 * @param body
 * @returns
 */
export async function login(body: { email: string; password: string }) {
  return client.post<{
    id: string;
    username: string;
    // name: string;
    // email: string;
    avatar: string;
    verified: string;
    // created: string;
    token: string;
  }>("/api/admin/user/login", body);
}

/**
 * 用户登录
 * @param body
 * @returns
 */
export async function register(body: { email: string; password: string }) {
  return client.post<{
    id: string;
    username: string;
    // name: string;
    // email: string;
    avatar: string;
    verified: string;
    // created: string;
    token: string;
  }>("/api/admin/user/register", body);
}

export async function logout(body: { email: string; password: string }) {
  return await client.post("/api/admin/user/logout", body);
}

export async function get_token() {
  return await client.post("/api/token", {});
}

/**
 * 获取当前登录用户信息详情
 * @returns
 */
export async function fetch_user_profile() {
  return client.get("/api/admin/user/profile");
}

/**
 * 成员通过授权链接访问首页时，验证该链接是否有效
 */
export async function validate(token: string) {
  const r = await client.post<{ token: string }>("/api/admin/user/validate", { token });
  if (r.error) {
    return Result.Err(r.error);
  }
  return Result.Ok(r.data);
}
