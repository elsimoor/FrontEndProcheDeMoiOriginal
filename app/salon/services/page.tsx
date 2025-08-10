"use client"

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { gql, useQuery } from "@apollo/client";

// Fetch salons to determine which salon to use.  We pick the first salon
// available for demonstration purposes.
const GET_SALONS = gql`
  query GetSalons {
    salons {
      id
      name
      description
      images
    }
  }
`;

// Fetch services for a given business.  We include fields needed for
// presentation on the services page.
const GET_SERVICES = gql`
  query GetServices($businessId: ID!, $businessType: String!) {
    services(businessId: $businessId, businessType: $businessType) {
      id
      name
      description
      price
      duration
      images
    }
  }
`;

/**
 * Page listing all services offered by the salon.  Each service card links
 * to the booking flow.  This page can be accessed via the navigation bar
 * under "Services".
 */
export default function SalonServicesPage() {
  const [salonId, setSalonId] = useState<string | null>(null);
  const { data: salonsData, loading: salonsLoading } = useQuery(GET_SALONS);
  useEffect(() => {
    if (!salonsLoading && salonsData?.salons && salonsData.salons.length > 0 && !salonId) {
      setSalonId(salonsData.salons[0].id);
    }
  }, [salonsLoading, salonsData, salonId]);

  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { businessId: salonId, businessType: "salon" },
    skip: !salonId,
  });

  const services = servicesData?.services ?? [];

  if (salonsLoading || !salonId) {
    return <p className="py-10 text-center text-gray-500">Chargement...</p>;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl text-pink-600">{salonsData.salons[0]?.name || "Salon"}</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
            <Link href="/salon" className="hover:text-pink-600">Accueil</Link>
            <Link href="/salon/services" className="hover:text-pink-600">Services</Link>
            <Link href="/salon/about" className="hover:text-pink-600">À propos de nous</Link>
            <Link href="/salon/contact" className="hover:text-pink-600">Contact</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link
              href="/salon/booking"
              className="hidden md:inline-block bg-pink-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-pink-700 transition-colors"
            >
              Réserver maintenant
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Nos Services</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service: any) => (
            <div key={service.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              {service.images && service.images.length > 0 ? (
                <img src={service.images[0]} alt={service.name} className="h-48 w-full object-cover" />
              ) : (
                <div className="h-48 bg-pink-100 flex items-center justify-center text-pink-500 text-4xl font-bold">
                  {service.name.charAt(0)}
                </div>
              )}
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-600 h-16 overflow-hidden">{service.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-pink-600 font-bold">{service.price}€</span>
                  <span className="text-sm text-gray-500">{service.duration || 0} min</span>
                </div>
                <Link
                  href="/salon/booking"
                  className="inline-block bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-700 transition-colors"
                >
                  Réserver
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <footer className="bg-gray-800 text-white py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Salon. Tous droits réservés.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link href="#" className="hover:text-pink-400">Politique de confidentialité</Link>
            <Link href="#" className="hover:text-pink-400">Conditions d’utilisation</Link>
            <Link href="#" className="hover:text-pink-400">Nous contacter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}