"use client";

import { useSearchParams } from "next/navigation";
import { gql, useQuery, useMutation } from "@apollo/client";
// Import currency helper to format refund amounts and totals correctly
import { formatCurrency } from '@/lib/currency';
import { useEffect, useState } from "react";

/*
 * Hotel reservation cancellation page.
 *
 * Guests arrive on this page via a link included in their booking
 * confirmation email.  Instead of immediately cancelling the
 * reservation, this page retrieves the reservation and applicable
 * cancellation policies, computes how much time remains before
 * check‑in and determines the refund percentage/amount.  The guest
 * is presented with these details and must explicitly confirm the
 * cancellation.  Upon confirmation the cancelHotelReservation
 * mutation is invoked to cancel the booking and process the refund.
 */

// Query a single reservation by id.  We request the client id to
// fetch the business’s cancellation policies, along with dates and
// amount for refund computation.
const RESERVATION_QUERY = gql`
  query Reservation($id: ID!) {
    reservation(id: $id) {
      id
      status
      paymentStatus
      totalAmount
      currency
      checkIn
      checkOut
      businessType
      customerInfo {
        name
        email
        phone
      }
      client {
        id
      }
    }
  }
`;

// Query all cancellation policies for a business (client).  Policies are
// sorted by daysBefore descending on the backend.
const POLICIES_QUERY = gql`
  query CancellationPolicies($businessId: ID!) {
    cancellationPolicies(businessId: $businessId) {
      id
      daysBefore
      refundPercentage
    }
  }
`;

// Mutation to cancel the reservation.  The cancelledBy argument
// determines whether the backend processes refunds via Stripe.
const CANCEL_RESERVATION = gql`
  mutation CancelHotelReservation($id: ID!, $cancelledBy: String!) {
    cancelHotelReservation(id: $id, cancelledBy: $cancelledBy) {
      success
      refundAmount
    }
  }
`;

