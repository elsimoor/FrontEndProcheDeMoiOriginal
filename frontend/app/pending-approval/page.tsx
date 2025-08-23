// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { gql, useLazyQuery } from "@apollo/client";

// /**
//  * The pending approval page is displayed after a new user registers
//  * their business.  It checks whether the associated business has
//  * been approved (isActive).  If approved, the user is redirected
//  * automatically to their dashboard.  Otherwise, a message is shown
//  * instructing them to wait.  A map of Marseille and contact details
//  * are included so the user can reach out if necessary.
//  */
// const GET_HOTEL_STATUS = gql`
//   query GetHotelStatus($id: ID!) {
//     hotel(id: $id) {
//       id
//       isActive
//     }
//   }
// `;

// const GET_RESTAURANT_STATUS = gql`
//   query GetRestaurantStatus($id: ID!) {
//     restaurant(id: $id) {
//       id
//       isActive
//     }
//   }
// `;

// const GET_SALON_STATUS = gql`
//   query GetSalonStatus($id: ID!) {
//     salon(id: $id) {
//       id
//       isActive
//     }
//   }
// `;

// export default function PendingApprovalPage() {
//   const router = useRouter();
//   const [businessType, setBusinessType] = useState<string | null>(null);
//   const [businessId, setBusinessId] = useState<string | null>(null);
//   const [checked, setChecked] = useState<boolean>(false);

//   // Lazy queries for each business type.  They will be executed
//   // manually once we know the businessType and businessId.
//   const [fetchHotelStatus, { data: hotelData }] = useLazyQuery(GET_HOTEL_STATUS);
//   const [fetchRestaurantStatus, { data: restaurantData }] = useLazyQuery(GET_RESTAURANT_STATUS);
//   const [fetchSalonStatus, { data: salonData }] = useLazyQuery(GET_SALON_STATUS);

//   useEffect(() => {
//     // Fetch the current session to determine the user's business
//     // association.  This endpoint returns the user object with
//     // businessType and businessId if logged in.  If there is no
//     // logged‑in user we redirect to the login page.
//     const checkSession = async () => {
//       try {
//         const res = await fetch("/api/session");
//         const json = await res.json();
//         const user = json?.user;
//         if (!user) {
//           router.push("/login");
//           return;
//         }
//         if (!user.businessType || !user.businessId) {
//           // If the user is not associated with a business yet redirect to home
//           router.push("/");
//           return;
//         }
//         setBusinessType(user.businessType);
//         setBusinessId(user.businessId);
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     checkSession();
//   }, [router]);

//   // Once we have the business type and id, execute the appropriate
//   // GraphQL query to check the approval status.  If the business is
//   // active we redirect to the correct dashboard.  Otherwise we stay
//   // on this page.  We set `checked` so that the UI knows the
//   // approval check has completed.
//   useEffect(() => {
//     if (!businessType || !businessId) return;
//     const fetchStatus = async () => {
//       try {
//         if (businessType === "hotel") {
//           await fetchHotelStatus({ variables: { id: businessId } });
//         } else if (businessType === "restaurant") {
//           await fetchRestaurantStatus({ variables: { id: businessId } });
//         } else if (businessType === "salon") {
//           await fetchSalonStatus({ variables: { id: businessId } });
//         }
//       } catch (err) {
//         console.error(err);
//       }
//       setChecked(true);
//     };
//     fetchStatus();
//   }, [businessType, businessId, fetchHotelStatus, fetchRestaurantStatus, fetchSalonStatus]);

//   // When the data for any business type arrives, determine if
//   // approved and redirect accordingly.
//   useEffect(() => {
//     const handleRedirect = () => {
//       if (hotelData?.hotel?.isActive) {
//         router.push("/hotel/dashboard");
//       } else if (restaurantData?.restaurant?.isActive) {
//         router.push("/restaurant/dashboard");
//       } else if (salonData?.salon?.isActive) {
//         router.push("/salon/dashboard");
//       }
//     };
//     handleRedirect();
//   }, [hotelData, restaurantData, salonData, router]);

//   // While we are fetching data show a simple loading state.
//   if (!checked) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
//         <p className="text-gray-600">Vérification du statut de votre établissement...</p>
//       </div>
//     );
//   }

//   // If not approved, display the waiting message with map and contact details.
//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8">
//       <h1 className="mb-4 text-3xl font-bold text-gray-900">Merci pour votre inscription !</h1>
//       <p className="mb-6 max-w-xl text-center text-gray-600">
//         Votre établissement est en cours de vérification par notre équipe. Une fois approuvé,
//         vous recevrez un email de confirmation et vous pourrez accéder à votre tableau de bord.
//       </p>
//       {/* Embedded map of Marseille.  We use an iframe to show an open
//           map centred on Marseille without requiring an API key. */}
//       <div className="w-full max-w-3xl aspect-video mb-6">
//         <iframe
//           title="Carte de Marseille"
//           src="https://maps.google.com/maps?q=Marseille%2C%20France&amp;z=12&amp;output=embed"
//           width="100%"
//           height="100%"
//           style={{ border: 0 }}
//           loading="lazy"
//         ></iframe>
//       </div>
//       {/* Contact section */}
//       <div className="text-center">
//         <h2 className="text-xl font-semibold mb-2 text-gray-900">Besoin d’aide ?</h2>
//         <p className="text-gray-600 mb-1">Contactez‑nous par email ou téléphone.</p>
//         <p className="text-gray-800 font-medium">Email : <a href="mailto:support@prochedemoi.fr" className="text-blue-600 hover:underline">support@prochedemoi.fr</a></p>
//         <p className="text-gray-800 font-medium">Téléphone : <a href="tel:+33123456789" className="text-blue-600 hover:underline">+33 1 23 45 67 89</a></p>
//       </div>
//       <Link href="/" className="mt-8 text-blue-600 hover:underline">
//         Retour à l’accueil
//       </Link>
//     </div>
//   );
// }



// test1





"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { gql, useLazyQuery } from "@apollo/client"
import { Clock, Mail, Phone, MapPin, CheckCircle, ArrowLeft } from "lucide-react"

/**
 * The pending approval page is displayed after a new user registers
 * their business.  It checks whether the associated business has
 * been approved (isActive).  If approved, the user is redirected
 * automatically to their dashboard.  Otherwise, a message is shown
 * instructing them to wait.  A map of Marseille and contact details
 * are included so the user can reach out if necessary.
 */
const GET_HOTEL_STATUS = gql`
  query GetHotelStatus($id: ID!) {
    hotel(id: $id) {
      id
      isActive
    }
  }
`

const GET_RESTAURANT_STATUS = gql`
  query GetRestaurantStatus($id: ID!) {
    restaurant(id: $id) {
      id
      isActive
    }
  }
`

const GET_SALON_STATUS = gql`
  query GetSalonStatus($id: ID!) {
    salon(id: $id) {
      id
      isActive
    }
  }
`

