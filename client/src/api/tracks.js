import { api } from "./client";

export async function fetchTracks() {
  const { data } = await api.get("/tracks");
  return data;
}

export async function fetchTrack(id) {
  const { data } = await api.get(`/tracks/${id}`);
  return data;
}

export async function createTrack(payload) {
  const { data } = await api.post("/tracks", payload);
  return data;
}

export async function updateTrack(id, payload) {
  const { data } = await api.patch(`/tracks/${id}`, payload);
  return data;
}

export async function completeTrack(id) {
  const { data } = await api.patch(`/tracks/${id}/complete`);
  return data;
}

export async function deleteTrack(id) {
  await api.delete(`/tracks/${id}`);
}

export async function saveTrack(payload) {
  if (payload._id) {
    const { data } = await api.patch(`/tracks/${payload._id}`, payload);
    return data;
  }
  const { data } = await api.post("/tracks", payload);
  return data;
}
