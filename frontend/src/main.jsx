import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/variables.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/buttons.css";
import "./styles/forms.css";
import "./styles/cards.css";
import "./styles/utilities.css";

import App from "./App.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
