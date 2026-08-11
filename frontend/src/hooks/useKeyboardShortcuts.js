// src/hooks/useKeyboardShortcuts.js
import { useEffect } from "react";

// function for setting up keyboard interactions
export function useKeyboardShortcuts({ deleteSelectedNode, addNode, setSelectedRole }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelectedNode();
      }
      
      if (event.key.toLowerCase() === "n") {
        addNode();
      }
      if (event.key.toLowerCase() === "p") {
        setSelectedRole("pc")
        addNode("pc");
      }
      if (event.key.toLowerCase() === "r") {
        setSelectedRole("router")
        addNode("router");
      }

      
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteSelectedNode, addNode, setSelectedRole]);
}