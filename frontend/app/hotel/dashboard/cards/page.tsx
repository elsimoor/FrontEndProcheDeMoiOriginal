"use client"

import { gql, useQuery, useMutation } from "@apollo/client";
// Helpers to format prices according to the hotel's selected currency
import { formatCurrency, currencySymbols } from "@/lib/currency";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Translation hooks for localisation
import useTranslation from "@/hooks/useTranslation";
import { useLanguage } from "@/context/LanguageContext";

// Query to fetch landing cards for the current hotel.  Filters by
// businessType and businessId so only cards belonging to this
// business are returned.
const GET_LANDING_CARDS = gql`
  query GetLandingCards($businessType: String, $businessId: ID) {
    landingCards(businessType: $businessType, businessId: $businessId) {
      id
      title
      description
      image
      price
      rating
      location
      tags
      amenities
      specialOffer
      isFeatured
    }
  }
`;

// Mutation to create a new landing card.
const CREATE_LANDING_CARD = gql`
  mutation CreateLandingCard($input: LandingCardInput!) {
    createLandingCard(input: $input) {
      id
    }
  }
`;

// Mutation to delete a landing card.
const DELETE_LANDING_CARD = gql`
  mutation DeleteLandingCard($id: ID!) {
    deleteLandingCard(id: $id)
  }
`;

// Mutation to set a landing card as the featured card for this business.  This
// will unset the isFeatured flag on all other cards belonging to the same
// business.  It accepts the card id along with the businessId and
// businessType.  Upon completion we refetch the list of cards to update
// the UI.
const SET_FEATURED_CARD = gql`
  mutation SetFeaturedLandingCard($id: ID!, $businessId: ID!, $businessType: String!) {
    setFeaturedLandingCard(id: $id, businessId: $businessId, businessType: $businessType) {
      id
      isFeatured
    }
  }
`;

// Query to fetch only the hotel's currency setting.  We use this to
// dynamically format prices on the landing cards page.  The hotel
// identifier is derived from the current session.
const GET_HOTEL_SETTINGS = gql`
  query GetHotelSettings($id: ID!) {
    hotel(id: $id) {
      settings {
        currency
      }
    }
  }
`;

export default function HotelLandingCardsPage() {
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    price: "",
    rating: "",
    location: "",
    tags: "",
    amenities: "",
    specialOffer: false,
  });

  // Fetch session to get the current user's businessId.
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        const json = await res.json();
        const user = json?.user;
        if (!user || !user.businessId || !user.businessType) {
          router.push("/login");
          return;
        }
        setBusinessId(user.businessId);
      } catch (err) {
        console.error(err);
      }
    }
    fetchSession();
  }, [router]);

  // Fetch landing cards for this hotel.  Skip query until we know the businessId.
  const { data, loading, error, refetch } = useQuery(GET_LANDING_CARDS, {
    variables: { businessType: "hotel", businessId },
    skip: !businessId,
  });

  // Fetch the hotel's currency settings so we can format prices
  const { data: settingsData } = useQuery(GET_HOTEL_SETTINGS, {
    variables: { id: businessId },
    skip: !businessId,
  });

  // Determine the currency and a human friendly symbol.  Default to USD
  // when the settings are unavailable.
  const currency: string = settingsData?.hotel?.settings?.currency || 'USD';
  const currencySymbol: string = currencySymbols[currency] ?? currency;

  // Translation hook and language context
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();

  const [createLandingCard, { loading: creating }] = useMutation(CREATE_LANDING_CARD, {
    onCompleted: () => {
      // Clear the form and refetch cards
      setFormData({
        title: "",
        description: "",
        image: "",
        price: "",
        rating: "",
        location: "",
        tags: "",
        amenities: "",
        specialOffer: false,
      });
      refetch();
    },
  });

  const [deleteLandingCard] = useMutation(DELETE_LANDING_CARD, {
    onCompleted: () => refetch(),
  });

  // Mutation hook to set a card as featured.  When completed, we refetch
  // the landing cards to reflect the new featured status.
  const [setFeaturedCard, { loading: settingFeatured }] = useMutation(SET_FEATURED_CARD, {
    onCompleted: () => refetch(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    // Convert comma‑separated tags/amenities to arrays
    const tagsArray = formData.tags
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const amenitiesArray = formData.amenities
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    await createLandingCard({
      variables: {
        input: {
          businessId,
          businessType: "hotel",
          title: formData.title,
          description: formData.description,
          image: formData.image || undefined,
          price: formData.price ? parseFloat(formData.price) : undefined,
          rating: formData.rating ? parseFloat(formData.rating) : undefined,
          location: formData.location || undefined,
          tags: tagsArray,
          amenities: amenitiesArray,
          specialOffer: formData.specialOffer,
        },
      },
    });
  };

  const handleDelete = async (id: string) => {
    await deleteLandingCard({ variables: { id } });
  };

  // Handler to set a particular card as featured.  Requires businessId to
  // be known.  If businessId is not yet available, this function is a no‑op.
  const handleSetFeatured = async (id: string) => {
    if (!businessId) return;
    await setFeaturedCard({ variables: { id, businessId, businessType: "hotel" } });
  };

  if (loading) return <p>{t("loading")}</p>;
  if (error) return <p>{t("errorOccurred")}</p>;
  const cards = data?.landingCards ?? [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t("landingCardsTitle")}</h1>
      {/* List of existing cards */}
      {cards.length === 0 ? (
        <p>{t("noLandingCards")}</p>
      ) : (
        <ul className="space-y-4">
          {cards.map((card: any) => (
            <li
              key={card.id}
              className={`border rounded-lg p-4 flex justify-between items-start ${card.isFeatured ? 'border-blue-500 bg-blue-50' : ''}`}
            >
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {card.title}
                  {card.isFeatured && (
                    <span className="text-xs font-medium text-blue-600 border border-blue-600 rounded-full px-2 py-0.5">
                      {t("featured")}
                    </span>
                  )}
                </h3>
                {card.description && <p className="text-sm text-gray-600 mt-1">{card.description}</p>}
                {card.location && (
                  <p className="text-sm text-gray-600 mt-1">
                    {t("location")} : {card.location}
                  </p>
                )}
                {card.price && (
                  <p className="text-sm text-gray-600 mt-1">
                    {t("price")} : {formatCurrency(card.price, currency)}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {!card.isFeatured && (
                  <button
                    onClick={() => handleSetFeatured(card.id)}
                    disabled={settingFeatured}
                    className="text-sm text-green-600 hover:text-green-800 disabled:opacity-50"
                  >
                    {settingFeatured ? t("setting") : t("select")}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(card.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  {t("delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* Form for creating a new card */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">{t("createNewLandingCard")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("titleLabel")}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("descriptionLabel")}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("imageUrl")}</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{`${t("price")} (${currencySymbol})`}</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("ratingLabel")}</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("location")}</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("tagsComma")}</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("amenitiesComma")}</label>
              <input
                type="text"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="specialOffer"
              checked={formData.specialOffer}
              onChange={(e) => setFormData({ ...formData, specialOffer: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="specialOffer" className="ml-2 block text-sm text-gray-700">
              {t("specialOffer")}
            </label>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? t("saving") : t("createCard")}
          </button>
        </form>
      </div>
    </div>
  );
}