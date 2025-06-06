import React from "react";

const EventFormLeft = ({
  formData,
  onFormChange,
  errors,
  nlpText,
  onNlpTextChange,
  onNlpSubmit,
  nlpError,
  nlpSuccess,
}) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Natural Language Input */}
      <div>
        <label htmlFor="nlpInput" className="block text-sm font-medium text-gray-700 mb-1">
          Describe your event
        </label>
        <textarea
          id="nlpInput"
          name="nlpInput"
          value={nlpText}
          onChange={onNlpTextChange}
          rows="3"
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Meeting with Jane next Tuesday at 3pm for 1 hour"
        />
        <button
          type="button"
          onClick={onNlpSubmit}
          className="mt-2 px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Parse Details from Description
        </button>
        {nlpError && <p className="mt-1 text-xs text-red-600">{nlpError}</p>}
        {nlpSuccess && <p className="mt-1 text-xs text-green-600">{nlpSuccess}</p>}
      </div>

      <hr className="my-3 sm:my-4 border-gray-200" />
      <p className="text-sm text-gray-600">Or fill in the details manually:</p>


      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title || ""}
          onChange={onFormChange}
          className={`w-full px-3 py-2 text-sm sm:text-base border ${
            errors.title ? "border-red-500" : "border-gray-300"
          } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
          placeholder="e.g., Team Meeting"
        />
        {errors.title && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Start Time */}
      <div>
        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
          Start Time
        </label>
        <input
          type="datetime-local"
          id="startTime"
          name="startTime"
          value={formData.startTime || ""}
          onChange={onFormChange}
          className={`w-full px-3 py-2 text-sm sm:text-base border ${
            errors.startTime ? "border-red-500" : "border-gray-300"
          } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.startTime && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.startTime}</p>
        )}
      </div>

      {/* End Time */}
      <div>
        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
          End Time
        </label>
        <input
          type="datetime-local"
          id="endTime"
          name="endTime"
          value={formData.endTime || ""}
          onChange={onFormChange}
          className={`w-full px-3 py-2 text-sm sm:text-base border ${
            errors.endTime ? "border-red-500" : "border-gray-300"
          } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.endTime && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.endTime}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location (Optional)
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location || ""}
          onChange={onFormChange}
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Conference Room A"
        />
         {errors.location && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.location}</p>
        )}
      </div>

      {/* Description (Manual) */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Detailed Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={onFormChange}
          rows="3"
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add more details about the event"
        />
        {errors.description && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.description}</p>
        )}
      </div>
    </div>
  );
};

export default EventFormLeft;
