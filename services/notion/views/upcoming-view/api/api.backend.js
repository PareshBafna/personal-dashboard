// File: services/notion/views/upcoming-view/api/api.backend.js
import { Client } from "@notionhq/client";

const TZ = "Asia/Kolkata";

function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export async function fetchUpcomingTasksFromNotion(notionClient, databaseId) {
  const tomorrow = getTomorrowDateString();

  const response = await notionClient.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        {
          property: "Due Date",
          date: {
            on_or_after: tomorrow
          }
        },
        {
          property: "Done",
          checkbox: {
            equals: false
          }
        }
      ]
    },
    sorts: [
      {
        property: "Due Date",
        direction: "ascending"
      }
    ]
  });

  return response.results.map(page => {
    const props = page.properties || {};
    const titleProp = props["Name"] || props["Task"] || props["Title"] || {};
    const title = titleProp.title?.[0]?.plain_text || "Untitled Task";
    const status = props["Status"]?.status?.name || props["Status"]?.select?.name || "Not Started";
    const priority = props["Priority"]?.select?.name || "Medium";
    const dueDate = props["Due Date"]?.date?.start || null;

    return {
      id: page.id,
      title,
      status,
      priority,
      date: dueDate,
      nativeDate: dueDate,
      isDone: false,
      url: page.url
    };
  });
}