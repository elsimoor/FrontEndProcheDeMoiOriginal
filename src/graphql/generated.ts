import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: any;
  Upload: any;
};

export type Address = {
  __typename?: 'Address';
  city?: Maybe<Scalars['String']>;
  country?: Maybe<Scalars['String']>;
  state?: Maybe<Scalars['String']>;
  street?: Maybe<Scalars['String']>;
  zipCode?: Maybe<Scalars['String']>;
};

export type AddressInput = {
  city?: InputMaybe<Scalars['String']>;
  country?: InputMaybe<Scalars['String']>;
  state?: InputMaybe<Scalars['String']>;
  street?: InputMaybe<Scalars['String']>;
  zipCode?: InputMaybe<Scalars['String']>;
};

export type Amenity = {
  __typename?: 'Amenity';
  category?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  included: Scalars['Boolean'];
  name: Scalars['String'];
  price?: Maybe<Scalars['Float']>;
};

export type AmenityInput = {
  category?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  included: Scalars['Boolean'];
  name: Scalars['String'];
  price?: InputMaybe<Scalars['Float']>;
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token: Scalars['String'];
  user: User;
};

export type Availability = {
  __typename?: 'Availability';
  available: Scalars['Boolean'];
  day: Scalars['String'];
  endTime: Scalars['String'];
  startTime: Scalars['String'];
};

export type AvailabilityInput = {
  available: Scalars['Boolean'];
  day: Scalars['String'];
  endTime: Scalars['String'];
  startTime: Scalars['String'];
};

export type BusinessHours = {
  __typename?: 'BusinessHours';
  closeTime?: Maybe<Scalars['String']>;
  day: Scalars['String'];
  isOpen: Scalars['Boolean'];
  openTime?: Maybe<Scalars['String']>;
};

export type BusinessHoursInput = {
  closeTime?: InputMaybe<Scalars['String']>;
  day: Scalars['String'];
  isOpen: Scalars['Boolean'];
  openTime?: InputMaybe<Scalars['String']>;
};

export type BusinessService = {
  __typename?: 'BusinessService';
  available: Scalars['Boolean'];
  category?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  price: Scalars['Float'];
};

export type BusinessServiceInput = {
  available: Scalars['Boolean'];
  category?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  price: Scalars['Float'];
};

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

/**
 * A Client (also referred to as a Business) represents a single tenant of
 * the reservation system.  Clients own reservations, rooms, services and
 * tables via the clientId foreign key.  Clients can be activated or
 * deactivated; deactivated clients are hidden from queries.
 */
export type Client = {
  __typename?: 'Client';
  address?: Maybe<Address>;
  contact?: Maybe<Contact>;
  createdAt: Scalars['Date'];
  id: Scalars['ID'];
  isActive: Scalars['Boolean'];
  modules: Modules;
  name: Scalars['String'];
  siret?: Maybe<Scalars['String']>;
  theme?: Maybe<Theme>;
  updatedAt: Scalars['Date'];
};

export type ClientInput = {
  address?: InputMaybe<AddressInput>;
  contact?: InputMaybe<ContactInput>;
  modules: ModulesInput;
  name: Scalars['String'];
  siret?: InputMaybe<Scalars['String']>;
  theme?: InputMaybe<ThemeInput>;
};

export type ClientUpdateInput = {
  address?: InputMaybe<AddressInput>;
  contact?: InputMaybe<ContactInput>;
  isActive?: InputMaybe<Scalars['Boolean']>;
  modules?: InputMaybe<ModulesInput>;
  name?: InputMaybe<Scalars['String']>;
  siret?: InputMaybe<Scalars['String']>;
  theme?: InputMaybe<ThemeInput>;
};

export type CommunicationPreferences = {
  __typename?: 'CommunicationPreferences';
  email: Scalars['Boolean'];
  phone: Scalars['Boolean'];
  sms: Scalars['Boolean'];
};

export type CommunicationPreferencesInput = {
  email?: InputMaybe<Scalars['Boolean']>;
  phone?: InputMaybe<Scalars['Boolean']>;
  sms?: InputMaybe<Scalars['Boolean']>;
};

export type Contact = {
  __typename?: 'Contact';
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  website?: Maybe<Scalars['String']>;
};

export type ContactInput = {
  email?: InputMaybe<Scalars['String']>;
  phone?: InputMaybe<Scalars['String']>;
  website?: InputMaybe<Scalars['String']>;
};

export type CustomerInfo = {
  __typename?: 'CustomerInfo';
  email: Scalars['String'];
  name: Scalars['String'];
  phone: Scalars['String'];
};

export type CustomerInfoInput = {
  email: Scalars['String'];
  name: Scalars['String'];
  phone: Scalars['String'];
};

export type Guest = {
  __typename?: 'Guest';
  address?: Maybe<Address>;
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  communicationPreferences?: Maybe<CommunicationPreferences>;
  createdAt: Scalars['Date'];
  email: Scalars['String'];
  id: Scalars['ID'];
  lastVisit?: Maybe<Scalars['Date']>;
  loyaltyPoints: Scalars['Int'];
  membershipLevel: Scalars['String'];
  name: Scalars['String'];
  notes?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  preferences?: Maybe<GuestPreferences>;
  status: Scalars['String'];
  totalSpent: Scalars['Float'];
  totalVisits: Scalars['Int'];
  updatedAt: Scalars['Date'];
  userId?: Maybe<Scalars['ID']>;
};

export type GuestInput = {
  address?: InputMaybe<AddressInput>;
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  communicationPreferences?: InputMaybe<CommunicationPreferencesInput>;
  email: Scalars['String'];
  membershipLevel?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  notes?: InputMaybe<Scalars['String']>;
  phone?: InputMaybe<Scalars['String']>;
  preferences?: InputMaybe<GuestPreferencesInput>;
  status?: InputMaybe<Scalars['String']>;
  userId?: InputMaybe<Scalars['ID']>;
};

