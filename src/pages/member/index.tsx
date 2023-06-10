/**
 * @file 成员管理
 */
import { createSignal, For, Show } from "solid-js";
import {
  Edit2,
  Gem,
  Instagram,
  QrCode as QrCodeIcon,
  RotateCcw,
  ShieldAlert,
  ShieldClose,
  UserPlus,
  UserX,
} from "lucide-solid";

import { add_member, create_member_auth_link, delete_member, fetch_members, MemberItem } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { DialogCore } from "@/domains/ui/dialog";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { InputCore } from "@/domains/ui/input";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { ViewComponent } from "@/types";
import { cn } from "@/utils";
import { Popover } from "@/components/ui/popover";
import { Qrcode } from "@/components/Qrcode";
import { SelectionCore } from "@/domains/cur";

export const MemberManagePage: ViewComponent = (props) => {
  const { app, router } = props;

  const list = new ListCore(new RequestCore(fetch_members), {
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
    },
  });
  const memberSelect = new SelectionCore<MemberItem>();
  const generateToken = new RequestCore(create_member_auth_link, {
    onLoading(loading) {
      generateTokenBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["生成 token 失败", error.message] });
    },
    onSuccess() {
      list.refresh();
    },
  });
  const addMember = new RequestCore(add_member, {
    onLoading(loading) {
      addMemberDialog.okBtn.setLoading(loading);
      addMemberDialog.cancelBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["新增成员失败", error.message] });
    },
    onSuccess() {
      addMemberDialog.hide();
      input1.clear();
      generateTokenBtn.clear();
      list.refresh();
    },
  });
  const addMemberDialog = new DialogCore({
    title: "新增成员",
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
      addMemberDialog.show();
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });
  const profileBtn = new ButtonInListCore<MemberItem>({
    onClick(member) {
      app.tip({ text: ["敬请期待"] });
    },
  });
  const generateTokenBtn = new ButtonInListCore<MemberItem>({
    onClick(member) {
      if (member === null) {
        app.tip({ text: ["请先选择生成链接的成员"] });
        return;
      }
      generateToken.run({ id: member.id });
    },
  });
  const banMemberBtn = new ButtonInListCore<MemberItem>({
    onClick(member) {
      app.tip({ text: ["敬请期待"] });
    },
  });
  const updateMemberBtn = new ButtonInListCore<MemberItem>({
    onClick(member) {
      app.tip({ text: ["敬请期待"] });
    },
  });
  const deleteMemberBtn = new ButtonInListCore<MemberItem>({
    onClick(member) {
      console.log("[]click", member);
      if (member === null) {
        return;
      }
      memberSelect.select(member);
      confirmDeleteMemberDialog.setTitle(`删除成员 '${member.remark}'`);
      confirmDeleteMemberDialog.show();
    },
  });
  const deleteMember = new RequestCore(delete_member, {
    onLoading(loading) {
      confirmDeleteMemberDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["删除成员成功"] });
      confirmDeleteMemberDialog.hide();
      list.refresh();
    },
    onFailed(error) {
      app.tip({ text: ["删除成员失败", error.message] });
    },
  });
  const confirmDeleteMemberDialog = new DialogCore({
    title: "删除成员",
    onOk() {
      const selectedMember = memberSelect.value;
      if (selectedMember === null) {
        app.tip({ text: ["请先选择要删除的成员"] });
        return;
      }
      deleteMember.run({ id: selectedMember.id });
    },
    onCancel() {
      confirmDeleteMemberDialog.hide();
    },
  });

  const [response, setResponse] = createSignal(list.response);
  list.onStateChange((nextState) => {
    // console.log("list ", nextState);
    setResponse(nextState);
  });

  list.init();

  const dataSource = () => response().dataSource;
  const empty = () => response().empty;
  const noMore = () => response().noMore;

  return (
    <>
      <div class="min-h-full">
        <h1 class="text-2xl">成员列表</h1>
        <div class="mt-8">
          <div class="space-x-2">
            <Button icon={<RotateCcw class="w-4 h-4" />} store={refreshBtn}>
              刷新
            </Button>
            <Button store={button1} icon={<UserPlus class="w-4 h-4" />}>
              新增成员
            </Button>
          </div>
          <Show when={!empty()}>
            <div class="space-y-8 mt-8">
              <For each={dataSource()}>
                {(member) => {
                  const { remark, tokens } = member;
                  return (
                    <div class="card">
                      <div class="flex items-center">
                        <div class="flex items-center justify-center w-12 h-12 bg-slate-300 rounded-full mr-2">
                          <div class="text-3xl text-slate-500">{remark.slice(0, 1).toUpperCase()}</div>
                        </div>
                        <div>
                          <p class="text-2xl">{remark}</p>
                        </div>
                      </div>
                      <div class="mt-4">
                        <div class="space-x-2">
                          <Button variant="subtle" icon={<Gem class="w-4 h-4" />} store={profileBtn.bind(member)}>
                            详情
                          </Button>
                          {/* <Button
                            variant="subtle"
                            icon={<ShieldAlert class="w-4 h-4" />}
                            store={generateTokenBtn.bind(member)}
                          >
                            生成授权链接
                          </Button> */}
                          <Button
                            variant="subtle"
                            icon={<ShieldClose class="w-4 h-4" />}
                            store={banMemberBtn.bind(member)}
                          >
                            禁用该成员
                          </Button>
                          <Button
                            variant="subtle"
                            icon={<Edit2 class="w-4 h-4" />}
                            store={updateMemberBtn.bind(member)}
                          >
                            修改信息
                          </Button>
                          <Button
                            variant="subtle"
                            icon={<UserX class="w-4 h-4" />}
                            store={deleteMemberBtn.bind(member)}
                          >
                            删除
                          </Button>
                        </div>
                        <Show when={tokens.length !== 0} fallback={null}>
                          <div class="mt-4 space-y-8">
                            <For each={tokens}>
                              {(link) => {
                                const { id, used } = link;
                                return (
                                  <div class="space-y-2">
                                    {[
                                      {
                                        prefix: "/pc/home/index?token=",
                                        qrcode: false,
                                      },
                                      {
                                        prefix: "/mobile/home/index?token=",
                                        qrcode: true,
                                      },
                                    ].map((config) => {
                                      const { prefix, qrcode } = config;
                                      const url = `${router.origin}${prefix}${id}`;
                                      return (
                                        <div class="flex">
                                          <Show when={qrcode}>
                                            <Qrcode class="w-[120px] h-[120px] mr-4" text={url} />
                                          </Show>
                                          <div
                                            class={cn(
                                              "text-lg text-slate-700 break-all whitespace-pre-wrap",
                                              used ? "line-through" : ""
                                            )}
                                          >
                                            <a href={url} target="_blank">
                                              {url}
                                            </a>
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
            <Show when={!noMore()}>
              <div
                class="mt-4 text-center text-slate-500 cursor-pointer"
                onClick={() => {
                  list.loadMore();
                }}
              >
                加载更多
              </div>
            </Show>
          </Show>
        </div>
      </div>
      <Dialog title="新增成员" store={addMemberDialog}>
        <Input store={input1} />
      </Dialog>
      <Dialog title="删除成员" store={confirmDeleteMemberDialog}>
        <div>确认删除该成员吗？</div>
      </Dialog>
    </>
  );
};