export default function PendingApprovalPage() {
  const router = useRouter()
  const [businessType, setBusinessType] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [checked, setChecked] = useState<boolean>(false)

  // Lazy queries for each business type.  They will be executed
  // manually once we know the businessType and businessId.
  const [fetchHotelStatus, { data: hotelData }] = useLazyQuery(GET_HOTEL_STATUS)
  const [fetchRestaurantStatus, { data: restaurantData }] = useLazyQuery(GET_RESTAURANT_STATUS)
  const [fetchSalonStatus, { data: salonData }] = useLazyQuery(GET_SALON_STATUS)

  useEffect(() => {
    // Fetch the current session to determine the user's business
    // association.  This endpoint returns the user object with
    // businessType and businessId if logged in.  If there is no
    // logged‑in user we redirect to the login page.
    const checkSession = async () => {
      try {
        const res = await fetch("/api/session")
        const json = await res.json()
        const user = json?.user
        if (!user) {
          router.push("/login")
          return
        }
        if (!user.businessType || !user.businessId) {
          // If the user is not associated with a business yet redirect to home
          router.push("/")
          return
        }
        setBusinessType(user.businessType)
        setBusinessId(user.businessId)
      } catch (err) {
        console.error(err)
      }
    }
    checkSession()
  }, [router])

  // Once we have the business type and id, execute the appropriate
  // GraphQL query to check the approval status.  If the business is
  // active we redirect to the correct dashboard.  Otherwise we stay
  // on this page.  We set `checked` so that the UI knows the
  // approval check has completed.
  useEffect(() => {
    if (!businessType || !businessId) return
    const fetchStatus = async () => {
      try {
        if (businessType === "hotel") {
          await fetchHotelStatus({ variables: { id: businessId } })
        } else if (businessType === "restaurant") {
          await fetchRestaurantStatus({ variables: { id: businessId } })
        } else if (businessType === "salon") {
          await fetchSalonStatus({ variables: { id: businessId } })
        }
      } catch (err) {
        console.error(err)
      }
      setChecked(true)
    }
    fetchStatus()
  }, [businessType, businessId, fetchHotelStatus, fetchRestaurantStatus, fetchSalonStatus])

  // Poll for approval status every few seconds.  If the business is
  // still pending we refetch its status from the server.  Once
  // approved the redirect effect below will navigate away and the
  // interval will be cleared automatically on unmount.
  useEffect(() => {
    if (!businessType || !businessId) return
    const interval = setInterval(() => {
      try {
        if (businessType === "hotel") {
          fetchHotelStatus({ variables: { id: businessId }, fetchPolicy: "network-only" })
        } else if (businessType === "restaurant") {
          fetchRestaurantStatus({ variables: { id: businessId }, fetchPolicy: "network-only" })
        } else if (businessType === "salon") {
          fetchSalonStatus({ variables: { id: businessId }, fetchPolicy: "network-only" })
        }
      } catch (err) {
        console.error(err)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [businessType, businessId, fetchHotelStatus, fetchRestaurantStatus, fetchSalonStatus])

  // When the data for any business type arrives, determine if
  // approved and redirect accordingly.
  useEffect(() => {
    const handleRedirect = () => {
      if (hotelData?.hotel?.isActive) {
        router.push("/hotel/dashboard")
      } else if (restaurantData?.restaurant?.isActive) {
        router.push("/restaurant/dashboard")
      } else if (salonData?.salon?.isActive) {
        router.push("/salon/dashboard")
      }
    }
    handleRedirect()
  }, [hotelData, restaurantData, salonData, router])

  // While we are fetching data show a beautiful loading state.
  if (!checked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vérification en cours</h2>
          <p className="text-gray-600">Vérification du statut de votre établissement...</p>
        </div>
      </div>
    )
  }

  // If not approved, display the waiting message with map and contact details.
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Merci pour votre inscription !</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Votre établissement est en cours de vérification par notre équipe. Une fois approuvé, vous recevrez un email
            de confirmation et vous pourrez accéder à votre tableau de bord.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-lg font-medium text-gray-900">En attente d'approbation</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Inscription</h3>
              <p className="text-sm text-gray-600">Complétée</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Vérification</h3>
              <p className="text-sm text-gray-600">En cours</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Activation</h3>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notre localisation</h2>
            </div>
            <p className="text-gray-600 mt-2">Marseille, France</p>
          </div>

          {/* Embedded map of Marseille.  We use an iframe to show an open
              map centred on Marseille without requiring an API key. */}
          <div className="aspect-video">
            <iframe
              title="Carte de Marseille"
              src="https://maps.google.com/maps?q=Marseille%2C%20France&amp;z=12&amp;output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              className="w-full h-full"
            ></iframe>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Besoin d'aide ?</h2>
            <p className="text-gray-600">Notre équipe est là pour vous accompagner</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <a href="mailto:support@prochedemoi.fr" className="text-blue-600 hover:text-blue-700 transition-colors">
                  support@prochedemoi.fr
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Téléphone</h3>
                <a href="tel:+33123456789" className="text-green-600 hover:text-green-700 transition-colors">
                  +33 1 23 45 67 89
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