export type GuestPreferences = {
  __typename?: 'GuestPreferences';
  allergies?: Maybe<Array<Scalars['String']>>;
  bedType?: Maybe<Scalars['String']>;
  cuisinePreferences?: Maybe<Array<Scalars['String']>>;
  dietaryRestrictions?: Maybe<Array<Scalars['String']>>;
  favoriteServices?: Maybe<Array<Scalars['String']>>;
  floor?: Maybe<Scalars['String']>;
  preferredStylist?: Maybe<Scalars['String']>;
  roomType?: Maybe<Scalars['String']>;
  seatingPreference?: Maybe<Scalars['String']>;
};

export type GuestPreferencesInput = {
  allergies?: InputMaybe<Array<Scalars['String']>>;
  bedType?: InputMaybe<Scalars['String']>;
  cuisinePreferences?: InputMaybe<Array<Scalars['String']>>;
  dietaryRestrictions?: InputMaybe<Array<Scalars['String']>>;
  favoriteServices?: InputMaybe<Array<Scalars['String']>>;
  floor?: InputMaybe<Scalars['String']>;
  preferredStylist?: InputMaybe<Scalars['String']>;
  roomType?: InputMaybe<Scalars['String']>;
  seatingPreference?: InputMaybe<Scalars['String']>;
};

