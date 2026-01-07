import { api } from "./client";

export async function fetchTasks() {
  const { data } = await api.get("/tasks");
  return data;
}

export async function createTask(task) {
  const { data } = await api.post("/tasks", task);
  return data;
}

export async function updateTask(id, partial) {
  const { data } = await api.patch(`/tasks/${id}`, partial);
  return data;
}

export async function deleteTask(id) {
  await api.delete(`/tasks/${id}`);
}
