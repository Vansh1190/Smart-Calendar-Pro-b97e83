import React, { useState, useEffect } from "react";
import CalendarContainer from "./components/Calendar/CalendarContainer";
import Sidebar from "./components/Sidebar/Sidebar";
import { CalendarContextProvider } from "./context/CalendarContext";
import { initDB } from "./services/storageService";

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        // In a production app, we'd show a user-friendly error message
      }
    };

    initializeApp();

    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIsMobile();

    // Add resize listener
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Calendar...</h2>
        </div>
      </div>
    );
  }

  return (
    <CalendarContextProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        {isMobile && (
          <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
            <div className="flex items-center justify-between px-4 py-3">
              <h1 className="text-xl font-bold text-gray-800">Smart Calendar Pro</h1>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24"><rect width="256" height="256" fill="none"/><path d="M152,152,234.35,129a8,8,0,0,0,.27-15.21l-176-65.28A8,8,0,0,0,48.46,58.63l65.28,176a8,8,0,0,0,15.21-.27Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24"><rect width="256" height="256" fill="none"/><polyline points="24 180 68 164 108 180 148 164 188 180 232 164" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="24" y1="128" x2="232" y2="128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><path d="M208,172.73V184a32,32,0,0,1-32,32H80a32,32,0,0,1-32-32V171.27" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><path d="M48.2,92a8,8,0,0,1-7.83-10.29C49.49,53.24,85.26,32,128,32s78.52,21.25,87.63,49.73A8,8,0,0,1,207.8,92Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
                )}
              </button>
            </div>
          </header>
        )}

        <div className="flex h-screen pt-0 sm:pt-0">
          {/* Sidebar - Hidden on mobile unless menu is open */}
          <div
            className={`
              ${isMobile ? "fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out" : "relative"}
              ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}
              bg-white border-r border-gray-200
            `}
          >
            <Sidebar />
          </div>

          {/* Overlay for mobile menu */}
          {isMobile && isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )}

          {/* Main Content */}
          <main className={`flex-1 overflow-auto ${isMobile ? "mt-16" : ""}`}>
            <div className="container mx-auto px-4 py-6">
              <CalendarContainer />
            </div>
          </main>
        </div>

        {/* Error Boundary Message (in production, this would be a proper React Error Boundary) */}
        <div id="error-container" className="hidden fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20"><rect width="256" height="256" fill="none"/><path d="M142.41,40.22l87.46,151.87C236,202.79,228.08,216,215.46,216H40.54C27.92,216,20,202.79,26.13,192.09L113.59,40.22C119.89,29.26,136.11,29.26,142.41,40.22Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><line x1="128" y1="136" x2="128" y2="104" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><circle cx="128" cy="176" r="16"/></svg>
            <span className="ml-2">An error occurred. Please try refreshing the page.</span>
          </div>
        </div>

        {/* Success Message Container */}
        <div id="success-container" className="hidden fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20"><rect width="256" height="256" fill="none"/><path d="M104,147.43l98.34-97.09a8,8,0,0,1,11.32,0l24,23.6a8,8,0,0,1,0,11.32l-128.4,128.4a8,8,0,0,1-11.32,0l-71.6-72a8,8,0,0,1,0-11.31l24-24a8,8,0,0,1,11.32,0Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/></svg>
            <span className="ml-2">Operation completed successfully!</span>
          </div>
        </div>
      </div>
    </CalendarContextProvider>
  );
};

export default App;