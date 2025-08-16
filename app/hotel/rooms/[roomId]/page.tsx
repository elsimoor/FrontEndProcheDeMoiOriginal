"use client";

import { useRouter } from "next/navigation";
import { gql, useQuery } from "@apollo/client";
import { getBooking, updateBooking } from "../../../../lib/booking";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Wifi, Tv, Utensils, ParkingSquare, Wine, Star, Martini } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

// Currency helper to format amounts according to the hotel's selected currency
import { formatCurrency } from "@/lib/currency";
// Translation hooks
import useTranslation from "@/hooks/useTranslation"
import { useLanguage } from "@/context/LanguageContext"


/*
 * Room detail page
 *
 * Displays detailed information about the selected room along with
 * available add‑on options (breakfast, parking and champagne).  The
 * user can review the room images, description and amenities and
 * choose extras which will adjust the price summary.  When the
 * booking is added to the cart the selection is persisted and
 * the user is taken to the checkout page.
 */

// Query a single room by id
const GET_ROOM = gql`
  query GetRoom($id: ID!) {
    room(id: $id) {
      id
      type
      price
      images
      description
      hotelId {
        name
        settings {
          currency
        }
        amenities {
          name
          description
          included
          category
          price
        }
      }
      # Paid options available for this room.  Each option includes name,
      # optional description, category and price.  Used to display
      # add‑on selections on the booking page.
      paidOptions {
        name
        description
        category
        price
      }
      # View options available for this room.  Each view has a name,
      # optional description and price.  Used to allow the guest to
      # choose their desired view during booking.
      viewOptions {
        name
        description
        category
        price
      }
    }
  }
`;

interface Amenity {
  name: string;
  description: string;
  included: boolean;
  category: string;
  price: number;
}

interface Extras {
  [key: string]: boolean;
}

// Represents a paid room option.  Each option may include an optional
// description, category and price.  The price field is optional
// because some view options or promotions may be free of charge.
interface PaidOption {
  name: string;
  description?: string;
  category?: string;
  price?: number;
}

// Helper to map amenity names to icons
const amenityIcons: { [key: string]: React.ElementType } = {
  "Wifi": Wifi,
  "TV": Tv,
  "Kitchen": Utensils,
  "Parking": ParkingSquare,
  "Champagne": Wine,
  "Breakfast": Martini,
  "default": Star,
};


export default function RoomDetailPage({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const roomId = params.roomId;

  // Load existing booking; if missing necessary details redirect
  const booking = typeof window !== "undefined" ? getBooking() : {};
  useEffect(() => {
    if (!booking.checkIn || !booking.checkOut) {
      router.replace("/hotel/search");
    }
    // ensure roomId persists on reload
    updateBooking({ roomId });
  }, [booking, router, roomId]);

  const { data, loading, error } = useQuery(GET_ROOM, {
    variables: { id: roomId },
  });

  // Determine number of nights from booking
  const nights = useMemo(() => {
    if (!booking.checkIn || !booking.checkOut) return 0;
    const inDate = new Date(booking.checkIn);
    const outDate = new Date(booking.checkOut);
    const diff = outDate.getTime() - inDate.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [booking.checkIn, booking.checkOut]);

  // Manage extras state
  const [extras, setExtras] = useState<Extras>({});

  // Manage paid room options state.  Each property corresponds to an
  // option name and indicates whether it is selected.  Using a separate
  // state prevents collisions with amenity names.
  const [selectedPaidOptions, setSelectedPaidOptions] = useState<{ [key: string]: boolean }>({});

  const room = data?.room;
  const amenities = room?.hotelId?.amenities || [];

  // The currency used by this hotel.  If the hotel's settings do not define
  // a currency we default to USD.  This value is used when formatting
  // prices throughout the room details and price summary.
  const currency: string = room?.hotelId?.settings?.currency || "USD";

  // Extract paid and view options from the room.  These arrays are
  // undefined if the query has not yet resolved.  When undefined we
  // treat them as empty arrays to simplify mapping logic.
  const paidOptions: PaidOption[] = room?.paidOptions || [];
  const viewOptions = room?.viewOptions || [];

  // When extras change, recompute total cost and persist extras to booking
  const extrasCost = useMemo(() => {
    return amenities?.reduce((total: number, amenity: Amenity) => {
      if (extras[amenity.name]) {
        return total + amenity.price;
      }
      return total;
    }, 0);
  }, [extras, amenities]);

  const basePrice = room ? room?.price * nights : 0;
  // Compute the total cost of selected paid options.  Sum the price of
  // each option that has been toggled on.  If no options are selected
  // or the price is undefined, the total is zero.
  const paidOptionsCost = useMemo(() => {
    return paidOptions?.reduce((sum: number, option: PaidOption) => {
      if (selectedPaidOptions[option.name]) {
        return sum + (option.price || 0);
      }
      return sum;
    }, 0);
  }, [selectedPaidOptions, paidOptions]);

  // Selected view state must be declared before any use of it
  const [selectedView, setSelectedView] = useState<string>("");

  // Compute the cost associated with the selected view.  If the view
  // has a price defined return it; otherwise return 0.
  const viewCost = useMemo(() => {
    if (!selectedView) return 0;
    const view = viewOptions?.find((v: any) => v.name === selectedView);
    return view && view.price ? view.price : 0;
  }, [selectedView, viewOptions]);

  const total = basePrice + extrasCost + paidOptionsCost + viewCost;

  const toggleExtra = (name: string) => {
    setExtras((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Toggle a paid option by name.  When checked we add the option to
  // selectedPaidOptions; when unchecked we remove it.  This state
  // tracks whether each paid option is selected.
  const togglePaidOption = (name: string) => {
    setSelectedPaidOptions((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // When the room data loads and no view has been selected, default to
  // the first available view option (if any).  Do not override once
  // the user has made a selection.
  useEffect(() => {
    if (!selectedView && viewOptions && viewOptions.length > 0) {
      setSelectedView(viewOptions[0].name);
    }
  }, [viewOptions, selectedView]);

  // Gallery state: whether the image viewer dialog is open and the
  // currently selected image index.  When an image in the collage is
  // clicked the gallery opens and displays that image.  We also store
  // the Embla carousel API to programmatically navigate to the
  // appropriate slide once the dialog opens.
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselApi, setCarouselApi] = useState<any>(null);

  // When the gallery opens and a carousel API is available, scroll to
  // the currently selected slide.  This effect runs whenever the
  // galleryOpen or currentSlide values change and ensures the correct
  // image is in view when the modal opens.
  useEffect(() => {
    if (galleryOpen && carouselApi) {
      try {
        carouselApi.scrollTo(currentSlide);
      } catch (err) {
        // ignore errors silently
      }
    }
  }, [galleryOpen, currentSlide, carouselApi]);

  const handleAddToCart = () => {
    const selectedAmenities = amenities?.filter((a: Amenity) => extras[a.name]);
    // Determine which paid options are selected.  We derive the list
    // of selected options from the state and include the full option
    // objects for accurate pricing when reviewing the cart.
    const selectedPaidList: PaidOption[] = paidOptions?.filter((opt: PaidOption) => selectedPaidOptions[opt.name]);
    // Persist selected extras, paid options, selected view and total price
    updateBooking({
      extras: selectedAmenities,
      paidOptions: selectedPaidList,
      view: selectedView,
      total,
    });
    router.push("/hotel/checkout");
  };


  // Grab translation and language context
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()

  return (
    <div className="bg-background font-sans ">
      {/* Header with navigation and language selector */}
      <header className="sticky top-0 bg-white z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-gray-900">
              {/* Brand name translation */}
              {t("stayEase")}
            </span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
            <a href="#" className="hover:text-blue-600 transition-colors">
              {t("explore")}
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              {t("wishlists")}
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              {t("trips")}
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              {t("messages")}
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            {/* Language selector */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLocale("en")}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("fr")}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"
                }`}
              >
                FR
              </button>
            </div>
            {/* Login link */}
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {t("signIn")}
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[1040px] mx-auto px-4 sm:px-16 lg:px-8 py-10">
        {loading && <p>{t("loadingRoom")}</p>}
        {error && <p className="text-red-600">{t("unableToLoadRoomDetails")}</p>}
        {room && (
          <div className="space-y-10">
            {/* Breadcrumb trail */}
            <section>
              <Breadcrumb className="text-sm text-gray-500">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/hotel/search">{t("stays")}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {/* Assuming Paris is the city, this could be dynamic */}
                    <BreadcrumbLink href="/hotel/search?city=Paris">Paris</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-gray-700 font-medium">{room.type}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </section>

            {/* Page heading */}
            <section>
              <h1 className="text-3xl lg:text-4xl font-bold font-serif mb-2">
                {t("charmingApartmentWith")} {room.type} {t("view")}
              </h1>
            </section>

            {/* Image collage */}
            <section className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[600px]">
              {room.images && room.images.length > 0 && (
                <>
                  {/* Primary image spans two columns and two rows */}
                  <div className="col-span-2 row-span-2 relative">
                    <img
                      src={room.images[0]}
                      alt={`${room.type} hero image`}
                      className="w-full h-full object-cover rounded-lg cursor-pointer"
                      onClick={() => {
                        setCurrentSlide(0);
                        setGalleryOpen(true);
                      }}
                    />
                  </div>
                  {room.images.slice(1, 5).map((img: string, idx: number) => {
                    const globalIdx = idx + 1;
                    const isLastDisplayed = idx === 3 && room.images.length > 5;
                    const extraCount = room.images.length - 5;
                    return (
                      <div key={idx} className="relative w-full h-full">
                        <img
                          src={img}
                          alt={`${room.type} image ${globalIdx + 1}`}
                          className="w-full h-full object-cover rounded-lg cursor-pointer"
                          onClick={() => {
                            setCurrentSlide(globalIdx);
                            setGalleryOpen(true);
                          }}
                        />
                        {isLastDisplayed && (
                          <div
                            className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg cursor-pointer"
                            onClick={() => {
                              setCurrentSlide(globalIdx);
                              setGalleryOpen(true);
                            }}
                          >
                            <span className="text-white text-2xl font-semibold">+{extraCount}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </section>

            {/* Image viewer dialog */}
            <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
              <DialogContent className="p-0 max-w-4xl w-full">
                {room.images && room.images.length > 0 && (
                  <Carousel opts={{ loop: true }} setApi={setCarouselApi} className="relative">
                    <CarouselContent>
                      {room.images.map((img: string, idx: number) => (
                        <CarouselItem key={idx} className="basis-full flex items-center justify-center bg-black">
                          <img
                            src={img}
                            alt={`Gallery image ${idx + 1}`}
                            className="max-h-[80vh] w-auto object-contain"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="text-white" />
                    <CarouselNext className="text-white" />
                  </Carousel>
                )}
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-12">
              <div className="space-y-10">
                {/* About this stay */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">About this stay</h2>
                  <p className="text-sm text-gray-700 max-w-[600px]">
                    {room.description || t("noDescriptionAvailable")}
                  </p>
                </section>

                {/* Paid room options */}
                {paidOptions && paidOptions.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4">{t("paidOptionsHeading")}</h2>
                    <div className="space-y-6">
                      {Object.entries(
                        paidOptions.reduce((acc: Record<string, PaidOption[]>, option: PaidOption) => {
                          const cat = option.category || "General";
                          (acc[cat] ??= []).push(option);
                          return acc;
                        }, {} as Record<string, PaidOption[]>)
                      ).map(([category, items]) => (
                        <div key={category}>
                          <h3 className="text-md font-medium text-gray-800 mb-3">{category}</h3>
                          <div className="space-y-4">
                            {items.map((option: PaidOption) => (
                              <div key={option.name} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`paid-${option.name}`}
                                    checked={!!selectedPaidOptions[option.name]}
                                    onCheckedChange={() => togglePaidOption(option.name)}
                                  />
                                  <label
                                    htmlFor={`paid-${option.name}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {option.name}
                                  </label>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {option.price !== undefined ? formatCurrency(option.price || 0, currency) : t("free")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* What this place offers */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">{t("whatThisPlaceOffers")}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                    {amenities
                      .filter((a: Amenity) => a.included)
                      .map((amenity: Amenity) => {
                        const Icon = amenityIcons[amenity.name] || amenityIcons.default;
                        return (
                          <div
                            key={amenity.name}
                            className="flex items-center space-x-3 rounded-full border border-gray-300 px-4 py-2"
                          >
                            <Icon className="h-4 w-4 text-gray-600" />
                            <span className="text-sm text-gray-800">{amenity.name}</span>
                          </div>
                        );
                      })}
                  </div>
                </section>

                {/* Select your view */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">{t("selectYourView")}</h2>
                  {viewOptions && viewOptions.length > 0 ? (
                    <ToggleGroup
                      type="single"
                      value={selectedView}
                      onValueChange={(value) => {
                        if (value) setSelectedView(value);
                      }}
                      className="justify-start flex-wrap"
                    >
                      {viewOptions.map((view: any) => (
                        <ToggleGroupItem
                          key={view.name}
                          value={view.name}
                          aria-label={`Select ${view.name}`}
                          className="data-[state=on]:bg-blue-600 data-[state=on]:text-white mr-2 mb-2"
                        >
                          {view.name}
                          {view.price !== undefined && (
                            <span className="ml-1 text-xs text-gray-200 md:text-gray-300">
                              {view.price > 0 ? ` (${formatCurrency(view.price, currency)})` : ` (${t("free")})`}
                            </span>
                          )}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  ) : (
                    <p className="text-sm text-gray-600">{t("noViewOptions")}</p>
                  )}
                </section>

                {/* Add-ons */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">{t("addOns")}</h2>
                  <div className="space-y-6">
                    {Object.entries(
                      amenities
                        .filter((a: Amenity) => !a.included)
                        .reduce((acc: Record<string, Amenity[]>, amenity: Amenity) => {
                          (acc[amenity.category] ??= []).push(amenity);
                          return acc;
                        }, {} as Record<string, Amenity[]>)
                    ).map(([category, items]) => (
                      <div key={category}>
                        <h3 className="text-md font-medium text-gray-800 mb-3">{category}</h3>
                        <div className="space-y-4">
                          {items.map((amenity: Amenity) => (
                            <div key={amenity.name} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={amenity.name}
                                  checked={!!extras[amenity.name]}
                                  onCheckedChange={() => toggleExtra(amenity.name)}
                                />
                                <label
                                  htmlFor={amenity.name}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {amenity.name}
                                </label>
                              </div>
                              <span className="text-sm text-gray-600">({formatCurrency(amenity.price, currency)})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-10 lg:mt-0 space-y-8">
                {/* Summary Cards */}
                {/* Summary Cards */}
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{t("yourStay")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("datesLabel")}</span>
                      <span className="font-medium">{`${booking.checkIn} → ${booking.checkOut}`}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("viewLabel")}</span>
                      <span className="font-medium">{selectedView}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("parking")}</span>
                      <span className="font-medium">{extras["Parking"] ? t("yes") : t("no")}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{t("priceSummary")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>
                        {`${nights} ${nights === 1 ? t("nightSingular") : t("nightsPlural")}`}
                      </span>
                      <span>{formatCurrency(basePrice, currency)}</span>
                    </div>
                    {amenities
                      .filter((a: Amenity) => extras[a.name])
                      .map((amenity: Amenity) => (
                        <div key={amenity.name} className="flex justify-between">
                          <span>{amenity.name}</span>
                          <span>{formatCurrency(amenity.price, currency)}</span>
                        </div>
                      ))}
                    {/* List selected paid room options with their prices */}
                    {paidOptions
                      .filter((opt: PaidOption) => selectedPaidOptions[opt.name])
                      .map((opt: PaidOption) => (
                        <div key={opt.name} className="flex justify-between">
                          <span>{opt.name}</span>
                          <span>{formatCurrency(opt.price || 0, currency)}</span>
                        </div>
                      ))}
                    {/* Add view cost if the selected view has a price */}
                    {viewCost > 0 && (
                      <div className="flex justify-between">
                        <span>{selectedView}</span>
                        <span>{formatCurrency(viewCost, currency)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>{t("totalPrice")}</span>
                      <span>{formatCurrency(total, currency)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Add to cart Button */}
            <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-sm border-t md:hidden">
              <Button size="lg" className="w-full" onClick={handleAddToCart}>
                {t("addToCart")}
              </Button>
            </div>
            <div className="hidden md:block fixed bottom-8 right-8">
              <Button size="lg" className="rounded-full px-8 shadow-lg" onClick={handleAddToCart}>
                {t("addToCart")}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}