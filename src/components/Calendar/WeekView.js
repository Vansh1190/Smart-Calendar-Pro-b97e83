import React, { useState, useEffect, useRef } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  startOfDay,
  differenceInMinutes,
  isBefore,
  isAfter,
  getHours,
  getMinutes,
  set
} from "date-fns";
import { useCalendarContext } from "../../context/CalendarContext";

const EventCard = ({ event, onClick, onMouseEnter, onMouseLeave, style }) => (
  <div
    className="absolute p-1.5 rounded-md text-xs cursor-pointer transition-all duration-200 hover:shadow-lg overflow-hidden event-card-selector"
    style={{
      backgroundColor: `${event.color || "#3B82F6"}E6`, // More opaque
      color: "white",
      borderLeft: `3px solid ${event.color || "#3B82F6"}`,
      ...style
    }}
    onClick={() => onClick(event)}
    onMouseEnter={(e) => onMouseEnter(event, e)}
    onMouseLeave={onMouseLeave}
    title={`${event.title} (${format(parseISO(event.startTime), "HH:mm")} - ${format(parseISO(event.endTime), "HH:mm")})`}
  >
    <div className="font-semibold truncate">{event.title}</div>
    <div className="text-2xs truncate">
      {format(parseISO(event.startTime), "HH:mm")} - {format(parseISO(event.endTime), "HH:mm")}
    </div>
    {event.location && (
      <div className="text-2xs truncate flex items-center mt-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="10" height="10" className="mr-1 opacity-80 flex-shrink-0"><rect width="256" height="256" fill="none"/><circle cx="128" cy="104" r="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="20"/><path d="M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
        {event.location}
      </div>
    )}
  </div>
);

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