export type Hotel = {
  __typename?: 'Hotel';
  address?: Maybe<Address>;
  amenities: Array<Amenity>;
  contact?: Maybe<Contact>;
  createdAt: Scalars['Date'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  images: Array<Scalars['String']>;
  isActive: Scalars['Boolean'];
  name: Scalars['String'];
  openingPeriods?: Maybe<Array<OpeningPeriod>>;
  policies: Array<Policy>;
  rating?: Maybe<Rating>;
  services: Array<BusinessService>;
  settings?: Maybe<HotelSettings>;
  updatedAt: Scalars['Date'];
};

export type HotelInput = {
  address?: InputMaybe<AddressInput>;
  amenities?: InputMaybe<Array<AmenityInput>>;
  contact?: InputMaybe<ContactInput>;
  description?: InputMaybe<Scalars['String']>;
  images?: InputMaybe<Array<Scalars['String']>>;
  name?: InputMaybe<Scalars['String']>;
  openingPeriods?: InputMaybe<Array<OpeningPeriodInput>>;
  policies?: InputMaybe<Array<PolicyInput>>;
  services?: InputMaybe<Array<BusinessServiceInput>>;
  settings?: InputMaybe<HotelSettingsInput>;
};

export type HotelSettings = {
  __typename?: 'HotelSettings';
  checkInTime?: Maybe<Scalars['String']>;
  checkOutTime?: Maybe<Scalars['String']>;
  currency?: Maybe<Scalars['String']>;
  serviceFee?: Maybe<Scalars['Float']>;
  taxRate?: Maybe<Scalars['Float']>;
  timezone?: Maybe<Scalars['String']>;
};

export type HotelSettingsInput = {
  checkInTime?: InputMaybe<Scalars['String']>;
  checkOutTime?: InputMaybe<Scalars['String']>;
  currency?: InputMaybe<Scalars['String']>;
  serviceFee?: InputMaybe<Scalars['Float']>;
  taxRate?: InputMaybe<Scalars['Float']>;
  timezone?: InputMaybe<Scalars['String']>;
};

export type LoginInput = {
  email: Scalars['String'];
  password: Scalars['String'];
};

export type MenuItem = {
  __typename?: 'MenuItem';
  allergens: Array<Scalars['String']>;
  available: Scalars['Boolean'];
  category: Scalars['String'];
  createdAt: Scalars['Date'];
  description?: Maybe<Scalars['String']>;
  dietaryInfo: Array<Scalars['String']>;
  id: Scalars['ID'];
  images: Array<Scalars['String']>;
  ingredients: Array<Scalars['String']>;
  isActive: Scalars['Boolean'];
  name: Scalars['String'];
  nutritionalInfo?: Maybe<NutritionalInfo>;
  popular: Scalars['Boolean'];
  prepTime?: Maybe<Scalars['Int']>;
  price: Scalars['Float'];
  restaurantId: Scalars['ID'];
  spiceLevel?: Maybe<Scalars['String']>;
  updatedAt: Scalars['Date'];
};

export type MenuItemInput = {
  allergens?: InputMaybe<Array<Scalars['String']>>;
  available?: InputMaybe<Scalars['Boolean']>;
  category: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  dietaryInfo?: InputMaybe<Array<Scalars['String']>>;
  images?: InputMaybe<Array<Scalars['String']>>;
  ingredients?: InputMaybe<Array<Scalars['String']>>;
  name: Scalars['String'];
  nutritionalInfo?: InputMaybe<NutritionalInfoInput>;
  popular?: InputMaybe<Scalars['Boolean']>;
  prepTime?: InputMaybe<Scalars['Int']>;
  price: Scalars['Float'];
  restaurantId: Scalars['ID'];
  spiceLevel?: InputMaybe<Scalars['String']>;
};

/** A set of flags indicating which reservation modules are active for a client. */
export type Modules = {
  __typename?: 'Modules';
  restaurant: Scalars['Boolean'];
  rooms: Scalars['Boolean'];
  services: Scalars['Boolean'];
};

export type ModulesInput = {
  restaurant: Scalars['Boolean'];
  rooms: Scalars['Boolean'];
  services: Scalars['Boolean'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _?: Maybe<Scalars['String']>;
  /**
   * Create a new client.  The caller may specify the modules and theme; if
   * omitted the modules default to all disabled and the theme is blank.  A
   * newly created client is active by default.
   */
  createClient: Client;
  createGuest: Guest;
  createHotel: Hotel;
  createMenuItem: MenuItem;
  createReservation: Reservation;
  createRestaurant: Restaurant;
  createRoom: Room;
  createSalon: Salon;
  createService: Service;
  createStaff: Staff;
  createTable: Table;
  /**
   * Soft delete a client.  Rather than removing the document from the
   * database this sets the isActive flag to false.  Returns true on success.
   */
  deleteClient: Scalars['Boolean'];
  deleteGuest: Scalars['Boolean'];
  deleteHotel: Scalars['Boolean'];
  deleteMenuItem: Scalars['Boolean'];
  deleteReservation: Scalars['Boolean'];
  deleteRestaurant: Scalars['Boolean'];
  deleteRoom: Scalars['Boolean'];
  deleteSalon: Scalars['Boolean'];
  deleteService: Scalars['Boolean'];
  deleteStaff: Scalars['Boolean'];
  deleteTable: Scalars['Boolean'];
  login: AuthPayload;
  register: AuthPayload;
  /**
   * Update an existing client.  Only the provided fields will be modified.
   * Attempting to update a non‑existent client returns null.
   */
  updateClient?: Maybe<Client>;
  updateGuest: Guest;
  updateHotel: Hotel;
  updateMenuItem: MenuItem;
  updateReservation: Reservation;
  updateRestaurant: Restaurant;
  updateRoom: Room;
  updateSalon: Salon;
  updateService: Service;
  updateStaff: Staff;
  updateTable: Table;
  updateUser: User;
};


export type MutationCreateClientArgs = {
  input: ClientInput;
};


export type MutationCreateGuestArgs = {
  input: GuestInput;
};


export type MutationCreateHotelArgs = {
  input: HotelInput;
};


export type MutationCreateMenuItemArgs = {
  input: MenuItemInput;
};


export type MutationCreateReservationArgs = {
  input: ReservationInput;
};


export type MutationCreateRestaurantArgs = {
  input: RestaurantInput;
};


export type MutationCreateRoomArgs = {
  input: RoomInput;
};


export type MutationCreateSalonArgs = {
  input: SalonInput;
};


export type MutationCreateServiceArgs = {
  input: ServiceInput;
};


export type MutationCreateStaffArgs = {
  input: StaffInput;
};


export type MutationCreateTableArgs = {
  input: TableInput;
};


export type MutationDeleteClientArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteGuestArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteHotelArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteMenuItemArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteReservationArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteRestaurantArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteRoomArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteSalonArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteServiceArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteStaffArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteTableArgs = {
  id: Scalars['ID'];
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationRegisterArgs = {
  input: RegisterInput;
};


export type MutationUpdateClientArgs = {
  id: Scalars['ID'];
  input: ClientUpdateInput;
};


export type MutationUpdateGuestArgs = {
  id: Scalars['ID'];
  input: GuestInput;
};


export type MutationUpdateHotelArgs = {
  id: Scalars['ID'];
  input: HotelInput;
};


export type MutationUpdateMenuItemArgs = {
  id: Scalars['ID'];
  input: MenuItemInput;
};


export type MutationUpdateReservationArgs = {
  id: Scalars['ID'];
  input: ReservationInput;
};


export type MutationUpdateRestaurantArgs = {
  id: Scalars['ID'];
  input: RestaurantInput;
};


export type MutationUpdateRoomArgs = {
  id: Scalars['ID'];
  input: RoomInput;
};


export type MutationUpdateSalonArgs = {
  id: Scalars['ID'];
  input: SalonInput;
};


export type MutationUpdateServiceArgs = {
  id: Scalars['ID'];
  input: ServiceInput;
};


export type MutationUpdateStaffArgs = {
  id: Scalars['ID'];
  input: StaffInput;
};


export type MutationUpdateTableArgs = {
  id: Scalars['ID'];
  input: TableInput;
};


export type MutationUpdateUserArgs = {
  id: Scalars['ID'];
  input: UserUpdateInput;
};

export type NotificationPreferences = {
  __typename?: 'NotificationPreferences';
  email?: Maybe<Scalars['Boolean']>;
  push?: Maybe<Scalars['Boolean']>;
  sms?: Maybe<Scalars['Boolean']>;
};

export type NutritionalInfo = {
  __typename?: 'NutritionalInfo';
  calories?: Maybe<Scalars['Int']>;
  carbs?: Maybe<Scalars['Float']>;
  fat?: Maybe<Scalars['Float']>;
  protein?: Maybe<Scalars['Float']>;
};

export type NutritionalInfoInput = {
  calories?: InputMaybe<Scalars['Int']>;
  carbs?: InputMaybe<Scalars['Float']>;
  fat?: InputMaybe<Scalars['Float']>;
  protein?: InputMaybe<Scalars['Float']>;
};

/**
 * OpeningPeriod defines a continuous date range during which a hotel
 * accepts reservations.  Both startDate and endDate are inclusive.
 */
export type OpeningPeriod = {
  __typename?: 'OpeningPeriod';
  endDate: Scalars['Date'];
  startDate: Scalars['Date'];
};

/** OpeningPeriodInput represents a date range (inclusive) when a hotel is open. */
export type OpeningPeriodInput = {
  endDate: Scalars['Date'];
  startDate: Scalars['Date'];
};

export type Policy = {
  __typename?: 'Policy';
  category: Scalars['String'];
  description: Scalars['String'];
  title: Scalars['String'];
};

export type PolicyInput = {
  category: Scalars['String'];
  description: Scalars['String'];
  title: Scalars['String'];
};

export type Position = {
  __typename?: 'Position';
  x?: Maybe<Scalars['Float']>;
  y?: Maybe<Scalars['Float']>;
};

export type PositionInput = {
  x?: InputMaybe<Scalars['Float']>;
  y?: InputMaybe<Scalars['Float']>;
};

export type Query = {
  __typename?: 'Query';
  _: Scalars['String'];
  /**
   * Return a list of rooms that are available for the given hotel and date
   * range.  A room is considered available if it is active, has status
   * "available" and there is no existing hotel reservation with
   * overlapping check‑in/check‑out dates for that room.  Both
   * parameters are required and should be ISO formatted dates.
   */
  availableRooms: Array<Room>;
  availableRoomsCount: Scalars['Int'];
  /**
   * Fetch a single client by its ID.  Returns null if no client exists
   * with the provided identifier.
   */
  client?: Maybe<Client>;
  /**
   * Return a list of all active clients.  Inactive clients are filtered
   * automatically.  Clients are ordered by creation date descending.
   */
  clients: Array<Client>;
  guest?: Maybe<Guest>;
  guests: Array<Guest>;
  hotel?: Maybe<Hotel>;
  hotels: Array<Hotel>;
  menuItem?: Maybe<MenuItem>;
  menuItems: Array<MenuItem>;
  reservation?: Maybe<Reservation>;
  reservations: Array<Reservation>;
  restaurant?: Maybe<Restaurant>;
  restaurants: Array<Restaurant>;
  room?: Maybe<Room>;
  rooms: Array<Room>;
  salon?: Maybe<Salon>;
  salons: Array<Salon>;
  service?: Maybe<Service>;
  services: Array<Service>;
  staff: Array<Staff>;
  staffMember?: Maybe<Staff>;
  table?: Maybe<Table>;
  tables: Array<Table>;
  user?: Maybe<User>;
  users: Array<User>;
};


export type QueryAvailableRoomsArgs = {
  adults: Scalars['Int'];
  checkIn: Scalars['Date'];
  checkOut: Scalars['Date'];
  children: Scalars['Int'];
  hotelId: Scalars['ID'];
};


export type QueryAvailableRoomsCountArgs = {
  adults: Scalars['Int'];
  checkIn: Scalars['Date'];
  checkOut: Scalars['Date'];
  children: Scalars['Int'];
  hotelId: Scalars['ID'];
};


export type QueryClientArgs = {
  id: Scalars['ID'];
};


export type QueryGuestArgs = {
  id: Scalars['ID'];
};


export type QueryGuestsArgs = {
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  status?: InputMaybe<Scalars['String']>;
};


export type QueryHotelArgs = {
  id: Scalars['ID'];
};


export type QueryMenuItemArgs = {
  id: Scalars['ID'];
};


export type QueryMenuItemsArgs = {
  category?: InputMaybe<Scalars['String']>;
  restaurantId: Scalars['ID'];
};


export type QueryReservationArgs = {
  id: Scalars['ID'];
};


export type QueryReservationsArgs = {
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  date?: InputMaybe<Scalars['Date']>;
  status?: InputMaybe<Scalars['String']>;
};


export type QueryRestaurantArgs = {
  id: Scalars['ID'];
};


export type QueryRoomArgs = {
  id: Scalars['ID'];
};


export type QueryRoomsArgs = {
  hotelId: Scalars['ID'];
  status?: InputMaybe<Scalars['String']>;
};


export type QuerySalonArgs = {
  id: Scalars['ID'];
};


export type QueryServiceArgs = {
  id: Scalars['ID'];
};


export type QueryServicesArgs = {
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  category?: InputMaybe<Scalars['String']>;
};


export type QueryStaffArgs = {
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  role?: InputMaybe<Scalars['String']>;
};


export type QueryStaffMemberArgs = {
  id: Scalars['ID'];
};


export type QueryTableArgs = {
  id: Scalars['ID'];
};


export type QueryTablesArgs = {
  restaurantId: Scalars['ID'];
  status?: InputMaybe<Scalars['String']>;
};


export type QueryUserArgs = {
  id: Scalars['ID'];
};


export type QueryUsersArgs = {
  businessType?: InputMaybe<Scalars['String']>;
  role?: InputMaybe<Scalars['String']>;
};

export type Rating = {
  __typename?: 'Rating';
  average: Scalars['Float'];
  count: Scalars['Int'];
};

export type RegisterInput = {
  businessType: Scalars['String'];
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  password: Scalars['String'];
};

export type Reservation = {
  __typename?: 'Reservation';
  businessType: Scalars['String'];
  checkIn?: Maybe<Scalars['Date']>;
  checkOut?: Maybe<Scalars['Date']>;
  client?: Maybe<Client>;
  createdAt: Scalars['Date'];
  customerId?: Maybe<User>;
  customerInfo: CustomerInfo;
  date: Scalars['Date'];
  duration?: Maybe<Scalars['Int']>;
  guests?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  notes?: Maybe<Scalars['String']>;
  partySize?: Maybe<Scalars['Int']>;
  paymentStatus: Scalars['String'];
  reminderSent: Scalars['Boolean'];
  roomId?: Maybe<Room>;
  serviceId?: Maybe<Service>;
  source: Scalars['String'];
  specialRequests?: Maybe<Scalars['String']>;
  staffId?: Maybe<Staff>;
  status: Scalars['String'];
  tableId?: Maybe<Table>;
  time?: Maybe<Scalars['String']>;
  totalAmount?: Maybe<Scalars['Float']>;
  updatedAt: Scalars['Date'];
};

export type ReservationInput = {
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  checkIn?: InputMaybe<Scalars['Date']>;
  checkOut?: InputMaybe<Scalars['Date']>;
  customerId?: InputMaybe<Scalars['ID']>;
  customerInfo: CustomerInfoInput;
  date: Scalars['Date'];
  duration?: InputMaybe<Scalars['Int']>;
  guests?: InputMaybe<Scalars['Int']>;
  notes?: InputMaybe<Scalars['String']>;
  partySize?: InputMaybe<Scalars['Int']>;
  paymentStatus?: InputMaybe<Scalars['String']>;
  roomId?: InputMaybe<Scalars['ID']>;
  serviceId?: InputMaybe<Scalars['ID']>;
  source?: InputMaybe<Scalars['String']>;
  specialRequests?: InputMaybe<Scalars['String']>;
  staffId?: InputMaybe<Scalars['ID']>;
  status?: InputMaybe<Scalars['String']>;
  tableId?: InputMaybe<Scalars['ID']>;
  time?: InputMaybe<Scalars['String']>;
  totalAmount?: InputMaybe<Scalars['Float']>;
};

export type Restaurant = {
  __typename?: 'Restaurant';
  address?: Maybe<Address>;
  businessHours: Array<BusinessHours>;
  contact?: Maybe<Contact>;
  createdAt: Scalars['Date'];
  cuisine: Array<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  features: Array<Scalars['String']>;
  id: Scalars['ID'];
  images: Array<Scalars['String']>;
  isActive: Scalars['Boolean'];
  name: Scalars['String'];
  policies: Array<Policy>;
  priceRange?: Maybe<Scalars['String']>;
  rating?: Maybe<Rating>;
  settings?: Maybe<RestaurantSettings>;
  updatedAt: Scalars['Date'];
};

export type RestaurantInput = {
  address?: InputMaybe<AddressInput>;
  businessHours?: InputMaybe<Array<BusinessHoursInput>>;
  contact?: InputMaybe<ContactInput>;
  cuisine?: InputMaybe<Array<Scalars['String']>>;
  description?: InputMaybe<Scalars['String']>;
  features?: InputMaybe<Array<Scalars['String']>>;
  images?: InputMaybe<Array<Scalars['String']>>;
  name: Scalars['String'];
  policies?: InputMaybe<Array<PolicyInput>>;
  priceRange?: InputMaybe<Scalars['String']>;
  settings?: InputMaybe<RestaurantSettingsInput>;
};

export type RestaurantSettings = {
  __typename?: 'RestaurantSettings';
  cancellationHours?: Maybe<Scalars['Int']>;
  currency?: Maybe<Scalars['String']>;
  maxPartySize?: Maybe<Scalars['Int']>;
  reservationWindow?: Maybe<Scalars['Int']>;
  serviceFee?: Maybe<Scalars['Float']>;
  taxRate?: Maybe<Scalars['Float']>;
  timezone?: Maybe<Scalars['String']>;
};

export type RestaurantSettingsInput = {
  cancellationHours?: InputMaybe<Scalars['Int']>;
  currency?: InputMaybe<Scalars['String']>;
  maxPartySize?: InputMaybe<Scalars['Int']>;
  reservationWindow?: InputMaybe<Scalars['Int']>;
  serviceFee?: InputMaybe<Scalars['Float']>;
  taxRate?: InputMaybe<Scalars['Float']>;
  timezone?: InputMaybe<Scalars['String']>;
};

export type Room = {
  __typename?: 'Room';
  amenities: Array<Scalars['String']>;
  bedType?: Maybe<Array<Maybe<Scalars['String']>>>;
  capacity: Scalars['Int'];
  condition: Scalars['String'];
  createdAt: Scalars['Date'];
  description?: Maybe<Scalars['String']>;
  features: Array<Scalars['String']>;
  floor?: Maybe<Scalars['Int']>;
  hotelId: Scalars['ID'];
  id: Scalars['ID'];
  images: Array<Scalars['String']>;
  isActive: Scalars['Boolean'];
  lastCleaned?: Maybe<Scalars['Date']>;
  nextMaintenance?: Maybe<Scalars['Date']>;
  number: Scalars['String'];
  numberOfBathrooms?: Maybe<Scalars['Int']>;
  numberOfBeds?: Maybe<Scalars['Int']>;
  price: Scalars['Float'];
  size?: Maybe<Scalars['Int']>;
  status: Scalars['String'];
  type: Scalars['String'];
  updatedAt: Scalars['Date'];
};

export type RoomInput = {
  amenities?: InputMaybe<Array<Scalars['String']>>;
  bedType?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  capacity: Scalars['Int'];
  condition?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  features?: InputMaybe<Array<Scalars['String']>>;
  floor?: InputMaybe<Scalars['Int']>;
  hotelId: Scalars['ID'];
  images?: InputMaybe<Array<Scalars['String']>>;
  lastCleaned?: InputMaybe<Scalars['Date']>;
  nextMaintenance?: InputMaybe<Scalars['Date']>;
  number: Scalars['String'];
  numberOfBathrooms?: InputMaybe<Scalars['Int']>;
  numberOfBeds?: InputMaybe<Scalars['Int']>;
  price: Scalars['Float'];
  size?: InputMaybe<Scalars['Int']>;
  status?: InputMaybe<Scalars['String']>;
  type: Scalars['String'];
};

export type Salon = {
  __typename?: 'Salon';
  address?: Maybe<Address>;
  businessHours: Array<BusinessHours>;
  contact?: Maybe<Contact>;
  createdAt: Scalars['Date'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  images: Array<Scalars['String']>;
  isActive: Scalars['Boolean'];
  name: Scalars['String'];
  policies: Array<Policy>;
  rating?: Maybe<Rating>;
  settings?: Maybe<SalonSettings>;
  specialties: Array<Scalars['String']>;
  updatedAt: Scalars['Date'];
};

export type SalonInput = {
  address?: InputMaybe<AddressInput>;
  businessHours?: InputMaybe<Array<BusinessHoursInput>>;
  contact?: InputMaybe<ContactInput>;
  description?: InputMaybe<Scalars['String']>;
  images?: InputMaybe<Array<Scalars['String']>>;
  name: Scalars['String'];
  policies?: InputMaybe<Array<PolicyInput>>;
  settings?: InputMaybe<SalonSettingsInput>;
  specialties?: InputMaybe<Array<Scalars['String']>>;
};

export type SalonSettings = {
  __typename?: 'SalonSettings';
  cancellationHours?: Maybe<Scalars['Int']>;
  currency?: Maybe<Scalars['String']>;
  serviceFee?: Maybe<Scalars['Float']>;
  taxRate?: Maybe<Scalars['Float']>;
  timezone?: Maybe<Scalars['String']>;
};

export type SalonSettingsInput = {
  cancellationHours?: InputMaybe<Scalars['Int']>;
  currency?: InputMaybe<Scalars['String']>;
  serviceFee?: InputMaybe<Scalars['Float']>;
  taxRate?: InputMaybe<Scalars['Float']>;
  timezone?: InputMaybe<Scalars['String']>;
};

export type Service = {
  __typename?: 'Service';
  allowClientChoose?: Maybe<Scalars['Boolean']>;
  available: Scalars['Boolean'];
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  category?: Maybe<Scalars['String']>;
  createdAt: Scalars['Date'];
  defaultEmployee?: Maybe<Scalars['ID']>;
  defaultRoom?: Maybe<Scalars['ID']>;
  description?: Maybe<Scalars['String']>;
  duration?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  images: Array<Scalars['String']>;
  isActive: Scalars['Boolean'];
  name: Scalars['String'];
  options: Array<ServiceOption>;
  popular: Scalars['Boolean'];
  price: Scalars['Float'];
  requirements: Array<Scalars['String']>;
  staffRequired: Array<Scalars['String']>;
  updatedAt: Scalars['Date'];
};

export type ServiceInput = {
  allowClientChoose?: InputMaybe<Scalars['Boolean']>;
  available?: InputMaybe<Scalars['Boolean']>;
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  category?: InputMaybe<Scalars['String']>;
  defaultEmployee?: InputMaybe<Scalars['ID']>;
  defaultRoom?: InputMaybe<Scalars['ID']>;
  description?: InputMaybe<Scalars['String']>;
  duration?: InputMaybe<Scalars['Int']>;
  images?: InputMaybe<Array<Scalars['String']>>;
  name: Scalars['String'];
  options?: InputMaybe<Array<ServiceOptionInput>>;
  popular?: InputMaybe<Scalars['Boolean']>;
  price: Scalars['Float'];
  requirements?: InputMaybe<Array<Scalars['String']>>;
  staffRequired?: InputMaybe<Array<Scalars['String']>>;
};

/**
 * Represents an optional add‑on for a salon service.  Service options
 * allow salons to offer customisations that adjust the base price and
 * duration of a service.  For example, a massage service might have an
 * option to add aromatherapy for an additional fee and time.
 */
export type ServiceOption = {
  __typename?: 'ServiceOption';
  durationImpact?: Maybe<Scalars['Int']>;
  name: Scalars['String'];
  price?: Maybe<Scalars['Float']>;
};

/**
 * Input type for specifying service options when creating or updating a
 * service.  Each option can independently modify the price and
 * duration of the service.  All fields are optional; omitting a field
 * will leave the corresponding value unchanged.
 */
export type ServiceOptionInput = {
  durationImpact?: InputMaybe<Scalars['Int']>;
  name: Scalars['String'];
  price?: InputMaybe<Scalars['Float']>;
};

export type Staff = {
  __typename?: 'Staff';
  availability: Array<Availability>;
  avatar?: Maybe<Scalars['String']>;
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  createdAt: Scalars['Date'];
  email?: Maybe<Scalars['String']>;
  hireDate?: Maybe<Scalars['Date']>;
  hourlyRate?: Maybe<Scalars['Float']>;
  id: Scalars['ID'];
  isActive: Scalars['Boolean'];
  name: Scalars['String'];
  notes?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  role: Scalars['String'];
  schedule: Scalars['String'];
  specialties: Array<Scalars['String']>;
  status: Scalars['String'];
  updatedAt: Scalars['Date'];
  userId?: Maybe<Scalars['ID']>;
};

export type StaffInput = {
  availability?: InputMaybe<Array<AvailabilityInput>>;
  avatar?: InputMaybe<Scalars['String']>;
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  email?: InputMaybe<Scalars['String']>;
  hireDate?: InputMaybe<Scalars['Date']>;
  hourlyRate?: InputMaybe<Scalars['Float']>;
  name: Scalars['String'];
  notes?: InputMaybe<Scalars['String']>;
  phone?: InputMaybe<Scalars['String']>;
  role: Scalars['String'];
  schedule?: InputMaybe<Scalars['String']>;
  specialties?: InputMaybe<Array<Scalars['String']>>;
  status?: InputMaybe<Scalars['String']>;
  userId?: InputMaybe<Scalars['ID']>;
};

export type Table = {
  __typename?: 'Table';
  capacity: Scalars['Int'];
  createdAt: Scalars['Date'];
  features: Array<Scalars['String']>;
  id: Scalars['ID'];
  isActive: Scalars['Boolean'];
  location: Scalars['String'];
  number: Scalars['Int'];
  position?: Maybe<Position>;
  restaurantId: Scalars['ID'];
  status: Scalars['String'];
  updatedAt: Scalars['Date'];
};

export type TableInput = {
  capacity: Scalars['Int'];
  features?: InputMaybe<Array<Scalars['String']>>;
  location: Scalars['String'];
  number: Scalars['Int'];
  position?: InputMaybe<PositionInput>;
  restaurantId: Scalars['ID'];
  status?: InputMaybe<Scalars['String']>;
};

/**
 * Visual theme customisation for a client.  Optional properties allow
 * overriding the logo, primary/secondary colours and typography.  These
 * variables are consumed by the front‑office to style the booking interfaces.
 */
export type Theme = {
  __typename?: 'Theme';
  logoUrl?: Maybe<Scalars['String']>;
  primaryColor?: Maybe<Scalars['String']>;
  secondaryColor?: Maybe<Scalars['String']>;
  typography?: Maybe<Scalars['String']>;
};

export type ThemeInput = {
  logoUrl?: InputMaybe<Scalars['String']>;
  primaryColor?: InputMaybe<Scalars['String']>;
  secondaryColor?: InputMaybe<Scalars['String']>;
  typography?: InputMaybe<Scalars['String']>;
};

export type User = {
  __typename?: 'User';
  avatar?: Maybe<Scalars['String']>;
  businessId?: Maybe<Scalars['ID']>;
  businessType?: Maybe<Scalars['String']>;
  createdAt: Scalars['Date'];
  email: Scalars['String'];
  firstName?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isActive: Scalars['Boolean'];
  lastLogin?: Maybe<Scalars['Date']>;
  lastName?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  preferences?: Maybe<UserPreferences>;
  role: Scalars['String'];
  updatedAt: Scalars['Date'];
};

export type UserPreferences = {
  __typename?: 'UserPreferences';
  language?: Maybe<Scalars['String']>;
  notifications?: Maybe<NotificationPreferences>;
  timezone?: Maybe<Scalars['String']>;
};

export type UserUpdateInput = {
  businessId?: InputMaybe<Scalars['ID']>;
  businessType?: InputMaybe<Scalars['String']>;
  role?: InputMaybe<Scalars['String']>;
};

export type CreateGuestMutationVariables = Exact<{
  input: GuestInput;
}>;


export type CreateGuestMutation = { __typename?: 'Mutation', createGuest: { __typename?: 'Guest', id: string, name: string, email: string, phone?: string | null, createdAt: any } };

export type CreateReservationMutationVariables = Exact<{
  input: ReservationInput;
}>;


export type CreateReservationMutation = { __typename?: 'Mutation', createReservation: { __typename?: 'Reservation', id: string, businessType: string, date: any, status: string, checkIn?: any | null, checkOut?: any | null, guests?: number | null, partySize?: number | null, duration?: number | null, createdAt: any, customerInfo: { __typename?: 'CustomerInfo', name: string, email: string, phone: string }, roomId?: { __typename?: 'Room', number: string, type: string } | null, tableId?: { __typename?: 'Table', number: number, capacity: number } | null, serviceId?: { __typename?: 'Service', name: string, duration?: number | null } | null, staffId?: { __typename?: 'Staff', name: string } | null } };

export type DeleteGuestMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type DeleteGuestMutation = { __typename?: 'Mutation', deleteGuest: boolean };

export type UpdateGuestMutationVariables = Exact<{
  id: Scalars['ID'];
  input: GuestInput;
}>;


export type UpdateGuestMutation = { __typename?: 'Mutation', updateGuest: { __typename?: 'Guest', id: string, name: string, email: string, phone?: string | null, createdAt: any } };

export type GuestsQueryVariables = Exact<{
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  status?: InputMaybe<Scalars['String']>;
}>;


export type GuestsQuery = { __typename?: 'Query', guests: Array<{ __typename?: 'Guest', id: string, name: string, email: string, phone?: string | null, createdAt: any }> };

export type ReservationsQueryVariables = Exact<{
  businessId: Scalars['ID'];
  businessType: Scalars['String'];
  status?: InputMaybe<Scalars['String']>;
  date?: InputMaybe<Scalars['Date']>;
}>;


export type ReservationsQuery = { __typename?: 'Query', reservations: Array<{ __typename?: 'Reservation', id: string, businessType: string, date: any, status: string, checkIn?: any | null, checkOut?: any | null, guests?: number | null, partySize?: number | null, duration?: number | null, createdAt: any, customerInfo: { __typename?: 'CustomerInfo', name: string, email: string, phone: string }, roomId?: { __typename?: 'Room', number: string, type: string } | null, tableId?: { __typename?: 'Table', number: number, capacity: number } | null, serviceId?: { __typename?: 'Service', name: string, duration?: number | null } | null, staffId?: { __typename?: 'Staff', name: string } | null }> };


export const CreateGuestDocument = gql`
    mutation createGuest($input: GuestInput!) {
  createGuest(input: $input) {
    id
    name
    email
    phone
    createdAt
  }
}
    `;
export type CreateGuestMutationFn = Apollo.MutationFunction<CreateGuestMutation, CreateGuestMutationVariables>;

/**
 * __useCreateGuestMutation__
 *
 * To run a mutation, you first call `useCreateGuestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateGuestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createGuestMutation, { data, loading, error }] = useCreateGuestMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateGuestMutation(baseOptions?: Apollo.MutationHookOptions<CreateGuestMutation, CreateGuestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateGuestMutation, CreateGuestMutationVariables>(CreateGuestDocument, options);
      }
export type CreateGuestMutationHookResult = ReturnType<typeof useCreateGuestMutation>;
export type CreateGuestMutationResult = Apollo.MutationResult<CreateGuestMutation>;
export type CreateGuestMutationOptions = Apollo.BaseMutationOptions<CreateGuestMutation, CreateGuestMutationVariables>;
export const CreateReservationDocument = gql`
    mutation createReservation($input: ReservationInput!) {
  createReservation(input: $input) {
    id
    id
    businessType
    customerInfo {
      name
      email
      phone
    }
    date
    status
    roomId {
      number
      type
    }
    checkIn
    checkOut
    guests
    tableId {
      number
      capacity
    }
    partySize
    serviceId {
      name
      duration
    }
    staffId {
      name
    }
    duration
    createdAt
  }
}
    `;
export type CreateReservationMutationFn = Apollo.MutationFunction<CreateReservationMutation, CreateReservationMutationVariables>;

/**
 * __useCreateReservationMutation__
 *
 * To run a mutation, you first call `useCreateReservationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateReservationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createReservationMutation, { data, loading, error }] = useCreateReservationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateReservationMutation(baseOptions?: Apollo.MutationHookOptions<CreateReservationMutation, CreateReservationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateReservationMutation, CreateReservationMutationVariables>(CreateReservationDocument, options);
      }
export type CreateReservationMutationHookResult = ReturnType<typeof useCreateReservationMutation>;
export type CreateReservationMutationResult = Apollo.MutationResult<CreateReservationMutation>;
export type CreateReservationMutationOptions = Apollo.BaseMutationOptions<CreateReservationMutation, CreateReservationMutationVariables>;
export const DeleteGuestDocument = gql`
    mutation deleteGuest($id: ID!) {
  deleteGuest(id: $id)
}
    `;
export type DeleteGuestMutationFn = Apollo.MutationFunction<DeleteGuestMutation, DeleteGuestMutationVariables>;

/**
 * __useDeleteGuestMutation__
 *
 * To run a mutation, you first call `useDeleteGuestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteGuestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteGuestMutation, { data, loading, error }] = useDeleteGuestMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteGuestMutation(baseOptions?: Apollo.MutationHookOptions<DeleteGuestMutation, DeleteGuestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteGuestMutation, DeleteGuestMutationVariables>(DeleteGuestDocument, options);
      }
export type DeleteGuestMutationHookResult = ReturnType<typeof useDeleteGuestMutation>;
export type DeleteGuestMutationResult = Apollo.MutationResult<DeleteGuestMutation>;
export type DeleteGuestMutationOptions = Apollo.BaseMutationOptions<DeleteGuestMutation, DeleteGuestMutationVariables>;
export const UpdateGuestDocument = gql`
    mutation updateGuest($id: ID!, $input: GuestInput!) {
  updateGuest(id: $id, input: $input) {
    id
    name
    email
    phone
    createdAt
  }
}
    `;
export type UpdateGuestMutationFn = Apollo.MutationFunction<UpdateGuestMutation, UpdateGuestMutationVariables>;

/**
 * __useUpdateGuestMutation__
 *
 * To run a mutation, you first call `useUpdateGuestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateGuestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateGuestMutation, { data, loading, error }] = useUpdateGuestMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateGuestMutation(baseOptions?: Apollo.MutationHookOptions<UpdateGuestMutation, UpdateGuestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateGuestMutation, UpdateGuestMutationVariables>(UpdateGuestDocument, options);
      }
export type UpdateGuestMutationHookResult = ReturnType<typeof useUpdateGuestMutation>;
export type UpdateGuestMutationResult = Apollo.MutationResult<UpdateGuestMutation>;
export type UpdateGuestMutationOptions = Apollo.BaseMutationOptions<UpdateGuestMutation, UpdateGuestMutationVariables>;
export const GuestsDocument = gql`
    query guests($businessId: ID!, $businessType: String!, $status: String) {
  guests(businessId: $businessId, businessType: $businessType, status: $status) {
    id
    name
    email
    phone
    createdAt
  }
}
    `;

/**
 * __useGuestsQuery__
 *
 * To run a query within a React component, call `useGuestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGuestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGuestsQuery({
 *   variables: {
 *      businessId: // value for 'businessId'
 *      businessType: // value for 'businessType'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGuestsQuery(baseOptions: Apollo.QueryHookOptions<GuestsQuery, GuestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GuestsQuery, GuestsQueryVariables>(GuestsDocument, options);
      }
export function useGuestsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GuestsQuery, GuestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GuestsQuery, GuestsQueryVariables>(GuestsDocument, options);
        }
export type GuestsQueryHookResult = ReturnType<typeof useGuestsQuery>;
export type GuestsLazyQueryHookResult = ReturnType<typeof useGuestsLazyQuery>;
export type GuestsQueryResult = Apollo.QueryResult<GuestsQuery, GuestsQueryVariables>;
export const ReservationsDocument = gql`
    query reservations($businessId: ID!, $businessType: String!, $status: String, $date: Date) {
  reservations(
    businessId: $businessId
    businessType: $businessType
    status: $status
    date: $date
  ) {
    id
    businessType
    customerInfo {
      name
      email
      phone
    }
    date
    status
    roomId {
      number
      type
    }
    checkIn
    checkOut
    guests
    tableId {
      number
      capacity
    }
    partySize
    serviceId {
      name
      duration
    }
    staffId {
      name
    }
    duration
    createdAt
  }
}
    `;

/**
 * __useReservationsQuery__
 *
 * To run a query within a React component, call `useReservationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useReservationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReservationsQuery({
 *   variables: {
 *      businessId: // value for 'businessId'
 *      businessType: // value for 'businessType'
 *      status: // value for 'status'
 *      date: // value for 'date'
 *   },
 * });
 */
export function useReservationsQuery(baseOptions: Apollo.QueryHookOptions<ReservationsQuery, ReservationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ReservationsQuery, ReservationsQueryVariables>(ReservationsDocument, options);
      }
export function useReservationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ReservationsQuery, ReservationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ReservationsQuery, ReservationsQueryVariables>(ReservationsDocument, options);
        }
export type ReservationsQueryHookResult = ReturnType<typeof useReservationsQuery>;
export type ReservationsLazyQueryHookResult = ReturnType<typeof useReservationsLazyQuery>;
export type ReservationsQueryResult = Apollo.QueryResult<ReservationsQuery, ReservationsQueryVariables>;