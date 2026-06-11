#!/bin/bash
# Complete QA Test Script v2 - Corrected Routes
API="https://localhost/api"
PASS=0
FAIL=0
WARN=0
ADMIN_TOKEN=""
MGR_TOKEN=""
SO_TOKEN=""

pass() { PASS=$((PASS+1)); echo "  [PASS] $1"; }
fail() { FAIL=$((FAIL+1)); echo "  [FAIL] $1"; }
warn() { WARN=$((WARN+1)); echo "  [WARN] $1"; }

# Helper: Login and store token
do_login() {
  local email=$1
  local pass=$2
  curl -k -s "$API/auth/login" -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$pass\"}" | jq -r '.token // empty'
}

echo "============================================"
echo "  CRM SYSTEM - COMPLETE QA REPORT v2"
echo "  $(date)"
echo "============================================"
echo ""

# ---------- 1. INFRASTRUCTURE ----------
echo "=== 1. INFRASTRUCTURE HEALTH ==="
[ "$(docker inspect -f '{{.State.Health.Status}}' crm-postgres 2>/dev/null)" = "healthy" ] && pass "PostgreSQL healthy" || fail "PostgreSQL not healthy"
for c in crm-api crm-frontend crm-nginx; do
  [ "$(docker inspect -f '{{.State.Running}}' $c)" = "true" ] && pass "$c running" || fail "$c down"
done
NET=$(docker inspect crm-api --format '{{json .NetworkSettings.Networks}}' | jq -r 'keys[]' | grep crm)
[ -n "$NET" ] && pass "API on CRM network ($NET)" || fail "API not on CRM network"
POSTGRES_NET=$(docker inspect crm-postgres --format '{{json .NetworkSettings.Networks}}' | jq -r 'keys[]' | grep crm)
[ -n "$POSTGRES_NET" ] && pass "PostgreSQL on CRM network ($POSTGRES_NET)" || fail "PostgreSQL not on CRM network"
echo ""

# ---------- 2. AUTHENTICATION ----------
echo "=== 2. AUTHENTICATION ==="
ADMIN_TOKEN=$(do_login "amin.kashif@gmail.com" "Admin@123")
[ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ] && pass "Admin login" || fail "Admin login"

MGR_TOKEN=$(do_login "kashif@visionplus.com.pk" "Manager@123")
[ -n "$MGR_TOKEN" ] && [ "$MGR_TOKEN" != "null" ] && pass "Manager login" || fail "Manager login"

MGR_TOKEN2=$(do_login "sumer@visionplus.com.pk" "Manager@123")
[ -n "$MGR_TOKEN2" ] && [ "$MGR_TOKEN2" != "null" ] && pass "Manager 2 (Umer) login" || fail "Manager 2 login"

SO_TOKEN=$(do_login "salman@visionplus.com.pk" "Sales@123")
[ -n "$SO_TOKEN" ] && [ "$SO_TOKEN" != "null" ] && pass "Sales Officer login" || fail "Sales Officer login"

# Invalid credentials
BAD_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/auth/login" -X POST -H "Content-Type: application/json" -d '{"email":"amin.kashif@gmail.com","password":"wrong"}')
[ "$BAD_CODE" = "401" ] && pass "Invalid password rejected (401)" || fail "Invalid password returned $BAD_CODE"

MISS_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/auth/login" -X POST -H "Content-Type: application/json" -d '{"email":"nobody@x.com","password":"x"}')
[ "$MISS_CODE" = "401" ] && pass "Unknown email rejected (401)" || fail "Unknown email returned $MISS_CODE"
echo ""

# ---------- 3. PROTECTED ENDPOINTS - ADMIN ----------
echo "=== 3. ADMIN ENDPOINTS ==="
for EP in dashboard leads leadsources employees followups/officers businessTypes cities reports messagelogs followups/calendar; do
  CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/$EP" -H "Authorization: Bearer $ADMIN_TOKEN")
  [ "$CODE" = "200" ] && pass "/$EP (200)" || fail "/$EP ($CODE)"
done
echo ""

