import { gql } from "@apollo/client"


// Hotel Queries
// -----------------------------------------------------------------------------
// Hotel Queries
//
// The backend schema for hotels has been simplified compared to the original
// project.  In particular, hotels no longer expose a `priceRange` object and
// business hours are managed via the `HotelSettings` type rather than a
// separate `businessHours` field.  The query below requests only the fields
// that actually exist on the `Hotel` type: basic identification, contact and
// address information, optional rating data and an array of image URLs.
export const GET_HOTELS = gql`
  query GetHotels {
    hotels {
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
      rating {
        average
        count
      }
      images
      isActive
    }
  }
`

export const GET_HOTEL = gql`
  query GetHotel($id: ID!) {
    hotel(id: $id) {
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
      amenities {
        name
        description
        included
        category
      }
      services {
        name
        description
        price
        category
        available
      }
      policies {
        title
        description
        category
      }
      rating {
        average
        count
      }
      images
      isActive
      createdAt
      updatedAt
    }
  }
`

export const GET_MY_HOTEL = gql`
  query GetMyHotel {
    myHotel {
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
      isActive
    }
  }
`

// Restaurant Queries
export const GET_RESTAURANTS = gql`
  query GetRestaurants {
    restaurants {
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
      rating {
        average
        count
      }
      images {
        url
        caption
        isMain
      }
      isActive
    }
  }
`

export const GET_RESTAURANT = gql`
  query GetRestaurant($id: ID!) {
    restaurant(id: $id) {
      id
      name
      description
      owner {
        id
        fullName
        email
      }
      address {
        street
        city
        state
        zipCode
        country
        coordinates {
          latitude
          longitude
        }
      }
      contact {
        phone
        email
        website
        socialMedia {
          facebook
          instagram
          twitter
        }
      }
      businessHours {
        day
        open
        close
        isClosed
      }
      cuisine
      features {
        name
        description
        icon
        isActive
      }
      policies {
        reservationPolicy
        cancellationPolicy
        dressCode
        ageRestriction
      }
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
      rating {
        average
        count
      }
      images {
        url
        caption
        isMain
      }
      settings {
        acceptOnlineReservations
        requireApproval
        advanceReservationDays
        minimumPartySize
        maximumPartySize
      }
      tables {
        id
        number
        capacity
        location
        availability {
          isAvailable
        }
      }
      menuItems {
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
      }
      isActive
      createdAt
      updatedAt
    }
  }
`

export const GET_MY_RESTAURANT = gql`
  query GetMyRestaurant {
    myRestaurant {
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
      rating {
        average
        count
      }
      settings {
        acceptOnlineReservations
        requireApproval
        advanceReservationDays
        minimumPartySize
        maximumPartySize
      }
      isActive
    }
  }
`

// Salon Queries
export const GET_SALONS = gql`
  query GetSalons {
    salons {
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
      specialties
      priceRange {
        min
        max
        currency
      }
      rating {
        average
        count
      }
      images {
        url
        caption
        isMain
      }
      isActive
    }
  }
`

export const GET_SALON = gql`
  query GetSalon($id: ID!) {
    salon(id: $id) {
      id
      name
      description
      owner {
        id
        fullName
        email
      }
      address {
        street
        city
        state
        zipCode
        country
        coordinates {
          latitude
          longitude
        }
      }
      contact {
        phone
        email
        website
        socialMedia {
          facebook
          instagram
          twitter
        }
      }
      businessHours {
        day
        open
        close
        isClosed
      }
      specialties
      amenities {
        name
        description
        icon
        isActive
      }
      policies {
        appointmentPolicy
        cancellationPolicy
        latePolicy
        paymentPolicy
      }
      priceRange {
        min
        max
        currency
      }
      rating {
        average
        count
      }
      images {
        url
        caption
        isMain
      }
      settings {
        acceptOnlineBookings
        requireApproval
        advanceBookingDays
        bufferTime
        allowWalkIns
      }
      services {
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
      }
      staff {
        id
        user {
          fullName
        }
        position
        specializations
      }
      isActive
      createdAt
      updatedAt
    }
  }
`

