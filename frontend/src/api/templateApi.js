import { API_BASE } from "../utils/constants"
//this file deals with any calls to the backend that loads or saves json files on the backend

//load a list of all stored templates from the backend
export async function loadTemplates() {
  const response = await fetch(`${API_BASE}/api/templates`);

  if (!response.ok) {
    throw new Error("Failed to load templates");
  }

  return response.json();
}

//load on specific template
export async function loadTemplate(template) {
  const response = await fetch(`${API_BASE}/api/templates/${template}`);

  if (!response.ok) {
    throw new Error("Failed to load template");
  }

  return response.json();
}

//save the current environment as a template on the backend
export async function saveTemplate(name, template) {
  const response = await fetch(`${API_BASE}/api/templates/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      template,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save template");
  }
}

//saves the current environment as a josn file and stores it in the converter script ready for conversion into docker compose
export async function saveTopology(topology) {
  const response = await fetch(`${API_BASE}/api/topology/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(topology),
  });

  if (!response.ok) {
    throw new Error("Failed to save topology");
  }
}