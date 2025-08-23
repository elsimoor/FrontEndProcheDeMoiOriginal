"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// import Image from "next/image";
// import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { DateRangePicker } from "../../../components/ui/DateRangePicker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

// Import translation and language hooks
import useTranslation from "@/hooks/useTranslation";
import { useLanguage } from "@/context/LanguageContext";

/*
 * Hotel reservation search page
 *
 * This page allows the user to pick a check‑in and check‑out date
 * as well as the number of adults and children before searching
 * for available rooms.  The UI loosely follows the provided
 * mockups with a large hero image and simple inputs.  Once the
 * search criteria are selected the data is persisted into
 * localStorage and the user is redirected to the rooms listing
 * page where they can choose a specific room type.
 */
export default function HotelSearchPage() {
  const router = useRouter();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // Translation and language context
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();

  // When the component mounts, attempt to prefill the form from
  // existing booking data if present.  This makes it easy to
  // navigate back and forth between steps without losing state.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("booking");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.checkIn && parsed.checkOut) {
            setDate({
              from: new Date(parsed.checkIn),
              to: new Date(parsed.checkOut),
            });
          }
          if (parsed.adults) setAdults(parsed.adults);
          if (parsed.children !== undefined) setChildren(parsed.children);
        } catch (e) {
          // ignore invalid storage
        }
      }
    }
  }, []);

  // Persist the current search data and navigate to the rooms list
  const handleSearch = () => {
    if (!date?.from || !date?.to) {
      alert(t("selectDatesAlert"));
      return;
    }
    const booking = {
      checkIn: date.from.toISOString().split("T")[0],
      checkOut: date.to.toISOString().split("T")[0],
      adults: adults,
      children: children,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("booking", JSON.stringify(booking));
    }
    const searchParams = new URLSearchParams({
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        adults: booking.adults.toString(),
        children: booking.children.toString(),
    });
    router.push(`/hotel/rooms?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-2xl text-white">StayEase</span>
        </div>
        {/* Navigation links with translations */}
        <nav className="hidden md:flex space-x-8 text-sm font-medium text-white">
          <a href="#" className="hover:text-gray-200 transition-colors">{t("explore")}</a>
          <a href="#" className="hover:text-gray-200 transition-colors">{t("wishlists")}</a>
          <a href="#" className="hover:text-gray-200 transition-colors">{t("trips")}</a>
          <a href="#" className="hover:text-gray-200 transition-colors">{t("messages")}</a>
        </nav>
        <div className="flex items-center space-x-4">
          {/* Language selector */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLocale("en")}
              className={`text-sm font-medium transition-colors hover:text-gray-200 ${
                locale === "en" ? "underline" : ""
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale("fr")}
              className={`text-sm font-medium transition-colors hover:text-gray-200 ${
                locale === "fr" ? "underline" : ""
              }`}
            >
              FR
            </button>
          </div>
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-full text-sm font-medium text-white bg-white/20 hover:bg-white/30 transition-colors"
          >
            {t("login")}
          </a>
        </div>
      </header>

      {/* Hero image */}
      <div className="relative w-full h-[500px] overflow-hidden">
        <img
          src="/searchHotelImage.png"
          alt="Hotel room"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <h1 className="text-white text-4xl md:text-6xl font-bold tracking-tight">
            {t("findYourPerfectStay")}
          </h1>
          <p className="text-white text-lg md:text-xl mt-4 max-w-2xl">
            {t("findStaySubtitle")}
          </p>
        </div>
      </div>

      {/* Search panel */}
      <div className="max-w-4xl mx-auto -mt-16 bg-white rounded-lg shadow-lg p-8 z-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("selectYourDates")}
            </label>
            <DateRangePicker date={date} onDateChange={setDate} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("adultsLabel")}</label>
              <div className="flex items-center justify-between border rounded-lg p-2">
                <button onClick={() => setAdults(a => Math.max(1, a - 1))} className="text-lg font-bold">-</button>
                <span>{adults}</span>
                <button onClick={() => setAdults(a => a + 1)} className="text-lg font-bold">+</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("childrenLabel")}</label>
              <div className="flex items-center justify-between border rounded-lg p-2">
                <button onClick={() => setChildren(c => Math.max(0, c - 1))} className="text-lg font-bold">-</button>
                <span>{children}</span>
                <button onClick={() => setChildren(c => c + 1)} className="text-lg font-bold">+</button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button
            type="button"
            onClick={handleSearch}
            className="w-full bg-blue-600 text-white rounded-lg py-3 text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {t("searchHotels")}
          </button>
        </div>
      </div>
      <footer className="w-full bg-gray-100 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} StayEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}