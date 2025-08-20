"use client"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useLanguage } from "@/context/LanguageContext"
import { cn } from "@/lib/utils"

/**
 * LanguageSelector renders a small dropdown that lets the user switch
 * between supported locales.  It leverages the Radix `Select`
 * component provided by the project's UI library for consistent
 * styling and accessibility.  A colour accent can be supplied via
 * the `colorClass` prop to adapt the focus ring to the surrounding
 * dashboard (e.g. indigo for admin, blue for hotel, red for
 * restaurant, pink for salon).  If no accent is provided the ring
 * defaults to the theme's primary colour.
 */
export default function LanguageSelector({
  colorClass = "indigo",
  className,
}: {
  /** Tailwind colour name without the shade, e.g. "indigo" or "blue" */
  colorClass?: "indigo" | "blue" | "red" | "pink"
  /** Additional classes to apply to the trigger */
  className?: string
}) {
  const { locale, setLocale } = useLanguage()

  // Map of accent colours to focus ring and border classes.  We
  // enumerate these explicitly so Tailwind can pick up the class
  // names at build time.  Without enumerating them the classes would
  // be generated dynamically and purged by Tailwind.
  const accentClasses: Record<string, string> = {
    indigo: "focus:ring-indigo-500 focus:border-indigo-500",
    blue: "focus:ring-blue-500 focus:border-blue-500",
    red: "focus:ring-red-500 focus:border-red-500",
    pink: "focus:ring-pink-500 focus:border-pink-500",
  }

  const accent = accentClasses[colorClass] ?? accentClasses.indigo

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as any)}>
      <SelectTrigger
        className={cn(
          "h-8 w-28 text-sm", // shorter height and width to fit nav bars
          accent,
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="fr">Français</SelectItem>
      </SelectContent>
    </Select>
  )
}