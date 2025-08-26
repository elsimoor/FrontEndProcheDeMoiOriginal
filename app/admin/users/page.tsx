"use client";

import { gql, useQuery, useMutation } from "@apollo/client";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import useTranslation from "@/hooks/useTranslation";

/**
 * AdminUsersPage
 *
 * This page allows administrators to view all registered users and
 * promote them to the admin role.  It lists each user’s name,
 * email and current role in a simple table.  A "Make Admin" button
 * appears for users who are not already admins.  When clicked the
 * updateUser mutation is invoked with the role set to "admin".  The
 * list is refetched upon completion to reflect the updated roles.
 */
/**
 * Queries and mutations for managing administrator accounts.  The
 * GET_ADMINS query filters the users collection to return only
 * accounts with the "admin" role.  REGISTER_ADMIN invokes the
 * register mutation to create a new user.  DELETE_USER removes
 * an existing user by id.  UPDATE_USER_ROLE is preserved to allow
 * demoting or promoting admins.
 */
const GET_ADMINS = gql`
  query GetAdmins {
    users(role: "admin") {
      id
      firstName
      lastName
      email
      role
      businessType
    }
  }
`;

const REGISTER_ADMIN = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        firstName
        lastName
        email
        role
        businessType
      }
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      id
      role
    }
  }
`;

export default function AdminUsersPage() {
  const { t } = useTranslation();
  // Pull locale setter so the language switcher in the header updates
  const { locale, setLocale } = useLanguage();
  // State for controlling the creation form visibility and its fields
  const [showCreateForm, setShowCreateForm] = useState(false);
  // State for the create admin form.  Business type has been removed
  // because system administrators do not manage a specific business.
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  // Fetch admins only
  const { data, loading, error, refetch } = useQuery(GET_ADMINS);
  // Mutations
  const [registerAdmin] = useMutation(REGISTER_ADMIN, {
    onCompleted: () => {
      refetch();
      setShowCreateForm(false);
      setFormState({ firstName: "", lastName: "", email: "", password: "" });
    },
  });
  const [deleteUser] = useMutation(DELETE_USER, {
    onCompleted: () => refetch(),
  });
  const [updateUserRole] = useMutation(UPDATE_USER_ROLE, {
    onCompleted: () => refetch(),
  });

  // Handle form field changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // Create a new admin using the register mutation.  Defaults the role to admin
  const handleCreateAdmin = () => {
    // Basic validation
    if (!formState.firstName || !formState.lastName || !formState.email || !formState.password) {
      alert("Please fill all fields");
      return;
    }
    registerAdmin({
      variables: {
        input: {
          lastName: formState.lastName,
          firstName: formState.firstName,
          email: formState.email,
          password: formState.password,
        },
      },
    });
  };

  // Delete an existing admin.  Prompts before deletion.
  const handleDelete = (userId: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;
    deleteUser({ variables: { id: userId } });
  };

  // Demote an admin to manager.  This uses the updateUser mutation.
  const handleDemote = (userId: string) => {
    if (!confirm("Are you sure you want to demote this admin to manager?")) return;
    updateUserRole({ variables: { id: userId, input: { role: "manager" } } });
  };

  if (loading) {
    return <p>Loading admins...</p>;
  }
  if (error) {
    return <p>Error loading admins.</p>;
  }
  const admins = data?.users ?? [];
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold mb-4">Manage Admins</h1>
      {/* Button to toggle the creation form */}
      <button
        onClick={() => setShowCreateForm((prev) => !prev)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {showCreateForm ? "Cancel" : "Create Admin"}
      </button>
      {showCreateForm && (
        <div className="mt-4 space-y-4 bg-white p-4 rounded-md shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formState.firstName}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formState.lastName}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formState.password}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            {/* Business type selection removed: administrators do not manage a single business */}
          </div>
          <button
            onClick={handleCreateAdmin}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Save Admin
          </button>
        </div>
      )}

      {/* Table of existing admins */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {user.businessType || "-"}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {user.role}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right space-x-2">
                  {/* Demote button appears only for admins */}
                  <button
                    onClick={() => handleDemote(user.id)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Demote
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}