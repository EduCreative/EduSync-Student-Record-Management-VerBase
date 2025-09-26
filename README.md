# EduSync - Modern Student Record Management System

[![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase)](https://supabase.io/)

**EduSync** is a comprehensive, responsive Student Record Management System designed for educational institutions. It provides a seamless, modern interface for managing all aspects of school administration, from student enrollment to financial reporting. Built with a robust, role-based access system, it offers tailored experiences for everyone from the school owner to the students themselves.

The application is architected as a client-side React application powered by Supabase, offering real-time data synchronization and offline capabilities.

---

## ✨ Key Features

EduSync is packed with features designed to streamline school management:

#### 🏛️ **Core Modules**
- **Role-Based Access Control (RBAC):** Six pre-configured user roles (Owner, Admin, Accountant, Teacher, Parent, Student) with distinct dashboards, permissions, and navigation menus.
- **Multi-School Management:** A top-level 'Owner' role can oversee multiple school branches, with the ability to switch context and view any school as an Admin.
- **Student Information System:**
  - Comprehensive student profiles with personal, academic, and contact details.
  - Full CRUD (Create, Read, Update, Delete) functionality for student records.
  - Track student status (Active, Inactive, Left).
  - Issue and print official School Leaving Certificates.
- **User Management:** Admins and Owners can manage all user accounts, approve new registrations, and set user statuses.
- **Academic Management:**
  - Class and subject management.
  - Daily attendance tracking on a per-class basis.
  - Result entry system for various exams (Mid-Term, Final, Quizzes).
- **Financial Management:**
  - Create and manage custom fee categories (Fee Heads).
  - Automatically generate monthly fee challans for entire classes.
  - Record full or partial fee payments and track discounts.
  - View, print, and save individual fee challans.

#### 📊 **Reporting & Analytics**
- **Dynamic Dashboards:** Each role gets a customized dashboard with key statistics presented in clean, visual stat cards and charts (Bar & Doughnut).
- **Comprehensive Reporting Suite:** A dedicated reports section to generate, view, and print critical documents:
  - **Fee Collection Report:** Track collected fees within a specific date range.
  - **Fee Defaulter Report:** Quickly identify students with overdue payments.
  - **Printable Class Lists:** Generate student lists with customizable columns.
  - **Bulk Fee Challan Printing:** Print professional, three-part fee challans for an entire class (3 per A4 page).
  - **Student Report Cards:** Generate and print detailed, professional report cards for a whole class.
- **Data Export:** Export key reports and data tables (like student lists) to CSV format.

#### 💻 **User Experience & Technology**
- **Modern & Responsive UI:** Clean, intuitive interface built with Tailwind CSS that works beautifully on desktops, tablets, and mobile devices.
- **Light & Dark Mode:** Switch between themes for user comfort.
- **Accessibility:** Adjustable font sizes (Small, Default, Large) to improve readability.
- **Real-time Feedback:** Toast notifications for actions like saving data or errors.
- **Offline Capability:** Designed to function with local state, with a "Last Sync" indicator to assure users their data is persisted.
- **Advanced Print Preview:** A custom print previewer ensures all printable documents (challans, reports, certificates) are perfectly formatted before sending to the printer or saving as a PDF.

---

## 🎭 User Roles & Demo Credentials

The application can be configured with demo accounts for each role. For a demonstration, you can use credentials like the following to explore the different perspectives:

| Role        | Example Email                 | Password | Description                                                              |
|-------------|-------------------------------|----------|--------------------------------------------------------------------------|
| **Owner**     | `owner@edusync.com`           | `password` | Manages multiple schools, users, and has full system oversight.          |
| **Admin**     | `admin@crescentschool.com`    | `password` | Manages a single school's operations, users, students, and finances.     |
| **Accountant**| `accountant@crescentschool.com` | `password` | Manages fee collection, financial reports, and challan generation.       |
| **Teacher**   | `teacher@crescentschool.com`  | `password` | Manages assigned classes, takes attendance, and enters exam results.     |
| **Parent**    | `parent@email.com`            | `password` | Views their children's progress, attendance, results, and fee status.    |
| **Student**   | `student@email.com`           | `password` | Views their own dashboard, attendance, results, and fee status.          |

---

## 🛠️ Technology Stack

- **Frontend:** [React](https://reactjs.org/) 18.2, [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend as a Service (BaaS):** [Supabase](https://supabase.io/) (for database, authentication, and storage)
- **State Management:** React Context API
- **Charts:** Custom-built SVG components (no external charting libraries)
- **Dependencies:** Loaded via CDN (`esm.sh`) using an `importmap` in `index.html`, eliminating the need for `npm install`.

---

## 🚀 Setup and Installation

This project is configured to run easily with minimal setup, connecting to a Supabase backend.

### 1. Prerequisites

- A modern web browser (Chrome, Firefox, Edge).
- A Supabase account ([free tier is sufficient](https://supabase.com/)).
- A local web server to serve the files (e.g., VS Code Live Server extension or `npx serve`).

### 2. Supabase Configuration

1.  **Create a new Supabase Project:**
    - Go to your Supabase dashboard and create a new project.
    - Save your **Project URL** and **`anon` public key**.

2.  **Set up the Database Schema:**
    - Navigate to the "SQL Editor" in your Supabase project.
    - Run the SQL scripts required to create the tables (`profiles`, `schools`, `students`, etc.).
      *(Note: A `schema.sql` file should be provided with the project for this step).*

3.  **Configure Storage (for Avatars/Logos):**
    - Go to the "Storage" section.
    - Create a new public bucket named `avatars`.
    - Create another public bucket named `logos`.
    - Set up the necessary RLS (Row Level Security) policies to allow authenticated users to upload/view files.

### 3. Local Setup

1.  **Download the Project Files:**
    - Clone or download the repository to your local machine.

2.  **Configure Supabase Client:**
    - Create a `.env` file in the root of the project.
    - Add your Supabase credentials to this file:
    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
    - The `lib/supabaseClient.ts` file is already configured to read these variables.

### 4. Running the Application

Because the application uses modern JavaScript modules (`import`/`export`), you need to serve it from a local web server. Opening `index.html` directly from the file system will not work.

**Option A: Using VS Code Live Server**
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in Visual Studio Code.
2. Right-click on `index.html` in the file explorer and select "Open with Live Server".

**Option B: Using a Terminal**
1. Make sure you have Node.js installed.
2. Open a terminal in the project's root directory.
3. Run the following command:
   ```bash
   npx serve
   ```
4. Open your browser and navigate to the local address provided by the server (e.g., `http://localhost:3000`).

---

## 📁 Project Structure

```
/
├── components/         # Reusable React components
│   ├── auth/           # Login, Register pages
│   ├── charts/         # Custom chart components
│   ├── common/         # Shared components (Avatar, Modal, etc.)
│   ├── dashboard/      # Role-specific dashboard components
│   ├── fees/           # Fee management components
│   ├── layout/         # Header, Sidebar, main Layout
│   ├── reports/        # Report generation and viewing components
│   └── ...             # Other feature-specific components
├── context/            # React Context providers for state management
│   ├── AuthContext.tsx
│   ├── DataContext.tsx   # Main data store and API logic
│   ├── PrintContext.tsx  # Handles the print preview functionality
│   └── ...
├── lib/                # Third-party service clients
│   └── supabaseClient.ts # Supabase client initialization
├── types.ts            # Core TypeScript types and interfaces
├── constants.ts        # App-wide constants (e.g., navigation links)
├── App.tsx             # Main application component
├── index.tsx           # React root entry point
└── index.html          # The single HTML page
```
