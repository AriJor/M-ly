import { getData } from "../../../packages/getData.js";

export function mainApi(req, res, fs) {
  const info = {
    type: "users"
  }
  getData(info, req, res, fs);
}