export default function CancelReservationPage() {
  const params = useSearchParams();
  const reservationId = params.get("reservationId");
  // State used to control whether the guest has confirmed the
  // cancellation.  When true, the final status and refund details
  // are displayed.
  const [isCancelled, setIsCancelled] = useState(false);
  // Computed values for time before check‑in and refund
  const [timeInfo, setTimeInfo] = useState<{
    daysBefore: number;
    hoursBefore: number;
    refundPercentage: number;
    refundAmount: number;
  }>({ daysBefore: 0, hoursBefore: 0, refundPercentage: 0, refundAmount: 0 });
  // Retrieve reservation details.  Skip the query when no id is
  // provided.
  const {
    data: reservationData,
    loading: reservationLoading,
    error: reservationError,
  } = useQuery(RESERVATION_QUERY, {
    variables: { id: reservationId },
    skip: !reservationId,
  });
  const businessId = reservationData?.reservation?.client?.id;
  // Retrieve cancellation policies once we know the business id.
  const {
    data: policiesData,
    loading: policiesLoading,
    error: policiesError,
  } = useQuery(POLICIES_QUERY, {
    variables: { businessId },
    skip: !businessId,
  });
  // Mutation hook for cancelling the reservation.  We do not call
  // automatically; instead we trigger it when the guest confirms.
  const [cancelReservation, { data: cancelData, loading: cancelLoading, error: cancelError }] = useMutation(
    CANCEL_RESERVATION
  );
  // Compute time before check‑in and refund whenever the reservation
  // and policy data change.
  useEffect(() => {
    function computeRefund() {
      const reservation = reservationData?.reservation;
      const policies = policiesData?.cancellationPolicies;
      if (!reservation) return;
      // Determine how many hours/days remain until check‑in.  When
      // checkIn is undefined the values remain zero.
      let daysBefore = 0;
      let hoursBefore = 0;
      if (reservation.checkIn) {
        const now = new Date();
        const checkInDate = new Date(reservation.checkIn);
        const diffMs = checkInDate.getTime() - now.getTime();
        // Only positive differences are considered.  If diffMs is
        // negative the guest is past the check‑in date and no refund
        // applies.
        if (diffMs > 0) {
          daysBefore = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          hoursBefore = Math.floor(diffMs / (1000 * 60 * 60));
        }
      }
      // Determine refund percentage using the cancellation policies.
      let refundPercentage = 0;
      if (policies && Array.isArray(policies)) {
        for (const policy of policies) {
          if (daysBefore >= policy.daysBefore) {
            refundPercentage = policy.refundPercentage;
            break;
          }
        }
      }
      // Compute refund amount based on totalAmount.  When no amount is
      // available or the percentage is zero the refund remains zero.
      const totalAmount = reservation.totalAmount ?? 0;
      const refundAmount = (totalAmount * refundPercentage) / 100;
      setTimeInfo({ daysBefore, hoursBefore, refundPercentage, refundAmount });
    }
    computeRefund();
  }, [reservationData, policiesData]);

  // Handle the confirmation click.  Invokes the mutation and
  // updates state to reflect cancellation success.
  async function handleConfirm() {
    if (!reservationId) return;
    try {
      const { data } = await cancelReservation({
        variables: { id: reservationId, cancelledBy: "user" },
      });
      if (data?.cancelHotelReservation?.success) {
        // Use the refund amount returned from the server to update the
        // display.  The server may adjust the refund based on final
        // evaluation or rounding.
        const serverRefund = data.cancelHotelReservation.refundAmount ?? 0;
        setTimeInfo((prev) => ({ ...prev, refundAmount: serverRefund }));
        setIsCancelled(true);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Render loading state while queries are in flight.
  if (!reservationId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Reservation Cancellation</h1>
          <p>Invalid reservation identifier.</p>
        </div>
      </div>
    );
  }
  if (reservationLoading || policiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Reservation Cancellation</h1>
          <p>Loading your reservation...</p>
        </div>
      </div>
    );
  }
  if (reservationError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Reservation Cancellation</h1>
          <p>Unable to retrieve your reservation. Please try again later.</p>
        </div>
      </div>
    );
  }
  // After the cancellation has been processed show the final
  // confirmation and refund details.
  if (isCancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Cancellation Complete</h1>
          <p className="mb-2">Your reservation has been cancelled successfully.</p>
          <p className="mb-2">
            A refund of{' '}
            {formatCurrency(
              timeInfo.refundAmount,
              reservationData?.reservation?.currency || 'USD',
              reservationData?.reservation?.currency || 'USD'
            )}{' '}
            will be processed to your original payment method.
          </p>
          <p className="text-sm text-gray-600">Please allow 5–7 business days for the refund to appear in your account.</p>
        </div>
      </div>
    );
  }
  // Display the reservation details and computed refund information.
  const reservation = reservationData?.reservation;
  const checkInDate = reservation?.checkIn ? new Date(reservation.checkIn).toISOString().split('T')[0] : null;
  const checkOutDate = reservation?.checkOut ? new Date(reservation.checkOut).toISOString().split('T')[0] : null;
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Cancel Reservation</h1>
        <p className="mb-4">Before proceeding, please review the details of your reservation and the applicable cancellation policy.</p>
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Reservation Details</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-medium">Reservation ID:</td>
                <td className="py-1 break-all">{reservation?.id}</td>
              </tr>
              {checkInDate && (
                <tr>
                  <td className="py-1 font-medium">Check‑in:</td>
                  <td className="py-1">{checkInDate}</td>
                </tr>
              )}
              {checkOutDate && (
                <tr>
                  <td className="py-1 font-medium">Check‑out:</td>
                  <td className="py-1">{checkOutDate}</td>
                </tr>
              )}
              {typeof reservation?.totalAmount === 'number' && reservation.totalAmount > 0 && (
                <tr>
                  <td className="py-1 font-medium">Total Amount:</td>
                  <td className="py-1">
                    {formatCurrency(
                      reservation.totalAmount ?? 0,
                      reservation.currency || 'USD',
                      reservation.currency || 'USD'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Cancellation Summary</h2>
          {timeInfo.daysBefore > 0 ? (
            <p>You are {timeInfo.daysBefore} day{timeInfo.daysBefore !== 1 ? 's' : ''} before your check‑in date.</p>
          ) : timeInfo.hoursBefore > 0 ? (
            <p>You are {timeInfo.hoursBefore} hour{timeInfo.hoursBefore !== 1 ? 's' : ''} before your check‑in date.</p>
          ) : (
            <p>You are past the check‑in date.</p>
          )}
          {timeInfo.refundPercentage > 0 ? (
            <p>
              According to our cancellation policy, you will receive a refund of {timeInfo.refundPercentage}% which
              amounts to{' '}
              {formatCurrency(
                timeInfo.refundAmount,
                reservation?.currency || 'USD',
                reservation?.currency || 'USD'
              )}
              .
            </p>
          ) : (
            <p>No refund is due based on the current cancellation policy.</p>
          )}
          <p className="text-sm text-gray-600 mt-2">Refunds will be processed via your original payment method. Please allow 5–7 business days for the funds to appear in your account.</p>
        </div>
        {cancelError && (
          <p className="text-red-600 mb-2">An error occurred while cancelling your reservation. Please try again later.</p>
        )}
        <div className="text-center">
          <button
            onClick={handleConfirm}
            disabled={cancelLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
          >
            {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}