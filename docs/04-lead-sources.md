# Lead Sources

Access: **Lead Sources** in sidebar (Admin/Manager only).

Manage where leads come from. Each source has a name, icon, and color for visual identification.

## Default Sources

| Source | Icon | Color |
|--------|------|-------|
| Website | 🌐 | #0ea5e9 |
| Reference | 👥 | #8b5cf6 |
| Old Client | ✅ | #10b981 |
| Facebook | 👍 | #1877f2 |
| Instagram | 📷 | #e11d48 |
| LinkedIn | 🔗 | #0a66c2 |
| Google Ads | 🅶 | #ea4335 |
| Walk-in | 🚪 | #f59e0b |
| Phone Call | 📞 | #14b8a6 |
| Email Campaign | ✉️ | #6366f1 |
| Trade Show | 🏪 | #f43f5e |
| Other | ⋯ | #64748b |

## CRUD Operations

### Add
1. Click **Add Source**
2. Enter name, select icon class, pick color
3. Click Save

### Edit
1. Click ✏️ on any source
2. Modify name, icon, or color
3. Toggle **Active** to enable/disable
4. Click Save

### Delete
- If source has **0 leads**: Hard delete (permanent)
- If source has **1+ leads**: Soft delete (IsActive = false) — preserves existing lead data

## Inline Add
When creating/editing a lead, click the **+** button next to the Lead Source dropdown to add a new source on-the-fly.
