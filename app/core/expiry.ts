import { addDays, addMonths, addWeeks } from "date-fns";

export const ShareExpiry = {
  TOMORROW: "tomorrow",
  THREE_DAYS: "3days",
  ONE_WEEK: "1week",
  ONE_MONTH: "1month",
  NEVER: "never",
} as const;

export type ShareExpiryValue = (typeof ShareExpiry)[keyof typeof ShareExpiry];

export function expiryToDate(expiry: ShareExpiryValue): Date {
  const date = new Date();
  switch (expiry) {
    case ShareExpiry.TOMORROW:
      return addDays(date, 1);
    case ShareExpiry.THREE_DAYS:
      return addDays(date, 3);
    case ShareExpiry.ONE_WEEK:
      return addWeeks(date, 1);
    case ShareExpiry.ONE_MONTH:
      return addMonths(date, 1);
    case ShareExpiry.NEVER:
      return new Date("9999-11-11T00:00:00Z");
  }
}
