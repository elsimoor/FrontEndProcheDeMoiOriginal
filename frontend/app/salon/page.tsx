"use client"

import Link from "next/link"
import { gql, useQuery } from "@apollo/client"
import { useState, useEffect, useMemo } from "react"
import useTranslation from "@/hooks/useTranslation"
import { useLanguage } from "@/context/LanguageContext"
import { useRouter } from "next/navigation"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"

const GET_SALONS = gql`
  query GetSalons {
    salons {
      id
      name
      description
      images
    }
  }
`

const GET_SERVICES = gql`
    query GetServices($businessId: ID!, $businessType: String!) {
        services(businessId: $businessId, businessType: $businessType) {
            id
            name
            description
            price
            duration
            category
            images
        }
    }
`

/**
 * Landing page for the salon service.  Presents a luxurious hero
 * section and showcases top salon services with a consistent pink
 * colour scheme.  Visitors are encouraged to book appointments or
 * browse services.
 */
export default function SalonLanding() {
  const { data: salonsData, loading: salonsLoading, error: salonsError } = useQuery(GET_SALONS)

  const salons = salonsData?.salons || []
  const salon = salons[0] || {}

  // Router instance to programmatically navigate.  This allows us
  // to redirect to the booking page with a preselected service.
  const router = useRouter()

  const { data: servicesData, loading: servicesLoading, error: servicesError } = useQuery(GET_SERVICES, {
    variables: { businessId: salon.id, businessType: "salon" },
    skip: !salon.id,
  })

  const services = servicesData?.services || []

  // Category filtering for services.  Collect all unique categories and
  // allow the user to filter services by category.  A "Tous" (all)
  // category is provided to reset the filter.  Categories default to
  // "Autres" when none is defined on a service.

  const [selectedCategory, setSelectedCategory] = useState<string>("Tous")
  const filteredServices = useMemo(() => {
    if (selectedCategory === "Tous") return services
    return services.filter((s: any) => (s.category || "Autres") === selectedCategory)
  }, [services, selectedCategory])

  
  const categories = useMemo(() => {
    const set = new Set<string>()
    services.forEach((s: any) => {
      set.add(s.category || "Autres")
    })
    return ["Tous", ...Array.from(set)]
  }, [services])

  if (salonsLoading || servicesLoading) return <p>Loading...</p>
  if (salonsError || servicesError) return <p>Error :(</p>

  // Translation and language for this page
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl text-pink-600">{salon.name || "Salon Zenith"}</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
            <Link href="/salon" className="hover:text-pink-600">{t("home")}</Link>
            <Link href="/salon/services" className="hover:text-pink-600">{t("services")}</Link>
            <Link href="/salon/about" className="hover:text-pink-600">{t("aboutUs")}</Link>
            <Link href="/salon/contact" className="hover:text-pink-600">{t("contact")}</Link>
          </nav>
          <div className="flex items-center space-x-4">
            {/* Language selector on salon landing page */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLocale("en")}
                className={`text-sm font-medium ${
                  locale === "en" ? "font-semibold text-pink-600" : "text-gray-700"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("fr")}
                className={`text-sm font-medium ${
                  locale === "fr" ? "font-semibold text-pink-600" : "text-gray-700"
                }`}
              >
                FR
              </button>
            </div>
            <Link
              href="/salon/booking"
              className="hidden md:inline-block bg-pink-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-pink-700 transition-colors"
            >
              {t("bookNow")}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </header>
      {/* Hero */}
      <main className="flex-1">
        <div
          className="relative bg-cover bg-center h-[70vh]"
          style={{ backgroundImage: `url('${salon.images?.[0] || 'https://images.unsplash.com/photo-1583267743713-0f36bcbc89e4'}')` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="max-w-3xl mx-auto px-4 py-24 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {salon.name || t("salonHeroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-gray-100 mb-8">
              {salon.description || t("salonHeroDescription")}
            </p>
            <Link
              href="/salon/booking"
              className="inline-block bg-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-pink-700 transition-transform transform hover:scale-105"
            >
              {t("bookNow")}
            </Link>
          </div>
        </div>
        {/* Services */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">{t("ourServices")}</h2>
          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {categories.map((cat) => {
              // Translate "Tous" and "Autres" categories, otherwise show the category name as is
              let displayCat: string
              if (cat === "Tous") {
                displayCat = t("all")
              } else if (cat === "Autres") {
                displayCat = t("others")
              } else {
                displayCat = cat
              }
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border
                ${selectedCategory === cat ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                >
                  {displayCat}
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service: any) => (
              <div
                key={service.id}
                onClick={() => router.push(`/salon/booking?serviceId=${service.id}`)}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
              >
                {service.images && service.images.length > 0 ? (
                  <div className="relative">
                    {/* Carousel for service images */}
                    <Carousel className="w-full">
                      <CarouselContent>
                        {service.images.map((img: string, index: number) => (
                          <CarouselItem key={index}>
                            <img
                              src={img}
                              alt={service.name}
                              className="h-48 w-full object-cover"
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {/* Show navigation controls only if multiple images */}
                      {service.images.length > 1 && (
                        <>
                          <CarouselPrevious />
                          <CarouselNext />
                        </>
                      )}
                    </Carousel>
                  </div>
                ) : (
                  <div className="h-48 bg-pink-100 flex items-center justify-center text-pink-500 text-4xl font-bold">
                    {service.name.charAt(0)}
                  </div>
                )}
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-600 h-16 overflow-hidden leading-relaxed">{service.description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-lg font-bold text-pink-600">{service.price}€</span>
                    {/* The reserve button is purely decorative; clicking anywhere on the card will navigate */}
                    <span className="inline-block bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Réserver
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Stylists */}
        <section className="bg-pink-50 py-16">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-10">{t("ourExpertStylists")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61" alt="Stylist 1" className="w-32 h-32 rounded-full mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Jessica</h3>
                        <p className="text-gray-600">Spécialiste couleur</p>
                    </div>
                    <div className="text-center">
                        <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e" alt="Stylist 2" className="w-32 h-32 rounded-full mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Marc</h3>
                        <p className="text-gray-600">Expert en coupe</p>
                    </div>
                    <div className="text-center">
                        <img src="https://images.unsplash.com/photo-1521119989659-a83eee488004" alt="Stylist 3" className="w-32 h-32 rounded-full mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Sophie</h3>
                        <p className="text-gray-600">Maître styliste</p>
                    </div>
                </div>
            </div>
        </section>
        {/* Testimonials */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-10 text-center">{t("whatClientsSay")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-gray-600 mb-4">"Une expérience incroyable ! Je suis tellement contente de ma nouvelle coupe."</p>
              <p className="font-bold text-gray-900">- Chloé</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-gray-600 mb-4">"Le meilleur salon de la ville. Le personnel est sympathique et professionnel."</p>
              <p className="font-bold text-gray-900">- Isabelle</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-gray-600 mb-4">"Je me sens comme une nouvelle femme ! Merci Salon Zenith."</p>
              <p className="font-bold text-gray-900">- Amélie</p>
            </div>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Salon Zenith. Tous droits réservés.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link href="#" className="hover:text-pink-400">{t("privacyPolicy")}</Link>
            <Link href="#" className="hover:text-pink-400">{t("termsOfUse")}</Link>
            <Link href="#" className="hover:text-pink-400">{t("contactUs")}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}