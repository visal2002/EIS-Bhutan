// frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";
import { ThemeProvider } from "./context/ThemeContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import { PermissionsProvider } from "./context/PermissionsContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SiteSettingsProvider>
          <PermissionsProvider>
            <App />
          </PermissionsProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);