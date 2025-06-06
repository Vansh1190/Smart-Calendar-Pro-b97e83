import { compareAsc, compareDesc, parseISO } from "date-fns";
import { v4 as uuidv4 } from "uuid";

// IndexedDB database name and version
const DB_NAME = "smartCalendarProDB";
const DB_VERSION = 1;

// Object store names
const STORES = {
  EVENTS: "events",
  SETTINGS: "settings",
  REMINDER_PREFERENCES: "reminderPreferences",
  RECURRING_PATTERNS: "recurringPatterns",
  PAST_EVENTS: "pastEvents"
};

// Initialize the database
export const initDB = () => {
  return new Promise((resolve, reject) => {
    // Open a connection to the database
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Handle database upgrade needed (first time creation or version upgrade)
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.EVENTS)) {
        const eventsStore = db.createObjectStore(STORES.EVENTS, { keyPath: "id" });
        eventsStore.createIndex("startTime", "startTime", { unique: false });
        eventsStore.createIndex("endTime", "endTime", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORES.REMINDER_PREFERENCES)) {
        db.createObjectStore(STORES.REMINDER_PREFERENCES, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORES.RECURRING_PATTERNS)) {
        const recurringStore = db.createObjectStore(STORES.RECURRING_PATTERNS, { keyPath: "id" });
        recurringStore.createIndex("eventId", "eventId", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PAST_EVENTS)) {
        const pastEventsStore = db.createObjectStore(STORES.PAST_EVENTS, { keyPath: "id" });
        pastEventsStore.createIndex("startTime", "startTime", { unique: false });
      }
    };

    // Handle success
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    // Handle errors
    request.onerror = (event) => {
      console.error("Database error:", event.target.error);
      reject("Could not open database");
    };
  });
};

// Generic function to perform a database transaction
const performTransaction = async (storeName, mode, callback) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      const request = callback(store);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error(`Transaction error in ${storeName}:`, event.target.error);
        reject(event.target.error);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error(`Error in ${storeName} transaction:`, error);
    throw error;
  }
};

// EVENTS OPERATIONS

// Internal function to add a new event (called by saveEvent)
const internalAddEvent = async (eventData) => {
  if (!eventData.id) {
    eventData.id = uuidv4();
  }
  
  if (eventData.startTime instanceof Date) {
    eventData.startTime = eventData.startTime.toISOString();
  }
  if (eventData.endTime instanceof Date) {
    eventData.endTime = eventData.endTime.toISOString();
  }
  
  eventData.createdAt = new Date().toISOString();

  try {
    await performTransaction(STORES.EVENTS, "readwrite", (store) => {
      return store.add(eventData);
    });

    if (eventData.recurring) {
      const recurringPattern = {
        id: uuidv4(),
        eventId: eventData.id,
        pattern: eventData.recurring,
        createdAt: new Date().toISOString()
      };
      await performTransaction(STORES.RECURRING_PATTERNS, "readwrite", (store) => {
        return store.add(recurringPattern);
      });
    }
    return eventData;
  } catch (error) {
    console.error("Failed to add event:", error);
    throw error;
  }
};

// Internal function to update an existing event (called by saveEvent)
const internalUpdateEvent = async (eventData) => {
  if (!eventData.id) {
    throw new Error("Event ID is required for updates");
  }

  if (eventData.startTime instanceof Date) {
    eventData.startTime = eventData.startTime.toISOString();
  }
  if (eventData.endTime instanceof Date) {
    eventData.endTime = eventData.endTime.toISOString();
  }
  eventData.updatedAt = new Date().toISOString();

  try {
    const existingEvent = await getEventById(eventData.id); // Renamed from getEvent to avoid conflict
    if (!existingEvent) {
      throw new Error(`Event with ID ${eventData.id} not found`);
    }

    await performTransaction(STORES.EVENTS, "readwrite", (store) => {
      return store.put(eventData);
    });

    if (eventData.recurring) {
      const recurringPattern = {
        eventId: eventData.id,
        pattern: eventData.recurring,
        updatedAt: new Date().toISOString()
      };
      const patterns = await getAllRecurringPatterns();
      const existingPattern = patterns.find(p => p.eventId === eventData.id);
      if (existingPattern) {
        recurringPattern.id = existingPattern.id;
        recurringPattern.createdAt = existingPattern.createdAt;
      } else {
        recurringPattern.id = uuidv4();
        recurringPattern.createdAt = new Date().toISOString();
      }
      await performTransaction(STORES.RECURRING_PATTERNS, "readwrite", (store) => {
        return store.put(recurringPattern);
      });
    } else { // Handle removal of recurrence
      const patterns = await getAllRecurringPatterns();
      const existingPattern = patterns.find(p => p.eventId === eventData.id);
      if (existingPattern) {
        await performTransaction(STORES.RECURRING_PATTERNS, "readwrite", (store) => {
          return store.delete(existingPattern.id);
        });
      }
    }
    return eventData;
  } catch (error) {
    console.error(`Failed to update event with ID ${eventData.id}:`, error);
    throw error;
  }
};

