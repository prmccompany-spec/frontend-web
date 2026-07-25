Attendance Feature (QR Scan Check-in/Check-out)
Context
PRMCF already generates a QR code per member (encoding member_table_id, see backend/src/utils/qrUtils.js) for ID cards, but nothing consumes it yet. This feature adds attendance tracking: an admin-facing scanner page (for a physical keyboard-wedge QR scanner or manual typing), a detail report page, and a reflection of each member's own attendance history on their Dashboard.

Confirmed with the user:

Schema: keep the standard id INT AUTO_INCREMENT PRIMARY KEY (required for insertId to work, matches every other table) — "no constraints" means no FOREIGN KEY constraints, same convention already documented in docs/DATABASE.md.
Multiple sessions per day are allowed — a member can check in/out several times in one day, each as its own row. The report shows a consolidated "present that day" summary by default, but individual entries must still be visible (expandable/drill-down).
Manual member-ID entry uses the exact same check-in/check-out toggle logic as a QR scan — same input field, same code path.
How the scan/entry toggle works
The scanner page has one always-focused text input. A hardware QR scanner behaves like a keyboard — it types the scanned value then sends Enter — so typed manual entry and a physical scan hit the same handler.

On submit (code = whatever's in the box):

Resolve the member: QR encodes member_table_id (numeric), manual entry is more likely the human member_id (e.g. PRMC10005) — try member_table_id first, then fall back to member_id.
Look for that member's open session today (attendance_date = CURDATE(), check_out_time IS NULL).
No open session → INSERT a new row (check_in_time = NOW()) → Checked In. This naturally covers both "first scan of the day" and "re-entry after an earlier session was already closed."
Open session exists, and NOW() - check_in_time < 60s → do nothing, respond "too soon" (guards against double-scans/debounce).
Open session exists, ≥ 60s elapsed → UPDATE that row's check_out_time = NOW() → Checked Out.
Dates/times are computed via MySQL's CURDATE()/NOW() in the query, not in JS — avoids UTC/IST timezone drift between the app server and the "attendance date" a scan should land on.

DB Schema (append to docs/DATABASE.md, user runs manually)
-- ============================================================
-- ATTENDANCE FEATURE
-- ============================================================
-- Standard id AUTO_INCREMENT PRIMARY KEY (same as every other table —
-- required for insertId). No FOREIGN KEY constraints, matching this
-- schema's existing convention. Multiple rows per member per day are
-- expected (one row per check-in/check-out session).

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_time DATETIME NOT NULL,
  check_out_time DATETIME NULL,
  marked_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
Backend
backend/src/models/memberModel.js: add getMemberByTableId(tableId) (SELECT * FROM members WHERE member_table_id = ?), mirroring the existing getMemberByMemberId.
New backend/src/models/attendanceModel.js: createCheckIn({member_id, marked_by}) (uses CURDATE()/NOW()), getOpenSession(memberId) (today, check_out_time IS NULL, latest first), setCheckOut(id), getAttendance(filters) (member_id, date, from, to — joined with member name/code, ordered by check_in_time DESC).
New backend/src/services/attendanceService.js: recordScan({code, marked_by}) implementing the resolve → open-session → checkin/checkout/ignore logic above; fetchAttendance(filters).
New backend/src/controllers/attendanceController.js + backend/src/routes/attendanceRoutes.js: POST /api/attendance/scan, GET /api/attendance.
backend/src/server.js: mount app.use('/api/attendance', attendanceRoutes).
Frontend
New frontend-web/src/services/attendanceService.js: scanAttendance(data), getAttendance(filters).
New frontend-web/src/pages/admin/attendance/Scanner.jsx (+ .css):
Single text input, auto-focused on mount and re-focused on blur/after every submit (autoFocus + ref + onBlur refocus).
Submits on Enter; a small in-memory debounce ignores the identical code submitted again within ~2s (handles scanner hardware double-fire).
marked_by is the logged-in admin's own user.id from useAuth() — no picker needed.
Big colored feedback panel per result: green "Checked In", blue "Checked Out" (+ duration), amber "Too soon" with seconds-since-checkin, red "Not found."
Running "Recent Scans" list below (last ~15), newest first.
New frontend-web/src/pages/admin/attendance/AttendanceReport.jsx (+ .css):
Filters: date (default today), date range, member search — passed straight to GET /api/attendance.
Default daily-summary view: one row per member per date (grouped client-side from the raw rows — dataset size doesn't justify a server-side GROUP BY endpoint), showing first check-in, last check-out (or "Still In" if the latest session is open), session count, total duration.
Each summary row expands to show its raw individual check-in/check-out entries for that member/date.
frontend-web/src/pages/admin/AdminLayout.jsx: new "Attendance" sidebar section with "Scan" and "Report" links, same pattern as the existing "Payments"/"Rentals" dividers.
frontend-web/src/routes/AppRoutes.jsx: attendance/scan and attendance/report routes under /admin.
frontend-web/src/pages/user/Dashboard.jsx: new "My Attendance" section (own getAttendance({member_id: user.id})), listing date, check-in, check-out, duration — same list/table styling already used for Payment History/Rentals.
frontend-web/src/pages/admin/AdminPanel.jsx: small addition — a 5th stat widget "Present Today" (distinct members with a row today), consistent with the widget-based dashboard already built.
Verification
Run the SQL above against the DB before testing.
node --check on new/edited backend files.
npx vite build in frontend-web/.
Manual: scan/type a code with no open session → Checked In; scan same code within 1 min → ignored/"too soon"; scan again after 1 min → Checked Out; scan again → new Checked In (multiple sessions same day). Confirm Report's daily summary consolidates that member/day into one row with the right session count, and expanding shows all individual entries. Confirm Dashboard reflects the member's own entries.