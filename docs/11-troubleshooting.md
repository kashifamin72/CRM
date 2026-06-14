# Troubleshooting

## Login Issues

### Wrong Password
- Passwords are case-sensitive
- Minimum 6 characters with at least 1 digit
- Contact System Administrator to reset

### Account Inactive
- If deactivated by Admin, you cannot log in
- Contact System Administrator to reactivate

## Lead Management

### Cannot Change Status on Closed Lead
- **Non-admin users**: Closed Won/Lost leads are locked. Only Administrator can modify.
- **Admin users**: Full access to re-open or change status.

### Status Change Modal Not Appearing
- Ensure remark is at least 10 characters
- Ensure a reason is selected from the dropdown

### Kanban Drag Not Working
- Closed Won/Lost cards cannot be dragged by non-admin users
- Table view status dropdown is also disabled for closed leads

## Follow-ups

### Cannot Add Follow-up
- If lead is Closed Won/Lost, only Administrator can add follow-ups
- Check that title and date are filled in

## Messages

### WhatsApp Send Button Disabled
- Lead must have a phone number
- If lead is Closed Won/Lost, only Administrator can send messages
- Check message body is not empty

### Message Fails to Send
- Check n8n webhook status
- WhatsApp connection may be disconnected

## Calendar

### No Follow-ups Showing
- Try changing the month
- For Sales Officers: only your own follow-ups appear
- For Managers/Admins: try filtering by a specific officer

## Browser Issues
- Use Chrome, Firefox, Edge, or Safari (latest 2 versions)
- Clear browser cache if UI appears broken (Ctrl+F5)
- Enable JavaScript
- Minimum screen width: 360px (mobile), 1280px recommended (desktop)