# ---------- 4. ROLE-BASED ACCESS CONTROL ----------
echo "=== 4. ROLE-BASED ACCESS CONTROL ==="
# Manager should access reports and leadsources
MGR_LEADSRC=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/leadsources" -H "Authorization: Bearer $MGR_TOKEN")
[ "$MGR_LEADSRC" = "200" ] && pass "Manager -> lead sources (200)" || fail "Manager -> lead sources ($MGR_LEADSRC)"
MGR_REPORT=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/reports" -H "Authorization: Bearer $MGR_TOKEN")
[ "$MGR_REPORT" = "200" ] && pass "Manager -> reports (200)" || fail "Manager -> reports ($MGR_REPORT)"
MGR_EMP=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/employees" -H "Authorization: Bearer $MGR_TOKEN")
[ "$MGR_EMP" = "403" ] && pass "Manager -> employees blocked (403)" || warn "Manager -> employees ($MGR_EMP)"

# Sales Officer should NOT access reports, employees, leadsources management
SO_REPORT=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/reports" -H "Authorization: Bearer $SO_TOKEN")
[ "$SO_REPORT" = "403" ] && pass "SalesOfficer -> reports blocked (403)" || fail "SalesOfficer -> reports ($SO_REPORT)"
SO_EMP=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/employees" -H "Authorization: Bearer $SO_TOKEN")
[ "$SO_EMP" = "403" ] && pass "SalesOfficer -> employees blocked (403)" || fail "SalesOfficer -> employees ($SO_EMP)"
SO_LEADSRC=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/leadsources" -H "Authorization: Bearer $SO_TOKEN")
[ "$SO_LEADSRC" = "403" ] && pass "SalesOfficer -> lead sources blocked (403)" || fail "SalesOfficer -> lead sources ($SO_LEADSRC)"

# Unauthenticated should be blocked
NOAUTH=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/leads")
[ "$NOAUTH" = "401" ] && pass "Unauthenticated -> /leads blocked (401)" || fail "Unauthenticated -> /leads ($NOAUTH)"
echo ""

# ---------- 5. LEAD CRUD ----------
echo "=== 5. LEAD CRUD ==="
CREATE_RES=$(curl -k -s -w "\n%{http_code}" "$API/leads" -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"QA Test Lead","description":"Test","customerName":"QA Customer","customerEmail":"qa@test.com","customerPhone":"+923001234567","status":0,"estimatedValue":1000,"leadSourceId":1,"notes":"Created by QA"}')
CREATE_CODE=$(echo "$CREATE_RES" | tail -1)
CREATE_BODY=$(echo "$CREATE_RES" | head -n -1)
[ "$CREATE_CODE" = "201" ] && pass "Create lead (201)" || fail "Create lead ($CREATE_CODE) - Body: $CREATE_BODY"
LEAD_ID=$(echo "$CREATE_BODY" | jq -r '.id // .Id // empty' 2>/dev/null)
[ -n "$LEAD_ID" ] && pass "Lead ID returned: $LEAD_ID" || fail "No lead ID returned"

if [ -n "$LEAD_ID" ]; then
  # Read lead
  READ_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/leads/$LEAD_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
  [ "$READ_CODE" = "200" ] && pass "Read lead by ID (200)" || fail "Read lead by ID ($READ_CODE)"

  # Update lead
  UPDATE_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/leads/$LEAD_ID" -X PUT \
    -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
    -d '{"title":"QA Updated","description":"U","customerName":"QA Customer","customerEmail":"qa@test.com","customerPhone":"+923001234567","status":1,"estimatedValue":2000,"leadSourceId":2}')
  [ "$UPDATE_CODE" = "200" ] && pass "Update lead (200)" || fail "Update lead ($UPDATE_CODE)"

  # Update status (POST not PATCH per actual route)
  STATUS_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/leads/$LEAD_ID/status" -X POST \
    -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
    -d '{"status":2}')
  [ "$STATUS_CODE" = "200" ] && pass "Update lead status (200)" || fail "Update lead status ($STATUS_CODE)"

  # Add follow-up
  FU_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/leads/$LEAD_ID/followups" -X POST \
    -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
    -d '{"title":"Call customer","description":"Discuss pricing","followUpDate":"2026-06-15T10:00:00Z"}')
  [ "$FU_CODE" = "201" ] || [ "$FU_CODE" = "200" ] && pass "Add follow-up ($FU_CODE)" || fail "Add follow-up ($FU_CODE)"

  # List follow-ups
  FU_LIST=$(curl -k -s "$API/leads/$LEAD_ID/followups" -H "Authorization: Bearer $ADMIN_TOKEN" | jq 'length')
  [ "$FU_LIST" -ge 1 ] && pass "Follow-ups listed (count: $FU_LIST)" || fail "No follow-ups listed"

  # Get activities
  ACT_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/leads/$LEAD_ID/activities" -H "Authorization: Bearer $ADMIN_TOKEN")
  [ "$ACT_CODE" = "200" ] && pass "Get activities (200)" || fail "Get activities ($ACT_CODE)"

  # Delete lead
  DEL_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/leads/$LEAD_ID" -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN")
  [ "$DEL_CODE" = "200" ] || [ "$DEL_CODE" = "204" ] && pass "Delete lead ($DEL_CODE)" || fail "Delete lead ($DEL_CODE)"
