import { API_BASE } from "../utils/constants"

//load a list of all stored animations from the backend
export async function loadAnimations() {
  const response = await fetch(`${API_BASE}/api/animation`);

  if (!response.ok) {
    throw new Error("Failed to load animations");
  }

  return response.json();
}

//load one specific animation
export async function loadAnimation(animation) {
  const response = await fetch(`${API_BASE}/api/animation/${animation}`);

  if (!response.ok) {
    throw new Error("Failed to load animation");
  }

  return response.json();
}