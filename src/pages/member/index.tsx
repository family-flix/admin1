/**
 * @file 成员管理
 */
import { createSignal, For, Show } from "solid-js";
import { Check, Edit2, Gem, Lock, RotateCcw, Search, ShieldClose, UserPlus, UserX } from "lucide-solid";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import {
  createMember,
  createMemberAuthToken,
  deleteMember,
  fetchMemberHistoryList,
  fetchMemberHistoryListProcess,
  fetchMemberList,
  fetchPermissionList,
  MemberItem,
  updateMemberPermission,
} from "@/biz/services/index";
import { create_link } from "@/biz/shortlink";
import { Button, Dialog, Input, ListView, Skeleton, ScrollView, Checkbox, CheckboxGroup } from "@/components/ui";
import { SeasonSelect, TVSeasonSelectCore } from "@/components/SeasonSelect";
import { Qrcode } from "@/components/Qrcode";
import {
  DialogCore,
  InputCore,
  ButtonCore,
  ButtonInListCore,
  ScrollViewCore,
  CheckboxGroupCore,
} from "@/domains/ui/index";
import { ListCore } from "@/domains/list/index";
import { RequestCore } from "@/domains/request/index";
import { RefCore } from "@/domains/cur/index";
import { MultipleSelectionCore } from "@/domains/multiple/index";
import { cn } from "@/utils/index";