// Save an event (creates if no ID, updates if ID exists)
export const saveEvent = async (eventData) => {
  if (!eventData || typeof eventData !== "object") {
    console.error("Validation Error: Invalid event data provided.", eventData);
    return Promise.reject(new Error("Invalid event data provided."));
  }
  if (!eventData.title || typeof eventData.title !== "string" || eventData.title.trim() === "") {
    console.error("Validation Error: Event title is required and must be a non-empty string.", eventData.title);
    return Promise.reject(new Error("Event title is required."));
  }
  if (!eventData.startTime) {
    console.error("Validation Error: Event start time is required.", eventData.startTime);
    return Promise.reject(new Error("Event start time is required."));
  }
  if (!eventData.endTime) {
    console.error("Validation Error: Event end time is required.", eventData.endTime);
    return Promise.reject(new Error("Event end time is required."));
  }

  let startTimeObj, endTimeObj;
  try {
    startTimeObj = parseISO(eventData.startTime);
    endTimeObj = parseISO(eventData.endTime);
    if (isNaN(startTimeObj.getTime()) || isNaN(endTimeObj.getTime())) {
        throw new Error("Invalid date format");
    }
  } catch (e) {
    console.error("Validation Error: Invalid start or end time format. Please use ISO string format.", {start: eventData.startTime, end: eventData.endTime});
    return Promise.reject(new Error("Invalid start or end time format."));
  }

  if (compareAsc(startTimeObj, endTimeObj) >= 0) {
    console.error("Validation Error: Event end time must be after start time.", {start: eventData.startTime, end: eventData.endTime});
    return Promise.reject(new Error("End time must be after start time."));
  }
  
  // Ensure dates are ISO strings
  const validatedEventData = {
      ...eventData,
      startTime: startTimeObj.toISOString(),
      endTime: endTimeObj.toISOString(),
  };


  if (validatedEventData.id) {
    return internalUpdateEvent(validatedEventData);
  } else {
    return internalAddEvent(validatedEventData);
  }
};


// Get all events
export const getEvents = async () => {
  try {
    return await performTransaction(STORES.EVENTS, "readonly", (store) => {
      return store.getAll();
    });
  } catch (error) {
    console.error("Failed to get all events:", error);
    return []; // Return empty array on error as a fallback
  }
};

// Get events within a date range
export const getEventsInRange = async (startDate, endDate) => {
  try {
    const allEvents = await getEvents(); // Use the renamed getEvents
    
    const startISO = startDate instanceof Date ? startDate.toISOString() : startDate;
    const endISO = endDate instanceof Date ? endDate.toISOString() : endDate;

    return allEvents.filter(event => {
      const eventStart = event.startTime;
      const eventEnd = event.endTime;
      
      const startsInRange = compareAsc(parseISO(eventStart), parseISO(startISO)) >= 0 && 
                           compareAsc(parseISO(eventStart), parseISO(endISO)) <= 0;
      
      const endsInRange = compareAsc(parseISO(eventEnd), parseISO(startISO)) >= 0 && 
                         compareAsc(parseISO(eventEnd), parseISO(endISO)) <= 0;
      
      const encompassesRange = compareAsc(parseISO(eventStart), parseISO(startISO)) <= 0 && 
                              compareAsc(parseISO(eventEnd), parseISO(endISO)) >= 0;
      
      return startsInRange || endsInRange || encompassesRange;
    });
  } catch (error) {
    console.error("Failed to get events in range:", error);
    return [];
  }
};

