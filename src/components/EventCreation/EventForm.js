import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useCalendarContext } from "../../context/CalendarContext";
import * as nlpService from "../../services/nlpService";
import { format, parseISO, addHours, isValid, differenceInMinutes } from "date-fns";
import EventFormLeft from "./EventFormLeft";
import EventFormRight from "./EventFormRight";

const STEPS = [
  { id: 1, name: "Event Details", fields: ["nlpInput", "title", "startTime", "endTime", "location", "description"] },
  { id: 2, name: "Options & Extras", fields: ["reminder", "color", "attendees", "recurrence"] },
  { id: 3, name: "Review & Confirm", fields: [] },
];

const EventForm = ({ initialEvent = null, onClose = () => {} }) => {
  const { addEvent, updateEvent, processNaturalLanguageInput } = useCalendarContext(); // Use updateEvent from context
  const [currentStep, setCurrentStep] = useState(1);

  const getDefaultEndTime = useCallback((startTimeString) => {
    if (startTimeString) {
      try {
        const parsedStartTime = parseISO(startTimeString);
        if (isValid(parsedStartTime)) {
          return format(addHours(parsedStartTime, 1), "yyyy-MM-dd'T'HH:mm");
        }
      } catch (e) { /* ignore parse error for now */ }
    }
    return "";
  }, []);

  const initialFormData = useMemo(() => ({
    id: initialEvent?.id || "",
    title: initialEvent?.title || "",
    startTime: initialEvent?.startTime ? format(parseISO(initialEvent.startTime), "yyyy-MM-dd'T'HH:mm") : "",
    endTime: initialEvent?.endTime
               ? format(parseISO(initialEvent.endTime), "yyyy-MM-dd'T'HH:mm")
               : initialEvent?.startTime
                 ? getDefaultEndTime(initialEvent.startTime)
                 : "",
    location: initialEvent?.location || "",
    description: initialEvent?.description || "",
    reminder: initialEvent?.reminder || "30 minutes",
    color: initialEvent?.color || "#3B82F6",
    attendees: initialEvent?.attendees || [],
    recurrence: initialEvent?.recurrence || "none",
  }), [initialEvent, getDefaultEndTime]);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [nlpText, setNlpText] = useState("");
  const [nlpSuggestions, setNlpSuggestions] = useState([]);
  const [nlpProcessing, setNlpProcessing] = useState(false);
  const [nlpParseError, setNlpParseError] = useState("");
  const [nlpParseSuccess, setNlpParseSuccess] = useState("");


  useEffect(() => {
    setFormData(initialFormData);
    setCurrentStep(1); // Reset to first step when initialEvent changes (e.g., opening for new vs edit)
    setNlpText(""); // Clear NLP text too
    setFormError("");
    setFormSuccess("");
    setNlpParseError("");
    setNlpParseSuccess("");

  }, [initialEvent, initialFormData]);

  const handleNlpTextChange = (e) => {
    const text = e.target.value;
    setNlpText(text);
    setNlpParseError("");
    setNlpParseSuccess("");
    if (text.length > 3) { // Trigger suggestions after a few characters
      const suggestions = nlpService.suggestCorrections(text);
      setNlpSuggestions(suggestions.slice(0, 3)); // Show top 3
    } else {
      setNlpSuggestions([]);
    }
  };

  const applyNlpSuggestion = (suggestion) => {
    setNlpText(prev => `${prev} ${suggestion} `); // Append suggestion and a space
    setNlpSuggestions([]); // Clear suggestions
  };

  const handleNlpParse = async () => {
    if (!nlpText.trim()) {
      setNlpParseError("Please enter a description to parse.");
      return;
    }
    setNlpProcessing(true);
    setNlpParseError("");
    setNlpParseSuccess("");

    try {
        const result = await nlpService.parseNaturalLanguage(nlpText); // Using the direct service function
        if (result.success && result.event) {
            const parsed = result.event;
            setFormData(prev => ({
                ...prev,
                title: parsed.title || prev.title,
                startTime: parsed.startTime ? format(parsed.startTime, "yyyy-MM-dd'T'HH:mm") : prev.startTime,
                endTime: parsed.endTime ? format(parsed.endTime, "yyyy-MM-dd'T'HH:mm") 
                         : (parsed.startTime ? getDefaultEndTime(format(parsed.startTime, "yyyy-MM-dd'T'HH:mm")) : prev.endTime),
                location: parsed.location || prev.location,
                description: parsed.description || prev.description, // NLP description can also populate this
                color: parsed.color || prev.color,
                reminder: parsed.reminder || prev.reminder,
            }));
            setNlpParseSuccess("Details parsed successfully! Review and adjust if needed.");
            setNlpText(""); // Optionally clear NLP input after successful parse
        } else {
            setNlpParseError(result.error || "Could not parse details. Try rephrasing.");
        }
    } catch (err) {
        setNlpParseError("An unexpected error occurred during parsing.");
        console.error("NLP parsing error:", err);
    } finally {
        setNlpProcessing(false);
    }
  };


  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      if (name === "startTime") {
        if (!newFormData.endTime || isBefore(parseISO(newFormData.endTime), parseISO(value)) || !isValid(parseISO(newFormData.endTime))) {
          newFormData.endTime = getDefaultEndTime(value);
        }
      }
      return newFormData;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setFormError(""); // Clear general form error on input change
  };

  const validateStep = (stepNumber) => {
    const currentStepFields = STEPS.find(s => s.id === stepNumber)?.fields || [];
    const newErrors = {};
    let isValidStep = true;

    currentStepFields.forEach(field => {
      if (field === "title" && !formData.title.trim()) {
        newErrors.title = "Title is required";
        isValidStep = false;
      }
      if (field === "startTime" && !formData.startTime) {
        newErrors.startTime = "Start date and time are required";
        isValidStep = false;
      } else if (field === "startTime" && formData.startTime && !isValid(parseISO(formData.startTime))) {
        newErrors.startTime = "Invalid start date/time format";
        isValidStep = false;
      }
      if (field === "endTime" && !formData.endTime) {
        newErrors.endTime = "End date and time are required";
        isValidStep = false;
      } else if (field === "endTime" && formData.endTime && !isValid(parseISO(formData.endTime))) {
        newErrors.endTime = "Invalid end date/time format";
        isValidStep = false;
      }
      if (field === "endTime" && formData.startTime && formData.endTime && isValid(parseISO(formData.startTime)) && isValid(parseISO(formData.endTime))) {
        if (differenceInMinutes(parseISO(formData.endTime), parseISO(formData.startTime)) <= 0) {
          newErrors.endTime = "End time must be after start time";
          isValidStep = false;
        }
      }
    });
    setErrors(prev => ({...prev, ...newErrors}));
    return isValidStep;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) { // Validate all previous steps before final submit
      setFormError("Please correct errors in previous steps.");
      // Find the first step with errors and navigate to it
      for (let i = 1; i <= STEPS.length; i++) {
        if (!validateStep(i)) {
          setCurrentStep(i);
          break;
        }
      }
      return;
    }
    setFormError("");
    setFormSuccess("");

    const eventDataPayload = {
      ...formData,
      id: initialEvent?.id || undefined, // Pass ID for updates, undefined for new
      startTime: parseISO(formData.startTime).toISOString(),
      endTime: parseISO(formData.endTime).toISOString(),
    };

    let result;
    if (initialEvent && initialEvent.id) {
      result = await updateEvent(eventDataPayload);
    } else {
      result = await addEvent(eventDataPayload);
    }

    if (result && result.success) {
      setFormSuccess(`Event "${result.event.title}" ${initialEvent ? "updated" : "created"} successfully!`);
      setTimeout(() => {
        onClose();
        setFormSuccess("");
      }, 2000);
    } else if (result && result.error) {
      setFormError(result.error || "Could not save event.");
      if (result.conflicts && result.conflicts.length > 0) {
        setFormError(`Conflict: This time overlaps with "${result.conflicts[0].title}".`);
        // Optionally, navigate to step 1 if conflict is related to time
        setCurrentStep(1);
      }
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <EventFormLeft
            formData={formData}
            onFormChange={handleFormChange}
            errors={errors}
            nlpText={nlpText}
            onNlpTextChange={handleNlpTextChange}
            onNlpSubmit={handleNlpParse}
            nlpProcessing={nlpProcessing}
            nlpError={nlpParseError}
            nlpSuccess={nlpParseSuccess}
            nlpSuggestions={nlpSuggestions}
            onApplyNlpSuggestion={applyNlpSuggestion}
          />
        );
      case 2:
        return (
          <EventFormRight
            formData={formData}
            onFormChange={handleFormChange}
            errors={errors}
          />
        );
      case 3:
        return (
          <div className="p-4 space-y-3 text-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Review Event Details</h3>
            <p><strong>Title:</strong> {formData.title}</p>
            <p><strong>Starts:</strong> {formData.startTime ? format(parseISO(formData.startTime), "MMM d, yyyy 'at' h:mm a") : "Not set"}</p>
            <p><strong>Ends:</strong> {formData.endTime ? format(parseISO(formData.endTime), "MMM d, yyyy 'at' h:mm a") : "Not set"}</p>
            {formData.location && <p><strong>Location:</strong> {formData.location}</p>}
            {formData.description && <p className="whitespace-pre-wrap"><strong>Description:</strong> {formData.description}</p>}
            <p><strong>Reminder:</strong> {formData.reminder || "None"}</p>
            <p className="flex items-center"><strong>Color:</strong> <span className="w-4 h-4 rounded-full ml-2" style={{backgroundColor: formData.color}}></span></p>
            {formData.attendees && formData.attendees.length > 0 && <p><strong>Attendees:</strong> {formData.attendees.join(", ")}</p>}
            {formError && <p className="text-red-600 bg-red-50 p-2 rounded-md">{formError}</p>}
            {formSuccess && <p className="text-green-600 bg-green-50 p-2 rounded-md">{formSuccess}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
      <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          {initialEvent ? "Edit Event" : "Create New Event"}
        </h2>
        <button
          className="text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
          aria-label="Close form"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="24" height="24" fill="currentColor"><rect width="256" height="256" fill="none"/><line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><line x1="200" y1="200" x2="56" y2="56" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
        </button>
      </div>

      {/* Stepper Navigation */}
      <nav aria-label="Progress" className="p-4 sm:p-5 border-b border-gray-200">
        <ol role="list" className="flex items-center">
          {STEPS.map((step, stepIdx) => (
            <li key={step.name} className={`relative ${stepIdx !== STEPS.length - 1 ? "pr-8 sm:pr-20" : ""}`}>
              {step.id < currentStep ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-blue-600"></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    <span className="sr-only">{step.name}</span>
                  </button>
                </>
              ) : step.id === currentStep ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200"></div>
                  </div>
                  <button
                    type="button"
                    className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white"
                    aria-current="step"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true"></span>
                    <span className="sr-only">{step.name}</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200"></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => validateStep(step.id -1) && setCurrentStep(step.id)} // Allow navigation to next step if previous is valid
                    className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" aria-hidden="true"></span>
                    <span className="sr-only">{step.name}</span>
                  </button>
                </>
              )}
               <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-600 whitespace-nowrap">
                  {step.name}
              </p>
            </li>
          ))}
        </ol>
      </nav>


      <form onSubmit={handleSubmit} className="p-4 sm:p-6 min-h-[300px]">
        <div className="mb-4">
          {renderStepContent()}
        </div>

        {formError && currentStep === STEPS.length && (
          <div className="my-4 bg-red-50 border-l-4 border-red-400 p-3 rounded">
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        )}
        {formSuccess && currentStep === STEPS.length && (
          <div className="my-4 bg-green-50 border-l-4 border-green-400 p-3 rounded">
            <p className="text-sm text-green-700">{formSuccess}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3 pt-4 sm:pt-5 mt-4 sm:mt-5 border-t border-gray-200">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handlePrevStep}
            className="w-full sm:w-auto order-2 sm:order-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>
          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full sm:w-auto order-1 sm:order-2 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="w-full sm:w-auto order-1 sm:order-2 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
              disabled={!!formSuccess} // Disable if success message is shown
            >
              {initialEvent ? "Save Changes" : "Create Event"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EventForm;
