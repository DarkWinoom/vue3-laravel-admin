declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    interface LoginToken {
      token: string;
      refreshToken?: string;
      csrfToken: string;
      expiresIn: number;
    }

    interface UserInfo {
      userId: string;
      userName: string;
      email: string;
      accessVersion: number;
      roles: string[];
      buttons: string[];
    }
  }
}
