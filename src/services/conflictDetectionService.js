import { parseISO, isBefore, isAfter, addMinutes, format } from "date-fns";

/**
 * Detects scheduling conflicts for a proposed event.
 * @param {Object} proposedEvent - The event to check for conflicts.
 * @param {string} proposedEvent.startTime - ISO string of the event start time.
 * @param {string} proposedEvent.endTime - ISO string of the event end time.
 * @param {Array} existingEvents - Array of existing events to check against.
 * @returns {Array} - Array of conflicting events.
 */
export const detectConflicts = (proposedEvent, existingEvents) => {
  const proposedStart = parseISO(proposedEvent.startTime);
  const proposedEnd = parseISO(proposedEvent.endTime);

  return existingEvents.filter(event => {
    const eventStart = parseISO(event.startTime);
    const eventEnd = parseISO(event.endTime);

    return (
      (isBefore(proposedStart, eventEnd) && isAfter(proposedEnd, eventStart)) ||
      (isBefore(eventStart, proposedEnd) && isAfter(eventEnd, proposedStart)) ||
      (isBefore(proposedStart, eventStart) && isAfter(proposedEnd, eventEnd))
    );
  });
};

/**
 * Suggests available time slots near a requested time.
 * @param {string} requestedTime - ISO string of the requested time.
 * @param {number} duration - Duration of the event in minutes.
 * @param {Array} existingEvents - Array of existing events to work around.
 * @param {number} rangeToSearch - Range to search in minutes (default: 24 hours).
 * @param {number} maxSuggestions - Maximum number of suggestions to return.
 * @returns {Array} - Array of suggested time slots.
 */
export const suggestAvailableSlots = (
  requestedTime,
  duration,
  existingEvents,
  rangeToSearch = 24 * 60,
  maxSuggestions = 5
) => {
  const requestedDateTime = parseISO(requestedTime);
  const rangeStart = addMinutes(requestedDateTime, -rangeToSearch / 2);
  const rangeEnd = addMinutes(requestedDateTime, rangeToSearch / 2);

  const sortedEvents = [...existingEvents].sort((a, b) =>
    parseISO(a.startTime) - parseISO(b.startTime)
  );

  const availableSlots = [];
  let currentTime = rangeStart;

  for (const event of sortedEvents) {
    const eventStart = parseISO(event.startTime);
    const eventEnd = parseISO(event.endTime);

    if (isBefore(currentTime, eventStart)) {
      const slotEnd = isBefore(addMinutes(currentTime, duration), eventStart)
        ? addMinutes(currentTime, duration)
        : eventStart;

      if (isAfter(slotEnd, currentTime)) {
        availableSlots.push({
          start: currentTime,
          end: slotEnd
        });
      }
    }

    currentTime = isAfter(eventEnd, currentTime) ? eventEnd : currentTime;
  }

  // Check for available slot after the last event
  if (isBefore(currentTime, rangeEnd)) {
    availableSlots.push({
      start: currentTime,
      end: addMinutes(currentTime, duration)
    });
  }

  // Sort slots by how close they are to the requested time
  availableSlots.sort((a, b) => {
    const diffA = Math.abs(a.start - requestedDateTime);
    const diffB = Math.abs(b.start - requestedDateTime);
    return diffA - diffB;
  });

  // Format the suggestions
  return availableSlots.slice(0, maxSuggestions).map(slot => ({
    start: format(slot.start, "yyyy-MM-dd'T'HH:mm:ss"),
    end: format(slot.end, "yyyy-MM-dd'T'HH:mm:ss")
  }));
};

/**
 * Checks if a proposed event overlaps with any existing events.
 * @param {Object} proposedEvent - The event to check for overlap.
 * @param {string} proposedEvent.startTime - ISO string of the event start time.
 * @param {string} proposedEvent.endTime - ISO string of the event end time.
 * @param {Array} existingEvents - Array of existing events to check against.
 * @returns {boolean} - True if there"s an overlap, false otherwise.
 */
export const checkOverlap = (proposedEvent, existingEvents) => {
  const conflicts = detectConflicts(proposedEvent, existingEvents);
  return conflicts.length > 0;
};