const WeekView = () => {
  const [weekDays, setWeekDays] = useState([]);
  const { events, selectedDate, onEventClick } = useCalendarContext();
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });

  const [dayLayouts, setDayLayouts] = useState({});
  const gridRef = useRef(null);
  const [hourSlotHeight, setHourSlotHeight] = useState(64); // Default height in pixels (4rem for h-16)

  useEffect(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Assuming Monday start
    const days = [...Array(7)].map((_, index) => addDays(start, index));
    setWeekDays(days);
  }, [selectedDate]);

  useEffect(() => {
    if (gridRef.current) {
        const firstHourSlot = gridRef.current.querySelector(".hour-slot-measurable");
        if (firstHourSlot) {
            setHourSlotHeight(firstHourSlot.offsetHeight);
        }
    }
    // Recalculate layout on events or weekDays change
    const newDayLayouts = {};
    weekDays.forEach(day => {
      newDayLayouts[format(day, "yyyy-MM-dd")] = calculateLayoutForDay(
        events.filter(event => isSameDay(parseISO(event.startTime), day))
      );
    });
    setDayLayouts(newDayLayouts);

  }, [events, weekDays, hourSlotHeight]); // Recalc if hourSlotHeight changes due to responsiveness


  const calculateLayoutForDay = (dayEvents) => {
    const sortedEvents = dayEvents.sort((a, b) =>
      parseISO(a.startTime) - parseISO(b.startTime) || parseISO(b.endTime) - parseISO(a.endTime)
    );

    const columns = [];
    for (const event of sortedEvents) {
      let placed = false;
      for (const col of columns) {
        const lastEventInCol = col[col.length - 1];
        if (!eventsOverlap(event, lastEventInCol)) {
          col.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([event]);
      }
    }
    return columns;
  };

  const eventsOverlap = (eventA, eventB) => {
    const startA = parseISO(eventA.startTime);
    const endA = parseISO(eventA.endTime);
    const startB = parseISO(eventB.startTime);
    const endB = parseISO(eventB.endTime);
    return isBefore(startA, endB) && isAfter(endA, startB);
  };

  const getEventStyle = (event, day, columnIndex, totalColumns) => {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);
    const dayStart = startOfDay(day);
    
    const topOffsetMinutes = Math.max(0, differenceInMinutes(start, dayStart));
    const durationMinutes = differenceInMinutes(end, start);

    const top = (topOffsetMinutes / (24 * 60)) * 100; // Percentage of total day height
    const height = (durationMinutes / (24 * 60)) * 100;

    const colWidth = 100 / totalColumns;
    const left = columnIndex * colWidth;

    return {
      top: `${top}%`,
      height: `${height}%`,
      left: `${left}%`,
      width: `${colWidth}%`,
    };
  };


  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  const getCurrentTimePosition = () => {
    const now = new Date();
    const dayStartToday = startOfDay(now);
    const minutesSinceDayStart = differenceInMinutes(now, dayStartToday);
    const topPercentage = (minutesSinceDayStart / (24 * 60)) * 100;
    return { topPercentage, today: now };
  };
  const currentTime = getCurrentTimePosition();

  const handleEventMouseEnter = (event, e) => {
    setHoveredEvent(event);
    setHoverPosition({ top: e.clientY, left: e.clientX });
  };

  const handleEventMouseLeave = () => {
    setHoveredEvent(null);
  };

  const handleEventCardClick = (event) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      console.log("Event clicked:", event);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-2 sm:p-4 flex flex-col h-full overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-px mb-2 sticky top-0 bg-white z-20 border-b border-gray-300">
        <div className="w-12 sm:w-16 text-xs text-gray-500 py-2 text-center">Time</div> {/* Time gutter */}
        {weekDays.map((day) => (
          <div
            key={day.toString()}
            className="text-center p-1 sm:p-2"
          >
            <div className="font-semibold text-gray-700 text-xs sm:text-sm">
              {format(day, "EEE")}
            </div>
            <div className={`text-xs sm:text-base font-medium ${
              isSameDay(day, new Date()) ? "bg-blue-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center mx-auto" : "text-gray-600"
            }`}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="flex-grow overflow-auto relative" ref={gridRef}>
        <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-px relative">
          {/* Time Labels */}
          <div className="relative">
            {timeSlots.map((hour) => (
              <div
                key={`time-${hour}`}
                className="h-12 sm:h-16 text-right pr-2 text-xs sm:text-sm text-gray-500 border-r border-gray-200 flex items-center justify-end sticky left-0 bg-white z-10 hour-slot-measurable"
              >
                {format(set(new Date(), { hours: hour, minutes: 0 }), "h a")}
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className="relative border-l border-gray-200"
            >
              {/* Hourly grid lines */}
              {timeSlots.map((hour) => (
                <div
                  key={`${day}-${hour}-line`}
                  className="h-12 sm:h-16 border-t border-gray-200"
                >
                  {/* Quarter/Half hour lines for finer detail */}
                  <div className="absolute left-0 right-0 top-1/4 h-px border-t border-gray-100 border-dashed"></div>
                  <div className="absolute left-0 right-0 top-1/2 h-px border-t border-gray-100 border-dashed"></div>
                  <div className="absolute left-0 right-0 top-3/4 h-px border-t border-gray-100 border-dashed"></div>
                </div>
              ))}

              {/* Current Time Indicator for Today's Column */}
              {isSameDay(day, currentTime.today) && hourSlotHeight > 0 && (
                 <div 
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                    style={{ top: `${(currentTime.topPercentage / 100) * (24 * hourSlotHeight)}px` }}
                  >
                    <div className="absolute -left-1 -top-[3px] w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              )}

              {/* Events for this day */}
              {(dayLayouts[format(day, "yyyy-MM-dd")] || []).map((column, colIndex) =>
                column.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={onEventClick || handleEventCardClick}
                    onMouseEnter={handleEventMouseEnter}
                    onMouseLeave={handleEventMouseLeave}
                    style={getEventStyle(event, day, colIndex, (dayLayouts[format(day, "yyyy-MM-dd")] || []).length)}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      </div>
      <EventPreviewPopover event={hoveredEvent} position={hoverPosition} />
    </div>
  );
};

export default WeekView;
