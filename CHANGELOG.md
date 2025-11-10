# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2024-07-22

### Fixed
- **Student Import:** Fixed an issue where custom tuition fees from a CSV import were being ignored. The import process now correctly uses the `tuition_fee` column from the CSV file to set a student's specific fee, instead of incorrectly falling back to the school's default.
- **Student Import Template:** Updated the sample CSV template and import logic to use `tuition_fee` instead of `monthly_tuition_fee` for clarity and consistency.

## [2.0.0] - 2024-07-22

### Added
- **Offline-First Architecture**: The application is now fully functional offline. Data is cached locally using Dexie.js and automatically syncs with the server when a connection is available, ensuring a seamless user experience even with intermittent internet.
- **PWA Support**: EduSync can now be installed as a Progressive Web App (PWA) on desktops and mobile devices for a faster, more integrated experience.
- **Scan & Pay Module**: A new "Scan & Pay" feature for Admins and Accountants allows for quick fee collection by scanning barcodes on fee challans using the device's camera.
- **Student ID Card Generation**: Added a new report to design, generate, and print professional, double-sided ID cards for an entire class.
- **Advanced Academic Year Management**:
  - **Bulk Student Promotion**: A powerful new tool for Admins to promote all students to their next respective classes at the end of an academic year, with an option to exempt specific students.
  - **Bulk Tuition Fee Increase**: A utility for Admins to apply a fixed tuition fee increase to selected students, streamlining fee updates for the new academic year.
- **Fee Reminders Module**: Admins and Accountants can now select students with outstanding fees and send targeted in-app reminders to their linked parent and student accounts.
- **Fine-Grained Permissions**: Owners can now set specific permission overrides for individual users, allowing for more flexible and granular access control beyond standard roles.
- **Challan Range Printing**: Introduced a new report option to print a specific range of fee challans by their number.
- **Attendance Report**: Added a new report to generate a comprehensive monthly attendance sheet for any class.

### Changed
- **Major Refactor for Stability**: Re-architected the core data synchronization logic to use atomic database transactions. This resolves a critical bug that caused the application to hang during save operations and significantly improves data integrity and overall performance.
- **Improved CSV Import UI**: The CSV import process now features a detailed progress modal that shows a real-time progress bar, a count of processed records, and a list of any rows that were skipped due to errors.

### Fixed
- **Application Hanging on Save:** Resolved a critical bug where action buttons (e.g., "Save", "Update", "Generate") would get stuck in a loading state if the underlying operation encountered an error. All asynchronous actions now correctly use `try...finally` blocks to reset their loading state, ensuring the UI remains responsive and interactive even when errors occur.
- **CSV Date Import Error:** Fixed a database error (`invalid input syntax for type date: ""`) that occurred when importing CSV files with empty date fields. The import process now correctly sanitizes empty date strings to `null` before insertion.
- **Build Error:** Removed an unused `useMemo` import in `PromotionPreviewModal.tsx` that was causing the build to fail.

### Database
- **Added `permissions_overrides` column:** A new `JSONB` column named `permissions_overrides` was added to the `profiles` table to support the new fine-grained permissions feature.
- **Renamed `admitted_in_class` column:** The column `admitted_in_class` in the `students` table was renamed to `admitted_class` for consistency with the application's data model.

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