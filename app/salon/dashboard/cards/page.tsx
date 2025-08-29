"use client"

import { gql, useQuery, useMutation } from "@apollo/client";
// Helpers to format prices according to the salon's selected currency
import { formatCurrency, currencySymbols } from "@/lib/currency";
import useTranslation from "@/hooks/useTranslation";
import { useEffect, useState } from "react";
// Import the toast helper from our react‑toastify shim.  This exposes a global
// toast API similar to react‑toastify and ensures consistent styling across the app.
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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
    }
  }
`;
const CREATE_LANDING_CARD = gql`
  mutation CreateLandingCard($input: LandingCardInput!) {
    createLandingCard(input: $input) {
      id
    }
  }
`;
const DELETE_LANDING_CARD = gql`
  mutation DeleteLandingCard($id: ID!) {
    deleteLandingCard(id: $id)
  }
`;

// Query to fetch only the salon's currency setting.  We use this to
// dynamically format prices on the landing cards page.  The salon
// identifier is derived from the current session.
const GET_SALON_SETTINGS = gql`
  query GetSalonSettings($id: ID!) {
    salon(id: $id) {
      settings {
        currency
      }
    }
  }
`;

export default function SalonLandingCardsPage() {
  const { t } = useTranslation();
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
  const { data, loading, error, refetch } = useQuery(GET_LANDING_CARDS, {
    variables: { businessType: "salon", businessId },
    skip: !businessId,
  });

  // Fetch the salon's currency settings so we can format prices
  const { data: settingsData } = useQuery(GET_SALON_SETTINGS, {
    variables: { id: businessId },
    skip: !businessId,
  });

  // Determine the currency and a friendly symbol.  Default to USD if
  // settings are unavailable.
  const currency: string = settingsData?.salon?.settings?.currency || 'USD';
  const currencySymbol: string = currencySymbols[currency] ?? currency;
  const [createLandingCard, { loading: creating }] = useMutation(CREATE_LANDING_CARD, {
    // On successful creation, clear the form, refetch cards and display a success toast
    onCompleted: () => {
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
      // Show success notification.  If a translation key for card creation exists we
      // leverage it; otherwise fallback to a generic message.
      toast.success(t("cardCreatedSuccessfully") || "Landing card created successfully");
    },
    onError: () => {
      // Provide feedback on failure using an error toast
      toast.error(t("failedToCreateCard") || "Failed to create landing card");
    },
  });
  const [deleteLandingCard] = useMutation(DELETE_LANDING_CARD, {
    onCompleted: () => {
      refetch();
      toast.success(t("cardDeletedSuccessfully") || "Landing card deleted successfully");
    },
    onError: () => {
      toast.error(t("failedToDeleteCard") || "Failed to delete landing card");
    },
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    const tagsArray = formData.tags.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    const amenitiesArray = formData.amenities.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    await createLandingCard({
      variables: {
        input: {
          businessId,
          businessType: "salon",
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
  if (loading) return <p>{t('loadingCards')}</p>;
  if (error) return <p>{t('errorLoadingCards')}</p>;
  const cards = data?.landingCards ?? [];
  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('landingCardsTitle')}</h1>
      {cards.length === 0 ? (
        <p>{t('noLandingCards')}</p>
      ) : (
        <ul className="space-y-4">
          {cards.map((card: any) => (
            <li key={card.id} className="border rounded-lg p-4 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                {card.description && <p className="text-sm text-gray-600">{card.description}</p>}
                {card.location && <p className="text-sm text-gray-600">{t('location')}: {card.location}</p>}
                {card.price && (
                  <p className="text-sm text-gray-600">
                    {t('price')}: {formatCurrency(card.price, currency)}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(card.id)}
                className="text-sm text-pink-600 hover:text-pink-800"
              >
                {t('delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">{t('createNewLandingCard')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('titleLabel')}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('descriptionLabel')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('imageUrl')}</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('price')} ({currencySymbol})</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ratingLabel')}</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('location')}</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tagsComma')}</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('amenitiesComma')}</label>
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
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="specialOffer" className="ml-2 block text-sm text-gray-700">
              {t('specialOffer')}
            </label>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 disabled:opacity-50"
          >
            {creating ? t('saving') : t('createCard')}
          </button>
        </form>
      </div>
    </div>
  );
}