fi
echo ""

# ---------- 6. LEAD SOURCES CRUD ----------
echo "=== 6. LEAD SOURCE CRUD ==="
SRC_RES=$(curl -k -s -w "\n%{http_code}" "$API/leadsources" -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"QA Test Source","icon":"bi-test","color":"#ff0000"}')
SRC_CODE=$(echo "$SRC_RES" | tail -1)
SRC_BODY=$(echo "$SRC_RES" | head -n -1)
[ "$SRC_CODE" = "201" ] || [ "$SRC_CODE" = "200" ] && pass "Create lead source ($SRC_CODE)" || fail "Create lead source ($SRC_CODE)"
SRC_ID=$(echo "$SRC_BODY" | jq -r '.id // .Id // empty' 2>/dev/null)
if [ -n "$SRC_ID" ]; then
  # Update
  PUT_SRC=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/leadsources/$SRC_ID" -X PUT \
    -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"QA Updated Source","icon":"bi-test","color":"#00ff00","isActive":true}')
  [ "$PUT_SRC" = "200" ] || [ "$PUT_SRC" = "204" ] && pass "Update lead source ($PUT_SRC)" || fail "Update source ($PUT_SRC)"
  # Delete
  DEL_SRC=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/leadsources/$SRC_ID" -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN")
  [ "$DEL_SRC" = "200" ] || [ "$DEL_SRC" = "204" ] && pass "Delete lead source ($DEL_SRC)" || fail "Delete source ($DEL_SRC)"
fi
echo ""

# ---------- 7. EMPLOYEE CRUD ----------
echo "=== 7. EMPLOYEE MANAGEMENT (Admin only) ==="
EMP_RES=$(curl -k -s -w "\n%{http_code}" "$API/employees" -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"firstName":"QA","lastName":"Tester","email":"qa.employee@visionplus.com.pk","phoneNumber":"+923009999999","designation":"Sales Officer","role":"SalesOfficer","password":"Test@123"}')
EMP_CODE=$(echo "$EMP_RES" | tail -1)
EMP_BODY=$(echo "$EMP_RES" | head -n -1)
[ "$EMP_CODE" = "201" ] || [ "$EMP_CODE" = "200" ] && pass "Create employee ($EMP_CODE)" || fail "Create employee ($EMP_CODE) - Body: $EMP_BODY"
EMP_ID=$(echo "$EMP_BODY" | jq -r '.id // .Id // empty' 2>/dev/null)
if [ -n "$EMP_ID" ]; then
  # Toggle active
  TOGGLE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/employees/$EMP_ID/toggle-active" -X POST -H "Authorization: Bearer $ADMIN_TOKEN")
  [ "$TOGGLE" = "200" ] && pass "Toggle employee active ($TOGGLE)" || fail "Toggle employee ($TOGGLE)"
  # Update
  UPD_EMP=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/employees/$EMP_ID" -X PUT \
    -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
    -d '{"firstName":"QA","lastName":"Updated","email":"qa.employee@visionplus.com.pk","phoneNumber":"+923009999999","designation":"Sales Officer","role":"SalesOfficer"}')
  [ "$UPD_EMP" = "200" ] || [ "$UPD_EMP" = "204" ] && pass "Update employee ($UPD_EMP)" || fail "Update employee ($UPD_EMP)"
fi
echo ""

# ---------- 8. DASHBOARD ----------
echo "=== 8. DASHBOARD ==="
DASH=$(curl -k -s "$API/dashboard" -H "Authorization: Bearer $ADMIN_TOKEN")
DASH_KEYS=$(echo "$DASH" | jq -r 'keys | join(",")' 2>/dev/null)
echo "  Dashboard keys: $DASH_KEYS"
[ -n "$DASH_KEYS" ] && [ "$DASH_KEYS" != "null" ] && pass "Dashboard returns data" || fail "Dashboard empty"
echo ""