/**
 * Finds the next available time slot after a given time.
 * @param {string} afterTime - ISO string of the time to start searching from.
 * @param {number} duration - Duration of the event in minutes.
 * @param {Array} existingEvents - Array of existing events to work around.
 * @returns {Object|null} - The next available time slot or null if none found.
 */
export const findNextAvailableSlot = (afterTime, duration, existingEvents) => {
  const startDateTime = parseISO(afterTime);
  const sortedEvents = [...existingEvents].sort((a, b) =>
    parseISO(a.startTime) - parseISO(b.startTime)
  );

  let currentTime = startDateTime;

  for (const event of sortedEvents) {
    const eventStart = parseISO(event.startTime);
    const eventEnd = parseISO(event.endTime);

    if (isAfter(eventStart, currentTime)) {
      const potentialEnd = addMinutes(currentTime, duration);
      if (isBefore(potentialEnd, eventStart)) {
        return {
          start: format(currentTime, "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(potentialEnd, "yyyy-MM-dd'T'HH:mm:ss")
        };
      }
    }

    currentTime = isAfter(eventEnd, currentTime) ? eventEnd : currentTime;
  }

  // If no slot found between events, suggest after the last event
  const suggestedStart = currentTime;
  const suggestedEnd = addMinutes(suggestedStart, duration);

  return {
    start: format(suggestedStart, "yyyy-MM-dd'T'HH:mm:ss"),
    end: format(suggestedEnd, "yyyy-MM-dd'T'HH:mm:ss")
  };
};

/**
 * Calculates the duration of free time between two events.
 * @param {Object} event1 - The first event.
 * @param {string} event1.endTime - ISO string of the first event"s end time.
 * @param {Object} event2 - The second event.
 * @param {string} event2.startTime - ISO string of the second event"s start time.
 * @returns {number} - The duration of free time in minutes.
 */
export const calculateFreeTimeBetweenEvents = (event1, event2) => {
  const end1 = parseISO(event1.endTime);
  const start2 = parseISO(event2.startTime);

  if (isAfter(start2, end1)) {
    const diffInMinutes = (start2 - end1) / (1000 * 60);
    return Math.round(diffInMinutes);
  }

  return 0; // Events overlap or are in wrong order
};

/**
 * Finds the largest free time slot within a given time range.
 * @param {string} rangeStart - ISO string of the range start time.
 * @param {string} rangeEnd - ISO string of the range end time.
 * @param {Array} existingEvents - Array of existing events within the range.
 * @returns {Object|null} - The largest free time slot or null if none found.
 */
export const findLargestFreeSlot = (rangeStart, rangeEnd, existingEvents) => {
  const start = parseISO(rangeStart);
  const end = parseISO(rangeEnd);
  
  const sortedEvents = [...existingEvents].sort((a, b) =>
    parseISO(a.startTime) - parseISO(b.startTime)
  );

  let largestSlot = { start: start, end: start, duration: 0 };
  let currentStart = start;

  for (const event of sortedEvents) {
    const eventStart = parseISO(event.startTime);
    const eventEnd = parseISO(event.endTime);

    if (isAfter(eventStart, currentStart)) {
      const slotDuration = (eventStart - currentStart) / (1000 * 60);
      if (slotDuration > largestSlot.duration) {
        largestSlot = {
          start: currentStart,
          end: eventStart,
          duration: slotDuration
        };
      }
    }

    currentStart = isAfter(eventEnd, currentStart) ? eventEnd : currentStart;
  }

  // Check for free slot after the last event
  if (isAfter(end, currentStart)) {
    const finalSlotDuration = (end - currentStart) / (1000 * 60);
    if (finalSlotDuration > largestSlot.duration) {
      largestSlot = {
        start: currentStart,
        end: end,
        duration: finalSlotDuration
      };
    }
  }

  if (largestSlot.duration === 0) {
    return null;
  }

  return {
    start: format(largestSlot.start, "yyyy-MM-dd'T'HH:mm:ss"),
    end: format(largestSlot.end, "yyyy-MM-dd'T'HH:mm:ss"),
    duration: Math.round(largestSlot.duration)
  };
};
