"use client"

import { gql, useQuery, useMutation } from "@apollo/client";
// Helpers to format prices according to the restaurant's selected currency
import { formatCurrency, currencySymbols } from "@/lib/currency";
import { useEffect, useState } from "react";
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

// Query to fetch only the restaurant's currency setting.  We use this
// to dynamically format prices on the landing cards page.  The
// restaurant identifier is derived from the current session.
const GET_RESTAURANT_SETTINGS = gql`
  query GetRestaurantSettings($id: ID!) {
    restaurant(id: $id) {
      settings {
        currency
      }
    }
  }
`;

export default function RestaurantLandingCardsPage() {
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
    variables: { businessType: "restaurant", businessId },
    skip: !businessId,
  });

  // Fetch the restaurant's currency settings so we can format prices
  const { data: settingsData } = useQuery(GET_RESTAURANT_SETTINGS, {
    variables: { id: businessId },
    skip: !businessId,
  });

  // Determine the currency and a friendly symbol.  Default to MAD (Dirham)
  // if settings are unavailable, ensuring card prices display in the
  // local currency by default.
  const currency: string = settingsData?.restaurant?.settings?.currency || 'MAD';
  const currencySymbol: string = currencySymbols[currency] ?? currency;
  const [createLandingCard, { loading: creating }] = useMutation(CREATE_LANDING_CARD, {
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
    },
  });
  const [deleteLandingCard] = useMutation(DELETE_LANDING_CARD, {
    onCompleted: () => refetch(),
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
          businessType: "restaurant",
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
  if (loading) return <p>Loading landing cards…</p>;
  if (error) return <p>Error loading cards.</p>;
  const cards = data?.landingCards ?? [];
  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Landing Cards</h1>
      {cards.length === 0 ? (
        <p>No landing cards yet. Create one below.</p>
      ) : (
        <ul className="space-y-4">
          {cards.map((card: any) => (
            <li key={card.id} className="border rounded-lg p-4 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                {card.description && <p className="text-sm text-gray-600">{card.description}</p>}
                {card.location && <p className="text-sm text-gray-600">Location: {card.location}</p>}
                {card.price && (
                  <p className="text-sm text-gray-600">
                    Price: {formatCurrency(card.price, currency)}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(card.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Create a new landing card</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ({currencySymbol})</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0–5)</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma separated)</label>
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
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="specialOffer" className="ml-2 block text-sm text-gray-700">
              Special offer
            </label>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {creating ? "Saving..." : "Create Card"}
          </button>
        </form>
      </div>
    </div>
  );
}