import React, { useState } from "react";

const EventFormRight = ({ formData, onFormChange, errors }) => {
  const [attendeeInput, setAttendeeInput] = useState("");
  const [attendees, setAttendees] = useState(formData.attendees || []);

  const handleAddAttendee = () => {
    if (attendeeInput.trim() && !attendees.includes(attendeeInput.trim())) {
      const newAttendees = [...attendees, attendeeInput.trim()];
      setAttendees(newAttendees);
      onFormChange({ target: { name: "attendees", value: newAttendees } });
      setAttendeeInput("");
    }
  };

  const handleRemoveAttendee = (attendeeToRemove) => {
    const newAttendees = attendees.filter(att => att !== attendeeToRemove);
    setAttendees(newAttendees);
    onFormChange({ target: { name: "attendees", value: newAttendees } });
  };


  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Reminder */}
      <div>
        <label htmlFor="reminder" className="block text-sm font-medium text-gray-700 mb-1">
          Reminder
        </label>
        <select
          id="reminder"
          name="reminder"
          value={formData.reminder || "30 minutes"}
          onChange={onFormChange}
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">No reminder</option>
          <option value="5 minutes">5 minutes before</option>
          <option value="15 minutes">15 minutes before</option>
          <option value="30 minutes">30 minutes before</option>
          <option value="1 hour">1 hour before</option>
          <option value="2 hours">2 hours before</option>
          <option value="1 day">1 day before</option>
        </select>
        {errors.reminder && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.reminder}</p>
        )}
      </div>

      {/* Event Color */}
      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
          Event Color
        </label>
        <div className="flex flex-wrap gap-2">
          {["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#6B7280"].map(color => (
            <button
              key={color}
              type="button"
              aria-label={`Select color ${color}`}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all ${formData.color === color ? "ring-2 ring-offset-2 ring-gray-500" : "hover:ring-1 hover:ring-gray-400"}`}
              style={{ backgroundColor: color }}
              onClick={() => onFormChange({ target: { name: "color", value: color }})}
            />
          ))}
        </div>
        {errors.color && (
            <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.color}</p>
        )}
      </div>

      {/* Recurrence - Placeholder */}
      <div>
        <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700 mb-1">
          Recurrence (Coming Soon)
        </label>
        <select
          id="recurrence"
          name="recurrence"
          value={formData.recurrence || "none"}
          onChange={onFormChange}
          disabled
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="none">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">Recurrence options will be available in a future update.</p>
         {errors.recurrence && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.recurrence}</p>
        )}
      </div>

      {/* Attendees - Basic Implementation */}
      <div>
        <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-1">
          Attendees (Optional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="email"
            id="attendeeInput"
            value={attendeeInput}
            onChange={(e) => setAttendeeInput(e.target.value)}
            className="flex-grow px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., user@example.com"
          />
          <button
            type="button"
            onClick={handleAddAttendee}
            className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
          >
            Add
          </button>
        </div>
        {attendees.length > 0 && (
          <div className="mt-2 space-y-1">
            {attendees.map((attendee, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded-md text-sm">
                <span>{attendee}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttendee(attendee)}
                  className="text-red-500 hover:text-red-700 ml-2"
                  aria-label={`Remove ${attendee}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="14" height="14"><rect width="256" height="256" fill="none"/><line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/><line x1="200" y1="200" x2="56" y2="56" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
         {errors.attendees && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.attendees}</p>
        )}
      </div>
    </div>
  );
};

export default EventFormRight;