// Get a single event by ID
export const getEventById = async (id) => { // Renamed to avoid conflict with getEvents
  if (!id) {
    console.error("Attempted to get event with no ID");
    return null;
  }
  try {
    return await performTransaction(STORES.EVENTS, "readonly", (store) => {
      return store.get(id);
    });
  } catch (error) {
    console.error(`Failed to get event with ID ${id}:`, error);
    return null;
  }
};

// Delete an event by ID
export const deleteEvent = async (eventId) => {
  if (!eventId) {
    console.error("Attempted to delete event with no ID provided.");
    return Promise.reject(new Error("Event ID is required for deletion."));
  }
  try {
    const event = await getEventById(eventId);
    if (event && compareAsc(parseISO(event.endTime), new Date()) < 0) {
      await performTransaction(STORES.PAST_EVENTS, "readwrite", (store) => {
        return store.add({
          ...event,
          archivedAt: new Date().toISOString()
        });
      });
    }

    await performTransaction(STORES.EVENTS, "readwrite", (store) => {
      return store.delete(eventId);
    });

    const patterns = await getAllRecurringPatterns();
    const associatedPattern = patterns.find(p => p.eventId === eventId);
    if (associatedPattern) {
      await performTransaction(STORES.RECURRING_PATTERNS, "readwrite", (store) => {
        return store.delete(associatedPattern.id);
      });
    }
    return true;
  } catch (error) {
    console.error(`Failed to delete event with ID ${eventId}:`, error);
    throw error; // Re-throw to be handled by caller
  }
};


// Re-exporting existing addEvent and updateEvent as they might be used directly elsewhere
// or for more fine-grained control if saveEvent is too generic for some cases.
export const addEvent = internalAddEvent;
export const updateEvent = internalUpdateEvent;


// PAST EVENTS OPERATIONS
export const getPastEvents = async () => {
  try {
    return await performTransaction(STORES.PAST_EVENTS, "readonly", (store) => {
      return store.getAll();
    });
  } catch (error) {
    console.error("Failed to get past events:", error);
    return [];
  }
};

export const getPastEventsInRange = async (startDate, endDate) => {
  try {
    const allPastEvents = await getPastEvents();
    const startISO = startDate instanceof Date ? startDate.toISOString() : startDate;
    const endISO = endDate instanceof Date ? endDate.toISOString() : endDate;

    return allPastEvents.filter(event => {
      const eventStart = event.startTime;
      return compareAsc(parseISO(eventStart), parseISO(startISO)) >= 0 && 
             compareAsc(parseISO(eventStart), parseISO(endISO)) <= 0;
    });
  } catch (error) {
    console.error("Failed to get past events in range:", error);
    return [];
  }
};

// RECURRING PATTERNS OPERATIONS
export const getAllRecurringPatterns = async () => {
  try {
    return await performTransaction(STORES.RECURRING_PATTERNS, "readonly", (store) => {
      return store.getAll();
    });
  } catch (error) {
    console.error("Failed to get recurring patterns:", error);
    return [];
  }
};

export const getRecurringPatternByEventId = async (eventId) => {
  try {
    const patterns = await getAllRecurringPatterns();
    return patterns.find(pattern => pattern.eventId === eventId) || null;
  } catch (error) {
    console.error(`Failed to get recurring pattern for event ${eventId}:`, error);
    return null;
  }
};

