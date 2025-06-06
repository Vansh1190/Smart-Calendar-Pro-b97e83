import * as chrono from "chrono-node";
import nlp from "compromise";
import { v4 as uuidv4 } from "uuid";

// Custom parser for handling recurring events
const recurringPatterns = {
  "every day": { unit: "days", interval: 1 },
  "daily": { unit: "days", interval: 1 },
  "every week": { unit: "weeks", interval: 1 },
  "weekly": { unit: "weeks", interval: 1 },
  "every month": { unit: "months", interval: 1 },
  "monthly": { unit: "months", interval: 1 },
  "every year": { unit: "years", interval: 1 },
  "yearly": { unit: "years", interval: 1 },
  "every monday": { unit: "weeks", interval: 1, dayOfWeek: 1 },
  "every tuesday": { unit: "weeks", interval: 1, dayOfWeek: 2 },
  "every wednesday": { unit: "weeks", interval: 1, dayOfWeek: 3 },
  "every thursday": { unit: "weeks", interval: 1, dayOfWeek: 4 },
  "every friday": { unit: "weeks", interval: 1, dayOfWeek: 5 },
  "every saturday": { unit: "weeks", interval: 1, dayOfWeek: 6 },
  "every sunday": { unit: "weeks", interval: 1, dayOfWeek: 0 }
};

// Duration patterns in minutes
const durationPatterns = {
  "hour": 60,
  "hours": 60,
  "minute": 1,
  "minutes": 1,
  "day": 1440,
  "days": 1440
};

export const parseNaturalLanguage = (text) => {
  try {
    // Normalize text
    const normalizedText = text.toLowerCase().trim();
    
    // Initialize event object
    const event = {
      id: uuidv4(),
      title: "",
      description: "",
      startTime: null,
      endTime: null,
      location: "",
      reminder: null,
      recurring: null,
      color: null
    };

    // Parse the text using compromise
    const doc = nlp(normalizedText);

    // Extract title (first noun phrase or the first few words if no noun phrase)
    const titleMatch = doc.match("#Noun+").first().text();
    event.title = titleMatch || normalizedText.split(" ").slice(0, 3).join(" ");

    // Extract location (looking for "at" or "in" followed by a place)
    const locationMatch = doc.match("(at|in) [.]+").first().text();
    if (locationMatch) {
      event.location = locationMatch.replace(/^(at|in)\s+/, "");
    }

    // Parse date and time using chrono
    const parsed = chrono.parse(normalizedText);
    if (parsed.length > 0) {
      event.startTime = parsed[0].start.date();
      
      // If end time is specified
      if (parsed[0].end) {
        event.endTime = parsed[0].end.date();
      } else {
        // Look for duration patterns
        const durationMatch = Object.keys(durationPatterns).find(pattern => 
          normalizedText.includes(pattern)
        );
        
        if (durationMatch) {
          const number = normalizedText.match(/\d+/);
          const duration = number ? number[0] * durationPatterns[durationMatch] : durationPatterns[durationMatch];
          event.endTime = new Date(event.startTime.getTime() + duration * 60000);
        } else {
          // Default to 1 hour if no duration specified
          event.endTime = new Date(event.startTime.getTime() + 60 * 60000);
        }
      }
    }

    // Check for recurring patterns
    const recurringMatch = Object.keys(recurringPatterns).find(pattern => 
      normalizedText.includes(pattern)
    );
    if (recurringMatch) {
      event.recurring = recurringPatterns[recurringMatch];
    }

    // Extract reminder (looking for "remind" patterns)
    const reminderMatch = normalizedText.match(/remind\s+(\d+)\s+(minute|hour|day)s?\s+before/i);
    if (reminderMatch) {
      const [_, amount, unit] = reminderMatch;
      event.reminder = `${amount} ${unit}${amount === "1" ? "" : "s"}`;
    }

    // Extract color if mentioned
    const colorMatch = doc.match("(red|blue|green|yellow|purple|orange|pink|brown|gray|black)").first().text();
    if (colorMatch) {
      const colorMap = {
        red: "#EF4444",
        blue: "#3B82F6",
        green: "#10B981",
        yellow: "#F59E0B",
        purple: "#8B5CF6",
        orange: "#F97316",
        pink: "#EC4899",
        brown: "#92400E",
        gray: "#6B7280",
        black: "#1F2937"
      };
      event.color = colorMap[colorMatch];
    }

    // Extract description (remaining text after removing other identified parts)
    let description = normalizedText
      .replace(event.title, "")
      .replace(locationMatch || "", "")
      .replace(reminderMatch?.[0] || "", "")
      .replace(colorMatch || "", "");
    
    // Clean up description
    description = description
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^(at|in|on|for)\s+/, "");
    
    if (description) {
      event.description = description;
    }

    return {
      success: true,
      event: event
    };
  } catch (error) {
    console.error("Error parsing natural language:", error);
    return {
      success: false,
      error: "Could not parse the event details. Please try rephrasing.",
      event: null
    };
  }
};

// Validate parsed event
export const validateEvent = (event) => {
  const errors = [];

  if (!event.title) {
    errors.push("Event title is required");
  }

  if (!event.startTime) {
    errors.push("Start time could not be determined");
  }

  if (!event.endTime) {
    errors.push("End time could not be determined");
  }

  if (event.startTime && event.endTime && event.startTime >= event.endTime) {
    errors.push("End time must be after start time");
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Suggest corrections for common parsing issues
export const suggestCorrections = (text) => {
  const suggestions = [];
  
  if (!text.match(/\d{1,2}(:\d{2})?(\s*[ap]m)?/i)) {
    suggestions.push("Include a specific time (e.g., '3pm' or '15:00')");
  }

  if (!text.match(/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)) {
    suggestions.push("Specify a day (e.g., 'tomorrow' or 'next Monday')");
  }

  if (!text.match(/(at|in)\s+[a-z0-9\s]+/i)) {
    suggestions.push("Include a location (e.g., 'at Conference Room' or 'in Office')");
  }

  if (!text.match(/for\s+\d+\s+(minute|hour)s?/i)) {
    suggestions.push("Specify duration (e.g., 'for 1 hour' or 'for 30 minutes')");
  }

  return suggestions;
};

// Format duration for display
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  
  return `${hours} hour${hours === 1 ? "" : "s"} ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}`;
};