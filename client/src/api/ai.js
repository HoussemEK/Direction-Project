import { api } from "./client";

export async function requestAI(path, context) {
  const response = await api.post("/ai/proxy", {
    path,
    payload: { context },
  });
  return response.data;
}

export async function generateTrackLevel(userData) {
  const response = await api.post("/ai/proxy", {
    path: "/generate/track",
    payload: userData,
  });
  return response.data;
}
