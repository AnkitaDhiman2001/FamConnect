import { Res } from "./Api";

export interface IErrorHandler {
  refresh?: boolean;
  toast?: string;
  validation?: boolean;
  signOut?: boolean;
}

function refresh() {
  return { refresh: true };
}

function signOut() {
  return { signOut: true };
}

function snackBar(message: string) {
  return { snackBar: message };
}

function toast(message: string) {
  return { toast: message };
}

async function handle(res: Res, route: string | string[]) {
  if (res.status == 200) return res;

  if (!res.error.code) {
    console.log("Error", res.error.code);
    return res;
  }

  let error: IErrorHandler | undefined = res.error.code;
  if (!error) {
    return res;
  }

  if (error.toast) {
    return res;
  }

  if (error.signOut) {
    return res;
  }

  if (error.validation) {
    if (Array.isArray(res.data.body) && res.data.body.length > 0) {
     console.log(error)
    } else {
        console.log(error)
    }
    return res;
  }
  return res;
}

export default { handle };
