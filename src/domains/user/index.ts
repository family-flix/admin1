import { Handler } from "mitt";

import { Result } from "@/types";
import { BaseDomain } from "@/domains/base";

import { fetch_user_profile, login, validate } from "./services";

export enum Events {
  Tip,
  Error,
  Login,
  Logout,
  /** 身份凭证失效 */
  Expired,
}
type TheTypesOfEvents = {
  [Events.Tip]: string[];
  [Events.Error]: Error;
  [Events.Login]: UserState & { token: string };
  [Events.Logout]: void;
  [Events.Expired]: void;
};
type UserState = {
  id: string;
  username: string;
  avatar: string;
};
type UserProps = {
  id: string;
  username: string;
  avatar: string;
  token: string;
};

export class UserCore extends BaseDomain<TheTypesOfEvents> {
  name = "UserCore";
  debug = false;

  state: UserState = {
    id: "",
    username: "Anonymous",
    avatar: "",
  };
  isLogin: boolean = false;
  token: string = "";
  values: Partial<{ email: string; password: string }> = {};

  static Events = Events;

  constructor(options: Partial<{ name: string } & UserProps> = {}) {
    super(options);

    const { id, username, avatar, token } = options;
    // this.log("constructor", initialUser);
    this.state.id = id;
    this.state.username = username;
    this.state.username = avatar;
    this.isLogin = !!token;
    this.token = token;
  }
  inputEmail(value: string) {
    this.values.email = value;
  }
  inputPassword(value: string) {
    this.values.password = value;
  }
  /** 校验用户凭证是否有效 */
  async validate() {
    const r = await validate(this.token);
    if (r.error) {
      this.emit(Events.Expired);
      return Result.Err(r.error);
    }
    return Result.Ok(null);
  }
  /** 用户名密码登录 */
  async login() {
    const { email, password } = this.values;
    if (!email) {
      const msg = this.tip({ text: ["请输入邮箱"] });
      return Result.Err(msg);
    }
    if (!password) {
      const msg = this.tip({ text: ["请输入密码"] });
      return Result.Err(msg);
    }
    const r = await login({ email, password });
    if (r.error) {
      this.tip({ text: ["登录失败", r.error.message] });
      return Result.Err(r.error);
    }
    this.values = {};
    this.isLogin = true;
    this.state = r.data;
    this.token = r.data.token;
    this.emit(Events.Login, { ...this.state, token: this.token });
    return Result.Ok(r.data);
  }
  /** 退出登录 */
  logout() {}
  async register() {
    const { email, password } = this.values;
    if (!email) {
      return Result.Err("Missing email");
    }
    if (!password) {
      return Result.Err("Missing password");
    }
    return Result.Ok(null);
  }
  async fetchProfile() {
    if (!this.isLogin) {
      return Result.Err("请先登录");
    }
    const r = await fetch_user_profile();
    if (r.error) {
      return r;
    }
    return Result.Ok(r.data);
  }

  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    this.on(Events.Error, handler);
  }
  onLogin(handler: Handler<TheTypesOfEvents[Events.Login]>) {
    this.on(Events.Login, handler);
  }
  onExpired(handler: Handler<TheTypesOfEvents[Events.Expired]>) {
    return this.on(Events.Expired, handler);
  }
}
