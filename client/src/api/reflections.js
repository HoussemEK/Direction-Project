import { api } from "./client";

export async function fetchReflections() {
  const { data } = await api.get("/reflections");
  return data;
}

export async function submitReflection(payload) {
  const { data } = await api.post("/reflections", payload);
  return data;
}