// SETTINGS OPERATIONS
export const saveSettings = async (settings) => {
  try {
    const settingsData = {
      id: "global_settings",
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await performTransaction(STORES.SETTINGS, "readwrite", (store) => {
      return store.put(settingsData);
    });
    return settingsData;
  } catch (error) {
    console.error("Failed to save settings:", error);
    throw error;
  }
};

const getDefaultSettings = () => {
  return {
    id: "global_settings",
    defaultView: "month",
    firstDayOfWeek: 0,
    showWeekNumbers: false,
    dayStartHour: 8,
    dayEndHour: 20,
    dateFormat: "MM/dd/yyyy",
    timeFormat: "h:mm a",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const getSettings = async () => {
  try {
    const settings = await performTransaction(STORES.SETTINGS, "readonly", (store) => {
      return store.get("global_settings");
    });
    return settings || getDefaultSettings();
  } catch (error) {
    console.error("Failed to get settings:", error);
    return getDefaultSettings();
  }
};


// REMINDER PREFERENCES OPERATIONS
export const saveReminderPreferences = async (preferences) => {
  try {
    const preferencesData = {
      id: "reminder_preferences",
      ...preferences,
      updatedAt: new Date().toISOString()
    };
    await performTransaction(STORES.REMINDER_PREFERENCES, "readwrite", (store) => {
      return store.put(preferencesData);
    });
    return preferencesData;
  } catch (error) {
    console.error("Failed to save reminder preferences:", error);
    throw error;
  }
};

const getDefaultReminderPreferences = () => {
  return {
    id: "reminder_preferences",
    defaultReminder: "30",
    notificationSound: "default",
    notificationStyle: "banner",
    emailNotifications: false,
    desktopNotifications: true, 
    reminderTimes: ["5", "15", "30", "60", "1440"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const getReminderPreferences = async () => {
  try {
    const preferences = await performTransaction(STORES.REMINDER_PREFERENCES, "readonly", (store) => {
      return store.get("reminder_preferences");
    });
    return preferences || getDefaultReminderPreferences();
  } catch (error) {
    console.error("Failed to get reminder preferences:", error);
    return getDefaultReminderPreferences();
  }
};

// DATA EXPORT/IMPORT
export const exportCalendarData = async () => {
  try {
    const events = await getEvents();
    const pastEvents = await getPastEvents();
    const recurringPatterns = await getAllRecurringPatterns();
    const settings = await getSettings();
    const reminderPreferences = await getReminderPreferences();

    const exportData = {
      events,
      pastEvents,
      recurringPatterns,
      settings,
      reminderPreferences,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(exportData);
  } catch (error) {
    console.error("Failed to export calendar data:", error);
    throw error;
  }
};

export const importCalendarData = async (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    if (!data.events || !Array.isArray(data.events)) {
      throw new Error("Invalid import data: missing events array");
    }

    await clearAllData();

    for (const event of data.events) {
      await saveEvent(event); // Use saveEvent for importing
    }
    if (data.pastEvents && Array.isArray(data.pastEvents)) {
      for (const event of data.pastEvents) {
        await performTransaction(STORES.PAST_EVENTS, "readwrite", (store) => {
          return store.add(event);
        });
      }
    }
    if (data.settings) {
      await saveSettings(data.settings);
    }
    if (data.reminderPreferences) {
      await saveReminderPreferences(data.reminderPreferences);
    }
    return true;
  } catch (error) {
    console.error("Failed to import calendar data:", error);
    throw error;
  }
};

export const clearAllData = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(Object.values(STORES), "readwrite");
      let completedStores = 0;
      const totalStores = Object.values(STORES).length;
      
      for (const storeName of Object.values(STORES)) {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => {
          completedStores++;
          if (completedStores === totalStores) {
            resolve(true);
          }
        };
        request.onerror = (event) => {
          console.error(`Error clearing ${storeName}:`, event.target.error);
          reject(event.target.error);
        };
      }
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Failed to clear data:", error);
    throw error;
  }
};

// CONFLICT DETECTION
export const findConflictingEvents = async (startTime, endTime, excludeEventId = null) => {
  try {
    const allEvents = await getEvents();
    const startISO = startTime instanceof Date ? startTime.toISOString() : startTime;
    const endISO = endTime instanceof Date ? endTime.toISOString() : endTime;
    
    return allEvents.filter(event => {
      if (excludeEventId && event.id === excludeEventId) {
        return false;
      }
      const eventStart = event.startTime;
      const eventEnd = event.endTime;
      const overlaps = (
        (compareAsc(parseISO(startISO), parseISO(eventStart)) >= 0 && 
         compareAsc(parseISO(startISO), parseISO(eventEnd)) < 0) ||
        (compareAsc(parseISO(endISO), parseISO(eventStart)) > 0 && 
         compareAsc(parseISO(endISO), parseISO(eventEnd)) <= 0) ||
        (compareAsc(parseISO(startISO), parseISO(eventStart)) <= 0 && 
         compareAsc(parseISO(endISO), parseISO(eventEnd)) >= 0)
      );
      return overlaps;
    });
  } catch (error) {
    console.error("Failed to find conflicting events:", error);
    return [];
  }
};

export const findAvailableSlots = async (
  nearStartTime, 
  duration,
  rangeToSearch = 24 * 60,
  excludeEventId = null
) => {
  try {
    const baseStartTime = nearStartTime instanceof Date ? nearStartTime : parseISO(nearStartTime);
    const rangeStart = new Date(baseStartTime.getTime() - (rangeToSearch * 30000));
    const rangeEnd = new Date(baseStartTime.getTime() + (rangeToSearch * 30000));
    
    const eventsInRange = await getEventsInRange(rangeStart, rangeEnd);
    const relevantEvents = excludeEventId ? 
      eventsInRange.filter(event => event.id !== excludeEventId) : 
      eventsInRange;
    
    relevantEvents.sort((a, b) => 
      compareAsc(parseISO(a.startTime), parseISO(b.startTime))
    );
    
    const availableSlots = [];
    const slotDurationMs = duration * 60000;
    
    if (relevantEvents.length === 0) {
      availableSlots.push({
        start: baseStartTime.toISOString(),
        end: new Date(baseStartTime.getTime() + slotDurationMs).toISOString()
      });
      availableSlots.push({
        start: new Date(baseStartTime.getTime() - 30 * 60000).toISOString(),
        end: new Date(baseStartTime.getTime() + slotDurationMs - 30 * 60000).toISOString()
      });
      availableSlots.push({
        start: new Date(baseStartTime.getTime() + 30 * 60000).toISOString(),
        end: new Date(baseStartTime.getTime() + slotDurationMs + 30 * 60000).toISOString()
      });
    } else {
      const firstEvent = relevantEvents[0];
      const firstEventStart = parseISO(firstEvent.startTime);
      
      if (firstEventStart.getTime() - rangeStart.getTime() >= slotDurationMs) {
        if (
          baseStartTime.getTime() < firstEventStart.getTime() &&
          baseStartTime.getTime() + slotDurationMs <= firstEventStart.getTime()
        ) {
          availableSlots.push({
            start: baseStartTime.toISOString(),
            end: new Date(baseStartTime.getTime() + slotDurationMs).toISOString()
          });
        } else {
          const suggestedStart = new Date(firstEventStart.getTime() - slotDurationMs - 15 * 60000);
          availableSlots.push({
            start: suggestedStart.toISOString(),
            end: new Date(suggestedStart.getTime() + slotDurationMs).toISOString()
          });
        }
      }
      
      for (let i = 0; i < relevantEvents.length - 1; i++) {
        const currentEventEnd = parseISO(relevantEvents[i].endTime);
        const nextEventStart = parseISO(relevantEvents[i + 1].startTime);
        if (nextEventStart.getTime() - currentEventEnd.getTime() >= slotDurationMs) {
          const suggestedStart = new Date(currentEventEnd.getTime() + 15 * 60000);
          availableSlots.push({
            start: suggestedStart.toISOString(),
            end: new Date(suggestedStart.getTime() + slotDurationMs).toISOString()
          });
        }
      }
      
      const lastEvent = relevantEvents[relevantEvents.length - 1];
      const lastEventEnd = parseISO(lastEvent.endTime);
      if (rangeEnd.getTime() - lastEventEnd.getTime() >= slotDurationMs) {
        const suggestedStart = new Date(lastEventEnd.getTime() + 15 * 60000);
        availableSlots.push({
          start: suggestedStart.toISOString(),
          end: new Date(suggestedStart.getTime() + slotDurationMs).toISOString()
        });
      }
    }
    
    availableSlots.sort((a, b) => {
      const distanceA = Math.abs(parseISO(a.start).getTime() - baseStartTime.getTime());
      const distanceB = Math.abs(parseISO(b.start).getTime() - baseStartTime.getTime());
      return distanceA - distanceB;
    });
    return availableSlots.slice(0, 3);
  } catch (error) {
    console.error("Failed to find available time slots:", error);
    return [];
  }
};

// FALLBACK STORAGE FOR BROWSERS WITHOUT INDEXEDDB
export const isIndexedDBAvailable = () => {
  try {
    return window.indexedDB !== undefined && window.indexedDB !== null;
  } catch (e) {
    return false; // In some restricted environments (e.g. Firefox private browsing), accessing indexedDB can throw an error.
  }
};

export const initStorage = async () => {
  if (isIndexedDBAvailable()) {
    try {
      await initDB();
      return { type: "indexedDB", isAvailable: true };
    } catch (error) {
      console.warn("IndexedDB initialization failed, falling back to localStorage:", error);
      return { type: "localStorage", isAvailable: true }; // Fallback implies localStorage is usable
    }
  } else {
    console.warn("IndexedDB not available, using localStorage instead");
    return { type: "localStorage", isAvailable: true }; // Assume localStorage is available if IndexedDB isn't
  }
};
