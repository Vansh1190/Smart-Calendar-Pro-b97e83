import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { addDays, subDays, startOfMonth, endOfMonth, parseISO } from "date-fns";
import * as storageService from "../services/storageService";
import * as nlpService from "../services/nlpService";
import * as conflictService from "../services/conflictDetectionService";

const CalendarContext = createContext();

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendarContext must be used within a CalendarContextProvider");
  }
  return context;
};

export const CalendarContextProvider = ({ children }) => {
  // State
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [settings, setSettings] = useState(null);
  const [reminderPreferences, setReminderPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data and all events on mount
  useEffect(() => {
    const initializeCalendar = async () => {
      setLoading(true);
      try {
        await storageService.initStorage();

        const savedSettings = await storageService.getSettings();
        setSettings(savedSettings);

        const savedPreferences = await storageService.getReminderPreferences();
        setReminderPreferences(savedPreferences);

        // Load all events initially
        const allEvents = await storageService.getEvents();
        setEvents(allEvents);

        setError(null);
      } catch (err) {
        console.error("Failed to initialize calendar:", err);
        setError("Failed to load calendar data. " + (err.message || ""));
      } finally {
        setLoading(false);
      }
    };

    initializeCalendar();
  }, []);


  // Load events for a specific month (can be used by views if needed for optimization)
  const loadEventsForMonth = useCallback(async (date) => {
    setLoading(true);
    try {
      const start = startOfMonth(date);
      const end = endOfMonth(date); // Fetch for a slightly larger range to cover multi-day events crossing month boundaries
      const monthEvents = await storageService.getEventsInRange(startOfMonth(subDays(start, 7)), endOfMonth(addDays(end, 7)));
      setEvents(monthEvents); // This might overwrite all events, consider if this is desired or if it should merge.
                              // For now, it replaces, assuming views will trigger this for specific month displays.
                              // If general event list is desired, fetch all and filter in views.
      setError(null);
    } catch (err) {
      console.error("Failed to load events for month:", err);
      setError("Failed to load events. " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  }, []);


  // Add new event
  const addEvent = useCallback(async (eventData) => {
    setError(null);
    try {
      const allCurrentEvents = await storageService.getEvents(); // Fetch fresh for conflict check
      const conflicts = conflictService.detectConflicts(eventData, allCurrentEvents);
      if (conflicts.length > 0) {
        const suggestedTimes = conflictService.suggestAvailableSlots(
          eventData.startTime,
          (parseISO(eventData.endTime).getTime() - parseISO(eventData.startTime).getTime()) / (60 * 1000), // duration in minutes
          allCurrentEvents
        );
        return {
          success: false,
          error: "Scheduling conflict detected.",
          conflicts,
          suggestedTimes
        };
      }

      const savedEvent = await storageService.saveEvent(eventData); // saveEvent handles ID generation
      setEvents(prevEvents => [...prevEvents, savedEvent]);
      return { success: true, event: savedEvent };
    } catch (err) {
      console.error("Failed to add event:", err);
      setError("Failed to add event. " + (err.message || ""));
      return { success: false, error: "Failed to add event: " + (err.message || "") };
    }
  }, []);

  // Update existing event
  const updateEvent = useCallback(async (eventData) => { // Renamed from editEvent for consistency
    setError(null);
    if (!eventData.id) {
      console.error("Update failed: Event ID is missing.");
      return { success: false, error: "Event ID is missing for update." };
    }
    try {
      const allCurrentEvents = await storageService.getEvents(); // Fetch fresh for conflict check
      const otherEvents = allCurrentEvents.filter(e => e.id !== eventData.id);
      const conflicts = conflictService.detectConflicts(eventData, otherEvents);
      
      if (conflicts.length > 0) {
        const suggestedTimes = conflictService.suggestAvailableSlots(
          eventData.startTime,
          (parseISO(eventData.endTime).getTime() - parseISO(eventData.startTime).getTime()) / (60 * 1000), // duration in minutes
          otherEvents
        );
        return {
          success: false,
          error: "Scheduling conflict detected.",
          conflicts,
          suggestedTimes
        };
      }

      const updatedEvent = await storageService.saveEvent(eventData); // saveEvent handles updates if ID exists
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );
      return { success: true, event: updatedEvent };
    } catch (err) {
      console.error("Failed to update event:", err);
      setError("Failed to update event. " + (err.message || ""));
      return { success: false, error: "Failed to update event: " + (err.message || "") };
    }
  }, []);


  // Remove event
  const removeEvent = useCallback(async (eventId) => { // Renamed from deleteEvent for consistency
    setError(null);
    if (!eventId) {
      console.error("Remove failed: Event ID is missing.");
      return { success: false, error: "Event ID is missing for removal." };
    }
    try {
      await storageService.deleteEvent(eventId);
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      return { success: true };
    } catch (err) {
      console.error("Failed to remove event:", err);
      setError("Failed to remove event. " + (err.message || ""));
      return { success: false, error: "Failed to remove event: " + (err.message || "") };
    }
  }, []);


  // Update settings
  const updateSettings = useCallback(async (newSettings) => {
    setError(null);
    try {
      const savedSettings = await storageService.saveSettings(newSettings);
      setSettings(savedSettings);
      return { success: true, settings: savedSettings };
    } catch (err) {
      console.error("Failed to update settings:", err);
      setError("Failed to update settings. " + (err.message || ""));
      return { success: false, error: "Failed to update settings: " + (err.message || "") };
    }
  }, []);

  // Update reminder preferences
  const updateReminderPreferences = useCallback(async (newPreferences) => {
    setError(null);
    try {
      const savedPreferences = await storageService.saveReminderPreferences(newPreferences);
      setReminderPreferences(savedPreferences);
      return { success: true, preferences: savedPreferences };
    } catch (err) {
      console.error("Failed to update reminder preferences:", err);
      setError("Failed to update reminder preferences. " + (err.message || ""));
      return { success: false, error: "Failed to update reminder preferences: " + (err.message || "") };
    }
  }, []);

  // Navigate to next/previous day/month/year based on current view logic
  const navigateDate = useCallback((newDate) => {
    const oldMonth = selectedDate.getMonth();
    setSelectedDate(newDate);
    // Potentially reload events if month/year changes significantly,
    // depending on how `loadEventsForMonth` or overall event fetching strategy is defined.
    // For now, assuming initial load gets all events or views manage their specific needs.
    if (newDate.getMonth() !== oldMonth) {
        // If views depend on `loadEventsForMonth` for filtering, uncomment and adapt
        // loadEventsForMonth(newDate); 
    }
  }, [selectedDate /*, loadEventsForMonth (if used here) */]);


  // Process natural language input
  const processNaturalLanguageInput = useCallback(async (input) => {
    setError(null);
    try {
      const parsedResult = await nlpService.parseNaturalLanguage(input);
      if (parsedResult.success && parsedResult.event) {
        // Validate event further if necessary before adding
        const validation = nlpService.validateEvent(parsedResult.event);
        if (!validation.isValid) {
          return { success: false, error: "Invalid event data from NLP: " + validation.errors.join(", ") };
        }
        return await addEvent(parsedResult.event); // Calls the context's addEvent
      }
      return parsedResult; // Returns { success: false, error: ... } from nlpService
    } catch (err) {
      console.error("Failed to process natural language input:", err);
      setError("Failed to process input. " + (err.message || ""));
      return { success: false, error: "Failed to process input: " + (err.message || "") };
    }
  }, [addEvent]);

  // Get past events
  const getPastEvents = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      const past = await storageService.getPastEventsInRange(startDate, endDate);
      setLoading(false);
      return past;
    } catch (err) {
      console.error("Failed to get past events:", err);
      setError("Failed to load past events. " + (err.message || ""));
      setLoading(false);
      return [];
    }
  }, []);

  const contextValue = {
    events,
    selectedDate,
    settings,
    reminderPreferences,
    loading,
    error,
    setSelectedDate: navigateDate, // Use navigateDate for setting selectedDate to potentially trigger reloads
    addEvent,
    updateEvent,
    removeEvent,
    updateSettings,
    updateReminderPreferences,
    processNaturalLanguageInput,
    getPastEvents,
    loadEventsForMonth // Expose if views need to trigger month-specific loads
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

export default CalendarContext;
