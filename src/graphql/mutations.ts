import { gql } from "@apollo/client"


// Hotel Mutations
export const CREATE_HOTEL_MUTATION = gql`
  mutation CreateHotel($input: HotelInput!) {
    createHotel(input: $input) {
      id
      name
      description
      address {
        street
        city
        state
        zipCode
        country
      }
      contact {
        phone
        email
        website
      }
      settings {
        checkInTime
        checkOutTime
        currency
        timezone
        taxRate
        serviceFee
      }
      rating {
        average
        count
      }
      images
      isActive
      createdAt
    }
  }
`

export const UPDATE_HOTEL_MUTATION = gql`
  mutation UpdateHotel($id: ID!, $input: HotelInput!) {
    updateHotel(id: $id, input: $input) {
      id
      name
      description
      address {
        street
        city
        state
        zipCode
        country
      }
      contact {
        phone
        email
        website
      }
      settings {
        checkInTime
        checkOutTime
        currency
        timezone
        taxRate
        serviceFee
      }
      rating {
        average
        count
      }
      images
      updatedAt
    }
  }
`

export const DELETE_HOTEL_MUTATION = gql`
  mutation DeleteHotel($id: ID!) {
    deleteHotel(id: $id)
  }
`

// Restaurant Mutations
export const CREATE_RESTAURANT_MUTATION = gql`
  mutation CreateRestaurant($input: RestaurantInput!) {
    createRestaurant(input: $input) {
      id
      name
      description
      address {
        street
        city
        state
        zipCode
        country
      }
      contact {
        phone
        email
        website
      }
      businessHours {
        day
        open
        close
        isClosed
      }
      cuisine
      priceRange {
        min
        max
        currency
      }
      capacity {
        total
        indoor
        outdoor
        privateRoom
      }
      isActive
      createdAt
    }
  }
`

export const UPDATE_RESTAURANT_MUTATION = gql`
  mutation UpdateRestaurant($id: ID!, $input: RestaurantInput!) {
    updateRestaurant(id: $id, input: $input) {
      id
      name
      description
      address {
        street
        city
        state
        zipCode
        country
      }
      contact {
        phone
        email
        website
      }
      businessHours {
        day
        open
        close
        isClosed
      }
      cuisine
      priceRange {
        min
        max
        currency
      }
      capacity {
        total
        indoor
        outdoor
        privateRoom
      }
      updatedAt
    }
  }
`

export const DELETE_RESTAURANT_MUTATION = gql`
  mutation DeleteRestaurant($id: ID!) {
    deleteRestaurant(id: $id)
  }
`

// Salon Mutations
export const CREATE_SALON_MUTATION = gql`
  mutation CreateSalon($input: SalonInput!) {
    createSalon(input: $input) {
      id
      name
      description
      address {
        street
        city
        state
        zipCode
        country
      }
      contact {
        phone
        email
        website
      }
      businessHours {
        day
        open
        close
        isClosed
      }
      specialties
      priceRange {
        min
        max
        currency
      }
      isActive
      createdAt
    }
  }
`

export const UPDATE_SALON_MUTATION = gql`
  mutation UpdateSalon($id: ID!, $input: SalonInput!) {
    updateSalon(id: $id, input: $input) {
      id
      name
      description
      address {
        street
        city
        state
        zipCode
        country
      }
      contact {
        phone
        email
        website
      }
      businessHours {
        day
        open
        close
        isClosed
      }
      specialties
      priceRange {
        min
        max
        currency
      }
      updatedAt
    }
  }
`

export const DELETE_SALON_MUTATION = gql`
  mutation DeleteSalon($id: ID!) {
    deleteSalon(id: $id)
  }
`

// Room Mutations
export const CREATE_ROOM_MUTATION = gql`
  mutation CreateRoom($input: RoomInput!) {
    createRoom(input: $input) {
      id
      number
      type
      # description
      capacity 
      # beds {
      #   type
      #   count
      # }
      amenities 
      # pricing {
      #   baseRate
      #   currency
      #   taxRate
      # }

      price
      images
      # availability {
      #   isAvailable
      #   maintenanceMode
      #   unavailableDates {
      #     startDate
      #     endDate
      #     reason
      #   }
      # }
      floor
      size 
      # view
      isActive
    }
  }
`

export const UPDATE_ROOM_MUTATION = gql`
  mutation UpdateRoom($id: ID!, $input: RoomInput!) {
    updateRoom(id: $id, input: $input) {
      id
      hotelId
      number
      type
      # description
      capacity 
      # beds {
      #   type
      #   count
      # }
      amenities 
      price
      images 
      # availability {
      #   isAvailable
      #   maintenanceMode
      #   unavailableDates {
      #     startDate
      #     endDate
      #     reason
      #   }
      # }
      floor
      size 
      # view
      isActive
      createdAt
      updatedAt
    }
  }
`

export const DELETE_ROOM_MUTATION = gql`
  mutation DeleteRoom($id: ID!) {
    deleteRoom(id: $id)
  }
`

// Table Mutations
export const CREATE_TABLE_MUTATION = gql`
  mutation CreateTable($input: TableInput!) {
    createTable(input: $input) {
      id
      number
      capacity
      location
      shape
      availability {
        isAvailable
      }
      isActive
      createdAt
    }
  }
`

