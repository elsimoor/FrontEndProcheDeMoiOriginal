export interface BookingData {
  /** ISO string representing the check‑in date */
  checkIn?: string;
  /** ISO string representing the check‑out date */
  checkOut?: string;
  /** Number of adults */
  adults?: number;
  /** Number of children */
  children?: number;
  /** Combined number of guests; if omitted it will be derived */
  guests?: number;
  /** Identifier of the selected room */
  roomId?: string;
  /** Selected extras */
  extras?: {
    breakfast?: boolean;
    parking?: boolean;
    champagne?: boolean;
  };
  /** Total amount including extras */
  total?: number;
  /** Cached hotel identifier used for queries */
  hotelId?: string;
}

/**
 * Retrieve the current booking data from localStorage.  If the
 * storage is empty or cannot be parsed an empty object is returned.
 */
export function getBooking(): BookingData {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("booking");
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (e) {
    return {};
  }
}

/**
 * Merge partial booking data into any existing data in localStorage.
 * Only provided keys will be updated.  If no booking exists a new
 * object will be created.  The merged object is returned.
 */
export function updateBooking(data: Partial<BookingData>): BookingData {
  if (typeof window === "undefined") return {};
  const current = getBooking();
  const updated: BookingData = { ...current, ...data };
  localStorage.setItem("booking", JSON.stringify(updated));
  return updated;
}

/**
 * Clear any stored booking data from localStorage.  Use this after
 * completing a reservation or when cancelling.
 */
export function clearBooking() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("booking");
}