export const GET_MY_SALON = gql`
  query GetMySalon {
    mySalon {
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
      rating {
        average
        count
      }
      settings {
        acceptOnlineBookings
        requireApproval
        advanceBookingDays
        bufferTime
        allowWalkIns
      }
      isActive
    }
  }
`

// Room Queries
export const GET_ROOMS = gql`
  query GetRooms($hotelId: ID!) {
    rooms(hotelId: $hotelId) {
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

export const GET_ROOM = gql`
  query GetRoom($id: ID!) {
    room(id: $id) {
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

// Table Queries
export const GET_TABLES = gql`
  query GetTables($restaurantId: ID!) {
    tables(restaurantId: $restaurantId) {
      id
      number
      capacity
      location
      shape
      features {
        name
        description
        icon
      }
      position {
        x
        y
        zone
      }
      availability {
        isAvailable
        maintenanceMode
        unavailableSlots {
          date
          startTime
          endTime
          reason
        }
      }
      pricing {
        minimumSpend
        reservationFee
        currency
      }
      preferences {
        isQuiet
        hasView
        isAccessible
        allowsSmoking
      }
      isActive
    }
  }
`

// Service Queries
export const GET_SERVICES = gql`
  query GetServices($salonId: ID!) {
    services(salonId: $salonId) {
      id
      name
      description
      category
      subcategory
      duration
      pricing {
        basePrice
        currency
        priceVariations {
          name
          price
          description
        }
      }
      staff {
        id
        user {
          fullName
        }
        position
      }
      requirements {
        preparation
        aftercare
        restrictions
      }
      images {
        url
        caption
        isMain
      }
      availability {
        isAvailable
        seasonalAvailability {
          startDate
          endDate
          isAvailable
          reason
        }
      }
      popularity {
        bookingCount
        rating
        reviewCount
      }
      isActive
    }
  }
`

// Staff Queries
export const GET_STAFF = gql`
  query GetStaff($businessId: ID!, $businessType: String!) {
    staff(businessId: $businessId, businessType: $businessType) {
      id
      user {
        id
        fullName
        email
        phone
      }
      position
      department
      specializations
      schedule {
        workDays {
          day
          startTime
          endTime
          isWorking
        }
        timeOff {
          startDate
          endDate
          reason
          isApproved
        }
      }
      permissions {
        canManageReservations
        canManageInventory
        canViewReports
        canManageStaff
        customPermissions
      }
      performance {
        rating
        reviewCount
        completedServices
      }
      employment {
        hireDate
        employmentType
        salary {
          amount
          currency
          payPeriod
        }
      }
      isActive
      createdAt
    }
  }
`

// Menu Item Queries
export const GET_MENU_ITEMS = gql`
  query GetMenuItems($restaurantId: ID!) {
    menuItems(restaurantId: $restaurantId) {
      id
      name
      description
      category
      subcategory
      pricing {
        price
        currency
        sizes {
          name
          price
          description
        }
      }
      ingredients {
        name
        isAllergen
        isOptional
      }
      dietary {
        isVegetarian
        isVegan
        isGlutenFree
        isDairyFree
        isNutFree
        isSpicy
        spiceLevel
      }
      nutrition {
        calories
        protein
        carbs
        fat
        fiber
        sodium
      }
      availability {
        isAvailable
        availableDays
        availableHours {
          start
          end
        }
      }
      images {
        url
        caption
        isMain
      }
      popularity {
        orderCount
        rating
        reviewCount
      }
      preparation {
        cookTime
        difficulty
        instructions
      }
      isActive
      isFeatured
    }
  }
`

// Reservation Queries
export const GET_RESERVATIONS = gql`
  query GetReservations($businessId: ID!, $businessType: String!) {
    reservations(businessId: $businessId, businessType: $businessType) {
      id
      confirmationNumber
      customerInfo {
        name
        email
        phone
        specialRequests
        preferences {
          dietary
          accessibility
          other
        }
      }
      
      # Hotel fields
      roomId
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
      tableId
      table {
        number
        capacity
      }
      partySize
      reservationTime
      
      # Salon fields
      serviceId
      service {
        name
        duration
      }
      staffId
      staff {
        user {
          fullName
        }
        position
      }
      appointmentTime
      duration
      
      # Common fields
      date
      status
      pricing {
        baseAmount
        taxes
        fees
        discounts
        totalAmount
        currency
      }
      paymentStatus
      paymentMethod
      notes {
        internal
        customer
      }
      history {
        action
        timestamp
        user {
          fullName
        }
        details
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_RESERVATION = gql`
  query GetReservation($id: ID!) {
    reservation(id: $id) {
      id
      confirmationNumber
      businessId
      businessType
      customerInfo {
        name
        email
        phone
        specialRequests
        preferences {
          dietary
          accessibility
          other
        }
      }
      
      # Hotel fields
      roomId
      room {
        id
        number
        type
        hotel {
          name
        }
      }
      checkIn
      checkOut
      guests {
        adults
        children
        total
      }
      
      # Restaurant fields
      tableId
      table {
        id
        number
        capacity
        restaurant {
          name
        }
      }
      partySize
      reservationTime
      
      # Salon fields
      serviceId
      service {
        id
        name
        duration
        salon {
          name
        }
      }
      staffId
      staff {
        id
        user {
          fullName
        }
        position
      }
      appointmentTime
      duration
      
      # Common fields
      date
      status
      pricing {
        baseAmount
        taxes
        fees
        discounts
        totalAmount
        currency
      }
      paymentStatus
      paymentMethod
      notes {
        internal
        customer
      }
      history {
        action
        timestamp
        user {
          fullName
        }
        details
      }
      business {
        ... on Hotel {
          name
          contact {
            phone
            email
          }
        }
        ... on Restaurant {
          name
          contact {
            phone
            email
          }
        }
        ... on Salon {
          name
          contact {
            phone
            email
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_MY_RESERVATIONS = gql`
  query GetMyReservations {
    myReservations {
      id
      confirmationNumber
      businessType
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
      
      # Restaurant fields
      table {
        number
      }
      partySize
      reservationTime
      
      # Salon fields
      service {
        name
      }
      staff {
        user {
          fullName
        }
      }
      appointmentTime
      
      business {
        ... on Hotel {
          name
          address {
            city
            state
          }
        }
        ... on Restaurant {
          name
          address {
            city
            state
          }
        }
        ... on Salon {
          name
          address {
            city
            state
          }
        }
      }
      createdAt
    }
  }
`

// Guest Queries
export const GET_GUESTS = gql`
  query GetGuests($businessId: ID!, $businessType: String!) {
    guests(businessId: $businessId, businessType: $businessType) {
      id
      personalInfo {
        firstName
        lastName
        email
        phone
        dateOfBirth
        gender
        nationality
      }
      address {
        street
        city
        state
        zipCode
        country
      }
      preferences {
        roomType
        bedType
        floorPreference
        smokingPreference
        seatingPreference
        dietaryRestrictions
        allergies
        servicePreferences
        communicationMethod
        language
        specialRequests
      }
      loyaltyProgram {
        memberId
        tier
        points
        joinDate
        isActive
      }
      visitHistory {
        totalVisits
        totalSpent
        currency
        lastVisit
        averageSpending
        favoriteServices
      }
      feedback {
        rating
        comment
        date
        response {
          message
          respondedBy {
            fullName
          }
          respondedAt
        }
      }
      status
      tags
      fullName
      isActive
      createdAt
      updatedAt
    }
  }
`
