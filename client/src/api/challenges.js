import { api } from "./client";

export async function fetchChallenges() {
  const { data } = await api.get("/challenges");
  return data;
}

export async function fetchActiveChallenge() {
  const { data } = await api.get("/challenges/active");
  return data;
}

export async function fetchChallengeMeta() {
  const { data } = await api.get("/challenges/meta");
  return data;
}

export async function createChallenge(challenge) {
  const { data } = await api.post("/challenges", challenge);
  return data;
}

export async function completeChallenge(id) {
  const { data } = await api.patch(`/challenges/${id}/complete`);
  return data;
}

export async function skipChallenge(id) {
  const { data } = await api.patch(`/challenges/${id}/skip`);
  return data;
}

export async function startTimedChallenge(id) {
  const { data } = await api.patch(`/challenges/${id}/start`);
  return data;
}

export async function saveChallenge(update) {
  if (update._id) {
    const { data } = await api.patch(`/challenges/${update._id}`, update);
    return data;
  }
  const { data } = await api.post("/challenges", update);
  return data;
}
