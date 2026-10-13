// File: services/notion/views/upcoming-view/api/api.client.js

export async function fetchUpcomingTasks() {
  const res = await fetch("/api/notion/upcoming-tasks");
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch upcoming tasks");
  }
  return data.tasks || [];
}