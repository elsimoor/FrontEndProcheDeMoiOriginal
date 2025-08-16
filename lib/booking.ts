/**
 * Represents the data persisted in the booking flow.  The booking
 * stores the basic reservation details such as dates and guest
 * counts along with the selected room.  Additional optional
 * properties capture any extras, paid room options and view
 * selections that the guest has chosen.  These fields are
 * intentionally flexible (using partials and index signatures) so
 * that new types of add‑ons can be incorporated without
 * breaking existing code.  The total price reflects the sum of
 * base room cost and any add‑ons selected.
 */
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
  /**
   * Generic extras selected by the guest.  This property is
   * intentionally flexible to accommodate a variety of add‑on
   * structures.  It may be a dictionary keyed by amenity name with
   * boolean flags, or an array of amenity objects returned from
   * GraphQL.  The concrete type depends on how the front‑end
   * chooses to represent the selected extras.  Using `any` here
   * avoids TypeScript errors when merging arbitrary add‑on data
   * into the booking.
   */
  extras?: any;
  /** List of paid room options selected by the guest.  Each option
   * includes a name and price.  Additional fields such as
   * description or category can be included but are not required.
   */
  paidOptions?: {
    name: string;
    price?: number;
    [key: string]: any;
  }[];
  /** Name of the selected view option (e.g. "City View").  When
   * undefined the room either has no view options or the guest has
   * not made a selection.
   */
  view?: string;
  /** Total amount including extras, paid options and view cost */
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