# CRM Application - Complete Documentation

> **Purpose:** This document captures every feature, business rule, data model, API endpoint, UI component, and infrastructure detail of the current CRM application to enable a clean rebuild using **React + .NET 10 Web API + PostgreSQL+ Tailwid css *.
>
> **Original Stack:** .NET 9 MVC + SQLite + jQuery + Bootstrap 5 + Chart.js
> **Target Stack:** React (Frontend) + .NET 10 Web API (Backend) + SQL Server (Database)

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Target Architecture](#2-target-architecture)
3. [Database Schema](#3-database-schema)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Feature Modules](#5-feature-modules)
6. [API Endpoints Reference](#6-api-endpoints-reference)
7. [Business Rules](#7-business-rules)
8. [UI/UX Specifications](#8-uiux-specifications)
9. [Infrastructure & Deployment](#9-infrastructure--deployment)
10. [Seed Data](#10-seed-data)
11. [Integration: WhatsApp](#11-integration-whatsapp)
12. [Rebuild Checklist](#12-rebuild-checklist)

---

## 1. Application Overview

A CRM (Customer Relationship Management) system for managing sales leads through a pipeline workflow. Supports three user roles with different access levels. Includes WhatsApp integration for customer messaging.
- copy write to Visionplus Technologies Pvt. 
- website visionplus.com.pk

### Core Capabilities
- Lead management with pipeline stages (New → Contacted → Qualified → Proposal → Closed Won / Closed Lost)
- Role-based access (Administrator, Manager, Sales Officer)
- WhatsApp message sending and history
- Follow-up scheduling and tracking
- Dashboard with KPIs and charts
- Reports with date/range/officer/source filters
- Lead source management
- User/employee management with profile pictures

### Users (Seeded)
| Name | Email | Password | Role |
|------|-------|----------|------|
| System Admin |amin.kashif@gmail.com | Admin@123 | Administrator |
| Kashif | kashif@visionplus.com.pk | Manager@123 | Manager |
| Umer | sumer@visionplus.com.pk | Manager@123 | Manager |
| Salman | salman@visionplus.com.pk | Sales@123 | SalesOfficer |
| Abdullah | abdullah@visionplus.com.pk | Sales@123 | SalesOfficer |
| Faisal | faisal@visionplus.com.pk | Sales@123 | SalesOfficer |

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────┐
│                  REACT SPA                   │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Dashboard│ │  Leads   │ │  Reports     │ │
│  └─────────┘ └──────────┘ └──────────────┘ │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Employees  │ │ Profile  │ │  Messages │ │
│  └─────────────┘ └──────────┘ └──────────┘ │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST + JWT Auth
┌──────────────────┴──────────────────────────┐
│           .NET 10 WEB API                     │
│  ┌────────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Auth       │ │ Leads    │ │ Reports   │ │
│  │ Controller │ │Controller│ │Controller │ │
│  └────────────┘ └──────────┘ └───────────┘ │
│  ┌────────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Employees  │ │ Profile  │ │ WhatsApp  │ │
│  │ Controller │ │Controller│ │ Service   │ │
│  └────────────┘ └──────────┘ └───────────┘ │
│  ┌──────────────────────────────────────┐   │
│  │      Entity Framework Core           │   │
│  └──────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│              SQL SERVER                     │
│  AspNetUsers  Leads  FollowUps             │
│  LeadSources  MessageLogs                  │
└─────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Users (extends ASP.NET Identity)

Maps to `AspNetUsers` table with additional columns.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `Id` | nvarchar(450) | No | PK | Identity user ID |
| `Email` | nvarchar(256) | No | | Email (also used as UserName) |
| `UserName` | nvarchar(256) | No | = Email | Login identifier |
| `PhoneNumber` | nvarchar(max) | Yes | | Mobile number (e.g. +923004320015) |
| `FirstName` | nvarchar(max) | No | '' | |
| `LastName` | nvarchar(max) | No | '' | |
| `Designation` | nvarchar(max) | No | '' | "Administrator", "Manager", or "Sales Officer" |
| `ProfilePicture` | nvarchar(max) | Yes | null | File path (e.g. /uploads/profiles/{id}.jpg) |
| `IsActive` | bit | No | true | false = deactivated user |
| `CreatedAt` | datetime2 | No | UTC now | |
| + Identity fields | | | | PasswordHash, SecurityStamp, EmailConfirmed, etc. |

### 3.2 Leads

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `Id` | int | No | PK, identity | |
| `Title` | nvarchar(max) | No | '' | Lead name/title |
| `Description` | nvarchar(max) | No | '' | Brief description |
| `CustomerName` | nvarchar(max) | No | '' | Customer full name |
| `CustomerEmail` | nvarchar(max) | No | '' | Customer email |
| `CustomerPhone` | nvarchar(max) | No | '' | Customer phone |
| `Status` | int | No | 0 (New) | Enum: 0=New, 1=Contacted, 2=Qualified, 3=Proposal, 4=ClosedWon, 5=ClosedLost |
| `EstimatedValue` | decimal(18,2) | Yes | null | Deal value |
| `Notes` | nvarchar(max) | Yes | null | Internal notes |
| `LeadSourceId` | int | Yes | null | FK → LeadSources.Id (ON DELETE SET NULL) |
| `CreatedById` | nvarchar(450) | No | | FK → AspNetUsers.Id (ON DELETE RESTRICT) |
| `AssignedToId` | nvarchar(450) | Yes | null | FK → AspNetUsers.Id (ON DELETE RESTRICT) |
| `CreatedAt` | datetime2 | No | UTC now | |
| `UpdatedAt` | datetime2 | No | UTC now | |

### 3.3 LeadSources

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `Id` | int | No | PK, identity | |
| `Name` | nvarchar(80) | No | | Required, unique |
| `Icon` | nvarchar(20) | Yes | null | Bootstrap icon class (e.g. bi-globe) |
| `Color` | nvarchar(20) | No | '#6366f1' | Hex color |
| `IsActive` | bit | No | true | Soft delete flag |
| `CreatedAt` | datetime2 | No | UTC now | |

**Seed data (12 sources):**
| Name | Icon | Color |
|------|------|-------|
| Website | bi-globe | #0ea5e9 |
| Reference | bi-people | #8b5cf6 |
| Old Client | bi-person-check | #10b981 |
| Facebook | bi-facebook | #1877f2 |
| Instagram | bi-instagram | #e11d48 |
| LinkedIn | bi-linkedin | #0a66c2 |
| Google Ads | bi-google | #ea4335 |
| Walk-in | bi-door-open | #f59e0b |
| Phone Call | bi-telephone | #14b8a6 |
| Email Campaign | bi-envelope | #6366f1 |
| Trade Show | bi-shop | #f43f5e |
| Other | bi-three-dots | #64748b |

### 3.4 FollowUps

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `Id` | int | No | PK, identity | |
| `LeadId` | int | No | | FK → Leads.Id (ON DELETE CASCADE) |
| `Title` | nvarchar(max) | No | '' | |
| `Description` | nvarchar(max) | Yes | null | |
| `FollowUpDate` | datetime2 | No | | Scheduled date/time |
| `IsCompleted` | bit | No | false | |
| `CreatedById` | nvarchar(450) | No | | FK → AspNetUsers.Id (ON DELETE RESTRICT) |
| `CreatedAt` | datetime2 | No | UTC now | |
| `CompletedAt` | datetime2 | Yes | null | |

### 3.5 MessageLogs

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `Id` | int | No | PK, identity | |
| `LeadId` | int | No | | FK → Leads.Id (ON DELETE CASCADE) |
| `ToPhoneNumber` | nvarchar(max) | No | '' | |
| `MessageBody` | nvarchar(max) | No | '' | |
| `Status` | nvarchar(max) | No | '' | "Sent" or "Failed" |
| `Response` | nvarchar(max) | Yes | null | Raw API response JSON |
| `SentById` | nvarchar(450) | No | | FK → AspNetUsers.Id (ON DELETE RESTRICT) |
| `SentAt` | datetime2 | No | UTC now | |

### 3.6 Entity Relationships

```
ApplicationUser ──┬──< Lead (CreatedById)        [Restrict]
                  ├──< Lead (AssignedToId)        [Restrict]
                  ├──< FollowUp (CreatedById)     [Restrict]
                  ├──< MessageLog (SentById)      [Restrict]
                  │
LeadSource ───────┬──< Lead (LeadSourceId)        [SetNull]
                  │
Lead ─────────────┬──< FollowUp (LeadId)          [Cascade]
                  └──< MessageLog (LeadId)        [Cascade]
```

---

## 4. Authentication & Authorization

### 4.1 Authentication
- ASP.NET Core Identity with cookie authentication
- No email confirmation required (`RequireConfirmedAccount = false`)
- Password: minimum 6 characters, at least 1 digit
- Login page: two-pane design (brand + form)
- Path base: `/crm` (all routes prefixed)

### 4.2 Roles

| Role | Description |
|------|-------------|
| `Administrator` | Full access. Manages users, deletes leads, manages lead sources |
| `Manager` | Views all leads (all officers). Filters by officer. Manages lead sources. Views reports |
| `SalesOfficer` | Views only own leads (where `AssignedToId = self`). No access to reports, employees, or lead source management |

### 4.3 Access Control Matrix

| Feature | Administrator | Manager | SalesOfficer |
|---------|:------------:|:-------:|:------------:|
| Dashboard | All leads | All leads + officer filter | Own leads only |
| Leads - View | All | All (filterable) | Own only |
| Leads - Create | Yes | Yes | Yes |
| Leads - Edit | Any | Any | Own only |
| Leads - Delete | Yes | No | No |
| Lead Status Change | Any | Any | Own only |
| Follow-ups | Any | Any | Own only |
| Lead Sources - View | Yes | Yes | No |
| Lead Sources - Manage | Yes (CRUD) | Yes (CRUD) | No |
| Reports | Yes | Yes | No |
| Employees - View | Yes | No | No |
| Employees - Manage | Yes (CRUD) | No | No |
| Message Logs | All | All | Own only |
| WhatsApp Send | Any | Any | Own only |
| Profile - View/Edit | Self | Self | Self |
| Profile - Picture | Self | Self | Self |
| Profile - Password | Self | Self | Self |

### 4.4 Lead Access Rule (`CanAccessLead`)
A user can access a lead if they are:
- Administrator, OR
- Manager, OR
- The lead's `AssignedTo`, OR
- The lead's `CreatedBy`

---

## 5. Feature Modules

### 5.1 Dashboard (`/crm/`)

**KPI Cards (4):**
- Total Leads
- New Leads
- Closed Won
- Estimated Value (sum)

**Follow-ups Section:**
- Today's pending follow-ups (yellow card)
- Tomorrow's pending follow-ups (blue card)
- Each shows: title, lead name, time, link to lead

**Charts (Chart.js):**
- Pipeline bar chart (New, Contacted, Qualified, Proposal, Won, Lost)
- Source doughnut chart (leads by source)

**Recent Leads Table:**
- Last 10 leads by UpdatedAt
- Columns: Title, Customer, Status (badge), Source (colored pill), Value, Assigned To
- Clickable rows → Edit lead

**Source Breakdown:**
- Doughnut chart + table with: Source name, Lead count, Estimated value, Share progress bar

**Bottom Cards:**
- Lead Distribution (progress bars per status)
- Conversion (win rate %, won count, lost count)
- Quick Actions (New Lead, View Leads, Reports)

**Manager-only:** Sales Officer filter dropdown at top

### 5.2 Leads Module

#### 5.2.1 Lead List (`/crm/Leads`)

**Filter Bar:**
- Status dropdown (all statuses)
- Source dropdown (all active sources)
- Sales Officer dropdown (manager/admin only, includes "Unassigned" option)
- Search field (title, customer name, email)
- Generate/Filter button
- New Lead button

**Two Views (toggle):**
1. **Table View:** Title, Customer, Status badge, Source pill, Value, Assigned To, Updated date, Actions (edit, WhatsApp, status dropdown, delete)
2. **Kanban View:** 6 columns (New, Contacted, Qualified, Proposal, Closed Won, Closed Lost) with drag-and-drop cards

**Kanban Card:**
- Status accent bar (colored gradient)
- Title (linked to Edit)
- Customer name with avatar initials, phone/email icons
- Meta pills: Value, Age (days), Follow-ups count, Source
- Footer: Assigned officer avatar + name, WhatsApp + Open actions
- Drag-and-drop updates status via AJAX POST

**Table Actions:**
- Edit (pencil icon)
- WhatsApp (green, if phone exists)
- Status change dropdown
- Delete (admin only, with confirmation)

#### 5.2.2 Lead Create (`/crm/Leads/Create`)

**Form Fields:**
- Title (required, large input)
- Status (dropdown, default: New)
- Description (textarea)
- Customer Name (required)
- Customer Email
- Customer Phone
- Estimated Value ($)
- Lead Source (dropdown with inline "+" add button)
- Notes (textarea)

**Inline Source Add:** Click "+" → prompt for name → AJAX POST to LeadSources/Create → adds to dropdown

#### 5.2.3 Lead Edit (`/crm/Leads/Edit`)

**Header:**
- Status icon + title (editable inline input)
- Customer name, phone (tel link), email (mailto link)
- Status badge
- 4 KPI mini cards: Est. Value, Days Open, Pending Follow-ups, Last Activity

**4 Tabs:**

**Tab 1 - Details:**
- Description textarea
- Customer: Name, Email, Phone
- Deal: Estimated Value, Status, Assigned To (dropdown), Lead Source (dropdown with "+" add)
- Notes textarea
- Sticky action bar: Back + Save Changes

**Tab 2 - Follow-ups:**
- Left: Follow-up timeline (list with status icons, dates, badges for Today/Overdue/Done, complete/delete actions)
- Right: "Schedule New" form (title, description, date, submit)

**Tab 3 - Messages:**
- Left: WhatsApp send form (shows phone, message textarea with template, send button)
- Right: Message history (scrollable list with avatar, sender, time, message, status badge)

**Tab 4 - Activity:**
- Combined timeline of: Lead created, Lead updated, Follow-ups (scheduled/completed), WhatsApp messages sent

**Sidebar:**
- Pipeline Stage: Visual stage track (New → Contacted → Qualified → Proposal → Closed Won + Closed Lost). Click to change status.
- Details card: Created by, Created on, Last update, Assigned to, Source, Lead ID
- Danger Zone: Delete button (admin only)

### 5.3 Lead Sources (`/crm/LeadSources`)

**Admin/Manager only**

**Table:** Name (with icon + color), Icon, Color swatch, Active status, Usage count, Actions

**Modal CRUD (JavaScript):**
- Add: Name, Icon (Bootstrap icon class), Color (hex picker)
- Edit: Same fields + IsActive toggle
- Delete: Hard delete if 0 leads; Soft delete (IsActive=false) if leads exist; shows usage count

### 5.4 Reports (`/crm/Reports`)

**Admin/Manager only**

**Filters:**
- From Date
- To Date
- Sales Officer dropdown (includes "Unassigned")
- Source dropdown
- Generate button

**KPI Cards (8):** Total, New, Contacted, Qualified, Proposal, Won, Lost, Est. Value

**Charts:**
- Status distribution bar chart
- Conversion breakdown (Won/Lost/Active counts + win rate progress bar)
- Source breakdown doughnut + table

**Lead Details Table:** Title, Customer, Status, Source, Value, Created By, Assigned To, Created date

### 5.5 Message Logs (`/crm/MessageLogs`)

**Table:** Lead (linked), Phone, Message (truncated), Status badge, Sent By, Date, Response

**Access:** Admin/Manager see all; SalesOfficer sees own only

### 5.6 Employee Management (`/crm/Employees`)

**Admin only**

**List View:**
- Search by name/email/designation
- Filter by status (Active/Inactive)
- Table: Avatar + Name + Email, Mobile, Designation badge, Role badges, Status badge, Created date, Edit + Toggle Active buttons

**Create Form:**
- First Name, Last Name, Email, Mobile Number, Designation (Manager/Sales Officer dropdown), Role (dropdown), Password

**Edit Form:**
- Same fields (no password), Role pre-selected

**Toggle Active:** POST to flip `IsActive` with confirmation dialog

### 5.7 User Profile (`/crm/Profile`)

#### Profile View:
- Hero card with gradient background, large avatar (picture or initials), name, email, role badges
- Personal Information card: Full Name, Email, Mobile, Designation, Role, Joined date, Status
- Profile Picture card: Upload/change picture (JPG/PNG/WebP, max 5MB), Remove picture
- Security card: Change Password button

#### Edit Profile:
- First Name, Last Name, Email, Mobile Number

#### Change Password:
- Current Password, New Password, Confirm New Password

### 5.8 Calendar View (`/calendar`)

**Access:**
- Any authenticated user (Administrator, Manager, SalesOfficer)

**Description:**
A month-grid calendar page that displays follow-up tasks organized by their scheduled date.

**Manager/Admin View:**
- Shows all follow-ups across all sales officers
- Sales Officer filter dropdown (lists all active SalesOfficer users) to narrow the view
- Each follow-up card shows: task title, linked lead name, assigned officer name (with user icon)
- Filtered by selected officer or shows all

**Sales Officer View:**
- Shows only follow-ups created by the logged-in Sales Officer
- No officer filter dropdown displayed
- Each follow-up card shows: task title, linked lead name

**Calendar UI:**
- Month navigation with Previous/Next buttons
- Current month/year displayed in center
- 7-column grid (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
- Today's date highlighted with primary blue circle
- Day cells show:
  - Day number (highlighted if today)
  - Count badge of follow-ups for that day
  - Up to 4 mini follow-up cards per day cell
  - "+N more" indicator if more than 4 tasks
- Pending follow-ups: amber background card with unfilled circle icon
- Completed follow-ups: green background card with checkmark icon
- Click any follow-up card → navigates to lead edit page
- Legend at bottom: Pending (amber) / Completed (green)

**Backend Endpoints:**
- `GET /api/followups/calendar?assignedTo=` — Returns all follow-ups with lead title, created by name; role-filtered for SalesOfficer; optional assignedTo filter for Admin/Manager
- `GET /api/followups/officers` — Returns active SalesOfficer users (Admin/Manager only) for filter dropdown

---

**Any authenticated user**

**Profile View:**
- Hero card with gradient background, large avatar (picture or initials), name, email, role badges
- Personal Information card: Full Name, Email, Mobile, Designation, Role, Joined date, Status
- Profile Picture card: Upload/change picture (JPG/PNG/WebP, max 5MB), Remove picture
- Security card: Change Password button

**Edit Profile:**
- First Name, Last Name, Email, Mobile Number

**Change Password:**
- Current Password, New Password, Confirm New Password

---

## 6. API Endpoints Reference

### 6.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/crm/Identity/Account/Login` | Login page |
| POST | `/crm/Identity/Account/Login` | Authenticate user |
| POST | `/crm/Identity/Account/Logout` | Logout |

### 6.2 Dashboard
| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/crm/` | `assignedTo?` | Dashboard data |

### 6.3 Leads
| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/crm/Leads` | `status?`, `search?`, `assignedTo?`, `sourceId?` | List with filters |
| GET | `/crm/Leads/Create` | - | Create form |
| POST | `/crm/Leads/Create` | `Lead` model | Create lead |
| GET | `/crm/Leads/Edit/{id}` | - | Edit form |
| POST | `/crm/Leads/Edit/{id}` | `Lead` model | Update lead |
| POST | `/crm/Leads/UpdateStatus` | `id`, `status` | Update status (supports AJAX, returns JSON) |
| POST | `/crm/Leads/Delete` | `id` | Delete lead (admin only) |
| POST | `/crm/Leads/AddFollowUp` | `leadId`, `title`, `description?`, `followUpDate` | Add follow-up |
| POST | `/crm/Leads/CompleteFollowUp` | `id` | Mark follow-up complete |
| POST | `/crm/Leads/DeleteFollowUp` | `id` | Delete follow-up |

### 6.4 Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/crm/Employees` | List all |
| GET | `/crm/Employees/Create` | Create form |
| POST | `/crm/Employees/Create` | Create user |
| GET | `/crm/Employees/Edit/{id}` | Edit form |
| POST | `/crm/Employees/Edit/{id}` | Update user |
| POST | `/crm/Employees/ToggleActive` | Toggle active status |

### 6.5 Lead Sources
| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/crm/LeadSources` | - | Manage page |
| POST | `/crm/LeadSources/Create` | `name`, `icon?`, `color` | Create (JSON) |
| POST | `/crm/LeadSources/Edit` | `id`, `name`, `icon`, `color`, `isActive` | Update (JSON) |
| POST | `/crm/LeadSources/Delete` | `id` | Delete/hard-delete (JSON) |

### 6.6 Message Logs
| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/crm/MessageLogs` | `leadId?` | Message history |
| POST | `/crm/MessageLogs/Send` | `leadId`, `messageBody` | Send WhatsApp + log |

### 6.7 Reports
| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/crm/Reports` | `fromDate?`, `toDate?`, `assignedTo?`, `sourceId?` | Report data |

### 6.8 Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/crm/Profile` | View profile |
| GET | `/crm/Profile/Edit` | Edit form |
| POST | `/crm/Profile/Edit` | Update profile |
| GET | `/crm/Profile/ChangePassword` | Password form |
| POST | `/crm/Profile/ChangePassword` | Change password |
| POST | `/crm/Profile/UploadPicture` | Upload picture (multipart) |
| POST | `/crm/Profile/RemovePicture` | Remove picture |

---

## 7. Business Rules

### 7.1 Lead Pipeline
- New leads start at status `New` (0)
- Status progresses: New → Contacted → Qualified → Proposal → Closed Won
- At any point, a lead can be marked `Closed Lost`
- Status can be changed via: dropdown (table), drag-and-drop (kanban), sidebar stage buttons (edit page)
- Each status change updates `UpdatedAt`

### 7.2 Lead Ownership
- Leads can be **unassigned** (`AssignedToId = null`)
- Only Managers and Administrators can see unassigned leads
- Sales Officers can only see leads assigned to them
- A Sales Officer can also see leads they created (even if assigned to someone else)
- Managers can filter the view by specific Sales Officer or "Unassigned"

### 7.3 Follow-ups
- Each follow-up belongs to a lead
- Has a scheduled date and completed status
- Overdue: `FollowUpDate < today && !IsCompleted`
- Today: `FollowUpDate == today && !IsCompleted`
- Dashboard shows today's and tomorrow's pending follow-ups

### 7.4 Lead Sources
- Deleting a source with leads: soft delete (`IsActive = false`)
- Deleting a source with no leads: hard delete
- Inline creation from Lead Create/Edit forms
- Duplicate name check (case-insensitive)

### 7.5 Employee Deactivation
- `IsActive = false` prevents login
- Does NOT delete the user or their data
- Can be reactivated

### 7.6 Profile Picture
- Stored at `/uploads/profiles/{userId}.{ext}`
- Allowed formats: JPG, JPEG, PNG, WebP
- Max size: 5MB
- Persisted via Docker volume mount

### 7.7 Password Policy
- Minimum 6 characters
- At least 1 digit required
- No email confirmation required

---

## 8. UI/UX Specifications

### 8.1 Layout Structure
- **Sidebar** (fixed, 250px, dark: #1e293b)
  - Brand: Logo icon + "CRM System"
  - Nav sections: Main (Dashboard, Leads, Messages), Analytics (Reports, Lead Sources - admin/manager), Administration (Employees - admin)
  - Footer: User avatar + name + role dropdown (Profile, Edit Profile, Change Password, Logout)
  - Mobile: Overlay + hamburger toggle, Escape key to close
- **Page Header** (sticky, 64px): Breadcrumb + page actions
- **Page Content**: Main content area with 1.5rem padding
- **Footer**: Copyright text

### 8.2 Design System
- **Font:** Inter (Google Fonts), system-ui fallback
- **Base size:** 14px (mobile), 15px (768px+)
- **Border radius:** 0.625rem (cards), 0.5rem (buttons/inputs)
- **Primary color:** #2563eb (blue)
- **Sidebar:** #1e293b (dark slate)
- **Background:** #f1f5f9 (light gray)
- **Transitions:** all 0.2s ease

### 8.3 Components
- **KPI Cards:** Icon + label + value, hover lift effect, top gradient border
- **Badges:** Soft-colored (bg-opacity-10 text), 0.75rem font
- **Tables:** Hover rows, uppercase muted headers, 0.8125rem font
- **Forms:** Rounded inputs, focus ring (primary color), floating labels on auth pages
- **Kanban:** Cards with accent bar, drag handle, hover shadow
- **Timeline:** Left border line, dot markers, icon badges
- **Empty States:** Centered icon + message + action button
- **Toast Notifications:** Auto-dismiss after 4s, top-right positioning

### 8.4 Login Page
- Two-pane layout: Brand pane (left) + Form pane (right)
- Brand pane: Gradient background, blur orbs, logo, headline, 3 feature cards, testimonial
- Form pane: Dot pattern background, white card, eyebrow tag, floating inputs, gradient submit button
- Mobile: Single column, brand extras hidden

### 8.5 Charts (Chart.js 4.4.1)
- Bar charts: Rounded corners (borderRadius: 4-6), no legend, gridlines on Y only
- Doughnut charts: 60% cutout, white border, right-positioned legend
- Responsive with maintainAspectRatio: false

### 8.6 Animations
- `fadeIn`: translateY(8px) → 0, 0.3s
- `slideIn`: translateX(-8px) → 0, 0.3s
- Staggered KPI card entrance (0.08s delay per card)
- Back-to-top button: fade + slide on scroll

### 8.7 Responsive Breakpoints
- 992px: Sidebar collapses to overlay
- 768px: 2-column stats grid
- 576px: Single column, compact padding

---

## 9. Infrastructure & Deployment

### 9.1 Docker
- **Base images:** `mcr.microsoft.com/dotnet/sdk:10.0` (build) → `mcr.microsoft.com/dotnet/aspnet:10.0` (runtime)
- **Port:** 5000 (HTTP only, nginx handles SSL)
- **Network:** `n8n-net` (shared with n8n, opencode-whatsapp)

### 9.2 Volumes
| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `/home/kashif/Documents/CRM/db` | `/app/db` | SQLite database |
| `/home/kashif/Documents/CRM/CRM-keys` | `/app/keys` | Data Protection keys |
| `/home/kashif/Documents/CRM/uploads` | `/app/wwwroot/uploads` | Profile pictures |

### 9.3 Nginx Reverse Proxy
| Path | Target |
|------|--------|
| `/crm/` | `crm-app:5000` |
| `/crm` | Redirect to `/crm/` |
| `/` | `n8n:5678` |
| `/health` | `opencode-whatsapp:3421` |
| `/whatsapp-qr` | Static `qr.html` |

### 9.4 Build Commands
```bash
# Build image
docker build -t crm-app /home/kashif/Documents/CRM

# Run container
docker run -d --name crm-app --network n8n-net \
  -v /home/kashif/Documents/CRM/db:/app/db \
  -v /home/kashif/Documents/CRM/CRM-keys:/app/keys \
  -v /home/kashif/Documents/CRM/uploads:/app/wwwroot/uploads \
  crm-app

# Rebuild + restart
docker stop crm-app && docker rm crm-app && docker run -d --name crm-app --network n8n-net \
  -v /home/kashif/Documents/CRM/db:/app/db \
  -v /home/kashif/Documents/CRM/CRM-keys:/app/keys \
  -v /home/kashif/Documents/CRM/uploads:/app/wwwroot/uploads \
  crm-app
```

---

## 10. Seed Data

### 10.1 Roles
- `Administrator`
- `Manager`
- `SalesOfficer`

### 10.2 Users
See [Section 1: Users (Seeded)](#users-seeded)

### 10.3 Lead Sources
See [Section 3.3: Seed data](#seed-data-12-sources)

### 10.4 Auto-migration
`db.Database.MigrateAsync()` runs on every application startup.

---

## 11. Integration: WhatsApp

### 11.1 Architecture
```
CRM → WhatsAppService (HttpClient) → n8n Webhook → opencode-whatsapp (Baileys) → WhatsApp
```

### 11.2 WhatsAppService
- Interface: `IWhatsAppService.SendMessageAsync(phone, message) → (bool, string)`
- Implementation: POST to n8n webhook URL, 30s timeout
- Returns success/failure + response JSON

### 11.3 n8n Workflow
- Webhook URL: `http://n8n:5678/webhook/whatsapp-bridge`
- Forwards to: `http://opencode-whatsapp:3421/api/send-message`
- Payload: `{chatId: "{phone}@s.whatsapp.net", text: "{message}"}`

### 11.4 Message Logging
Every send attempt is recorded in `MessageLogs` table with phone, message, status, response, sender, and timestamp.

---

## 12. Rebuild Checklist

### Phase 1: Backend (.NET 10 Web API)
- [ ] Create new .NET 10 Web API project
- [ ] Set up SQL Server connection (replace SQLite)
- [ ] Implement ASP.NET Core Identity with JWT authentication
- [ ] Create all 5 domain models (User, Lead, LeadSource, FollowUp, MessageLog)
- [ ] Set up Entity Framework Core with SQL Server provider
- [ ] Create and apply migrations
- [ ] Implement seed data (roles, users, lead sources)
- [ ] Build 7 API controllers with all endpoints
- [ ] Implement role-based authorization policies
- [ ] Implement lead access control (CanAccessLead logic)
- [ ] Add WhatsApp service integration
- [ ] Add profile picture upload (file storage)
- [ ] Add CORS configuration for React frontend
- [ ] Add API documentation (Swagger/OpenAPI)

### Phase 2: Frontend (React)
- [ ] Set up React project (Vite/Create React App)
- [ ] Implement authentication (login, JWT storage, protected routes)
- [ ] Build layout: sidebar navigation, header, footer
- [ ] Dashboard page with KPI cards, charts (Chart.js/Recharts), follow-ups
- [ ] Leads list with table/kanban toggle, filters, drag-and-drop
- [ ] Lead create/edit forms with tabs, follow-ups, messages, activity
- [ ] Lead source management (admin/manager)
- [ ] Reports with date filters, charts, breakdown tables
- [ ] Message logs table
- [ ] Employee management (admin only)
- [ ] User profile with picture upload, password change
- [ ] Toast notifications, loading states, error handling
- [ ] Responsive design (mobile sidebar, compact tables)
- [ ] Back-to-top button, smooth scrolling

### Phase 3: Integration & Deployment
- [ ] Docker Compose setup (React + .NET API + SQL Server)
- [ ] Nginx configuration for API proxy
- [ ] WhatsApp integration (n8n webhook + bridge)
- [ ] Profile picture file storage (persistent volume)
- [ ] Data Protection key persistence
- [ ] CI/CD pipeline (optional)
- [ ] Environment variables configuration

### Phase 4: Enhancements (Future)
- [ ] Export to CSV/Excel for reports
- [ ] Email notifications for overdue follow-ups
- [ ] Lead scoring / AI priority
- [ ] Lead import from CSV
- [ ] Lead ownership transfer
- [ ] Activity timeline per lead (unified)
- [ ] Charts: leads per officer, time-to-close, monthly trend
- [ ] Two-factor authentication
- [ ] PWA / Mobile app

---

## Appendix A: Current File Structure

```
CRM/
├── Program.cs                         # Bootstrap, DI, middleware, seed data
├── CRM.csproj                         # .NET 10 project
├── Dockerfile                         # Multi-stage build
├── appsettings.json                   # Connection string, WhatsApp URL
├── Data/
│   ├── ApplicationDbContext.cs        # DbContext + FK config
│   ├── DesignTimeDbContextFactory.cs
│   └── Migrations/                    # 6 migrations
├── Models/
│   ├── ApplicationUser.cs             # IdentityUser + custom fields
│   ├── Lead.cs                        # Lead entity + LeadStatus enum
│   ├── LeadSource.cs                  # Lead source master
│   ├── FollowUp.cs                    # Follow-up reminder
│   ├── MessageLog.cs                  # WhatsApp message log
│   └── ErrorViewModel.cs
├── Controllers/
│   ├── HomeController.cs              # Dashboard
│   ├── LeadsController.cs             # Lead CRUD + workflow
│   ├── EmployeesController.cs         # User management
│   ├── LeadSourcesController.cs       # Source CRUD
│   ├── MessageLogsController.cs       # Message history + send
│   ├── ReportsController.cs           # Reports with filters
│   └── ProfileController.cs           # User profile
├── Services/
│   ├── IWhatsAppService.cs
│   └── WhatsAppService.cs
├── Views/
│   ├── Shared/_Layout.cshtml          # Main layout with sidebar
│   ├── Home/Index.cshtml              # Dashboard
│   ├── Leads/{Index,Create,Edit}.cshtml
│   ├── LeadSources/Index.cshtml
│   ├── Reports/Index.cshtml
│   ├── MessageLogs/Index.cshtml
│   ├── Employees/{Index,Create,Edit}.cshtml
│   └── Profile/{Index,Edit,ChangePassword}.cshtml
├── Areas/Identity/Pages/Account/
│   └── Login.cshtml                   # Two-pane login
└── wwwroot/
    ├── css/{site.css, login.css}
    ├── js/site.js
    └── lib/{bootstrap, jquery, jquery-validation}
```

## Appendix B: Status Enum Values

| Value | Name | Color | Icon |
|-------|------|-------|------|
| 0 | New | warning (amber) | bi-stars |
| 1 | Contacted | info (cyan) | bi-chat-dots |
| 2 | Qualified | primary (blue) | bi-check2-circle |
| 3 | Proposal | secondary (gray) | bi-file-text |
| 4 | ClosedWon | success (green) | bi-trophy |
| 5 | ClosedLost | danger (red) | bi-x-circle |

## Appendix C: Pre-existing Build Warnings

These are nullable-reference warnings in the current codebase (non-blocking):
- `LeadsController.cs:35, 224, 240` - User null checks
- `HomeController.cs:64` - User null check
- `MessageLogsController.cs:36` - User null check
- `Views/Leads/Index.cshtml:324` - Nullable int comparison
- `Views/Leads/Index.cshtml:17` - Unused local function `StatusIcon`

---

*Document generated on: June 7, 2026*
*Source: Current CRM application (.NET 9 MVC + SQLite)*
*Target: React + .NET 10 Web API + PostgreSQL*

