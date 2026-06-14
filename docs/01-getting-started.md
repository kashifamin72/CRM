# Getting Started

## About the CRM
VisionPlus CRM is a sales pipeline management system for tracking leads through stages from New to Closed Won/Lost. It supports three user roles with WhatsApp integration, follow-up scheduling, and reporting.

## Login
1. Open **https://crm.visionplusapps.com** (production) or **https://opencode.visionplusapps.com** (dev)
2. Enter your email and password
3. Click **Sign In**

## Default Users

| Name | Email | Password | Role |
|------|-------|----------|------|
| System Admin | amin.kashif@gmail.com | Admin@123 | Administrator |
| Kashif | kashif@visionplus.com.pk | Manager@123 | Manager |
| Umer | sumer@visionplus.com.pk | Manager@123 | Manager |
| Salman | salman@visionplus.com.pk | Sales@123 | SalesOfficer |
| Abdullah | abdullah@visionplus.com.pk | Sales@123 | SalesOfficer |
| Faisal | faisal@visionplus.com.pk | Sales@123 | SalesOfficer |

## Role Overview

| Feature | Administrator | Manager | Sales Officer |
|---------|:------------:|:-------:|:------------:|
| Dashboard (all leads) | ✓ | ✓ | Own leads only |
| Leads - View/Create/Edit | All leads | All leads | Own only |
| Lead Status Change | Any time | Until Closed | Until Closed |
| Modify Closed Leads | ✓ | ✗ | ✗ |
| Follow-ups | Any lead | Any lead | Own only |
| Lead Sources | Full CRUD | View only | No access |
| Status Reasons | Full CRUD | No access | No access |
| Reports | ✓ | ✓ | No access |
| Employees | Manage | No access | No access |
| WhatsApp | Any lead | Any lead | Own only |
| Profile | Self | Self | Self |

## Navigation
- **Sidebar** (left): Main menu with Dashboard, Leads, Messages, Calendar, Reports, Administration
- **Header** (top): User avatar + name, click for Profile/Logout dropdown
- **Mobile**: Hamburger icon (top-left) opens sidebar overlay