# ---------- 9. WHATSAPP ----------
echo "=== 9. WHATSAPP INTEGRATION ==="
LEAD_FOR_WA=$(curl -k -s "$API/leads" -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"WA Test","description":"x","customerName":"WA Customer","customerPhone":"+923001111111","status":0,"leadSourceId":1}' | jq -r '.id // .Id')
if [ -n "$LEAD_FOR_WA" ]; then
  WA_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/messagelogs/Send" -X POST \
    -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
    -d "{\"leadId\":$LEAD_FOR_WA,\"messageBody\":\"Test from QA\",\"toPhoneNumber\":\"+923001111111\"}")
  [ "$WA_CODE" = "200" ] && pass "WhatsApp send (200)" || warn "WhatsApp send ($WA_CODE) - n8n may be unavailable"
  # Check log
  LOG_COUNT=$(curl -k -s "$API/messagelogs" -H "Authorization: Bearer $ADMIN_TOKEN" | jq 'length')
  [ "$LOG_COUNT" -ge 1 ] && pass "Message logged (count: $LOG_COUNT)" || warn "No message log"
  # Cleanup
  curl -k -s -o /dev/null "$API/leads/$LEAD_FOR_WA" -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN"
fi
echo ""

# ---------- 10. FRONTEND ----------
echo "=== 10. FRONTEND ==="
FRONTEND=$(curl -k -s -o /dev/null -w "%{http_code}" "https://localhost/")
[ "$FRONTEND" = "200" ] && pass "Frontend loads (200)" || fail "Frontend ($FRONTEND)"
HTML_CHECK=$(curl -k -s "https://localhost/" | head -1)
echo "  First line: $HTML_CHECK"
echo ""

# ---------- 11. DATABASE INTEGRITY ----------
echo "=== 11. DATA INTEGRITY ==="
U_COUNT=$(docker exec crm-postgres psql -U postgres -d crm_db -t -c "SELECT count(*) FROM \"AspNetUsers\";" | xargs)
[ "$U_COUNT" -ge 6 ] && pass "Users in DB: $U_COUNT" || fail "Users missing ($U_COUNT)"
ROLES=$(docker exec crm-postgres psql -U postgres -d crm_db -t -c "SELECT count(*) FROM \"AspNetRoles\";" | xargs)
[ "$ROLES" -ge 3 ] && pass "Roles in DB: $ROLES" || fail "Roles missing ($ROLES)"
SRC=$(docker exec crm-postgres psql -U postgres -d crm_db -t -c "SELECT count(*) FROM \"LeadSources\";" | xargs)
[ "$SRC" -ge 12 ] && pass "Lead sources: $SRC" || fail "Lead sources missing ($SRC)"
BT=$(docker exec crm-postgres psql -U postgres -d crm_db -t -c "SELECT count(*) FROM \"BusinessTypes\";" | xargs)
[ "$BT" -ge 1 ] && pass "Business types: $BT" || warn "No business types"
CT=$(docker exec crm-postgres psql -U postgres -d crm_db -t -c "SELECT count(*) FROM \"Cities\";" | xargs)
[ "$CT" -ge 1 ] && pass "Cities: $CT" || warn "No cities"
echo ""

# ---------- 12. AUTH VERIFICATION ----------
echo "=== 12. JWT TOKEN VERIFICATION ==="
# Test a protected route with no token
NO_AUTH=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/dashboard")
[ "$NO_AUTH" = "401" ] && pass "Dashboard requires auth (401)" || fail "Dashboard open ($NO_AUTH)"
# Test with invalid token
BAD_TOKEN=$(curl -k -s -o /dev/null -w "%{http_code}" "$API/dashboard" -H "Authorization: Bearer badtoken")
[ "$BAD_TOKEN" = "401" ] && pass "Invalid token rejected (401)" || fail "Bad token ($BAD_TOKEN)"
echo ""

# ---------- SUMMARY ----------
echo "============================================"
echo "  FINAL RESULTS"
echo "============================================"
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"
echo "  WARN: $WARN"
TOTAL=$((PASS+FAIL+WARN))
echo "  TOTAL TESTS: $TOTAL"
echo "============================================"
if [ "$FAIL" -eq 0 ]; then
  echo "  STATUS: SYSTEM HEALTHY"
else
  echo "  STATUS: ISSUES FOUND - REVIEW FAILURES"
fi
echo ""
