# EduSync - Student Record Management System

EduSync is a comprehensive, responsive Student Record Management System designed for schools. It supports multiple user roles (Owner, Admin, Accountant, Teacher, Parent, Student) with role-based access control and features intuitive dashboards with data visualization. The entire application runs client-side, using mock data to simulate a backend, making it easy to run and demonstrate.

## Features

- **Role-Based Access Control:** Tailored dashboards and permissions for 6 distinct user roles.
- **Multi-School Management:** A top-level 'Owner' role can manage multiple school branches.
- **Comprehensive Dashboards:** At-a-glance statistics and charts for key metrics like student population, fee collection, and attendance.
- **Student Management:** Add, edit, delete, and view detailed student profiles. Includes bulk import/export via CSV.
- **Fee Management:** Generate monthly fee challans, record payments, manage fee categories (Fee Heads), and view financial reports.
- **Attendance Tracking:** Mark daily attendance by class and view detailed attendance records for students.
- **Results & Report Cards:** Enter exam results by class and subject, and generate printable report cards.
- **Reporting Suite:** Generate and print/export various reports, including:
  - Fee Collection & Defaulter Lists
  - Class Lists with customizable columns
  - Bulk Fee Challans (3 per page)
  - Student Report Cards
  - School Leaving Certificates
- **Dark Mode & Theming:** Switch between light and dark themes and adjust font sizes for accessibility.
- **Offline Functionality:** The application is designed to work offline, with a "Last Sync" indicator to simulate data synchronization.
- **Responsive Design:** A clean, modern UI that works seamlessly across desktops, tablets, and mobile devices.

## User Roles & Login Credentials

The application comes pre-populated with mock users for each role. Use the following credentials on the login page:

| Role        | Email                         | Password | Description                                                              |
|-------------|-------------------------------|----------|--------------------------------------------------------------------------|
| **Owner**     | `owner@edusync.com`           | (any)    | Manages multiple schools, users, and has full system oversight.          |
| **Admin**     | `admin@crescentschool.com`    | (any)    | Manages a single school's operations, users, students, and finances.     |
| **Accountant**| `accountant@crescentschool.com` | (any)    | Manages fee collection, financial reports, and challan generation.       |
| **Teacher**   | `teacher@crescentschool.com`  | (any)    | Manages assigned classes, takes attendance, and enters exam results.     |
| **Parent**    | `parent@email.com`            | (any)    | Views their children's progress, attendance, results, and fee status.    |
| **Student**   | `student@email.com`           | (any)    | Views their own dashboard, attendance, results, and fee status.          |

*Note: Password validation is disabled for this demonstration.*

## Tech Stack

- **Frontend:** React, TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Custom-built SVG components (no external charting libraries)
- **State Management:** React Context API
- **Backend:** None (all data is mocked and stored in-memory in `context/DataContext.tsx`)

## Setup and Running the Application

This project is designed to be as simple as possible to run, with **no build steps or dependencies** required.

### Prerequisites

- A modern web browser that supports ES6 modules (e.g., Chrome, Firefox, Safari, Edge).

### Instructions

1.  Ensure you have all the project files (`index.html`, `index.tsx`, `App.tsx`, etc.) in a single directory.
2.  Open the `index.html` file directly in your web browser.

That's it! The application will load and be fully interactive.