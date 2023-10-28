/**
 * @file 成员管理
 */
import { createSignal, For, Show } from "solid-js";
import { Check, Edit2, Gem, Lock, RotateCcw, Search, ShieldClose, UserPlus, UserX } from "lucide-solid";

import {
  add_member,
  create_member_auth_link,
  delete_member,
  fetchMemberList,
  fetchPermissionList,
  MemberItem,
  updateMemberPermission,
} from "@/services";
import { Button, Dialog, Input, ListView, Skeleton, ScrollView, Checkbox, CheckboxGroup } from "@/components/ui";
import { Qrcode } from "@/components/Qrcode";
import { DialogCore, InputCore, ButtonCore, ButtonInListCore, ScrollViewCore, CheckboxGroupCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { ViewComponent } from "@/types";
import { cn } from "@/utils";
import { MultipleSelectionCore } from "@/domains/multiple";
import { homePermissionListPage } from "@/store";
import { TVSeasonSelect, TVSeasonSelectCore } from "@/components/SeasonSelect";
import { create_link } from "@/domains/shortlink";

export const MemberManagePage: ViewComponent = (props) => {
  const { app, view } = props;

  const memberList = new ListCore(new RequestCore(fetchMemberList), {
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
    },
  });
  const memberPermissionUpdateRequest = new RequestCore(updateMemberPermission, {
    onLoading(loading) {
      permissionDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["权限更新成功"],
      });
      permissionDialog.hide();
    },
    onFailed(error) {
      app.tip({
        text: ["权限更新失败", error.message],
      });
    },
  });
  const memberSelect = new RefCore<MemberItem>();
  const generateToken = new RequestCore(create_member_auth_link, {
    onLoading(loading) {
      generateTokenBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["生成 token 失败", error.message] });
    },
    onSuccess() {
      memberList.refresh();
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
      remarkInput.clear();
      memberList.refresh();
    },
  });
  const memberRef = new RefCore<MemberItem>();
  const addMemberDialog = new DialogCore({
    title: "新增成员",
    onOk() {
      if (!remarkInput.value) {
        app.tip({ text: ["请先输入成员备注"] });
        return;
      }
      addMember.run({
        remark: remarkInput.value,
      });
    },
  });
  const remarkInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入备注",
    onEnter() {
      addMemberDialog.okBtn.click();
    },
  });
  const permissionBtn = new ButtonCore({
    onClick() {
      app.showView(homePermissionListPage);
    },
  });
  const addMemberBtn = new ButtonCore({
    onClick() {
      addMemberDialog.show();
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      memberList.refresh();
    },
  });
  const nameSearchInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入名称搜索",
    onEnter() {
      searchBtn.click();
    },
  });
  const searchBtn = new ButtonCore({
    onClick() {
      memberList.search({ name: nameSearchInput.value });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      memberList.reset();
      nameSearchInput.clear();
    },
  });
  const profileBtn = new ButtonInListCore<MemberItem>({
    onClick(member) {
      app.tip({ text: ["敬请期待"] });
    },
  });
  const linkBtn = new ButtonInListCore<MemberItem>({
    onClick(member) {
      memberRef.select(member);
      seasonSelect.dialog.show();
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
      memberRef.select(member);
      permissionList.init();
      permissionDialog.show();
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
      memberList.refresh();
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
  const seasonSelect = new TVSeasonSelectCore({
    async onOk() {
      const member = memberRef.value;
      if (!member) {
        return;
      }
      if (!seasonSelect.value) {
        return;
      }
      const { tokens } = member;
      const token = tokens[0];
      if (!token) {
        return;
      }
      const { name, tv_id, id } = seasonSelect.value;
      const originalURL = `${window.location.origin}/mobile/tv_play?id=${tv_id}&season_id=${id}&rate=1.5&hide_menu=1&token=${token.id}`;
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
      seasonSelect.dialog.hide();
    },
  });
  const scrollView = new ScrollViewCore();
  const permissionList = new ListCore(new RequestCore(fetchPermissionList));
  const permissionDialog = new DialogCore({
    title: "权限配置",
    onOk() {
      if (!memberRef.value) {
        app.tip({
          text: ["请先选择成员"],
        });
        return;
      }
      console.log(permissionMultipleSelect.values);
      memberPermissionUpdateRequest.run({
        member_id: memberRef.value.id,
        permissions: permissionMultipleSelect.values.map((p) => p.code),
      });
    },
  });
  const permissionMultipleSelect = new MultipleSelectionCore<{ code: string }>({});

  const [response, setResponse] = createSignal(memberList.response);
  const [permissionResponse, setPermissionResponse] = createSignal(permissionList.response);
  const [selectedPermissions, setSelectedPermissions] = createSignal(permissionMultipleSelect.values);

  permissionList.onStateChange((nextState) => {
    setPermissionResponse(nextState);
  });
  memberList.onStateChange((nextState) => {
    // console.log("list ", nextState);
    setResponse(nextState);
  });
  permissionMultipleSelect.onStateChange((nextState) => {
    setSelectedPermissions(nextState);
  });
  scrollView.onReachBottom(() => {
    memberList.loadMore();
  });

  memberList.init();

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8">
        <h1 class="text-2xl">成员列表</h1>
        <div class="mt-8">
          <div class="space-x-2">
            <Button icon={<RotateCcw class="w-4 h-4" />} store={refreshBtn}>
              刷新
            </Button>
            <Button store={addMemberBtn} icon={<UserPlus class="w-4 h-4" />}>
              新增成员
            </Button>
            <Button store={permissionBtn} icon={<Lock class="w-4 h-4" />}>
              权限
            </Button>
          </div>
          <div class="flex items-center space-x-2 mt-4">
            <Input class="" store={nameSearchInput} />
            <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
              搜索
            </Button>
            <Button class="" store={resetBtn}>
              重置
            </Button>
          </div>
          <div class="mt-4">
            <ListView
              store={memberList}
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
                    const { inviter, remark, tokens } = member;
                    return (
                      <div class="card rounded-sm bg-white p-4">
                        <div class="flex items-center">
                          <div class="flex items-center justify-center w-12 h-12 bg-slate-300 rounded-full mr-2">
                            <div class="text-3xl text-slate-500">{remark.slice(0, 1).toUpperCase()}</div>
                          </div>
                          <div class="flex text-2xl">
                            <Show when={inviter}>
                              <div class="flex items-center text-gray-600">
                                <div>{inviter?.remark}</div>
                                <div class="mx-2">/</div>
                              </div>
                            </Show>
                            <p class="">{remark}</p>
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
                              store={linkBtn.bind(member)}
                            >
                              复制影片链接
                            </Button>
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
                                        // @todo 怎么移除 window 平台相关变量？
                                        const url = `${window.location.origin}${prefix}${id}`;
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
      <Dialog title="新增成员" store={addMemberDialog}>
        <div class="w-[520px]">
          <Input store={remarkInput} />
        </div>
      </Dialog>
      <Dialog title="删除成员" store={confirmDeleteMemberDialog}>
        <div class="w-[520px]">
          <div>确认删除该成员吗？</div>
        </div>
      </Dialog>
      <Dialog store={permissionDialog}>
        <div class="w-[520px]">
          <ListView store={permissionList} class="space-y-8">
            <For each={permissionResponse().dataSource}>
              {(permission) => {
                const { code, desc } = permission;
                return (
                  <div
                    class="flex items-center space-x-2 px-8 py-4"
                    onClick={() => {
                      permissionMultipleSelect.toggle(permission);
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
      <Dialog store={seasonSelect.dialog}>
        <div class="w-[520px]">
          <TVSeasonSelect store={seasonSelect} />
        </div>
      </Dialog>
    </>
  );
};
