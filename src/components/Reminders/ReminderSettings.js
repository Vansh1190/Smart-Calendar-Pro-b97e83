import React, { useState, useEffect, useCallback } from "react";
import { useCalendarContext } from "../../context/CalendarContext";
import Button from "../common/Button"; // Assuming a reusable Button component
import Input from "../common/Input"; // Assuming a reusable Input/Select component, simplified for this example

const ToggleSwitch = ({ id, checked, onChange, label }) => (
  <div className="flex items-center">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`${
        checked ? "bg-blue-600" : "bg-gray-200"
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
    >
      <span
        aria-hidden="true"
        className={`${
          checked ? "translate-x-5" : "translate-x-0"
        } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
    <label htmlFor={id} className="ml-3 text-sm text-gray-700">
      {label}
    </label>
  </div>
);

const ReminderSettings = () => {
  const { updateReminderPreferences, reminderPreferences: initialPreferences, settings: calendarSettings } = useCalendarContext();
  
  const defaultSettings = {
    defaultReminderTime: "30", // minutes
    notificationSound: "default",
    desktopNotificationsEnabled: true,
    emailNotificationsEnabled: false,
    // More granular control for quick reminder options in event form
    availableReminderOptions: ["5", "15", "30", "60", "1440"], // in minutes
  };

  const [settings, setSettings] = useState(initialPreferences || defaultSettings);
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "success", "error"
  const [notificationPermission, setNotificationPermission] = useState("default");

  useEffect(() => {
    if (initialPreferences) {
      setSettings(initialPreferences);
    }
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [initialPreferences]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaveStatus(""); // Clear save status on change
  };

  const requestDesktopNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    if (Notification.permission === "granted") {
      alert("Notifications are already enabled.");
      return;
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        handleSettingChange("desktopNotificationsEnabled", true);
         // Show a test notification
        new Notification("Smart Calendar Pro", {
          body: "Desktop notifications are now enabled!",
          icon: "/logo192.png", // Make sure this path is correct
        });
      }
    } else {
        alert("Notification permission was previously denied. Please enable it in your browser settings.");
    }
  };
  
  const playTestSound = () => {
    // Basic sound playback - in a real app, use a more robust audio solution
    // and ensure sound files are in public/sounds/
    try {
      const audio = new Audio(`/sounds/${settings.notificationSound}.mp3`);
      audio.play().catch(e => console.error("Error playing sound:", e));
    } catch (e) {
      console.error("Could not play sound:", e);
    }
  };

  const handleSaveChanges = async () => {
    setSaveStatus("saving");
    try {
      const result = await updateReminderPreferences(settings);
      if (result.success) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus(""), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving reminder preferences:", error);
      setSaveStatus("error");
    }
  };

  const reminderTimeOptions = [
    { value: "5", label: "5 minutes before" },
    { value: "15", label: "15 minutes before" },
    { value: "30", label: "30 minutes before" },
    { value: "60", label: "1 hour before" },
    { value: "120", label: "2 hours before" },
    { value: "1440", label: "1 day before" },
    { value: "", label: "No default reminder" }
  ];

  const soundOptions = [
    { value: "default", label: "Default Ping" },
    { value: "chime", label: "Gentle Chime" },
    { value: "alert", label: "Urgent Alert" },
    { value: "subtle", label: "Subtle Click" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto my-8">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Reminder Preferences</h2>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="28" height="28" className="text-blue-500"><rect width="256" height="256" fill="none"/><line x1="96" y1="228" x2="160" y2="228" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M184,24a102.71,102.71,0,0,1,36.29,40" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M35.71,64A102.71,102.71,0,0,1,72,24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M52,188a8,8,0,0,1-6.38-12.81C53.85,164.49,63.84,144.6,64,112a64,64,0,0,1,128,0c.16,32.6,10.15,52.49,18.35,63.19A8,8,0,0,1,204,188Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>
      </div>

      <div className="p-6 space-y-8">
        {/* Default Reminder Settings */}
        <section>
          <h3 className="text-md font-medium text-gray-700 mb-3">Default Event Reminder</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="defaultReminderTime" className="block text-sm font-medium text-gray-600 mb-1">
                Default time before event
              </label>
              <select
                id="defaultReminderTime"
                name="defaultReminderTime"
                value={settings.defaultReminderTime}
                onChange={(e) => handleSettingChange("defaultReminderTime", e.target.value)}
                className="w-full mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
              >
                {reminderTimeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Notification Channels */}
        <section>
          <h3 className="text-md font-medium text-gray-700 mb-3">Notification Channels</h3>
          <div className="space-y-4">
            <ToggleSwitch
              id="desktopNotifications"
              label="Enable Desktop Notifications"
              checked={settings.desktopNotificationsEnabled}
              onChange={(checked) => {
                handleSettingChange("desktopNotificationsEnabled", checked);
                if (checked && notificationPermission !== "granted") {
                  requestDesktopNotificationPermission();
                }
              }}
            />
            {settings.desktopNotificationsEnabled && notificationPermission === "denied" && (
                 <p className="text-xs text-yellow-600 ml-14">
                    Desktop notifications are blocked. Please enable them in your browser settings.
                </p>
            )}
             {settings.desktopNotificationsEnabled && notificationPermission === "default" && (
                 <Button size="sm" variant="outline" onClick={requestDesktopNotificationPermission} className="ml-14 text-xs">
                    Request Permission
                </Button>
            )}

            <ToggleSwitch
              id="emailNotifications"
              label="Enable Email Notifications (if configured)"
              checked={settings.emailNotificationsEnabled}
              onChange={(checked) => handleSettingChange("emailNotificationsEnabled", checked)}
            />
             {settings.emailNotificationsEnabled && (
                 <p className="text-xs text-gray-500 ml-14">
                    Make sure your email is correctly set up in account settings. (Feature placeholder)
                </p>
            )}
          </div>
        </section>
        
        {/* Sound Preferences */}
        <section>
          <h3 className="text-md font-medium text-gray-700 mb-3">Sound Preferences</h3>
          <div className="flex items-center gap-4">
            <div className="flex-grow">
                <label htmlFor="notificationSound" className="block text-sm font-medium text-gray-600 mb-1">
                    Notification sound
                </label>
                <select
                    id="notificationSound"
                    name="notificationSound"
                    value={settings.notificationSound}
                    onChange={(e) => handleSettingChange("notificationSound", e.target.value)}
                    className="w-full mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                >
                    {soundOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            <Button variant="outline" onClick={playTestSound} className="self-end mb-0.5">
                Test Sound
            </Button>
          </div>
        </section>
        
        {/* Quick Reminder Options in Event Form */}
        <section>
          <h3 className="text-md font-medium text-gray-700 mb-3">Quick Reminder Options</h3>
           <p className="text-xs text-gray-500 mb-2">Select which reminder intervals appear in the event creation form.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {reminderTimeOptions.filter(opt => opt.value !== "").map(option => (
              <label key={option.value} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={settings.availableReminderOptions?.includes(option.value)}
                  onChange={(e) => {
                    const currentOptions = settings.availableReminderOptions || [];
                    const newOptions = e.target.checked
                      ? [...currentOptions, option.value]
                      : currentOptions.filter(val => val !== option.value);
                    handleSettingChange("availableReminderOptions", newOptions.sort((a,b) => parseInt(a) - parseInt(b)) );
                  }}
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </section>

      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
        {saveStatus === "success" && (
          <span className="text-sm text-green-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="18" height="18" className="mr-1.5"><rect width="256" height="256" fill="none"/><polyline points="224 64 96 192 32 128" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="20"/></svg>
            Preferences saved!
          </span>
        )}
        {saveStatus === "error" && (
          <span className="text-sm text-red-600">Failed to save.</span>
        )}
        <Button 
          onClick={handleSaveChanges} 
          isLoading={saveStatus === "saving"}
          disabled={saveStatus === "saving"}
        >
          {saveStatus === "saving" ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
};

export default ReminderSettings;
