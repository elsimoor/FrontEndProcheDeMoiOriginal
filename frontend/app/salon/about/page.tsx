"use client"

import React from "react";
import Link from "next/link";
import useTranslation from "@/hooks/useTranslation";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Simple placeholder for the Salon About page.  You can customise this
 * section with details about your salon, mission, team and story.  It is
 * linked from the navigation bar on the salon landing page.
 */
export default function SalonAboutPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">À propos de notre salon</h1>
        <p className="text-gray-700 leading-relaxed">
          Cette page est un modèle pour présenter votre salon, son histoire et son équipe.
          Vous pouvez personnaliser ce contenu en fonction de votre marque et de votre
          philosophie. Incluez des photos, des témoignages et tout autre contenu pertinent
          pour mieux raconter votre histoire.
        </p>
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