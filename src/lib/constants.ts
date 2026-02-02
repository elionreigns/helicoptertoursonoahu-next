/**
 * Email configuration for operators and system emails
 * 
 * IMPORTANT: This is the SINGLE SOURCE OF TRUTH for all email addresses.
 * All email addresses used throughout the application MUST come from this object.
 * 
 * HOW TO UPDATE OPERATOR EMAILS:
 * 1. Contact the operator to get their official booking email address
 * 2. Update the email value in this object (e.g., blueHawaiian: "bookings@bluehawaiian.com")
 * 3. Save and commit the file
 * 4. Push to GitHub - Vercel will auto-deploy
 * 
 * HOW TO ADD A NEW OPERATOR:
 * 1. Add a new key-value pair in the emails object (e.g., "newOperator": "email@operator.com")
 * 2. Add corresponding entry in the operators object below
 * 3. The system will automatically use the new operator in booking flows
 */
export const emails = {
  bookingsHub: "bookings@helicoptertoursonoahu.com",        // Main incoming email hub - used for From when sending
  /** Reply-To for all outgoing emails so replies go here; set to subdomain where Resend Inbound receives (e.g. booking.helicoptertoursonoahu.com) */
  bookingsHubInbound: "bookings@booking.helicoptertoursonoahu.com",
  /** Internal alert: notified when a new booking is submitted (never shown to customers) */
  internalAlert: "elionreigns@gmail.com",
  testAgent: "ericbelievesinjesusbecause@gmail.com",        // Agent email that handles client communication (for testing)
  testClient: "elionreigns@gmail.com",                      // Client email for testing purposes
  blueHawaiian: "coralcrowntechnologies@gmail.com",         // Blue Hawaiian Helicopters - UPDATE TO REAL EMAIL
  rainbow: "ashleydanielleschaefer@gmail.com",              // Rainbow Helicopters - UPDATE TO REAL EMAIL
  // Add more operators here, e.g.:
  // "magnum": "bookings@magnumhelicopters.com",
  // "georges": "bookings@georgesaviation.com",
} as const;

/** Addresses that must never receive the client follow-up ("Available Tour Times") — only the real client should get it. */
const FOLLOW_UP_BLOCKED_EMAILS = [
  emails.bookingsHub,
  emails.bookingsHubInbound,
  emails.internalAlert,
  emails.testAgent,
  emails.blueHawaiian,
  emails.rainbow,
] as const;

/** Returns true if this email is an operator, hub, or internal address. Used to avoid sending client-only follow-up to the wrong recipient. */
export function isOperatorOrInternalEmail(email: string): boolean {
  const normalized = (email || '').trim().toLowerCase();
  return FOLLOW_UP_BLOCKED_EMAILS.some((addr) => addr.toLowerCase() === normalized);
}

/**
 * Operator metadata
 * 
 * This object provides additional information about each operator.
 * The email field MUST reference the emails object above to ensure consistency.
 * 
 * To add a new operator:
 * 1. Add email to emails object above
 * 2. Add entry here with name, email (from emails object), and website
 */
export const operators = {
  blueHawaiian: {
    name: "Blue Hawaiian Helicopters",
    email: emails.blueHawaiian,  // Uses email from emails object above
    website: "https://www.bluehawaiian.com",
  },
  rainbow: {
    name: "Rainbow Helicopters",
    email: emails.rainbow,  // Uses email from emails object above
    website: "https://www.rainbowhelicopters.com",
  },
} as const;

/**
 * Booking statuses
 */
export const bookingStatuses = {
  PENDING: "pending",
  COLLECTING_INFO: "collecting_info",
  CHECKING_AVAILABILITY: "checking_availability",
  CONTACTED_OPERATOR: "contacted_operator",
  AWAITING_OPERATOR_RESPONSE: "awaiting_operator_response",
  AWAITING_PAYMENT: "awaiting_payment",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;

export type BookingStatus = typeof bookingStatuses[keyof typeof bookingStatuses];

/**
 * VAPI Configuration
 * 
 * VAPI Assistant ID for phone agent integration
 * This assistant handles phone calls and collects booking information
 */
export const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID || "2ed16509-a321-4f09-84d8-bf1fcfe42438";

/**
 * VAPI Phone Number for Testing
 */
export const VAPI_PHONE_NUMBER = "+1 (707) 381-2583";
