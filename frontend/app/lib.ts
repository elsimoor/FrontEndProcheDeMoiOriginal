import { SessionOptions } from "iron-session";

export interface SessionData {
    token?: string;
    access?: string;
    user?: {
        id?: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        username?: string;
        email?: string;
        role?: string;
        imageUrl?: string;
        isActive?: boolean;
    };
    isLoggedIn?: boolean;

    /**
     * Identifier of the business (hotel, restaurant or salon) that this user
     * manages.  Populated at login based on the `businessId` returned from
     * the backend.  When `businessType` is `HOTEL` this becomes the hotel
     * identifier, when `RESTAURANT` it is the restaurant identifier, and so on.
     */
    businessId?: string;

    /**
     * Type of the business associated with the user.  The backend uses this
     * field to differentiate between hotels, restaurants and salons.  Typical
     * values are `HOTEL`, `RESTAURANT` and `SALON`.
     */
    businessType?: string;

    /**
     * Additional services associated with the user.  Each entry
     * identifies a business by its type and id.  When a user adds
     * a second or third service via the "Add Service" flow this
     * array will be populated so that the client can render
     * dashboard switchers.  Services remain even if the primary
     * businessId/businessType fields continue to refer to the
     * original business.
     */
    services?: { businessId: string; businessType: string }[];
}

export const defautlSessionData: SessionData = {
    isLoggedIn: false,
};


export const sessionOptions: SessionOptions = {
    password: process.env.SESSION_PASSWORD!,
    cookieName: "lama-session",
    cookieOptions: {
        httpOnly: true,
        // Secure only works in `https` environments. So if the environment is `https`, it'll return true.
        secure: process.env.NODE_ENV === "production",
    },
};


export const formatDate = (dateString: string) => {
    if (!dateString) return ""

    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  export function capitalizeFirstLetter(str?: string) {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }