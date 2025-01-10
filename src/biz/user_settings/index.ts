import { base } from "@/domains/base";
import { ButtonCore, FormCore, InputCore } from "@/domains/ui";
import { FormFieldCore } from "@/domains/ui/form/field";
import { ListContainerCore } from "@/domains/ui/form/list";

type UserSettingsCoreProps = {};
export function UserSettingsCore(props: UserSettingsCoreProps) {
  const $tmdb_form = FormCore({
    fields: {
      hostname: new FormFieldCore({
        label: "域名",
        name: "hostname",
        input: new InputCore({ defaultValue: "" }),
      }),
      token: new FormFieldCore({
        label: "token",
        name: "token",
        input: new InputCore({ defaultValue: "" }),
      }),
    },
  });
  const $tmdb_form_btn = new ButtonCore({});
  const $message_push_form = FormCore({
    fields: {
      push_deer_token: new FormFieldCore({
        label: "PushDeer Token",
        name: "push_deer_token",
        input: new InputCore({ defaultValue: "" }),
      }),
      telegram_bot_token: new FormFieldCore({
        label: "Telegram 机器人 token",
        name: "telegram_bot_token",
        input: new InputCore({ defaultValue: "" }),
      }),
      wx_push_token: new FormFieldCore({
        label: "WxPush token",
        name: "wx_push_token",
        input: new InputCore({ defaultValue: "" }),
      }),
      message: new FormFieldCore({
        label: "测试消息",
        name: "message",
        input: new InputCore({ defaultValue: "测试消息推送" }),
      }),
    },
  });
  const $message_push_btn = new ButtonCore({});
  const $filename_parse_rules = FormCore({
    fields: {
      rules: new FormFieldCore({
        label: "文件名解析规则",
        name: "rules",
        input: ListContainerCore({
          defaultValue: [{ text: "", replace: "" }],
          factory() {
            return FormCore({
              fields: {
                text: new FormFieldCore({
                  label: "匹配内容",
                  name: "text",
                  input: new InputCore({ defaultValue: "" }),
                }),
                replace: new FormFieldCore({
                  label: "替换为",
                  name: "replace",
                  input: new InputCore({ defaultValue: "" }),
                }),
              },
            });
          },
        }),
      }),
    },
  });

  const _state = {};

  enum Events {
    Change,
    StateChange,
  }
  type TheTypesOfEvents = {
    [Events.Change]: {};
    [Events.StateChange]: typeof _state;
  };
  const bus = base<TheTypesOfEvents>();

  $tmdb_form_btn.onClick(async () => {
    const r = await $tmdb_form.validate();
    if (r.error) {
      bus.tip({
        text: ["校验失败", r.error.message],
      });
      return;
    }
    const values = r.data;
    console.log(values);
  });
  $message_push_btn.onClick(async () => {
    const r = await $message_push_form.validate();
    if (r.error) {
      bus.tip({
        text: ["校验失败", r.error.message],
      });
      return;
    }
    const values = r.data;
    console.log(values);
  });

  return {
    ui: {
      $message_push_form,
    },
  };
}

export type UserSettingsCore = ReturnType<typeof UserSettingsCore>;
