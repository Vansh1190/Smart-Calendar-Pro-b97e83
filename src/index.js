import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CalendarContextProvider } from "./context/CalendarContext";

// Initialize any error tracking or performance monitoring here
const handleError = (error, errorInfo) => {
  // In production, you would send this to your error tracking service
  console.error("Application Error:", error, errorInfo);
  
  // Show error message to user
  const errorContainer = document.getElementById("error-container");
  if (errorContainer) {
    errorContainer.classList.remove("hidden");
    setTimeout(() => {
      errorContainer.classList.add("hidden");
    }, 5000);
  }
};

// Add error boundary
window.onerror = (message, source, lineno, colno, error) => {
  handleError(error);
};

// Add unhandled promise rejection handler
window.onunhandledrejection = (event) => {
  handleError(event.reason);
};

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <CalendarContextProvider>
      <App />
    </CalendarContextProvider>
  </React.StrictMode>
);

// Enable hot module replacement for development
if (module.hot) {
  module.hot.accept();
}