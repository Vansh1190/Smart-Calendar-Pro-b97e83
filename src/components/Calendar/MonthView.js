import React, { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays, // For easier navigation
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  parseISO,
  isToday as dateFnsIsToday, // Renamed to avoid conflict
} from "date-fns";
import { useCalendarContext } from "../../context/CalendarContext";

// Define a simple popover for event preview
const EventPreviewPopover = ({ event, position, onClose }) => {
  if (!event) return null;

  return (
    <div
      className="fixed z-50 p-4 bg-white rounded-lg shadow-xl border border-gray-200 w-72 text-sm"
      style={{ top: position.top, left: position.left, transform: "translate(10px, 10px)" }} // Offset from cursor
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800 flex items-center">
         <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: event.color || "#3B82F6" }}></span>
         {event.title}
        </h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20" fill="currentColor"><rect width="256" height="256" fill="none"/><line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="200" y1="200" x2="56" y2="56" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
        </button>
      </div>
      <p className="text-gray-600 mb-1 pl-5">
        {format(parseISO(event.startTime), "EEE, MMM d, h:mm a")} - {format(parseISO(event.endTime), "h:mm a")}
      </p>
      {event.location && (
        <p className="text-gray-500 text-xs mb-1 flex items-center pl-5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="12" height="12" className="mr-1.5 text-gray-400 flex-shrink-0"><rect width="256" height="256" fill="none"/><circle cx="128" cy="104" r="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
          {event.location}
        </p>
      )}
      {event.description && (
        <p className="text-gray-500 text-xs pl-5 line-clamp-3 mt-1">{event.description}</p>
      )}
    </div>
  );
};


const MonthView = () => {
  const [calendarDays, setCalendarDays] = useState([]);
  const { events, selectedDate, setSelectedDate, onEventClick } = useCalendarContext(); // Assuming onEventClick is passed for consistency with other views
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  
  // State for animation
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null); // 'next' or 'prev'

  const updateCalendarDays = useCallback((currentDate) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Assuming Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    setCalendarDays(days);
  }, []);

  useEffect(() => {
    updateCalendarDays(selectedDate);
  }, [selectedDate, updateCalendarDays]);

  const handleNavigation = (direction) => {
    setIsTransitioning(true);
    setTransitionDirection(direction);

    setTimeout(() => {
      const newDate = direction === "next" ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1);
      setSelectedDate(newDate);
      // The updateCalendarDays will be called by useEffect on selectedDate change
      // Start fade-in animation
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionDirection(null);
      }, 50); // Short delay for fade-in to start after DOM update
    }, 200); // Duration of fade-out animation
  };


  const getEventsForDay = (day) => {
    return events.filter(event => 
      isSameDay(parseISO(event.startTime), day)
    ).sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
    // Potentially switch to DayView or show a day-specific modal
    // For now, just sets selectedDate, which might highlight the day
  };

  const handleEventMouseEnter = (event, e) => {
    setHoveredEvent(event);
    // Position popover relative to the event or mouse cursor
    const rect = e.target.getBoundingClientRect();
    setPopoverPosition({ top: rect.bottom, left: rect.left });
  };

  const handleEventMouseLeave = () => {
    setHoveredEvent(null);
  };

  const weekDaysHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 h-full flex flex-col">
      {/* Month and Year Header with Navigation */}
      <div className="flex justify-between items-center mb-4 px-1">
        <button 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
          onClick={() => handleNavigation("prev")}
          aria-label="Previous month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20" fill="currentColor"><rect width="256" height="256" fill="none"/><polyline points="160 208 80 128 160 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">
          {format(selectedDate, "MMMM yyyy")}
        </h2>
        <button 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
          onClick={() => handleNavigation("next")}
          aria-label="Next month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20" fill="currentColor"><rect width="256" height="256" fill="none"/><polyline points="96 48 176 128 96 208" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={`flex-grow grid grid-cols-7 gap-px sm:gap-1 relative overflow-hidden
        ${isTransitioning ? (transitionDirection === "next" ? "animate-slideOutLeft" : "animate-slideOutRight") : 
                           (transitionDirection === "next" ? "animate-slideInRight" : "animate-slideInLeft") }
      `}
      style={{ animationDuration: "0.2s" }} // Sync with JS timeout
      >
        {/* Week day headers */}
        {weekDaysHeaders.map(day => (
          <div key={day} className="text-center font-semibold text-gray-500 text-xs sm:text-sm py-2">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonthDay = isSameMonth(day, selectedDate);
          const isSelectedDay = isSameDay(day, selectedDate);
          const isToday = dateFnsIsToday(day);
          
          return (
            <div
              key={index}
              className={`min-h-[60px] sm:min-h-[90px] md:min-h-[100px] lg:min-h-[110px] border border-gray-200 rounded-md p-1 sm:p-1.5 transition-all duration-150 ease-in-out relative flex flex-col
                ${isCurrentMonthDay ? "bg-white" : "bg-gray-50 text-gray-400"}
                ${isSelectedDay && isCurrentMonthDay ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" : ""}
                ${isToday && isCurrentMonthDay ? "border-blue-500" : ""}
                ${!isCurrentMonthDay ? "cursor-default" : "hover:bg-gray-100 cursor-pointer"}
              `}
              onClick={() => isCurrentMonthDay && handleDayClick(day)}
            >
              <div className="flex justify-between items-start mb-0.5">
                <span 
                  className={`text-xs sm:text-sm font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full
                    ${isToday && isCurrentMonthDay ? "bg-blue-500 text-white" : isCurrentMonthDay ? "text-gray-700" : "text-gray-400"}
                  `}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 2 && isCurrentMonthDay && (
                  <span className="hidden sm:inline-block text-2xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 font-medium">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              
              {isCurrentMonthDay && (
                <div className="mt-0.5 space-y-0.5 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  {dayEvents.slice(0, 2).map(event => ( // Show first 2 events, more indicator for others
                    <div
                      key={event.id}
                      className="text-2xs sm:text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer event-card-selector"
                      style={{ 
                        backgroundColor: `${event.color || "#3B82F6"}33`, // Lighter, more transparent
                        borderLeft: `3px solid ${event.color || "#3B82F6"}`
                      }}
                      onClick={(e) => { e.stopPropagation(); if(onEventClick) onEventClick(event); }}
                      onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                      onMouseLeave={handleEventMouseLeave}
                      title={event.title}
                    >
                      <span className="font-medium" style={{color: event.color || "#3B82F6" }}>
                        {format(parseISO(event.startTime), "HH:mm")}
                      </span> {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-2xs sm:text-xs text-gray-500 pl-1 mt-0.5">
                      + {dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hoveredEvent && (
        <EventPreviewPopover 
          event={hoveredEvent} 
          position={popoverPosition} 
          onClose={() => setHoveredEvent(null)} 
        />
      )}
    </div>
  );
};

// Add keyframes for slide transitions in a global CSS or Tailwind config
// @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
// @keyframes slideOutLeft { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-100%); opacity: 0; } }
// @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
// @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
// .animate-slideInLeft { animation-name: slideInLeft; }
// .animate-slideOutLeft { animation-name: slideOutLeft; }
// .animate-slideInRight { animation-name: slideInRight; }
// .animate-slideOutRight { animation-name: slideOutRight; }

export default MonthView;
