/**
 * @file 成员管理
 */
import { createSignal, For, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  add_member,
  create_member_auth_link,
  fetch_members,
  MemberItem,
} from "@/services";
import { ViewComponent } from "@/types";
import { cn } from "@/utils";
import { Modal } from "@/components/SingleModal";
import { DialogCore } from "@/domains/ui/dialog";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { InputCore } from "@/domains/ui/input";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";

export const MemberManagePage: ViewComponent = (props) => {
  const { app, router } = props;

  const list = new ListCore<MemberItem>(fetch_members);
  const generateToken = new RequestCore(create_member_auth_link, {
    onFailed(error) {
      app.tip({ text: ["生成 token 失败", error.message] });
    },
    onSuccess() {
      list.refresh();
    },
  });
  const addMember = new RequestCore(add_member, {
    onFailed(error) {
      app.tip({ text: ["新增成员失败", error.message] });
    },
    onSuccess() {
      dialog.hide();
      input1.empty();
      button2.clear();
      list.refresh();
    },
  });
  const dialog = new DialogCore({
    onOk() {
      if (!input1.value) {
        app.tip({ text: ["请先输入成员备注"] });
        return;
      }
      addMember.run({
        remark: input1.value,
      });
    },
  });
  const input1 = new InputCore({
    placeholder: "请输入备注",
  });
  const button1 = new ButtonCore({
    onClick() {
      dialog.show();
    },
  });
  const button2 = new ButtonInListCore<MemberItem>({
    onClick(member) {
      generateToken.run({ id: member.id });
    },
  });
  generateToken.onLoadingChange((loading) => {
    button2.setLoading(loading);
  });

  const [response, setResponse] = createSignal(list.response);
  list.onStateChange((nextState) => {
    setResponse(nextState);
  });

  list.init();

  const dataSource = () => response().dataSource;

  return (
    <>
      <div class="min-h-screen">
        <div class="">
          <h2 class="">成员列表</h2>
          <Button store={button1}>新增成员</Button>
          <view>
            <div class="space-y-4">
              <For each={dataSource()}>
                {(member) => {
                  const { remark, disabled, tokens } = member;
                  return (
                    <div class="card">
                      <div class="flex justify-between">
                        <div>
                          <p class="text-2xl">{remark}</p>
                          {disabled ? "disabled" : "enabled"}
                        </div>
                      </div>
                      <div class="mt-4">
                        <Button variant="subtle" store={button2.bind(member)}>
                          生成授权链接
                        </Button>
                        <Show when={tokens.length !== 0} fallback={null}>
                          <div class="mt-4 space-y-4">
                            <For each={tokens}>
                              {(link) => {
                                const { id, token, used } = link;
                                return (
                                  <div class="space-y-2">
                                    {[
                                      "https://pc-t.funzm.com/home?token=",
                                      "https://h5-t.funzm.com/home?token=",
                                      "http://video.funzm.com/home?token=",
                                      "http://beta.funzm.com/home?token=",
                                    ].map((prefix) => {
                                      const url = `${prefix}${token}`;
                                      return (
                                        <div class="flex items-center">
                                          {used ? null : (
                                            <div class="mr-4"></div>
                                          )}
                                          <div
                                            class={cn(
                                              "w-full text-sm break-all whitespace-pre-wrap",
                                              used ? "line-through" : ""
                                            )}
                                          >
                                            {url}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }}
                            </For>
                          </div>
                        </Show>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </view>
        </div>
      </div>
      <Modal title="新增成员" store={dialog}>
        <Input store={input1} />
      </Modal>
    </>
  );
};
