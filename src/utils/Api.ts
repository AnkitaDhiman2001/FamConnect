import Error from "./Error";
export interface Res {
  success: boolean;
  status: number;
  resent: boolean;
  resend: Function;
  [key: string]: any;
}


class API {
 static async get(
  path: string | string[],
  resent: boolean = false,
  signal?: AbortSignal
): Promise<Res> {
  return new Promise(async (resolve, reject) => {
    try {
      if (Array.isArray(path)) path = path.join("/");

      const headers = new Headers();
      headers.append("Accept", "application/json");
      headers.append("Content-Type", "application/json");   

      const options: RequestInit = {
        method: "GET",
        headers,
        credentials: "include"
      };

      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + path, options);
      const parsed = await this.parseRes(
        response,
        () => this.get(path, true),
        resent,
        path
      );

      resolve(parsed);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn("Request aborted:", path);
      } else {
        console.error("API.get error:", err);
      }
      reject(err);
    }
  });
}


  static async post(
    path: string | string[],
    body: any,
    resent: boolean = false
  ): Promise<Res> {
    return new Promise(async (resolve) => {
      // Join path array
      if (Array.isArray(path)) path = path.join("/");

      let headers = new Headers();

      headers.append("Accept", "application/json");
      headers.append("Content-Type", "application/json");

      await fetch(process.env.NEXT_PUBLIC_API_URL + path, {
        method: "POST",
        credentials: "include",
        headers: headers,
        body: JSON.stringify(body),
      })
        .then(async (res: Response) => {
          let parsed = await this.parseRes(
            res,
            () => this.post(path, body, true),
            resent,
            path
          );
          resolve(parsed);
        })
        .catch((err: any) => {
          if (err.status == undefined) {
            console.log(err)
          }
          console.error(err);
        });
    });
  }

  static async postFile(
    path: string | string[],
    body: any,
    resent: boolean = false
  ): Promise<Res> {
    return new Promise(async (resolve) => {
      // Join path array
      if (Array.isArray(path)) path = path.join("/");

      let headers = new Headers();

      await fetch(process.env.NEXT_PUBLIC_API_URL + path, {
        method: "POST",
        credentials: "include",
        headers: headers,
        body: body,
      })
        .then(async (res: Response) => {
          let parsed = await this.parseRes(
            res,
            () => this.post(path, body, true),
            resent,
            path
          );
          resolve(parsed);
        })
        .catch((err: any) => {
          if (err.status == undefined) {
            console.log(err)
          }
          console.error(err);
        });
    });
  }

  static async put(
    path: string | string[],
    body: any,
    resent: boolean = false
  ): Promise<Res> {
    return new Promise(async (resolve) => {
      if (Array.isArray(path)) path = path.join("/");

      let headers = new Headers();

      headers.append("Accept", "application/json");
      headers.append("Content-Type", "application/json");

      await fetch(process.env.NEXT_PUBLIC_API_URL + path, {
        method: "PUT",
        credentials: "include",
        headers: headers,
        body: JSON.stringify(body),
      })
        .then(async (res: Response) => {
          let parsed = await this.parseRes(
            res,
            () => this.post(path, body, true),
            resent,
            path
          );

          resolve(parsed);
        })
        .catch((err: any) => {
          if (err.status == undefined) {
           console.log(err)
          }
          console.error(err);
        });
    });
  }

  static async delete(
    path: string | string[],
    body: any,
    resent: boolean = false
  ): Promise<Res> {
    return new Promise(async (resolve) => {
      // Join path array
      if (Array.isArray(path)) path = path.join("/");

      let headers = new Headers();

      headers.append("Accept", "application/json");
      headers.append("Content-Type", "application/json");

      await fetch(process.env.NEXT_PUBLIC_API_URL + path, {
        method: "DELETE",
        credentials: "include",
        headers: headers,
        body: JSON.stringify(body),
      })
        .then(async (res: Response) => {
          let parsed = await this.parseRes(
            res,
            () => this.post(path, body, true),
            resent,
            path
          );
          resolve(parsed);
        })
        .catch((err: any) => {
          if (err.status == undefined) {
            console.log(err)
          }
          console.error(err);
        });
    });
  }

  static async parseRes(
    raw: Response,
    resend: Function,
    resent: boolean,
    path: string | string[]
  ) {
    let res: Res = await raw?.json();
    res.success = raw.status >= 200 && raw.status < 300;
    res.status = raw.status;
    res.resend = resend;
    res.resent = resent;

    if (!res.success) return await Error.handle(res, path);
    return res;
  }
}

export default API;
