"use client";

import { useEffect, useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
// Import toast from react-toastify.  This shim provides toast notifications
// for create, update, delete and loading actions throughout the
// cancellation policies page.
import { toast } from "react-toastify";
import useTranslation from "@/hooks/useTranslation";

/*
 * Cancellation policies management page.
 *
 * This page allows hotel managers to configure rules that determine
 * the refund amount when a guest cancels a reservation.  Each rule
 * specifies the minimum number of days prior to check‑in and the
 * percentage of the total amount to refund.  Policies are ordered
 * by daysBefore descending so that the first matching rule applies.
 */

const GET_POLICIES = gql`
  query GetCancellationPolicies($businessId: ID!) {
    cancellationPolicies(businessId: $businessId) {
      id
      daysBefore
      refundPercentage
    }
  }
`;

const CREATE_POLICY = gql`
  mutation CreateCancellationPolicy($input: CancellationPolicyInput!) {
    createCancellationPolicy(input: $input) {
      id
      daysBefore
      refundPercentage
    }
  }
`;

const UPDATE_POLICY = gql`
  mutation UpdateCancellationPolicy($id: ID!, $input: CancellationPolicyInput!) {
    updateCancellationPolicy(id: $id, input: $input) {
      id
      daysBefore
      refundPercentage
    }
  }
`;

const DELETE_POLICY = gql`
  mutation DeleteCancellationPolicy($id: ID!) {
    deleteCancellationPolicy(id: $id)
  }
`;

interface PolicyFormState {
  daysBefore: string;
  refundPercentage: string;
}

export default function CancellationPoliciesPage() {
  const { t } = useTranslation();
  // Business context
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  // Fetch session to get businessId
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          if (data.businessType?.toLowerCase() === 'hotel') {
            setBusinessId(data.businessId);
          }
        }
      } catch (err) {
        console.error('Failed to load session', err);
      } finally {
        setLoadingSession(false);
      }
    }
    fetchSession();
  }, []);

  // GraphQL queries/mutations
  const { data, loading: policiesLoading, error: policiesError, refetch } = useQuery(GET_POLICIES, {
    variables: { businessId },
    skip: !businessId,
  });
  const [createPolicy] = useMutation(CREATE_POLICY);
  const [updatePolicy] = useMutation(UPDATE_POLICY);
  const [deletePolicy] = useMutation(DELETE_POLICY);

  // Form state for creating/updating policies
  const [formState, setFormState] = useState<PolicyFormState>({ daysBefore: '', refundPercentage: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Display a loading toast when session or policy data is being fetched.
  useEffect(() => {
    if (loadingSession || policiesLoading) {
      toast.info({
        title: 'Loading...',
        description: t('pleaseWaitWhileWeLoadYourData') || 'Please wait while we load your data.',
        duration: 3000,
      });
    }
  }, [loadingSession, policiesLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    const days = parseInt(formState.daysBefore, 10);
    const refund = parseFloat(formState.refundPercentage);
    if (isNaN(days) || isNaN(refund)) return;
    const input = { businessId, daysBefore: days, refundPercentage: refund };
    try {
      if (editingId) {
        await updatePolicy({ variables: { id: editingId, input } });
        toast.success(t('policyUpdatedSuccessfully') || 'Policy updated successfully');
      } else {
        await createPolicy({ variables: { input } });
        toast.success(t('policyCreatedSuccessfully') || 'Policy created successfully');
      }
      setFormState({ daysBefore: '', refundPercentage: '' });
      setEditingId(null);
      refetch();
    } catch (err) {
      console.error('Failed to save policy', err);
      toast.error(t('failedToSavePolicy') || 'Failed to save policy');
    }
  };

  const handleEdit = (policy: any) => {
    setEditingId(policy.id);
    setFormState({ daysBefore: String(policy.daysBefore), refundPercentage: String(policy.refundPercentage) });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this policy?')) {
      try {
        await deletePolicy({ variables: { id } });
        refetch();
        toast.success(t('policyDeletedSuccessfully') || 'Policy deleted successfully');
      } catch (err) {
        console.error('Failed to delete policy', err);
        toast.error(t('failedToDeletePolicy') || 'Failed to delete policy');
      }
    }
  };

  if (loadingSession || policiesLoading) return <p>Loading...</p>;
  if (policiesError) return <p>Error loading policies.</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{t('cancellationPolicies') || 'Cancellation Policies'}</h1>
      {/* List of existing policies */}
      <section className="bg-white p-6 rounded-lg shadow">
        {data?.cancellationPolicies && data.cancellationPolicies.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('daysBefore') || 'Days Before Check‑In'}</TableHead>
                <TableHead>{t('refundPercentage') || 'Refund %'}</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.cancellationPolicies.map((policy: any) => (
                <TableRow key={policy.id}>
                  <TableCell>{policy.daysBefore}</TableCell>
                  <TableCell>{policy.refundPercentage}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(policy)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(policy.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p>No policies defined yet.</p>
        )}
      </section>
      {/* Form to add/update a policy */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Policy' : 'Add Policy'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="daysBefore">
              {t('daysBefore') || 'Days Before Check‑In'}
            </label>
            <Input
              id="daysBefore"
              type="number"
              min={0}
              value={formState.daysBefore}
              onChange={(e) => setFormState({ ...formState, daysBefore: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="refundPercentage">
              {t('refundPercentage') || 'Refund Percentage'}
            </label>
            <Input
              id="refundPercentage"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={formState.refundPercentage}
              onChange={(e) => setFormState({ ...formState, refundPercentage: e.target.value })}
              required
            />
          </div>
          <div className="flex space-x-4">
            <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={() => { setEditingId(null); setFormState({ daysBefore: '', refundPercentage: '' }); }}>Cancel</Button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}