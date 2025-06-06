import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  format,
  addHours,
  startOfDay,
  endOfDay,
  parseISO,
  isSameHour,
  isAfter,
  isBefore,
  addMinutes,
  differenceInMinutes,
  addDays as dfnsAddDays,
  isSameDay as dfnsIsSameDay,
  setHours,
  setMinutes,
  setSeconds,
} from "date-fns";
import { useCalendarContext } from "../../context/CalendarContext";
import EventForm from "../EventCreation/EventForm";

// Define a simple popover for event preview
const EventPreviewPopover = ({ event, position }) => {
  if (!event) return null;

  return (
    <div
      className="fixed z-30 p-3 bg-white rounded-lg shadow-xl border border-gray-200 max-w-xs text-sm pointer-events-none"
      style={{ top: position.top, left: position.left, transform: "translate(15px, 15px)" }}
    >
      <h4 className="font-semibold text-gray-800 mb-1 flex items-center">
        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: event.color || "#3B82F6" }}></span>
        {event.title}
      </h4>
      <p className="text-gray-600 mb-1 pl-5">
        {format(parseISO(event.startTime), "h:mm a")} - {format(parseISO(event.endTime), "h:mm a")}
      </p>
      {event.location && (
        <p className="text-gray-500 text-xs mb-1 flex items-center pl-5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="12" height="12" className="mr-1.5 text-gray-400 flex-shrink-0"><rect width="256" height="256" fill="none"/><circle cx="128" cy="104" r="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
          {event.location}
        </p>
      )}
      {event.description && (
        <p className="text-gray-500 text-xs pl-5 line-clamp-2">{event.description}</p>
      )}
    </div>
  );
};


