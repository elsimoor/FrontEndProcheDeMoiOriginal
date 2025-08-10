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

export default function SiteNavbar() {
  const pathname = usePathname()
  const links = [
    { label: "Hotel", href: "/hotel" },
    { label: "Restaurant", href: "/u/accueil" },
    { label: "Salon", href: "/salon" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
    { label: "Contact", href: "/#contact" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-600 to-purple-600" aria-hidden />
          <span className="text-lg font-semibold tracking-tight text-gray-900">BusinessSuite</span>
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
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
              Start free trial
            </Button>
          </Link>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>BusinessSuite</SheetTitle>
                <SheetDescription>Navigate to a section</SheetDescription>
              </SheetHeader>
              <nav className="mt-6 grid gap-2">
                {links.map((l) => (
                  <SheetClose asChild key={l.href}>
                    <Link
                      href={l.href}
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="mt-4 h-px w-full bg-gray-200" />
                <div className="grid gap-2">
                  <SheetClose asChild>
                    <Link
                      href="/login"
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Sign in
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/register">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                        Start free trial
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" className="mt-2 w-full" aria-label="Close menu">
                    <X className="mr-2 h-4 w-4" />
                    Close
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
