"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import useTranslation from "@/hooks/useTranslation"
import { useLanguage } from "@/context/LanguageContext"

export default function SiteNavbar() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()
  // Define navigation links with translation keys.  The hrefs
  // remain constant, but the labels will be translated at render
  // time via t().
  const links = [
    { key: "hotel", href: "/hotel" },
    { key: "restaurant", href: "/u/accueil" },
    { key: "salon", href: "/salon" },
    { key: "pricingPage", href: "/#pricing" },
    { key: "faq", href: "/#faq" },
    { key: "contactPage", href: "/#contact" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-600 to-purple-600" aria-hidden />
          <span className="text-lg font-semibold tracking-tight text-gray-900">{t("businessSuite")}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {links.map((l) => {
            const isActive =
              l.href !== "/#pricing" && l.href !== "/#faq" && l.href !== "/#contact" && pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-colors hover:text-gray-900 ${
                  isActive ? "text-gray-900" : "text-gray-600"
                }`}
              >
                {t(l.key)}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {/* Language selector buttons for desktop */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLocale("en")}
              className={`text-sm font-medium transition-colors hover:text-gray-900 ${
                locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale("fr")}
              className={`text-sm font-medium transition-colors hover:text-gray-900 ${
                locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"
              }`}
            >
              FR
            </button>
          </div>
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            {t("signIn")}
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
              {t("startFreeTrial")}
            </Button>
          </Link>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t("openMenu") ?? "Open menu"}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>{t("businessSuite")}</SheetTitle>
                <SheetDescription>{t("navigateToSection")}</SheetDescription>
              </SheetHeader>
              <nav className="mt-6 grid gap-2">
                {links.map((l) => (
                  <SheetClose asChild key={l.href}>
                    <Link
                      href={l.href}
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {t(l.key)}
                    </Link>
                  </SheetClose>
                ))}
                <div className="mt-4 h-px w-full bg-gray-200" />
                {/* Language selector for mobile */}
                <div className="flex items-center justify-start space-x-4 px-3 py-2">
                  <button
                    onClick={() => setLocale("en")}
                    className={`text-sm font-medium ${
                      locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLocale("fr")}
                    className={`text-sm font-medium ${
                      locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"
                    }`}
                  >
                    FR
                  </button>
                </div>
                <div className="grid gap-2">
                  <SheetClose asChild>
                    <Link
                      href="/login"
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {t("signIn")}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/register">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                        {t("startFreeTrial")}
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" className="mt-2 w-full" aria-label={t("close") ?? "Close menu"}>
                    <X className="mr-2 h-4 w-4" />
                    {t("close")}
                  </Button>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
