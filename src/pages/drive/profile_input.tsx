import { ViewComponentProps } from "@/store/types";
import { media_request } from "@/biz/requests";
import { Button, Textarea } from "@/components/ui";
import { RequestCore } from "@/domains/request";
import { ButtonCore, InputCore } from "@/domains/ui";
import { createSignal, Show } from "solid-js";
import { base, Handler } from "@/domains/base";

function getQRCode() {
  return media_request.post<{
    url: string;
    qrCodeUrl: string;
    sid: string;
  }>("/api/v2/alipan/get_qrcode");
}
function checkLoginStatus(body: { sid: string }) {
  return media_request.post<{
    status: "WaitLogin" | "LoginSuccess" | "QRCodeExpired" | "ScanSuccess" | "LoginFailed";
    refresh_token: string;
    access_token: string;
  }>("/api/v2/alipan/get_login_status", body);
}
function refreshAccessToken(body: { refresh_token: string }) {
  return media_request.post<{
    token_type: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>("/api/v2/alipan/get_access_token", body);
}
const $requests = {
  QRCode: new RequestCore(getQRCode),
  LoginStatus: new RequestCore(checkLoginStatus),
  AccessToken: new RequestCore(refreshAccessToken),
};

function AlipanOpenDriveCreateInputCore(props: { app: ViewComponentProps["app"] }) {
  let _success = false;
  let _token = {
    access_token: "",
    refresh_token: "",
  };
  const $btn = new ButtonCore({
    async onClick() {
      _success = false;
      _token = {
        access_token: "",
        refresh_token: "",
      };
      $btn.setLoading(true);
      const r = await $requests.QRCode.run();
      if (r.error) {
        $btn.setLoading(false);
        props.app.tip({
          text: ["生成授权链接失败", r.error.message],
        });
        return;
      }
      const { url, sid } = r.data;
      props.app.openWindow(url);
      async function run() {
        const r = await $requests.LoginStatus.run({ sid });
        if (r.error) {
          $btn.setLoading(false);
          props.app.tip({
            text: ["获取登录状态失败", r.error.message],
          });
          return;
        }
        const { status, refresh_token, access_token } = r.data;
        if (status === "LoginSuccess") {
          $btn.setLoading(false);
          _success = true;
          _token.access_token = access_token;
          _token.refresh_token = refresh_token;
          bus.emit(Events.Success, { ..._token });
          bus.emit(Events.Change, { ..._state });
          return;
        }
        run();
      }
      run();
    },
  });

  const _state = {
    get success() {
      return _success;
    },
    get token() {
      return _token;
    },
  };
  enum Events {
    Success,
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Success]: {
      access_token: string;
      refresh_token: string;
    };
    [Events.Change]: typeof _state;
  };
  const bus = base<TheTypesOfEvents>();

  return {
    state: _state,
    ui: {
      $btn,
    },
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
    onSuccess(handler: Handler<TheTypesOfEvents[Events.Success]>) {
      return bus.on(Events.Success, handler);
    },
  };
}

export function AlipanOpenDriveCreateInput(props: { app: ViewComponentProps["app"]; store: InputCore<any> }) {
  const $logic = AlipanOpenDriveCreateInputCore({ app: props.app });
  const [state, setState] = createSignal($logic.state);

  $logic.onChange((v) => setState(v));
  $logic.onSuccess((token) => {
    props.store.setValue(JSON.stringify(token));
  });

  return (
    <div class="p-4">
      <div class="flex justify-center">
        <Button store={$logic.ui.$btn}>
          <Show when={state().success} fallback="授权">
            重新授权
          </Show>
        </Button>
      </div>
      <Show when={state().success}>
        <div>
          <div class="text-gray-600">Access Token</div>
          <div class="mt-1 break-all">{state().token.access_token}</div>
        </div>
        <div class="mt-4">
          <div class="text-gray-600">Refresh Token</div>
          <div class="mt-1 break-all">{state().token.refresh_token}</div>
        </div>
      </Show>
    </div>
  );
}

export function AlipanDriveCreateInput(props: { store: InputCore<any> }) {
  return (
    <div>
      <Textarea store={props.store} />
    </div>
  );
}