const DayView = () => {
  const { events, selectedDate, setSelectedDate } = useCalendarContext();
  const [dayEvents, setDayEvents] = useState([]);
  const [clickedEventDetails, setClickedEventDetails] = useState(null);
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });

  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [selectionRange, setSelectionRange] = useState({ start: null, end: null });
  const gridRef = useRef(null);
  const hourSlotRefs = useRef({});

  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEventInitialData, setNewEventInitialData] = useState(null);


  useEffect(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    
    const filteredEvents = events.filter(event => {
      const eventStart = parseISO(event.startTime);
      const eventEnd = parseISO(event.endTime);
      return (isAfter(eventEnd, dayStart) && isBefore(eventStart, dayEnd));
    });
    
    setDayEvents(filteredEvents);
  }, [selectedDate, events]);
  
  const getEventsForHourSlot = (hour) => {
    const hourStart = addHours(startOfDay(selectedDate), hour);
    return dayEvents.filter(event => {
      const eventStart = parseISO(event.startTime);
      const eventEnd = parseISO(event.endTime);
      const hourEnd = addHours(hourStart, 1);
      // Event starts in this hour OR event ends in this hour OR event spans this entire hour
      return (
        (isSameHour(eventStart, hourStart)) || // Starts in this hour
        (isBefore(eventStart, hourStart) && isAfter(eventEnd, hourStart) ) // Spans from before into this hour
      );
    });
  };
  
 const calculateEventPosition = (event, hour) => {
    const eventStart = parseISO(event.startTime);
    const slotStartTime = addHours(startOfDay(selectedDate), hour);

    let minutesFromSlotStart = 0;
    if (isAfter(eventStart, slotStartTime) || isSameHour(eventStart, slotStartTime)) {
        minutesFromSlotStart = differenceInMinutes(eventStart, slotStartTime);
    }
    // If event starts before this slot, minutesFromSlotStart is effectively negative, so it should be 0 for top positioning
    minutesFromSlotStart = Math.max(0, minutesFromSlotStart); 

    const startPercentage = (minutesFromSlotStart / 60) * 100;
    return { top: `${startPercentage}%` };
};
  
  const calculateEventHeight = (event, hour) => {
    const eventStart = parseISO(event.startTime);
    const eventEnd = parseISO(event.endTime);
    const slotStartTime = addHours(startOfDay(selectedDate), hour);
    const slotEndTime = addHours(slotStartTime, 1);

    const effectiveStart = isBefore(eventStart, slotStartTime) ? slotStartTime : eventStart;
    const effectiveEnd = isAfter(eventEnd, slotEndTime) ? slotEndTime : eventEnd;
    
    const durationMinutesInSlot = differenceInMinutes(effectiveEnd, effectiveStart);
    if (durationMinutesInSlot <= 0) return { height: "0%" };

    const heightPercentage = (durationMinutesInSlot / 60) * 100;
    return { height: `${Math.min(heightPercentage, 100)}%` };
  };
  
  const handleEventCardClick = (event) => {
    setClickedEventDetails(event);
  };
  
  const closeEventDetailsModal = () => {
    setClickedEventDetails(null);
  };
  
  const navigateDay = (direction) => {
    const newDate = dfnsAddDays(selectedDate, direction);
    setSelectedDate(newDate);
  };
    
  const getCurrentTimePosition = () => {
    const now = new Date();
    if (!dfnsIsSameDay(now, selectedDate)) return null;
    
    const dayStart = startOfDay(now);
    const minutesSinceDayStart = differenceInMinutes(now, dayStart);
    const hourPosition = Math.floor(minutesSinceDayStart / 60);
    const minutePosition = minutesSinceDayStart % 60;
    
    return {
      hour: hourPosition,
      percentage: (minutePosition / 60) * 100
    };
  };
  
  const currentTimePosition = getCurrentTimePosition();

  const getMinuteFromYPosition = (clientY, hourSlotElement) => {
    if (!hourSlotElement) return 0;
    const slotRect = hourSlotElement.getBoundingClientRect();
    const relativeY = clientY - slotRect.top;
    const slotHeight = slotRect.height;
    if (slotHeight === 0) return 0; // Avoid division by zero
    const minute = Math.round((relativeY / slotHeight) * 60);
    return Math.max(0, Math.min(59, minute));
  };

  const handleMouseDownOnSlot = (e, hour) => {
    if (e.target.closest(".event-card-selector")) return;

    const slotElement = hourSlotRefs.current[hour];
    if (!slotElement) return;

    const startMinute = getMinuteFromYPosition(e.clientY, slotElement);
    let startTime = setSeconds(setMinutes(setHours(startOfDay(selectedDate), hour), startMinute), 0);
    
    setSelectionRange({ start: startTime, end: addMinutes(startTime, 1) }); // Min 1 min selection
    setIsSelectingRange(true);
    e.preventDefault();
  };

  const handleGlobalMouseMove = useCallback((e) => {
    if (!isSelectingRange || !selectionRange.start || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    if(!gridRect) return;

    const relativeYInGrid = e.clientY - gridRect.top;
    
    const firstHourSlot = gridRef.current.querySelector(".hour-content-area");
    if (!firstHourSlot) return;
    const singleHourSlotHeight = firstHourSlot.offsetHeight;
    if (singleHourSlotHeight === 0) return;
    
    let currentHour = Math.floor(relativeYInGrid / singleHourSlotHeight);
    currentHour = Math.max(0, Math.min(23, currentHour));

    const hourSlotElement = hourSlotRefs.current[currentHour];
    if (!hourSlotElement) return;

    const currentMinute = getMinuteFromYPosition(e.clientY, hourSlotElement);
    let endTime = setSeconds(setMinutes(setHours(startOfDay(selectedDate), currentHour), currentMinute), 0);

    if (isBefore(endTime, selectionRange.start)) {
      setSelectionRange(prev => ({ start: endTime, end: prev.start }));
    } else {
      setSelectionRange(prev => ({ ...prev, end: endTime }));
    }

  }, [isSelectingRange, selectionRange, selectedDate]);

  const handleGlobalMouseUp = useCallback(() => {
    if (!isSelectingRange) return;

    setIsSelectingRange(false);
    if (selectionRange.start && selectionRange.end) {
        const normStart = isBefore(selectionRange.start, selectionRange.end) ? selectionRange.start : selectionRange.end;
        const normEnd = isAfter(selectionRange.end, selectionRange.start) ? selectionRange.end : selectionRange.start;

        if (differenceInMinutes(normEnd, normStart) >= 5) { // Minimum 5 minutes duration
            setNewEventInitialData({ 
                startTime: normStart.toISOString(), 
                endTime: normEnd.toISOString(),
            });
            setShowNewEventForm(true);
        }
    }
    setSelectionRange({ start: null, end: null });
  }, [isSelectingRange, selectionRange]);

  useEffect(() => {
    if (isSelectingRange) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    } else {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isSelectingRange, handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleEventMouseEnter = (event, e) => {
    setHoveredEvent(event);
    setHoverPosition({ top: e.clientY, left: e.clientX });
  };

  const handleEventMouseLeave = () => {
    setHoveredEvent(null);
  };

  const renderSelectionRectangle = () => {
    if (!isSelectingRange || !selectionRange.start || !selectionRange.end || !gridRef.current) return null;
    
    const firstHourSlot = gridRef.current.querySelector(".hour-content-area");
    if (!firstHourSlot) return null;
    const slotHeight = firstHourSlot.offsetHeight;
    if(slotHeight === 0) return null;

    const normStart = isBefore(selectionRange.start, selectionRange.end) ? selectionRange.start : selectionRange.end;
    const normEnd = isAfter(selectionRange.end, selectionRange.start) ? selectionRange.end : selectionRange.start;

    const startHour = normStart.getHours();
    const startMinute = normStart.getMinutes();
    const endHour = normEnd.getHours();
    const endMinute = normEnd.getMinutes();

    const topOffset = (startHour * slotHeight) + ((startMinute / 60) * slotHeight);
    const endOffset = (endHour * slotHeight) + ((endMinute / 60) * slotHeight);
    
    const rectHeight = Math.max(0, endOffset - topOffset);
    if(rectHeight <= 0) return null;

    return (
      <div
        className="absolute left-20 right-0 bg-blue-500 bg-opacity-30 border-2 border-blue-600 rounded pointer-events-none z-10"
        style={{
          top: `${topOffset}px`,
          height: `${rectHeight}px`,
        }}
      />
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-20 pb-3 border-b border-gray-300">
        <button 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
          onClick={() => navigateDay(-1)}
          aria-label="Previous day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20" fill="currentColor"><rect width="256" height="256" fill="none"/><polyline points="160 208 80 128 160 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">
            {format(selectedDate, "EEEE")}
          </h2>
          <p className="text-gray-600 text-sm">
            {format(selectedDate, "MMMM d, yyyy")}
          </p>
          {dfnsIsSameDay(selectedDate, new Date()) && (
            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mt-1">
              Today
            </span>
          )}
        </div>
        
        <button 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
          onClick={() => navigateDay(1)}
          aria-label="Next day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20" fill="currentColor"><rect width="256" height="256" fill="none"/><polyline points="96 48 176 128 96 208" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto relative" ref={gridRef}>
        {hours.map((hour) => (
          <div key={hour} className="flex items-stretch border-t border-gray-300 min-h-[4rem]">
            <div className="w-20 text-right pr-3 pt-1 sticky left-0 bg-white z-10 flex-shrink-0">
              <span className="text-xs font-semibold text-gray-700">
                {format(addHours(startOfDay(selectedDate), hour), "h a")}
              </span>
            </div>
            
            <div 
              className="flex-grow min-w-0 relative hour-content-area border-l border-gray-300"
              ref={el => hourSlotRefs.current[hour] = el}
              onMouseDown={(e) => handleMouseDownOnSlot(e, hour)}
              style={{ height: "4rem" }} // Explicit height for consistency
            >
              <div className="border-t border-gray-200 border-dashed absolute w-full top-1/2 h-px pointer-events-none"></div>
              
              {getEventsForHourSlot(hour).map((event) => (
                <div
                  key={event.id}
                  className="event-card-selector absolute left-1 right-1 p-1.5 rounded-md cursor-pointer shadow-sm overflow-hidden border-l-4 hover:shadow-lg transition-shadow duration-200"
                  style={{
                    ...calculateEventPosition(event, hour),
                    ...calculateEventHeight(event, hour),
                    backgroundColor: `${event.color || "#3B82F6"}20`, // Lighter with more opacity
                    borderLeftColor: event.color || "#3B82F6",
                    zIndex: 5
                  }}
                  onClick={() => handleEventCardClick(event)}
                  onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                  onMouseLeave={handleEventMouseLeave}
                >
                  <div className="font-semibold text-xs truncate" style={{color: event.color || "#3B82F6"}}>
                    {event.title}
                  </div>
                  <div className="text-xs text-gray-700 truncate">
                    {format(parseISO(event.startTime), "h:mm a")} - {format(parseISO(event.endTime), "h:mm a")}
                  </div>
                  {event.location && (
                    <div className="text-2xs text-gray-500 truncate flex items-center mt-0.5">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="10" height="10" className="mr-1 text-gray-400 flex-shrink-0"><rect width="256" height="256" fill="none"/><circle cx="128" cy="104" r="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="20"/><path d="M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {renderSelectionRectangle()}
        
        {currentTimePosition && (
          <div 
            className="absolute left-20 right-0 flex items-center z-20 pointer-events-none"
            style={{ top: `${(currentTimePosition.hour * 4)}rem`, transform: `translateY(${(currentTimePosition.percentage / 100) * 4}rem)` }}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white shadow-md -ml-[5px]"></div>
            <div className="h-0.5 bg-red-500 flex-grow"></div>
          </div>
        )}
      </div>
      
      {clickedEventDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800" style={{color: clickedEventDetails.color || "#3B82F6"}}>{clickedEventDetails.title}</h3>
              <button 
                onClick={closeEventDetailsModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close event details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24" fill="currentColor"><rect width="256" height="256" fill="none"/><line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="200" y1="200" x2="56" y2="56" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16" className="mr-2 text-gray-500 flex-shrink-0"><rect width="256" height="256" fill="none"/><rect x="40" y="40" width="176" height="176" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="176" y1="24" x2="176" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="80" y1="24" x2="80" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="40" y1="88" x2="216" y2="88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
                <span>{format(parseISO(clickedEventDetails.startTime), "EEEE, MMMM d, yyyy")}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16" className="mr-2 text-gray-500 flex-shrink-0"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><polyline points="128 72 128 128 184 128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
                <span>{format(parseISO(clickedEventDetails.startTime), "h:mm a")} - {format(parseISO(clickedEventDetails.endTime), "h:mm a")}</span>
              </div>
              
              {clickedEventDetails.location && (
                <div className="flex items-center text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16" className="mr-2 text-gray-500 flex-shrink-0"><rect width="256" height="256" fill="none"/><circle cx="128" cy="104" r="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
                  <span>{clickedEventDetails.location}</span>
                </div>
              )}
              
              {clickedEventDetails.description && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{clickedEventDetails.description}</p>
                </div>
              )}

              {clickedEventDetails.reminder && (
                <div className="flex items-center text-gray-700 pt-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="16" height="16" className="mr-2 text-gray-500 flex-shrink-0"><rect width="256" height="256" fill="none"/><line x1="96" y1="228" x2="160" y2="228" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M184,24a102.71,102.71,0,0,1,36.29,40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M35.71,64A102.71,102.71,0,0,1,72,24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M52,188a8,8,0,0,1-6.38-12.81C53.85,164.49,63.84,144.6,64,112a64,64,0,0,1,128,0c.16,32.6,10.15,52.49,18.35,63.19A8,8,0,0,1,204,188Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
                  <span>Reminder: {clickedEventDetails.reminder} before</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                onClick={closeEventDetailsModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <EventPreviewPopover event={hoveredEvent} position={hoverPosition} />

      {showNewEventForm && newEventInitialData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <EventForm 
            initialEvent={{
                title: "", 
                startTime: newEventInitialData.startTime,
                endTime: newEventInitialData.endTime,
                location: "",
                description: "",
                color: "#3B82F6"
            }}
            onClose={() => {
                setShowNewEventForm(false);
                setNewEventInitialData(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DayView;
