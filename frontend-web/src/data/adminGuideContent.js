// Product-facing help content for the Admin Panel User Guide. Grouped to
// mirror the sidebar's own grouping (AdminLayout.jsx) so the guide's table
// of contents reads the same way the sidebar does — one less thing for an
// admin to re-learn.

const adminGuide = [
  {
    group: 'Overview',
    items: [
      {
        key: 'dashboard',
        title: 'Dashboard',
        path: '/admin',
        why: "Your first stop every day — a single glance answers \"is anything wrong, and what changed since yesterday?\" It pulls together members, payments, dues, expenses, rentals and attendance so you don't have to open eight pages to know where things stand.",
        how: [
          'Check the KPI cards at the top for this month\'s totals — Members, Payments, Due Clearance and Rental Revenue, each with a % change vs. last month.',
          'Use the Member Status and Members by Branch charts to see how the community is distributed.',
          'The Payments Overview chart compares what was received vs. what\'s still pending, month over month.',
          'The Recent Rentals and Recent Logins panels are shortcuts — click "View Report" / "View All" to jump straight into the full page for that data.',
        ],
        tips: [
          'Every KPI card is clickable — it takes you to the detailed report behind that number (e.g. clicking Due Clearance opens the Due Tracker).',
          'Click "Take a Tour" any time to get a guided walkthrough of this page\'s layout.',
        ],
      },
    ],
  },
  {
    group: 'Members',
    items: [
      {
        key: 'members',
        title: 'Members',
        path: '/admin/members',
        why: 'The master list of everyone in the organization. This is where you look someone up, correct their details, reset a forgotten password, or deactivate a membership — without needing to touch the database directly.',
        how: [
          'Switch between the Active and Other Statuses tabs to see currently active members vs. inactive/suspended ones.',
          'Search by name, member ID, or phone number — typing a full member ID or a 5+ digit phone number matches exactly, so "1" won\'t accidentally match member "10" or someone\'s phone.',
          'Use the User Type, Blood Group and Location filters to narrow the list further.',
          'Click a row to view full details, or use Edit to update information, replace their photo/QR code, or reset their password.',
          'Export the currently filtered list to PDF using the Export PDF button — useful for printing a branch or blood-group list.',
        ],
        tips: [
          'Editing a member here does not require them to be logged in — this is the admin-side override for anything a member can\'t change themselves.',
          'Deactivating a member (not deleting) keeps their full history intact for records — they simply move to the Other Statuses tab.',
        ],
      },
      {
        key: 'register-member',
        title: 'Register Member',
        path: '/admin/register-member',
        why: 'The onboarding form for bringing a new person into the system — this is the only place a brand-new member record gets created, complete with their identity, address, photo, QR code and any dues they already owe at signup.',
        how: [
          'Member ID auto-fills with the next available number — you normally don\'t need to change it.',
          'Fill in Core Details, Identity, Contact and Personal sections; required fields are marked with *.',
          'Optionally upload a photo, and either let the QR code auto-generate (default) or switch to "Upload manually" if you already have a specific QR image to use instead.',
          'If the member lives outside Rajapalayam, tick that box to reveal a second address section for their current residence.',
          'Add any Pending Payments (e.g. an annual fee they still owe) right here — no need for a separate step afterward.',
          'Submit — the member gets a default password (their member ID zero-padded to 6 digits), which they should change after first login.',
        ],
        tips: [
          'A toast confirms successful registration and shows the new member ID — write it down if you need to hand it to the member directly.',
          'Gotra and Branch are linked — the Branch dropdown only shows branches belonging to the Gotra you picked.',
        ],
      },
    ],
  },
  {
    group: 'Administration',
    items: [
      {
        key: 'settings',
        title: 'Settings',
        path: '/admin/settings',
        why: 'The configuration hub for every dropdown list used elsewhere in the app — user types, member statuses, branches, gotras, payment categories and expense categories. Change it once here and it updates everywhere it\'s used.',
        how: [
          'Pick a tab for the list you want to manage (e.g. Payment Categories).',
          'Add, edit or deactivate entries — deactivating hides an option from new forms without deleting historical records that already used it.',
        ],
        tips: [
          'If a dropdown elsewhere in the app is missing an option you need, this is the page to add it.',
        ],
      },
      {
        key: 'auth-control',
        title: 'Auth Control',
        path: '/admin/auth-control',
        why: 'Controls who is allowed to see which page in the whole app — public pages, member-only pages, and admin-only pages. This is the security layer that decides, for example, whether the Donate page needs login, or which user types can reach the Admin Panel at all.',
        how: [
          'Each row is one route in the app. Toggle "Require Login" to force sign-in before that page loads.',
          'Use "Allowed User Types" to restrict a route to specific roles (e.g. only Admin/President) — leave it empty to allow any logged-in user.',
        ],
        tips: [
          'Be careful here — misconfiguring the "admin" route\'s permissions can lock everyone (including you) out of the Admin Panel. When in doubt, test in a private browser window before saving.',
        ],
      },
      {
        key: 'login-tracker',
        title: 'Login Tracker',
        path: '/admin/login-tracker',
        why: "A security audit log of every login attempt — successful or failed — across the whole app. If a member says they \"can't log in\" or you suspect someone is trying to guess a password, this is where you check.",
        how: [
          'Filter by status (Success/Failed), date range, or search by member name/ID/phone.',
          'Each row shows the device/browser and IP address the attempt came from.',
          'Export the filtered results to PDF for record-keeping.',
        ],
        tips: [
          'A burst of Failed attempts for the same member in a short window is worth following up on directly with them.',
        ],
      },
    ],
  },
  {
    group: 'Offline Services',
    items: [
      {
        key: 'services',
        title: 'Services',
        path: '/admin/services',
        why: 'Manages the catalog of offline services the organization offers (e.g. certificates, letters) — each with its own required documents and multi-step approval workflow, so members can request them online instead of walking in.',
        how: [
          'Create a service, attach an offline form template if one is needed, and define which documents a member must upload to request it.',
          'Configure the approval workflow — the ordered sequence of roles (e.g. committee → president) who must act on a request before it\'s complete.',
          'Publish the service once it\'s ready so members can see and request it from their portal.',
        ],
        tips: [
          'A service stays hidden from members until you explicitly publish it — safe to build and test privately first.',
        ],
      },
      {
        key: 'service-requests',
        title: 'Request Tracker',
        path: '/admin/services/requests',
        why: "Where every member's service request lives once submitted — lets you see what's awaiting your action, what's been completed, and what was rejected, without hunting through individual member records.",
        how: [
          'Use the tabs — Awaiting Action, Completed, Rejected, All — to filter by where a request stands.',
          'Click a row to expand its full timeline: who acted at each step, when, and any remarks left.',
          'Uploaded documents and the filled offline form (if any) are downloadable from the expanded view.',
        ],
        tips: [
          'Requests only move forward when someone at the current workflow step approves it — check "Pending Steps" to see who\'s holding up a request.',
        ],
      },
    ],
  },
  {
    group: 'Events',
    items: [
      {
        key: 'add-event',
        title: 'Add Event',
        path: '/admin/events/add',
        why: 'Publishes events to the public-facing Events page — this is how the community finds out about upcoming gatherings, functions and programs without needing to be logged in.',
        how: [
          'Fill in the event title, date, time, location and description.',
          'Upload a cover image, and mark the event as upcoming/ongoing/completed as its status changes over time.',
          'Add organizer and contact details so attendees know who to reach.',
        ],
        tips: [
          'Keep the short description punchy — it\'s what shows on the events listing card before someone clicks in for the full description.',
        ],
      },
    ],
  },
  {
    group: 'Payments',
    items: [
      {
        key: 'assign-due',
        title: 'Assign Due',
        path: '/admin/payments/assign-due',
        why: "Creates a pending due for a member — an amount they owe but haven't paid yet (e.g. this year's membership fee). This is the first half of the payment lifecycle; the money itself gets recorded later, only once it's actually collected.",
        how: [
          'Select the member, a payment category, a title (e.g. "Annual Fee 2026"), the amount, and an optional due date.',
          'Submit — the due now shows up in that member\'s pending list and in the Due Tracker.',
        ],
        tips: [
          'Assigning a due does not collect any money — it\'s purely a record that something is owed. Use Record Payment (with "Due Cleared" selected) when they actually pay.',
        ],
      },
      {
        key: 'due-tracker',
        title: 'Due Tracker',
        path: '/admin/payments/due-tracker',
        why: 'A live view of everything currently owed across the whole membership — overdue amounts, what\'s due today, and totals grouped by member or by date. This is the page for chasing collections.',
        how: [
          'Use the Overdue / Due Today / Member-wise / Date-wise tabs depending on how you want to work through the list.',
          'Expand a member group to see their individual dues and jump straight to Record Payment for them.',
          'Export the current filtered view to PDF for a printable collections list.',
        ],
        tips: [
          "A due only disappears from this page once it's actually paid off — assigning it doesn't count as income until collection happens (see Reports).",
        ],
      },
      {
        key: 'payment-entry',
        title: 'Record Payment',
        path: '/admin/payments/entry',
        why: "Where money actually gets recorded as received — cash or QR — either as a fresh payment (e.g. a donation) or to clear an existing due. Every payment gets a unique reference number for future lookup.",
        how: [
          'Select the member, category and amount, or pick an existing pending due to clear it directly.',
          'Choose the payment mode (Cash or QR) and confirm.',
          'A reference number (e.g. PAY-20260728-1234) is generated automatically — shown on screen and stored on the record permanently.',
        ],
        tips: [
          'The right-hand panel shows that member\'s recent payment history so you can sanity-check before recording a new one.',
        ],
      },
      {
        key: 'payment-history',
        title: 'Payment History',
        path: '/admin/payments/history',
        why: "The complete, filterable ledger of every payment ever recorded — the audit trail behind every rupee collected.",
        how: [
          'Filter by category or date range, or search by member name/ID or payment reference.',
          'Export the filtered results to a formatted PDF for record-keeping or handing to an auditor.',
        ],
        tips: [
          'Every row shows the payment reference — quote this if a member asks for proof of a specific payment.',
        ],
      },
    ],
  },
  {
    group: 'Expenses',
    items: [
      {
        key: 'expense-book',
        title: 'Expense Book',
        path: '/admin/expenses',
        why: 'Tracks money going out — every expense the organization incurs, by category, with a reason and who recorded it. Paired with Payment History, this gives the full picture of income vs. outgo.',
        how: [
          'Click Add Expense, choose a category, enter the amount and a clear reason, and save.',
          'Filter by category or date range, or search the reason/recorded-by fields.',
          'Export the filtered list to PDF.',
        ],
        tips: [
          'Always fill in a specific reason — "Misc" six months later tells nobody anything useful when reviewing the books.',
        ],
      },
    ],
  },
  {
    group: 'Reports',
    items: [
      {
        key: 'reports',
        title: 'Reports',
        path: '/admin/reports',
        why: "The financial command center — brings payments, due collections, rental income and expenses together into one consolidated view. This is what you'd open before a committee meeting to answer \"how are we doing financially?\"",
        how: [
          'Overview tab: high-level totals, month-over-month trend charts, and breakdowns by income source / expense category.',
          'Income tab: every income-generating transaction (payments, due collections, rental advances/balances) in one filterable ledger, each with its reference number.',
          'Expenses tab: the same expense data as the Expense Book, filterable here alongside income for comparison.',
          'Tally Book tab: a chronological ledger with a running balance — the closest thing to a traditional cash book.',
          'Every tab has its own Export PDF button that respects whatever filters are currently applied.',
        ],
        tips: [
          "A rental's advance counts as income the moment it's collected, but the remaining balance only counts once the item is actually returned and settled — the Income tab already reflects this correctly, you don't need to adjust for it manually.",
        ],
      },
    ],
  },
  {
    group: 'Attendance',
    items: [
      {
        key: 'scanner',
        title: 'Scanner',
        path: '/admin/attendance/scan',
        why: "Captures attendance at events or the office by scanning a member's QR code — one scan checks them in, the next scan (later) checks them out. No manual sign-in sheets.",
        how: [
          'Point a camera-enabled device at this page and scan the member\'s QR code (from their ID card or profile).',
          'First scan of the day = check-in. A second scan by the same member = check-out.',
        ],
        tips: [
          "If someone forgets to check out and the day rolls over, the Attendance Report will show it as \"Checked out by system\" at end of day rather than leaving it stuck on \"Still In\" forever.",
        ],
      },
      {
        key: 'attendance-report',
        title: 'Attendance Report',
        path: '/admin/attendance/report',
        why: 'Shows who was present, when, and for how long — grouped by member and day, with every individual check-in/check-out session available if you expand a row.',
        how: [
          'Switch between Single Day and Date Range modes depending on what you\'re reviewing.',
          'Search by name or member ID to check one person\'s attendance specifically.',
          'Expand a row to see every session that day (some members check in/out multiple times).',
          'Export the current view to PDF.',
        ],
        tips: [
          '"Checked out by system" means the session was auto-closed at day\'s end because the member never scanned out — not necessarily an error, just worth knowing when reading the duration.',
        ],
      },
    ],
  },
  {
    group: 'Rentals',
    items: [
      {
        key: 'rental-products',
        title: 'Rental Products',
        path: '/admin/rentals/products',
        why: 'The catalog of assets the organization rents out (e.g. generators, furniture, utensils) along with their day/month/year rates. The day rate is always the floor — nothing is ever billed less than one day\'s rate, however short the rental.',
        how: [
          'Add a product with a name, description and rates for whichever tiers apply (day is mandatory; month/year are optional).',
          'Deactivate a product that\'s no longer available instead of deleting it, to preserve its rental history.',
        ],
        tips: [
          'Only an active product with no currently-active rental shows up as "available" on the dashboard asset tiles.',
        ],
      },
      {
        key: 'rental-entry',
        title: 'Record Rental',
        path: '/admin/rentals/entry',
        why: 'Books a rental — for a member or for a non-member (a guest, recorded by name only) — and optionally collects an advance up front. The remaining balance is settled later, when the item actually comes back.',
        how: [
          'Pick the product, choose Member or Non-Member, and fill in who\'s renting it.',
          'Set the rate type and start/end dates — the amount auto-calculates from rate × duration (with the day-rate floor), though you can override it.',
          'Optionally collect an advance now, choosing its payment mode.',
          'Submit — a rental reference number is generated and shown as confirmation.',
        ],
        tips: [
          'The end date here is the planned return date — if the item actually comes back earlier or later, that gets corrected at Return & Settle time in Rental History, not here.',
        ],
      },
      {
        key: 'rental-history',
        title: 'Rental History',
        path: '/admin/rentals/history',
        why: 'Tracks every rental from booking through to return — this is where you settle the final bill when an item comes back, cancel a booking, and download receipts for completed rentals.',
        how: [
          'Filter by status, product, or search by renter/product/reference.',
          'For an active rental: use Return & Settle to record the actual return date (which may differ from the original plan) and recalculate the final amount, or Cancel to void the booking entirely.',
          'For a returned (settled) rental: click Receipt to download a formatted settlement receipt showing the advance, balance and total.',
          'Export the filtered table to PDF for a full rental report.',
        ],
        tips: [
          'The return amount recalculates automatically from the real start-to-end duration when you change the return date in the settle dialog — you don\'t need to do that math yourself.',
        ],
      },
    ],
  },
];

export default adminGuide;
