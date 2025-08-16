"use client";

import { useState, useEffect } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { DateRangePicker } from "../../../../components/ui/DateRangePicker";
import useTranslation from "@/hooks/useTranslation";
import { DateRange } from "react-day-picker";

// GraphQL queries
const GET_HOTEL_OPENING = gql`
  query GetHotel($id: ID!) {
    hotel(id: $id) {
      id
      openingPeriods {
        startDate
        endDate
      }
    }
  }
`;

const UPDATE_HOTEL = gql`
  mutation UpdateHotel($id: ID!, $input: HotelInput!) {
    updateHotel(id: $id, input: $input) {
      id
    }
  }
`;

interface OpeningPeriod {
  startDate: string;
  endDate: string;
}

export default function OpeningHoursPage() {
  const { t } = useTranslation();
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          setSessionLoading(false);
          return;
        }
        const data = await res.json();
        if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
          setHotelId(data.businessId);
        } else {
          setSessionError(t("notAssociatedWithHotel"));
        }
      } catch (err) {
        setSessionError(t("failedToLoadSession"));
      } finally {
        setSessionLoading(false);
      }
    }
    fetchSession();
  }, []);

  // Fetch current opening periods
  const {
    data: hotelData,
    loading: hotelLoading,
    error: hotelError,
    refetch: refetchHotel,
  } = useQuery(GET_HOTEL_OPENING, {
    variables: { id: hotelId },
    skip: !hotelId,
  });

  const [updateHotel] = useMutation(UPDATE_HOTEL);

  // Local state for new period form
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [loadingMutation, setLoadingMutation] = useState(false);

  const periods: OpeningPeriod[] = hotelData?.hotel?.openingPeriods || [];

  // Add a new opening period
  const handleAddPeriod = async () => {
    if (!hotelId) return;
    if (!date || !date.from || !date.to) {
      alert(t("selectDateRange"));
      return;
    }
    const newPeriods = [...periods, { startDate: date.from.toISOString(), endDate: date.to.toISOString() }];
    try {
      setLoadingMutation(true);
      await updateHotel({
        variables: {
          id: hotelId,
          input: { openingPeriods: newPeriods.map((p) => ({ startDate: p.startDate, endDate: p.endDate })) },
        },
      });
      setDate(undefined);
      refetchHotel();
    } catch (err) {
      console.error(err);
      alert(t("failedLoadHotelData"));
    } finally {
      setLoadingMutation(false);
    }
  };

  // Remove a period by index
  const handleRemovePeriod = async (index: number) => {
    if (!hotelId) return;
    const newPeriods = periods.filter((_, i) => i !== index);
    try {
      setLoadingMutation(true);
      await updateHotel({
        variables: {
          id: hotelId,
          input: { openingPeriods: newPeriods.map((p) => ({ startDate: p.startDate, endDate: p.endDate })) },
        },
      });
      refetchHotel();
    } catch (err) {
      console.error(err);
      alert(t("failedLoadHotelData"));
    } finally {
      setLoadingMutation(false);
    }
  };

  if (sessionLoading || hotelLoading) {
    return <div className="p-6">{t("loading")}</div>;
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>;
  }
  if (hotelError) {
    return <div className="p-6 text-red-600">{t("failedLoadHotelData")}</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("openingHoursTitle")}</h1>
        <p className="text-gray-600">
          {t("openingHoursSubtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{t("addOpeningPeriod")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("selectDateRange")}</label>
                <DateRangePicker date={date} onDateChange={setDate} />
              </div>
              <button
                onClick={handleAddPeriod}
                disabled={loadingMutation}
                className={`w-full px-4 py-2 rounded text-white ${loadingMutation ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {t("add")}
              </button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{t("configuredOpeningPeriods")}</h2>
            {periods.length > 0 ? (
              <ul className="space-y-3">
                {periods.map((period, index) => (
                  <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-800">
                        {new Date(period.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} - {new Date(period.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemovePeriod(index)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      {t("delete")}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">{t("noOpeningPeriods")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}