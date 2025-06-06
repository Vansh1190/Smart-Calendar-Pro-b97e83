import React, { useState, useMemo } from "react";
import { useCalendarContext } from "../../context/CalendarContext";
import {
  format,
  parseISO,
  addDays,
  isSameDay,
  isAfter,
  isBefore,
  startOfToday,
  endOfToday,
  endOfWeek,
} from "date-fns";
import EventForm from "../EventCreation/EventForm"; // For the full event form modal

const CollapsibleSection = ({ title, children, icon, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        <span className="flex items-center">
          {icon && React.cloneElement(icon, { className: "mr-2 w-5 h-5 text-gray-500" })}
          {title}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          width="16"
          height="16"
          className={`transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <rect width="256" height="256" fill="none"/>
          <polyline points="208 96 128 176 48 96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/>
        </svg>
      </button>
      {isOpen && <div className="mt-1.5 pl-3 pr-1 space-y-2">{children}</div>}
    </div>
  );
};


const Sidebar = () => {
  const { events, processNaturalLanguageInput, selectedDate, setSelectedDate, updateSettings, settings } = useCalendarContext();
  const [isQuickEventOpen, setIsQuickEventOpen] = useState(false);
  const [quickEventText, setQuickEventText] = useState("");
  const [quickEventError, setQuickEventError] = useState("");
  const [quickEventSuccess, setQuickEventSuccess] = useState("");

  const [showFullEventForm, setShowFullEventForm] = useState(false);
  const [activeNavLink, setActiveNavLink] = useState("dashboard"); // Example state for nav links

  const today = startOfToday();
  const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 }); // Assuming Monday start

  const { todayEvents, upcomingEventsThisWeek, upcomingEventsLater } = useMemo(() => {
    const sortedEvents = [...events].sort((a, b) => parseISO(a.startTime) - parseISO(b.startTime));
    
    const todayEvs = sortedEvents.filter(event => isSameDay(parseISO(event.startTime), today));
    
    const upcomingThisWeek = sortedEvents.filter(event => {
      const eventDate = parseISO(event.startTime);
      return isAfter(eventDate, endOfToday()) && isBefore(eventDate, endOfThisWeek);
    });

    const upcomingLater = sortedEvents.filter(event => {
      const eventDate = parseISO(event.startTime);
      return isAfter(eventDate, endOfThisWeek);
    });

    return { todayEvents: todayEvs, upcomingEventsThisWeek: upcomingThisWeek, upcomingEventsLater: upcomingLater };
  }, [events, today, endOfThisWeek]);


  const handleQuickEventSubmit = async (e) => {
    e.preventDefault();
    setQuickEventError("");
    setQuickEventSuccess("");

    if (!quickEventText.trim()) {
      setQuickEventError("Please enter event details.");
      return;
    }

    const result = await processNaturalLanguageInput(quickEventText);

    if (result.success && result.event) {
      setQuickEventSuccess(`Event "${result.event.title}" added!`);
      setQuickEventText("");
      setTimeout(() => {
        setIsQuickEventOpen(false);
        setQuickEventSuccess("");
      }, 3000);
    } else {
      setQuickEventError(result.error || "Could not add event.");
      if (result.conflicts && result.conflicts.length > 0) {
         setQuickEventError(`Conflict: Overlaps with "${result.conflicts[0].title}".`);
      }
    }
  };

  const EventMiniCard = ({ event }) => (
    <div
      className="p-2.5 mb-1.5 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border-l-4"
      style={{ borderColor: event.color || "#3B82F6" }}
      onClick={() => setSelectedDate(parseISO(event.startTime))}
      title={`View ${event.title} on calendar`}
    >
      <h4 className="font-medium text-gray-800 text-xs">{event.title}</h4>
      <p className="text-2xs text-gray-500">
        {format(parseISO(event.startTime), "h:mm a")} - {format(parseISO(event.endTime), "h:mm a")}
      </p>
      {event.location && (
        <div className="flex items-center mt-0.5 text-2xs text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="10" height="10" className="mr-1 text-gray-400"><rect width="256" height="256" fill="none"/><circle cx="128" cy="104" r="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="20"/><path d="M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
          <span className="truncate">{event.location}</span>
        </div>
      )}
    </div>
  );

  const navLinks = [
    { id: "dashboard", label: "Dashboard", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M32,128a64,64,0,0,1,64-64H208" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><path d="M224,128a64,64,0,0,1-64,64H48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><line x1="128" y1="32" x2="128" y2="224" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>, action: () => console.log("Dashboard clicked") },
    { id: "settings", label: "Settings", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M128,72a20,20,0,1,0,20,20A20,20,0,0,0,128,72Zm0,112a20,20,0,1,0,20,20A20,20,0,0,0,128,184Zm88-80a20,20,0,1,0-20-20A20,20,0,0,0,216,104Zm-56,56a20,20,0,1,0-20-20A20,20,0,0,0,160,160ZM96,104a20,20,0,1,0-20-20A20,20,0,0,0,96,104Z"/></svg>, action: () => console.log("Settings clicked") },
    { id: "reminders", label: "Reminders", icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="96" y1="228" x2="160" y2="228" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><path d="M184,24a102.71,102.71,0,0,1,36.29,40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><path d="M35.71,64A102.71,102.71,0,0,1,72,24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><path d="M52,188a8,8,0,0,1-6.38-12.81C53.85,164.49,63.84,144.6,64,112a64,64,0,0,1,128,0c.16,32.6,10.15,52.49,18.35,63.19A8,8,0,0,1,204,188Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>, action: () => console.log("Reminders clicked") },
  ];

  return (
    <div className="w-full sm:w-64 md:w-72 bg-gray-50 h-full border-r border-gray-200 p-3 sm:p-4 flex flex-col">
      {/* Quick Actions & Logo */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
           <h1 className="text-xl font-bold text-blue-600">SmartCal</h1>
            <button 
                onClick={() => console.log("User Profile/Menu Clicked")} 
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                title="User Account"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="36" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><rect x="32" y="32" width="192" height="192" rx="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/><circle cx="180" cy="76" r="16"/></svg>
            </button>
        </div>
        <button
          onClick={() => setShowFullEventForm(true)}
          className="w-full bg-blue-500 text-white rounded-lg py-2.5 px-4 text-sm font-medium flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="18" height="18" className="mr-2 fill-current"><rect width="256" height="256" fill="none"/><line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><line x1="128" y1="40" x2="128" y2="216" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>
          Create Event
        </button>
      </div>

      {/* Quick Event Add */}
      <CollapsibleSection 
        title="Quick Add" 
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M192,32H64A24,24,0,0,0,40,56V200a24,24,0,0,0,24,24H192a24,24,0,0,0,24-24V56A24,24,0,0,0,192,32Zm-32,96H128v32a8,8,0,0,1-16,0V128H80a8,8,0,0,1,0-16h32V80a8,8,0,0,1,16,0v32h32a8,8,0,0,1,0,16Z"/></svg>}
      >
        <form onSubmit={handleQuickEventSubmit} className="space-y-2">
          <textarea
            value={quickEventText}
            onChange={(e) => setQuickEventText(e.target.value)}
            placeholder="e.g., Team lunch next Friday 1pm at Cafe Central"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs"
            rows="2"
          />
          {quickEventError && <p className="text-xs text-red-600">{quickEventError}</p>}
          {quickEventSuccess && <p className="text-xs text-green-600">{quickEventSuccess}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white rounded-md py-1.5 text-xs font-medium hover:bg-indigo-600 transition-colors"
          >
            Add Event
          </button>
        </form>
      </CollapsibleSection>

      {/* Today's Events */}
      <CollapsibleSection 
        title={`Today (${format(today, "MMM d")})`} 
        defaultOpen={true}
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><rect x="40" y="40" width="176" height="176" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><line x1="176" y1="24" x2="176" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><line x1="80" y1="24" x2="80" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><line x1="40" y1="88" x2="216" y2="88" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><rect x="84" y="120" width="32" height="32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>}
        >
        {todayEvents.length > 0 ? (
          <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1">
            {todayEvents.map(event => <EventMiniCard key={event.id} event={event} />)}
          </div>
        ) : (
          <p className="text-gray-500 text-xs py-2">No events for today.</p>
        )}
      </CollapsibleSection>

      {/* Upcoming Events */}
      <CollapsibleSection 
        title="Upcoming" 
        defaultOpen={true}
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M48,80V56a8,8,0,0,1,8-8H200a8,8,0,0,1,8,8V200a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V176" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><line x1="16" y1="120" x2="128" y2="120" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><polyline points="80 72 128 120 80 168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><line x1="176" y1="24" x2="176" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><line x1="80" y1="24" x2="80" y2="56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>}
        >
        {upcomingEventsThisWeek.length > 0 && (
            <>
                <h5 className="text-2xs font-semibold text-gray-500 uppercase mt-1 mb-0.5">This Week</h5>
                <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1">
                    {upcomingEventsThisWeek.map(event => <EventMiniCard key={event.id} event={event} />)}
                </div>
            </>
        )}
        {upcomingEventsLater.length > 0 && (
             <>
                <h5 className="text-2xs font-semibold text-gray-500 uppercase mt-2 mb-0.5">Later</h5>
                <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1">
                    {upcomingEventsLater.map(event => <EventMiniCard key={event.id} event={event} />)}
                </div>
            </>
        )}
        {upcomingEventsThisWeek.length === 0 && upcomingEventsLater.length === 0 && (
          <p className="text-gray-500 text-xs py-2">No upcoming events.</p>
        )}
      </CollapsibleSection>
      
      <div className="flex-grow"></div> {/* Spacer */}

      {/* Navigation Links */}
      <nav className="mt-auto border-t border-gray-200 pt-3 space-y-1">
        {navLinks.map(link => (
          <button
            key={link.id}
            onClick={() => { link.action(); setActiveNavLink(link.id); }}
            className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors group
              ${ activeNavLink === link.id
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
          >
            {React.cloneElement(link.icon, { className: `mr-3 w-5 h-5 flex-shrink-0 ${activeNavLink === link.id ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"}` })}
            {link.label}
          </button>
        ))}
      </nav>

      {/* Full Event Form Modal Triggered by Create Event */}
      {showFullEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-2 sm:p-4 overflow-y-auto">
          <EventForm onClose={() => setShowFullEventForm(false)} />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
