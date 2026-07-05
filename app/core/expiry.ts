import { addDays, addMonths, addWeeks } from "date-fns";

/**
 * The expiry date of a share, as sent by the client.
 *
 * The server parses this value to determine the expiry date of the share.
 */
export enum ShareExpiry {
  TOMORROW = "tomorrow",
  THREE_DAYS = "3days",
  ONE_WEEK = "1week",
  ONE_MONTH = "1month",
  NEVER = "never",
}

/**
 * Parses a share expiry value into a `Date` object.
 */
export function expiryToDate(expiry: ShareExpiry): Date {
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
