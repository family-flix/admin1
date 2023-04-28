/**
 * @file 用户登录
 */
// import { useRouter } from "next/router";
import { onMount } from "solid-js";

import { Application } from "@/domains/app";
import { ViewCore } from "@/domains/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const LoginPage = (props: { app: Application; router: ViewCore }) => {
  const { app, router } = props;
  const { user } = app;
  // const router = useRouter();

  onMount(() => {
    user.onError((error) => {
      alert(error.message);
    });
    user.onLogin(() => {
      router.push("/");
    });
  });

  return (
    <div class="flex justify-center items-center h-screen">
      <form>
        <div class="space-y-4 p-12 rounded-xl w-[480px] bg-white">
          <h1 class="text-3xl text-center">管理后台登录</h1>
          <div class="mt-8">
            <Input
              placeholder="请输入邮箱"
              onChange={(event) => {
                user.inputEmail(event.target.value);
              }}
            />
          </div>
          <div>
            <Input
              placeholder="请输入密码"
              type="password"
              onChange={(event) => {
                user.inputPassword(event.target.value);
              }}
            />
          </div>
          <div class="grid grid-cols-1">
            <Button
              className="block"
              onClick={() => {
                user.login();
              }}
            >
              登录
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
