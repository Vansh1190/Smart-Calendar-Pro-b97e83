import React, { useState, useEffect, useCallback, useRef } from "react";
import DayView from "./DayView";
import WeekView from "./WeekView";
import MonthView from "./MonthView";
import EventForm from "../EventCreation/EventForm";
import { useCalendarContext } from "../../context/CalendarContext";
import { format, addDays, subDays, addMonths, subMonths } from "date-fns";

// Assumed to be in a global CSS file or Tailwind config:
// @keyframes view-transition-anim {
//   from { opacity: 0.6; transform: translateY(8px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-view-transition { animation: view-transition-anim 0.3s ease-out; }

const MIN_SWIPE_DISTANCE = 50; // pixels

const CalendarContainer = () => {
  const { selectedDate, setSelectedDate, events, removeEvent, loading, error } = useCalendarContext();
  const [activeView, setActiveView] = useState("month");
  const [isMobile, setIsMobile] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Gesture control states
  const touchStartXRef = useRef(null);
  const touchMoveXRef = useRef(null);
  
  // View transition state
  const [isViewReady, setIsViewReady] = useState(true);


  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const handleViewChange = useCallback((view) => {
    if (view === activeView) return;
    setIsViewReady(false);
    setTimeout(() => {
      setActiveView(view);
      setIsViewReady(true);
    }, 200); // Corresponds to fade-out duration
  }, [activeView, setActiveView, setIsViewReady]);


  useEffect(() => {
    if (isMobile && activeView === "week") {
      // For mobile, if week view is somehow selected, default to day view
      handleViewChange("day");
    }
  }, [isMobile, activeView, handleViewChange]);


  const navigateToday = useCallback(() => {
    setIsViewReady(false);
    setTimeout(() => {
        setSelectedDate(new Date());
        setIsViewReady(true);
    }, 200);
  }, [setSelectedDate, setIsViewReady]);

  const handleEventClick = useCallback((event) => {
    setEventToEdit(event);
    setShowEventForm(true);
  }, [setEventToEdit, setShowEventForm]);

  const handleDeleteRequest = useCallback((eventId) => {
    setConfirmDelete(eventId);
  }, [setConfirmDelete]);
  
  const confirmEventDeletion = useCallback(async () => {
    if (confirmDelete) {
      await removeEvent(confirmDelete);
      setConfirmDelete(null);
      setShowEventForm(false);
      setEventToEdit(null);
    }
  }, [confirmDelete, removeEvent, setConfirmDelete, setShowEventForm, setEventToEdit]);

  const closeEventForm = useCallback(() => {
    setShowEventForm(false);
    setEventToEdit(null);
  }, [setShowEventForm, setEventToEdit]);

  // Gesture handlers
  const handleTouchStart = useCallback((e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchMoveXRef.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartXRef.current === null) return;
    touchMoveXRef.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartXRef.current === null || touchMoveXRef.current === null) return;

    const distance = touchStartXRef.current - touchMoveXRef.current;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    let newDate = null;

    if (isLeftSwipe) { // Swiped left (next period)
      if (activeView === "day") newDate = addDays(selectedDate, 1);
      else if (activeView === "week") newDate = addDays(selectedDate, 7);
      else if (activeView === "month") newDate = addMonths(selectedDate, 1);
    } else if (isRightSwipe) { // Swiped right (previous period)
      if (activeView === "day") newDate = subDays(selectedDate, 1);
      else if (activeView === "week") newDate = subDays(selectedDate, 7);
      else if (activeView === "month") newDate = subMonths(selectedDate, 1);
    }

    if (newDate) {
      setIsViewReady(false);
      setTimeout(() => {
        setSelectedDate(newDate);
        setIsViewReady(true);
      }, 200);
    }

    touchStartXRef.current = null;
    touchMoveXRef.current = null;
  }, [activeView, selectedDate, setSelectedDate, setIsViewReady]);


  const renderActiveView = () => {
    const viewProps = {
      events: events || [],
      onEventClick: handleEventClick,
      onEventDelete: handleDeleteRequest,
    };

    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center h-full py-10">
          <div className="w-12 h-12 border-4 border-t-4 border-blue-500 border-gray-200 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading events...</p>
        </div>
      );
    }

    if (error) {
       return (
        <div className="p-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-md mx-auto mt-10 max-w-lg">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24" className="text-red-500"><rect width="256" height="256" fill="none"/><path d="M142.41,40.22l87.46,151.87C236,202.79,228.08,216,215.46,216H40.54C27.92,216,20,202.79,26.13,192.09L113.59,40.22C119.89,29.26,136.11,29.26,142.41,40.22Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="128" y1="136" x2="128" y2="104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><circle cx="128" cy="176" r="12"/></svg>
            <h3 className="ml-2 text-lg font-semibold">Error Loading Calendar</h3>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    switch (activeView) {
      case "day":
        return <DayView {...viewProps} />;
      case "week":
        return <WeekView {...viewProps} />;
      case "month":
        return <MonthView {...viewProps} />;
      default:
        return <MonthView {...viewProps} />;
    }
  };

  const viewSwitcherButtons = [
    { view: "day", label: "Day", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="18" height="18"><rect width="256" height="256" fill="none"/><rect x="40" y="40" width="176" height="176" rx="8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" fill="none"/><line x1="176" y1="24" x2="176" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="80" y1="24" x2="80" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="40" y1="88" x2="216" y2="88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><rect x="84" y="120" width="32" height="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg> },
    { view: "week", label: "Week", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="18" height="18"><rect width="256" height="256" fill="none"/><rect x="40" y="40" width="176" height="176" rx="8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" fill="none"/><line x1="176" y1="24" x2="176" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="80" y1="24" x2="80" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="40" y1="88" x2="216" y2="88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="128" y1="88" x2="128" y2="216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg> },
    { view: "month", label: "Month", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="18" height="18"><rect width="256" height="256" fill="none"/><rect x="40" y="40" width="176" height="176" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="176" y1="24" x2="176" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="80" y1="24" x2="80" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="40" y1="88" x2="216" y2="88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><circle cx="128" cy="136" r="12"/><circle cx="172" cy="136" r="12"/><circle cx="84" cy="136" r="12"/><circle cx="84" cy="180" r="12"/><circle cx="128" cy="180" r="12"/><circle cx="172" cy="180" r="12"/></svg> },
  ];


  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Calendar Header */}
      <div className="bg-white p-3 sm:p-4 shadow-sm rounded-t-lg flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sticky top-0 z-10">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => { setEventToEdit(null); setShowEventForm(true);}}
            className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs sm:text-sm flex items-center shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16" className="inline mr-1.5 -mt-0.5 fill-current"><rect width="256" height="256" fill="none"/><line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><line x1="128" y1="40" x2="128" y2="216" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>
            New Event
          </button>
          <button
            onClick={navigateToday}
            className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs sm:text-sm shadow-sm"
          >
            Today
          </button>
        </div>

        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          {viewSwitcherButtons.map(btn => {
            if (isMobile && btn.view === "week") return null; // Hide week view button on mobile for this switcher
            return (
              <button
                key={btn.view}
                className={`flex items-center justify-center px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out
                  ${ activeView === btn.view
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                  }`}
                onClick={() => handleViewChange(btn.view)}
              >
                <span className="mr-1.5 sm:mr-2">{btn.icon}</span>
                {btn.label}
              </button>
            );
          })}
        </div>
        
        <h2 className="text-lg sm:text-xl font-bold text-gray-700 hidden md:block order-first sm:order-none sm:ml-auto sm:mr-4">
            {format(selectedDate, "MMMM yyyy")}
        </h2>
      </div>

      {/* Calendar View Area with Gestures and Transitions */}
      <div
        className="flex-grow overflow-auto relative"
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        <div
          key={activeView} // Key for re-mount animation on view change
          className={`h-full transition-opacity duration-200 ease-in-out animate-view-transition ${isViewReady ? "opacity-100" : "opacity-0"}`}
        >
          {renderActiveView()}
        </div>
      </div>
      
      {/* Mobile Bottom Navigation (Simplified View Switcher) */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-1 flex justify-around items-center z-20 shadow-top">
          {viewSwitcherButtons.filter(btn => btn.view !== "week").map(btn => ( // Exclude week view for mobile bottom bar
            <button
              key={`mobile-${btn.view}`}
              className={`flex flex-col items-center justify-center p-2 rounded-md w-1/2
                ${ activeView === btn.view ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:bg-gray-100"
                }`}
              onClick={() => handleViewChange(btn.view)}
            >
              {React.cloneElement(btn.icon, {width: 22, height: 22})}
              <span className="text-xs mt-1">{btn.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-2 sm:p-4 overflow-y-auto">
          <EventForm initialEvent={eventToEdit} onClose={closeEventForm} />
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24" className="text-red-500 mr-3"><rect width="256" height="256" fill="none"/><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,32a12,12,0,1,1,12-12A12,12,0,0,1,128,168Z"/></svg>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              Are you sure you want to delete the event &quot;{events.find(e => e.id === confirmDelete)?.title || "this event"}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmEventDeletion}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarContainer;
