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
  const input1 = new InputCore({
    placeholder: "请输入邮箱",
  });
  const input2 = new InputCore({
    type: "password",
    placeholder: "请输入密码",
  });
  const btn = new ButtonCore({
    onClick() {
      user.login();
    },
  });

  input1.onChange((value) => {
    user.inputEmail(value);
  });
  input2.onChange((value) => {
    user.inputPassword(value);
  });

  return (
    <div class="flex justify-center items-center h-screen">
      <form>
        <div class="space-y-4 p-12 rounded-xl w-[480px] bg-white">
          <h1 class="text-3xl text-center">管理后台登录</h1>
          <div class="mt-8">
            <Input store={input1} />
          </div>
          <div>
            <Input store={input2} />
          </div>
          <div class="grid grid-cols-1">
            <Button store={btn} class="block">
              登录
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
