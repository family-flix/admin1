/**
 * @file 用户登录
 */
import { onMount } from "solid-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ViewComponent } from "@/types";
import { InputCore } from "@/domains/ui/input";
import { ButtonCore } from "@/domains/ui/button";

export const LoginPage: ViewComponent = (props) => {
  const { app, router } = props;
  const { user } = app;
  const emailInput = new InputCore({
    placeholder: "请输入邮箱",
    onChange(v) {
      user.inputEmail(v);
    },
  });
  const passwordInput = new InputCore({
    type: "password",
    placeholder: "请输入密码",
    onChange(v) {
      user.inputPassword(v);
    },
  });
  const loginBtn = new ButtonCore({
    async onClick() {
      loginBtn.setLoading(true);
      await user.login();
      loginBtn.setLoading(false);
    },
  });

  return (
    <div class="flex justify-center items-center h-screen">
      <form>
        <div class="p-12 rounded-xl w-[480px] bg-white">
          <h1 class="text-4xl text-center">管理后台登录</h1>
          <div class="mt-16">
            <Input store={emailInput} />
          </div>
          <div class="mt-4">
            <Input store={passwordInput} />
          </div>
          <div class="grid grid-cols-1 mt-4">
            <Button store={loginBtn} class="h-[28px]">
              登录
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
