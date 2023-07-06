/**
 * @file 用户注册
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ViewComponent } from "@/types";
import { InputCore } from "@/domains/ui/input";
import { ButtonCore } from "@/domains/ui/button";

export const RegisterPage: ViewComponent = (props) => {
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
  const registerBtn = new ButtonCore({
    async onClick() {
      registerBtn.setLoading(true);
      await user.register();
      registerBtn.setLoading(false);
      app.tip({
        text: ["注册成功"],
      });
    },
  });

  return (
    <div class="flex justify-center items-center h-screen">
      <form>
        <div class="p-12 rounded-xl w-[480px] bg-white">
          <h1 class="text-4xl text-center">管理员注册</h1>
          <div class="mt-16">
            <Input store={emailInput} />
          </div>
          <div class="mt-4">
            <Input store={passwordInput} />
          </div>
          <div class="grid grid-cols-1 mt-4">
            <Button store={registerBtn} size="default">
              注册
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
