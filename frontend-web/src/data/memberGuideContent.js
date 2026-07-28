// Product-facing help content for the Member Portal User Guide.

const memberGuide = [
  {
    group: 'Member Portal',
    items: [
      {
        key: 'dashboard',
        title: 'Dashboard',
        path: '/dashboard',
        why: "Your personal home page in the portal — everything about your own membership in one place, so you don't have to call the office to ask \"do I owe anything?\" or \"was my payment recorded?\"",
        how: [
          'Your profile card at the top shows your photo, member ID, gotra and branch — click it to edit your details or upload a new photo.',
          'Payment Overview and Payment History show what you\'ve paid and when — click "View Payment History" for the complete list, each entry with its payment reference.',
          'If you have a pending amount, a button appears letting you see exactly what\'s owed and why.',
          'My Attendance shows your check-in/check-out history if the organization tracks attendance at events you\'ve attended.',
          'My Rentals lists anything you\'ve rented from the organization, its status, and the amount involved.',
          'Your Last Login and Login History are shown too — check these if anything about your account looks unfamiliar.',
        ],
        tips: [
          'Click "Take a Tour" for a guided walkthrough of everything on this page.',
          'If you don\'t recognize a login in your Login History, change your password immediately from the profile menu.',
        ],
      },
      {
        key: 'member-search',
        title: 'Member Search',
        path: '/member-search',
        why: 'A directory of every active member in the organization — useful for finding someone\'s contact details, checking which branch/gotra they belong to, or just looking someone up before an event.',
        how: [
          'Search by name, member ID, or phone number — a full member ID or phone number matches exactly rather than fuzzy-matching, so you get precise results.',
          'Click "View Full Details" on a card to see a member\'s full profile — identity, contact, and address information.',
          'Click a phone number directly to dial it on your device.',
        ],
        tips: [
          'This directory only shows active members — someone who has left or been deactivated won\'t appear here.',
        ],
      },
      {
        key: 'services',
        title: 'Offline Services',
        path: '/services',
        why: 'Lets you request services that traditionally required an in-person visit and paperwork (certificates, letters, approvals) — submit everything online instead, and track its progress through approval without needing to follow up in person.',
        how: [
          'Browse the list of published services and pick the one you need.',
          'Upload whichever documents that service requires, and fill in the offline form if one is attached.',
          'Submit — your request enters the approval workflow, and you can track its status (Submitted → In Progress → Approved/Completed, or Rejected) from here.',
        ],
        tips: [
          'Each service shows exactly which documents are mandatory before you start, so you can gather everything up front instead of submitting halfway.',
        ],
      },
    ],
  },
];

export default memberGuide;
