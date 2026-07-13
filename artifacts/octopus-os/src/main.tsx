import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register Service Worker for PWA mobile installation support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((reg) => console.log("SW registered successfully:", reg.scope))
      .catch((err) => console.error("SW registration failed:", err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
