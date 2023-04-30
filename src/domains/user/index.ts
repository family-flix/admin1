import { Handler } from "mitt";

import { Result } from "@/types";
import { BaseDomain } from "@/domains/base";

import { fetch_user_profile, login } from "./services";

export enum Events {
  Tip,
  Error,
  Login,
  Logout,
}
type TheTypeOfEvent = {
  [Events.Tip]: string[];
  [Events.Error]: Error;
  [Events.Login]: {};
  [Events.Logout]: void;
};

export class UserCore extends BaseDomain<TheTypeOfEvent> {
  _isLogin: boolean = false;
  user: {
    username: string;
    avatar: string;
    token: string;
  } | null = null;
  token: string = "";
  values: Partial<{ email: string; password: string }> = {};

  static Events = Events;

  constructor(initialUser?: UserCore["user"]) {
    super();

    console.log("[DOMAIN]User - constructor", initialUser);
    this._isLogin = !!initialUser;
    this.user = initialUser;
    this.token = initialUser ? initialUser.token : "";
  }
  get isLogin() {
    return this._isLogin;
  }
  inputEmail(value: string) {
    this.values.email = value;
  }
  inputPassword(value: string) {
    this.values.password = value;
  }
  /** 用户名密码登录 */
  async login() {
    const { email, password } = this.values;
    if (!email) {
      return Result.Err("请输入邮箱");
    }
    if (!password) {
      return Result.Err("请输入密码");
    }
    const r = await login({ email, password });
    if (r.error) {
      this.emitError(r.error.message);
      return r;
    }
    this.values = {};
    this._isLogin = true;
    this.user = r.data;
    this.token = r.data.token;
    this.emitLogin();
    // localStorage.setItem("user", JSON.stringify(r.data));
    return Result.Ok(r.data);
  }
  logout() {}
  async register() {
    const { email, password } = this.values;
    if (!email) {
      return Result.Err("Missing email");
    }
    if (!password) {
      return Result.Err("Missing password");
    }
    // const r = await login({ email, password });
    // this.values = {};
    // if (r.error) {
    //   this.notice_error(r);
    //   return r;
    // }
    // this.user = r.data;
    // this.token = r.data.token;
    // localStorage.setItem("user", JSON.stringify(r.data));
    return Result.Ok(null);
  }
  async fetchProfile() {
    if (!this._isLogin) {
      return Result.Err("请先登录");
    }
    const r = await fetch_user_profile();
    if (r.error) {
      return r;
    }
    return Result.Ok(r.data);
  }
  onError(handler: Handler<TheTypeOfEvent[Events.Error]>) {
    this.on(Events.Error, handler);
  }
  emitError(result: Result<null> | string) {
    const error = (() => {
      if (typeof result === "string") {
        return new Error(result);
      }
      return result.error;
    })();
    this.emit(Events.Error, error);
  }
  onLogin(handler: Handler<TheTypeOfEvent[Events.Error]>) {
    this.on(Events.Login, handler);
  }
  emitLogin() {
    this.emit(Events.Login, { ...this.user });
  }
}