function Page(props: ViewComponentProps) {
  const { app, client, storage, history } = props;

  const $memberList = new ListCore(new RequestCore(fetchMemberList), {
    onLoadingChange(loading) {
      $refreshBtn.setLoading(loading);
    },
  });
  // const memberAccountsRequest = new RequestCore(fetchMemberAccounts, {
  //   defaultResponse: {},
  //   client,
  // });
  const memberPermissionUpdateRequest = new RequestCore(updateMemberPermission, {
    onLoading(loading) {
      $permissionDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["权限更新成功"],
      });
      $permissionDialog.hide();
      $permissionMultipleSelect.clear();
    },
    onFailed(error) {
      app.tip({
        text: ["权限更新失败", error.message],
      });
    },
    onCompleted() {
      $permissionMultipleSelect.clear();
    },
  });
  const memberSelect = new RefCore<MemberItem>();
  const generateToken = new RequestCore(createMemberAuthToken, {
    onLoading(loading) {
      generateTokenBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["生成 token 失败", error.message] });
    },
    onSuccess() {
      $memberList.refresh();
    },
  });
  const addMemberRequest = new RequestCore(createMember, {
    onLoading(loading) {
      $addMemberDialog.okBtn.setLoading(loading);
      $addMemberDialog.cancelBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["新增成员失败", error.message] });
    },
    onSuccess(r) {
      $addMemberDialog.hide();
      $remarkInput.clear();
      $memberList.refresh();
      //       $memberAccountsDialog.show();
      //       const text = `${history.$router.origin}/mobile/home/index

      // 邮箱
      // ${r.account.id}

      // 密码
      // ${r.account.pwd}
      // `;
      // setText();
    },
  });
  const $historyList = new ListCore(
    new RequestCore(fetchMemberHistoryList, { process: fetchMemberHistoryListProcess })
  );
  const memberRef = new RefCore<MemberItem>();
  const $addMemberDialog = new DialogCore({
    title: "新增成员",
    onOk() {
      if (!$remarkInput.value) {
        app.tip({ text: ["请先输入成员备注"] });
        return;
      }
      addMemberRequest.run({
        remark: $remarkInput.value,
      });
    },
  });
  const $remarkInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入备注",
    onEnter() {
      $addMemberDialog.okBtn.click();
    },
  });
  const $permissionBtn = new ButtonCore({
    onClick() {
      history.push("root.home_layout.permission");
      // app.showView(homePermissionListPage);
    },
  });
  const $addMemberBtn = new ButtonCore({
    onClick() {
      $addMemberDialog.show();
    },
  });
  const $refreshBtn = new ButtonCore({
    onClick() {
      $memberList.refresh();
    },
  });
  const $nameInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入名称或邮箱搜索",
    onEnter() {
      $searchBtn.click();
    },
  });
  const $searchBtn = new ButtonCore({
    onClick() {
      $memberList.search({ name: $nameInput.value });
    },
  });
  const $resetBtn = new ButtonCore({
    onClick() {
      $memberList.reset();
      $nameInput.clear();
    },
  });
  const $profile = new ButtonInListCore<MemberItem>({
    onClick(member) {
      $historyList.init({ member_id: member.id });
      $historyDialog.show();
    },
  });
  // const $account = new ButtonInListCore<MemberItem>({
  //   onClick(member) {
  //     memberAccountsRequest.run({ id: member.id });
  //     $memberAccountsDialog.show();
  //   },
  // });
  const $link = new ButtonInListCore<MemberItem>({
    onClick(member) {
      memberRef.select(member);
      $seasonSelect.dialog.show();
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
  const $ban = new ButtonInListCore<MemberItem>({
    onClick(member) {
      app.tip({ text: ["敬请期待"] });
    },
  });
  const $update = new ButtonInListCore<MemberItem>({
    onClick(member) {
      memberRef.select(member);
      $permissionList.init();
      $permissionDialog.show();
    },
  });
  const $delete = new ButtonInListCore<MemberItem>({
    onClick(member) {
      console.log("[]click", member);
      if (member === null) {
        return;
      }
      memberSelect.select(member);
      $confirmDeleteMemberDialog.setTitle(`删除成员 '${member.remark}'`);
      $confirmDeleteMemberDialog.show();
    },
  });
  const deleteMemberRequest = new RequestCore(deleteMember, {
    onLoading(loading) {
      $confirmDeleteMemberDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["删除成员成功"] });
      $confirmDeleteMemberDialog.hide();
      $memberList.refresh();
    },
    onFailed(error) {
      app.tip({ text: ["删除成员失败", error.message] });
    },
  });
  const $memberAccountsDialog = new DialogCore({
    title: "账号",
    footer: false,
    onOk() {
      const selectedMember = memberSelect.value;
      if (selectedMember === null) {
        app.tip({ text: ["请先选择要删除的成员"] });
        return;
      }
      deleteMemberRequest.run({ id: selectedMember.id });
    },
    onCancel() {
      $confirmDeleteMemberDialog.hide();
    },
  });
  const $confirmDeleteMemberDialog = new DialogCore({
    title: "删除成员",
    onOk() {
      const selectedMember = memberSelect.value;
      if (selectedMember === null) {
        app.tip({ text: ["请先选择要删除的成员"] });
        return;
      }
      deleteMemberRequest.run({ id: selectedMember.id });
    },
    onCancel() {
      $confirmDeleteMemberDialog.hide();
    },
  });
  const $seasonSelect = new TVSeasonSelectCore({
    async onOk() {
      const member = memberRef.value;
      if (!member) {
        return;
      }
      if (!$seasonSelect.value) {
        return;
      }
      const { tokens } = member;
      const token = tokens[0];
      if (!token) {
        return;
      }
      const { name, id } = $seasonSelect.value;
      const originalURL = `${window.location.origin}/mobile/tv_play?id=${id}&season_id=${id}&rate=1.5&hide_menu=1&token=${token.id}`;
      const shotURLRes = await create_link(originalURL);
      if (shotURLRes.error) {
        return;
      }
      const url = shotURLRes.data;
      const message = `➤➤➤ ${name}
${url}`;
      app.copy(message);
      app.tip({
        text: ["已复制到剪贴板"],
      });
      $seasonSelect.dialog.hide();
    },
  });
  const $scroll = new ScrollViewCore({
    async onReachBottom() {
      await $memberList.loadMore();
      $scroll.finishLoadingMore();
    },
  });
  const $permissionList = new ListCore(new RequestCore(fetchPermissionList));
  const $permissionDialog = new DialogCore({
    title: "权限配置",
    onOk() {
      if (!memberRef.value) {
        app.tip({
          text: ["请先选择成员"],
        });
        return;
      }
      memberPermissionUpdateRequest.run({
        member_id: memberRef.value.id,
        permissions: $permissionMultipleSelect.values.map((p) => p.code),
      });
    },
  });
  const $permissionMultipleSelect = new MultipleSelectionCore<{ code: string }>({});
  const $historyDialog = new DialogCore({
    title: "播放历史",
    footer: false,
  });

  return {
    $memberList,
    $permissionList,
    $permissionMultipleSelect,
    $historyList,
    ui: {
      $scroll,
      $refreshBtn,
      $addMemberBtn,
      $permissionBtn,
      $nameInput,
      $searchBtn,
      $resetBtn,
      $profile,
      $link,
      $update,
      $ban,
      $delete,
      $seasonSelect,
      $memberAccountsDialog,
      $permissionDialog,
      $addMemberDialog,
      $remarkInput,
      $confirmDeleteMemberDialog,
      $historyDialog,
    },
  };
}

