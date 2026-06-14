# Lead Management

## Lead List

Access: **Leads** in sidebar.

### Views
- **Table View** (default): Sortable columns — Title, Customer, Status, Date, Source, Value, Assigned To, Actions
- **Kanban View**: Drag-and-drop columns — New → Contacted → Qualified → Proposal → Closed Won → Closed Lost

Toggle between views using the grid/list buttons (top-right of filter bar).

### Filters
- **Status**: Filter by any pipeline stage
- **Source**: Filter by lead source
- **Sales Officer**: Manager/Admin only — filter by assigned officer or "Unassigned"
- **Search**: Search by title, customer name, or email
- **Win/Lost**: "Exclude Win/Lost" or "Last 30 Days" options

### Sorting
Click any column header to sort ascending/descending.

### Table Actions
| Icon | Action | Description |
|------|--------|-------------|
| ✏️ | Edit | Opens lead edit page |
| 💬 | WhatsApp | Opens WhatsApp chat (if phone exists) |
| 🗑️ | Delete | Admin only — permanently deletes lead |
| Status dropdown | Change status | Opens reason modal for Closed Won/Lost |

### Kanban Card
Each card shows: title, customer name/initials, contact person, value, age (days), source/business type badges, assigned officer. Drag a card to a different column to change its status. **Closed Won/Lost cards cannot be dragged by non-admin users.**

---

## Create Lead

Click **New Lead** button (top-right of leads page).

### Required Fields
- **Title** — Lead name
- **Customer Name** — Full name of customer
- **Status** — Defaults to "New"

### Optional Fields
- Description, Customer Email, Customer Phone
- Contact Person, Designation, Mobile
- Address, City
- Estimated Value ($)
- Lead Source, Business Type
- Lead Date (defaults to today)
- Assigned To (Manager/Admin only)
- Notes

Click **Create Lead** to save.

---

## Edit Lead

Click a lead title or the ✏️ icon to open the edit page.

### Header
- Status badge with icon
- Lead title
- Customer name, phone (tel link), email (mailto link)
- Business type, lead date

### Tabs

**Tab 1 — Details**
Editable fields for all lead information. Save Changes button at bottom.

**Tab 2 — Follow-ups**
- Left: Timeline of scheduled follow-ups with status (Today/Overdue/Done badges)
- Right: Schedule new follow-up form

**Tab 3 — Messages**
- Left: Send WhatsApp message form
- Right: Message history

### Sidebar
- Activity timeline (scrollable)
- Shows: Lead created, Status changes (with reason/remark), Follow-ups, Messages

---

## Lead Status Workflow

### Pipeline Stages
```
New (0) → Contacted (1) → Qualified (2) → Proposal (3) → Closed Won (4)
                                                              → Closed Lost (5)
```

### Changing Status
1. **Table View**: Select new status from dropdown in the Status column
2. **Kanban View**: Drag the card to the target column
3. **Edit Page**: Select status from the Status dropdown in Details tab

### Closing a Lead (Won/Lost)
When moving to **Closed Won** or **Closed Lost**:
1. A modal dialog appears
2. **Select a reason** from the dropdown (e.g., "Price too high", "Good price/value")
3. **Enter a remark** (minimum 10 characters) — describe why the lead was closed
4. Click **Confirm**

### Locked Leads
Once a lead is **Closed Won** or **Closed Lost**:
- **Sales Officers / Managers**: Cannot modify the lead in any way
  - All form fields are disabled
  - Status dropdown is disabled
  - Cannot add follow-ups
  - Cannot send messages
  - Cannot forward the lead
  - A lock banner is shown at the top
- **Administrators**: Full access — can reopen, edit, or change status

### Previous Status Changes
All status changes are recorded in the Activity timeline on the edit page, showing:
- From → To status
- Reason badge
- Remark text in quotes
- Who performed the change and when
