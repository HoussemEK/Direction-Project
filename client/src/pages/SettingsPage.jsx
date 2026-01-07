import { useState } from 'react';


/**
 * Preferences (Settings Redesign)
 * 
 * Features:
 * - Single scrollable page
 * - Toggle switches only
 * - Removed profile section
 * - Minimal design, no cards
 */

export default function SettingsPage() {
  // const { isDarkMode, toggleDarkMode } = useTheme(); // Removed for cosmic theme
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  return (
    <section className="preferences-page">
      <h1 className="text-h2 mb-8">Settings</h1>




      {/* Notifications */}
      <div className="preference-item">
        <div>
          <div className="preference-label">Notifications</div>
          <div className="preference-description">Receive task and challenge reminders</div>
        </div>
        <div
          className={`toggle-switch ${notificationsEnabled ? 'active' : ''}`}
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
        >
          <div className="toggle-slider" />
        </div>
      </div>

      {/* Auto-save */}
      <div className="preference-item">
        <div>
          <div className="preference-label">Auto-save Reflections</div>
          <div className="preference-description">Automatically save log entries as you type</div>
        </div>
        <div
          className={`toggle-switch ${autoSaveEnabled ? 'active' : ''}`}
          onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
        >
          <div className="toggle-slider" />
        </div>
      </div>
    </section>
  );
}