export const HomeMemberListPage: ViewComponent = (props) => {
  const { app, history, client, view } = props;

  const $page = Page(props);

  const [response, setResponse] = createSignal($page.$memberList.response);
  const [historyResponse, setHistoryResponse] = createSignal($page.$historyList.response);
  const [permissionResponse, setPermissionResponse] = createSignal($page.$permissionList.response);
  const [selectedPermissions, setSelectedPermissions] = createSignal($page.$permissionMultipleSelect.values);
  // const [memberAccounts, setMemberAccounts] = createSignal(memberAccountsRequest.response);
  const [text, setText] = createSignal("");

  $page.$permissionList.onStateChange((v) => setPermissionResponse(v));
  $page.$memberList.onStateChange((v) => setResponse(v));
  $page.$historyList.onStateChange((v) => setHistoryResponse(v));
  $page.$permissionMultipleSelect.onStateChange((v) => setSelectedPermissions(v));
  $page.$memberList.init();

  return (
    <>
      <ScrollView store={$page.ui.$scroll} class="h-screen p-8">
        <h1 class="text-2xl">成员列表({response().total})</h1>
        <div class="mt-8">
          <div class="flex items-center space-x-2">
            <Button icon={<RotateCcw class="w-4 h-4" />} store={$page.ui.$refreshBtn}>
              刷新
            </Button>
            <Button class="" store={$page.ui.$resetBtn}>
              重置
            </Button>
            <Button store={$page.ui.$addMemberBtn} icon={<UserPlus class="w-4 h-4" />}>
              新增成员
            </Button>
            <Button store={$page.ui.$permissionBtn} icon={<Lock class="w-4 h-4" />}>
              权限
            </Button>
          </div>
          <div class="flex items-center space-x-2 mt-4">
            <Input class="" store={$page.ui.$nameInput} />
            <Button class="" icon={<Search class="w-4 h-4" />} store={$page.ui.$searchBtn}>
              搜索
            </Button>
          </div>
          <div class="mt-4">
            <ListView
              store={$page.$memberList}
              skeleton={
                <div class="space-y-8">
                  <div class="card rounded-sm bg-white p-4">
                    <div class="flex items-center">
                      <Skeleton class="w-12 h-12 rounded-full mr-2"></Skeleton>
                      <Skeleton class="w-36 h-8"></Skeleton>
                    </div>
                    <div class="mt-4">
                      <div class="flex space-x-2">
                        <Skeleton class="w-24 h-10"></Skeleton>
                        <Skeleton class="w-24 h-10"></Skeleton>
                        <Skeleton class="w-24 h-10"></Skeleton>
                      </div>
                      <div class="mt-4 space-y-8">
                        <div class="space-y-2">
                          <Skeleton class="w-[480px] h-6 mr-4"></Skeleton>
                          <div class="flex">
                            <Skeleton class="w-[120px] h-[120px] mr-4"></Skeleton>
                            <Skeleton class="w-[360px] h-6 mr-4"></Skeleton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <div class="space-y-8">
                <For each={response().dataSource}>
                  {(member) => {
                    const { inviter, remark, email, tokens } = member;
                    return (
                      <div class="card rounded-sm bg-white p-4">
                        <div class="flex items-center">
                          <div class="flex items-center justify-center w-12 h-12 bg-slate-300 rounded-full mr-2">
                            <div class="text-3xl text-slate-500">{remark.slice(0, 1).toUpperCase()}</div>
                          </div>
                          <div>
                            <div class="flex text-2xl">
                              <Show when={inviter}>
                                <div class="flex items-center text-gray-600">
                                  <div>{inviter?.remark}</div>
                                  <div class="mx-2">/</div>
                                </div>
                              </Show>
                              <p class="">{remark}</p>
                            </div>
                            <Show when={email}>{email}</Show>
                          </div>
                        </div>
                        <div class="mt-4">
                          <div class="space-x-2">
                            <Button
                              variant="subtle"
                              icon={<Gem class="w-4 h-4" />}
                              store={$page.ui.$profile.bind(member)}
                            >
                              详情
                            </Button>
                            {/* <Button
                              variant="subtle"
                              icon={<Gem class="w-4 h-4" />}
                              store={$page.ui.$account.bind(member)}
                            >
                              账号
                            </Button> */}
                            {/* <Button
                            variant="subtle"
                            icon={<ShieldAlert class="w-4 h-4" />}
                            store={generateTokenBtn.bind(member)}
                          >
                            生成授权链接
                          </Button> */}
                            {/* <Button
                              variant="subtle"
                              icon={<ShieldClose class="w-4 h-4" />}
                              store={$page.ui.$link.bind(member)}
                            >
                              复制影片链接
                            </Button> */}
                            {/* <Button
                              variant="subtle"
                              icon={<ShieldClose class="w-4 h-4" />}
                              store={$page.ui.$ban.bind(member)}
                            >
                              禁用该成员
                            </Button>
                            <Button
                              variant="subtle"
                              icon={<Edit2 class="w-4 h-4" />}
                              store={$page.ui.$update.bind(member)}
                            >
                              修改信息
                            </Button> */}
                            <Button
                              variant="subtle"
                              icon={<UserX class="w-4 h-4" />}
                              store={$page.ui.$delete.bind(member)}
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
                                        const url = `${history.$router.origin}${prefix}${id}`;
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
            </ListView>
          </div>
        </div>
      </ScrollView>
      <Dialog title="新增成员" store={$page.ui.$addMemberDialog}>
        <div class="w-[520px]">
          <Input store={$page.ui.$remarkInput} />
        </div>
      </Dialog>
      <Dialog title="删除成员" store={$page.ui.$confirmDeleteMemberDialog}>
        <div class="w-[520px]">
          <div>确认删除该成员吗？</div>
        </div>
      </Dialog>
      <Dialog store={$page.ui.$permissionDialog}>
        <div class="w-[520px]">
          <ListView store={$page.$permissionList} class="space-y-8">
            <For each={permissionResponse().dataSource}>
              {(permission) => {
                const { code, desc } = permission;
                return (
                  <div
                    class="flex items-center space-x-2 px-8 py-4"
                    onClick={() => {
                      $page.$permissionMultipleSelect.toggle(permission);
                    }}
                  >
                    <div
                      classList={{
                        "p-2 rounded-sm": true,
                        "bg-slate-500": selectedPermissions().includes(permission),
                      }}
                    >
                      {desc}
                    </div>
                  </div>
                );
              }}
            </For>
          </ListView>
        </div>
      </Dialog>
      <Dialog store={$page.ui.$memberAccountsDialog}>
        <div class="w-[520px]">
          <pre
            class="p-2 w-bg-0 rounded-md"
            onClick={() => {
              app.copy(text());
              app.tip({
                text: ["复制成功"],
              });
            }}
          >
            {text()}
          </pre>
        </div>
      </Dialog>
      <Dialog store={$page.ui.$historyDialog}>
        <div class="w-[520px] h-[360px] overflow-y-auto">
          <ListView store={$page.$historyList}>
            <div class="space-y-2">
              <For each={historyResponse().dataSource}>
                {(history) => {
                  const { name, source, updated } = history;
                  return (
                    <div>
                      <div class="text-lg">{name}</div>
                      {/* <div>{source}</div> */}
                      <div class="text-sm">{updated}</div>
                    </div>
                  );
                }}
              </For>
            </div>
          </ListView>
        </div>
      </Dialog>
      <Dialog store={$page.ui.$seasonSelect.dialog}>
        <div class="w-[520px]">
          <SeasonSelect store={$page.ui.$seasonSelect} />
        </div>
      </Dialog>
    </>
  );
};
