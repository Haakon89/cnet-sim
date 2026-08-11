import { API_BASE } from "../utils/constants"

//sends a message to the backend to run the current saved docker environment for a set number of seconds
export async function startEnvironment(config) {
  const response = await fetch(`${API_BASE}/api/environment/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error("Failed to start environment");
  }

  return response.json();
}