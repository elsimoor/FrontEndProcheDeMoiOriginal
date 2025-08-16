"use client"

import React from "react";
import Link from "next/link";
import useTranslation from "@/hooks/useTranslation";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Simple placeholder for the Salon Contact page.  Use this page to provide
 * your salon's contact information, address and a contact form if
 * necessary.  It is linked from the navigation bar on the salon landing page.
 */
export default function SalonContactPage() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl text-pink-600">{t("salon")}</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
            <Link href="/salon" className="hover:text-pink-600">{t("home")}</Link>
            <Link href="/salon/services" className="hover:text-pink-600">{t("services")}</Link>
            <Link href="/salon/about" className="hover:text-pink-600">{t("aboutUs")}</Link>
            <Link href="/salon/contact" className="hover:text-pink-600">{t("contact")}</Link>
          </nav>
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => setLocale("en")}
              className={`text-sm font-medium ${locale === "en" ? "font-semibold text-pink-600" : "text-gray-700"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale("fr")}
              className={`text-sm font-medium ${locale === "fr" ? "font-semibold text-pink-600" : "text-gray-700"}`}
            >
              FR
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 space-y-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Contactez‑nous</h1>
        <p className="text-gray-700 leading-relaxed mb-4">
          Nous serions ravis de vous entendre ! Utilisez les coordonnées ci‑dessous ou
          envoyez‑nous un message via le formulaire de contact.
        </p>
        <div className="space-y-2">
          <p className="text-gray-700"><strong>Adresse :</strong> Votre adresse de salon ici</p>
          <p className="text-gray-700"><strong>Téléphone :</strong> +212 6 12 34 56 78</p>
          <p className="text-gray-700"><strong>Email :</strong> contact@salon.com</p>
        </div>
      </main>
      <footer className="bg-gray-800 text-white py-10">
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