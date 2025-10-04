# EduSync - Modern Student Record Management System

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?logo=supabase)](https://supabase.io/)

**EduSync** is a comprehensive, responsive Student Record Management System designed for educational institutions. It provides a seamless, modern interface for managing all aspects of school administration, from student enrollment to financial reporting. Built with a robust, role-based access system, it offers tailored experiences for everyone from the school owner to the students themselves.

The application is architected as a client-side React application powered by Supabase, offering real-time data synchronization and a rich, offline-capable user experience.

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
- **Interactive Dashboards:** Each role gets a customized dashboard with key statistics. The Admin and Owner dashboards feature **interactive charts** with drill-down capabilities to explore data like fee status and attendance in detail.
- **Versatile Charting:** The Admin dashboard includes a toggle to switch the "Fee Collection" graph between **Line** and **Bar** chart views for better analysis.
- **Comprehensive Reporting Suite:** A dedicated reports section to generate, view, and print critical documents:
  - **Fee Collection Report:** Track collected fees within a specific date range.
  - **Fee Defaulter Report:** Quickly identify students with overdue payments.
  - **Printable Class Lists:** Generate student lists with customizable columns.
  - **Bulk Fee Challan Printing:** Print professional, three-part fee challans for an entire class (3 per A4 page).
  - **Student Report Cards:** Generate and print detailed, professional report cards for a whole class.
- **Data Export & Import:**
  - **Robust CSV Export:** Export key reports and data tables (like student lists and users) to CSV format with proper data escaping.
  - **Bulk CSV Import:** Easily import data for Students, Users, and Classes to speed up initial setup.

#### 💻 **User Experience & Technology**
- **Modern & Responsive UI:** Clean, intuitive interface built with Tailwind CSS that works beautifully on desktops, tablets, and mobile devices.
- **Light & Dark Mode:** Switch between themes for user comfort.
- **Accessibility:** Adjustable font sizes (Small, Default, Large) to improve readability.
- **Real-time Feedback:** Toast notifications for actions like saving data or errors.
- **Advanced Print Preview:** A custom, robust print previewer ensures all printable documents (challans, reports, certificates) are perfectly formatted before sending to the printer or saving as a PDF, eliminating common browser printing issues.

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
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend as a Service (BaaS):** [Supabase](https://supabase.io/) (for database, authentication, and storage)
- **State Management:** React Context API
- **Charts:** Custom-built SVG components (no external charting libraries)

---

## 🚀 Setup and Installation

This project is configured to run with a modern frontend toolchain (Vite) and connect to a Supabase backend.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- A [Supabase](https://supabase.com/) account (free tier is sufficient)
- A code editor like [VS Code](https://code.visualstudio.com/)

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

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd edusync-student-record-management-verbase
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    - Create a file named `.env` in the root of the project.
    - Add your Supabase credentials to this file:
    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
    ```
    - The `src/lib/supabaseClient.ts` file is already configured to read these variables.

### 4. Running the Application

1.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
2.  Open your browser and navigate to the local address provided by Vite (e.g., `http://localhost:5173`).

---

## 📁 Project Structure

```
/
├── public/               # Static assets
├── src/
│   ├── components/       # Reusable React components
│   │   ├── auth/         # Login, Register pages
│   │   ├── charts/       # Custom chart components
│   │   ├── common/       # Shared components (Avatar, Modal, etc.)
│   │   ├── dashboard/    # Role-specific dashboard components
│   │   ├── fees/         # Fee management components
│   │   ├── layout/       # Header, Sidebar, main Layout
│   │   └── ...           # Other feature-specific components
│   ├── context/          # React Context providers for state management
│   │   ├── AuthContext.tsx
│   │   ├── DataContext.tsx
│   │   └── ...
│   ├── lib/              # Third-party service clients
│   │   └── supabaseClient.ts
│   ├── types.ts          # Core TypeScript types and interfaces
│   ├── constants.tsx     # App-wide constants
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # React root entry point
│   └── index.css         # Tailwind CSS entry
├── .env.example          # Example environment file
├── index.html            # The single HTML page entry
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```