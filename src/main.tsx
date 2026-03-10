import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { VChatProvider, ChatWidget } from "vchat7";
import "vchat7/style.css";

import "./index.css";
import App from "./App";

const isDarkMode =
  document.documentElement.getAttribute("data-theme") === "dark";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <VChatProvider
        apiUrl={import.meta.env.VITE_VCHAT_API_URL}
        botId={import.meta.env.VITE_VCHAT_BOT_ID}
        theme={{
          primaryColor: "#3b82f6",
          backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
          textColor: isDarkMode ? "#f1f5f9" : "#333333",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          borderRadius: 15,
          headerBackground: "#3b82f6",
          headerTextColor: "#ffffff",
        }}
      >
        <App />
        <ChatWidget position="bottom-right" />
        <Analytics />
        <SpeedInsights />
      </VChatProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