export const UPDATE_TABLE_MUTATION = gql`
  mutation UpdateTable($id: ID!, $input: TableInput!) {
    updateTable(id: $id, input: $input) {
      id
      number
      capacity
      location
      shape
      availability {
        isAvailable
      }
      updatedAt
    }
  }
`

export const DELETE_TABLE_MUTATION = gql`
  mutation DeleteTable($id: ID!) {
    deleteTable(id: $id)
  }
`

// Service Mutations
export const CREATE_SERVICE_MUTATION = gql`
  mutation CreateService($input: ServiceInput!) {
    createService(input: $input) {
      id
      name
      description
      category
      duration
      pricing {
        basePrice
        currency
      }
      availability {
        isAvailable
      }
      isActive
      createdAt
    }
  }
`

export const UPDATE_SERVICE_MUTATION = gql`
  mutation UpdateService($id: ID!, $input: ServiceInput!) {
    updateService(id: $id, input: $input) {
      id
      name
      description
      category
      duration
      pricing {
        basePrice
        currency
      }
      availability {
        isAvailable
      }
      updatedAt
    }
  }
`

export const DELETE_SERVICE_MUTATION = gql`
  mutation DeleteService($id: ID!) {
    deleteService(id: $id)
  }
`

// Staff Mutations
export const CREATE_STAFF_MUTATION = gql`
  mutation CreateStaff($input: StaffInput!) {
    createStaff(input: $input) {
      id
      user {
        id
        fullName
        email
      }
      position
      department
      employment {
        hireDate
        employmentType
      }
      isActive
      createdAt
    }
  }
`

export const UPDATE_STAFF_MUTATION = gql`
  mutation UpdateStaff($id: ID!, $input: StaffInput!) {
    updateStaff(id: $id, input: $input) {
      id
      user {
        id
        fullName
        email
      }
      position
      department
      employment {
        hireDate
        employmentType
      }
      updatedAt
    }
  }
`

export const DELETE_STAFF_MUTATION = gql`
  mutation DeleteStaff($id: ID!) {
    deleteStaff(id: $id)
  }
`

// Menu Item Mutations
export const CREATE_MENU_ITEM_MUTATION = gql`
  mutation CreateMenuItem($input: MenuItemInput!) {
    createMenuItem(input: $input) {
      id
      name
      description
      category
      pricing {
        price
        currency
      }
      availability {
        isAvailable
      }
      isActive
      createdAt
    }
  }
`

export const UPDATE_MENU_ITEM_MUTATION = gql`
  mutation UpdateMenuItem($id: ID!, $input: MenuItemInput!) {
    updateMenuItem(id: $id, input: $input) {
      id
      name
      description
      category
      pricing {
        price
        currency
      }
      availability {
        isAvailable
      }
      updatedAt
    }
  }
`

export const DELETE_MENU_ITEM_MUTATION = gql`
  mutation DeleteMenuItem($id: ID!) {
    deleteMenuItem(id: $id)
  }
`

// Reservation Mutations
export const CREATE_RESERVATION_MUTATION = gql`
  mutation CreateReservation($input: ReservationInput!) {
    createReservation(input: $input) {
      id
      confirmationNumber
      businessType
      customerInfo {
        name
        email
        phone
      }
      date
      status
      pricing {
        totalAmount
        currency
      }
      
      # Hotel fields
      room {
        number
        type
      }
      checkIn
      checkOut
      guests {
        adults
        children
        total
      }
      
      # Restaurant fields
      table {
        number
        capacity
      }
      partySize
      reservationTime
      
      # Salon fields
      service {
        name
        duration
      }
      staff {
        user {
          fullName
        }
      }
      appointmentTime
      duration
      
      createdAt
    }
  }
`

export const UPDATE_RESERVATION_MUTATION = gql`
  mutation UpdateReservation($id: ID!, $input: ReservationInput!) {
    updateReservation(id: $id, input: $input) {
      id
      confirmationNumber
      status
      customerInfo {
        name
        email
        phone
      }
      date
      pricing {
        totalAmount
        currency
      }
      updatedAt
    }
  }
`

export const CANCEL_RESERVATION_MUTATION = gql`
  mutation CancelReservation($id: ID!) {
    cancelReservation(id: $id) {
      id
      status
      history {
        action
        timestamp
        details
      }
    }
  }
`

export const CONFIRM_RESERVATION_MUTATION = gql`
  mutation ConfirmReservation($id: ID!) {
    confirmReservation(id: $id) {
      id
      status
      history {
        action
        timestamp
        details
      }
    }
  }
`

// Guest Mutations
export const CREATE_GUEST_MUTATION = gql`
  mutation CreateGuest($input: GuestInput!) {
    createGuest(input: $input) {
      id
      personalInfo {
        firstName
        lastName
        email
        phone
      }
      address {
        street
        city
        state
        zipCode
        country
      }
      loyaltyProgram {
        tier
        points
      }
      status
      fullName
      isActive
      createdAt
    }
  }
`

export const UPDATE_GUEST_MUTATION = gql`
  mutation UpdateGuest($id: ID!, $input: GuestInput!) {
    updateGuest(id: $id, input: $input) {
      id
      personalInfo {
        firstName
        lastName
        email
        phone
      }
      address {
        street
        city
        state
        zipCode
        country
      }
      loyaltyProgram {
        tier
        points
      }
      status
      fullName
      updatedAt
    }
  }
`

export const DELETE_GUEST_MUTATION = gql`
  mutation DeleteGuest($id: ID!) {
    deleteGuest(id: $id)
  }
`
