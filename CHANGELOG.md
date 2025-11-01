# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Application Hanging on Save:** Resolved a critical bug where action buttons (e.g., "Save", "Update", "Generate") would get stuck in a loading state if the underlying operation encountered an error. All asynchronous actions now correctly use `finally` blocks to reset their loading state, ensuring the UI remains responsive and interactive even when errors occur.

## [1.5.1] - 2024-07-22

### Fixed
- **Widespread Application Hanging:** Resolved a critical, application-wide bug where forms would hang in a "saving" state if an error occurred during data submission (e.g., saving a user, generating challans, creating an event). The `handleSubmit` functions in multiple modal forms (Class, Fee Head, Event) were missing loading state management and error handling. This has been fixed by implementing robust `try...finally` blocks to ensure the loading state is always reset, preventing the UI from freezing.

### Added
- **Loading State Feedback:** Added loading indicators ("Saving...", "Updating...") to several forms (Class, Fee Head, Event modals) that were missing them. This provides better user feedback during data submission and prevents accidental double-clicks.

## [1.5.0] - 2024-07-21

### Fixed
- **Application Hanging on Save:** Resolved a critical bug where action buttons (e.g., "Save", "Update", "Generate") would get stuck in a loading state if the underlying operation encountered an error. All asynchronous actions now correctly use `finally` blocks to reset their loading state, ensuring the UI remains responsive and interactive even when errors occur.

### Added
- **Loading State Feedback:** Added loading indicators ("Saving...", "Updating...") to several forms (User, Class, Fee Head, Event modals) that were missing them. This provides better user feedback during data submission and prevents accidental double-clicks.

## [1.4.2] - 2024-07-20

### Fixed
- **Critical Printing Failure:** Resolved a "Could not find root element" error during printing by creating an isolated, sandboxed HTML document from a `Blob`. This prevents the main app's scripts from running in the print iframe and ensures reliable printing.
- **Incomplete CSV Exports:** Re-engineered the CSV export functionality to handle all data types correctly. Implemented robust character escaping for commas and quotes, and added custom CSV generation for complex, grouped reports (Fee Collection, Defaulters) to ensure all data is exported accurately.
- **Blank Attendance Chart:** Fixed the "Today's Attendance Snapshot" on the Admin dashboard to show all active students, correctly categorizing them as Present, Absent, Leave, or "Pending" if attendance has not been marked.

### Added
- **Interactive Dashboard Charts:** Made Admin Dashboard charts interactive for data exploration.
  - Clicking a segment on the **Fee Status** doughnut chart now opens a modal showing a list of students and challans for that status.
  - Clicking a bar on the **Attendance Snapshot** chart opens a modal displaying the list of students with that status.
- **Enhanced Fee Collection Chart:** Added a toggle to the "Fee Collection (Last 30 Days)" chart on the Admin Dashboard, allowing users to switch between a **Line** and a **Bar** chart view for more versatile data analysis.

## [1.4.1] - 2024-07-19

### Fixed
- **Critical Auth Failure:** Migrated all Supabase authentication calls to the modern v2 API, resolving a version mismatch that caused login, registration, and password reset to fail at runtime.
- **TypeScript Errors:** Resolved TypeScript errors related to environment variables by adding the necessary Vite client type references.

### Security
- **Removed Hardcoded Credentials:** Migrated Supabase URL and anon key from the source code to environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) to prevent exposing sensitive keys in the repository, following security best practices for deployment.

## [1.4.0] - 2024-07-18

### Added
- **CSV Data Import:** Implemented a feature to import data for Users, Students, Teachers, Accountants, and Classes from a CSV file. Each management page now has an 'Import' button that opens a modal with instructions and a downloadable sample template to ensure correct formatting.

## [1.3.0] - 2024-07-17

### Added
- **CSV Data Export:** Implemented a feature to export data from management tables (Users, Students, Teachers, Accountants, Classes) to a CSV file. The export respects the current filters applied to the table.

## [1.2.0] - 2024-07-16

### Added
- **Skeleton Loading States:** Implemented skeleton loading placeholders for all dashboards (Stat Cards, Charts) and data tables (User, Student, Class management pages). This improves perceived performance and user experience while data is being fetched.

## [1.1.0] - 2024-07-16

### Added

- **Interactive Dashboard Charts:**
  - The 'Student Distribution by School' bar chart is now interactive. Clicking a bar opens a modal displaying a list of students from that school.
  - The 'User Roles Overview' doughnut chart segments are now clickable, navigating to the User Management page pre-filtered by the selected role.
- **Owner School Switcher:**
  - Implemented a school selection dropdown in the header for the 'Owner' role, allowing them to switch their administrative context between different schools.
  - The header now dynamically displays the name and logo of the currently active school or "Owner Overview".
  - Added a "Back to Owner View" button for easy navigation from a school's dashboard back to the global overview.
- **Visual Feedback on Charts:** Added hover effects to bar and doughnut chart elements to indicate interactivity.

### Fixed

- **User Profile Menu:** Corrected the non-functional user profile dropdown menu in the header. "Profile," "Settings," and "Logout" actions now work as expected.
- **Dropdown Menu Behavior:** The user profile menu now closes automatically when an option is clicked or when clicking outside the menu area.
- **TypeScript Errors:** Resolved a type mismatch in the `OwnerDashboard` component related to the interactive bar chart's `onClick` handler.