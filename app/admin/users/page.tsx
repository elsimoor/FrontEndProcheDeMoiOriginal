// "use client";

// import { gql, useQuery, useMutation } from "@apollo/client";
// import { useState } from "react";
// import { useLanguage } from "@/context/LanguageContext";
// import useTranslation from "@/hooks/useTranslation";

// /**
//  * AdminUsersPage
//  *
//  * This page allows administrators to view all registered users and
//  * promote them to the admin role.  It lists each user’s name,
//  * email and current role in a simple table.  A "Make Admin" button
//  * appears for users who are not already admins.  When clicked the
//  * updateUser mutation is invoked with the role set to "admin".  The
//  * list is refetched upon completion to reflect the updated roles.
//  */
// /**
//  * Queries and mutations for managing administrator accounts.  The
//  * GET_ADMINS query filters the users collection to return only
//  * accounts with the "admin" role.  REGISTER_ADMIN invokes the
//  * register mutation to create a new user.  DELETE_USER removes
//  * an existing user by id.  UPDATE_USER_ROLE is preserved to allow
//  * demoting or promoting admins.
//  */
// const GET_ADMINS = gql`
//   query GetAdmins {
//     users(role: "admin") {
//       id
//       firstName
//       lastName
//       email
//       role
//       businessType
//     }
//   }
// `;

// const REGISTER_ADMIN = gql`
//   mutation Register($input: RegisterInput!) {
//     register(input: $input) {
//       user {
//         id
//         firstName
//         lastName
//         email
//         role
//         businessType
//       }
//     }
//   }
// `;

// const DELETE_USER = gql`
//   mutation DeleteUser($id: ID!) {
//     deleteUser(id: $id)
//   }
// `;

// const UPDATE_USER_ROLE = gql`
//   mutation UpdateUserRole($id: ID!, $input: UserUpdateInput!) {
//     updateUser(id: $id, input: $input) {
//       id
//       role
//     }
//   }
// `;

// export default function AdminUsersPage() {
//   const { t } = useTranslation();
//   // Pull locale setter so the language switcher in the header updates
//   const { locale, setLocale } = useLanguage();
//   // State for controlling the creation form visibility and its fields
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   // State for the create admin form.  Business type has been removed
//   // because system administrators do not manage a specific business.
//   const [formState, setFormState] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//   });

//   // Fetch admins only
//   const { data, loading, error, refetch } = useQuery(GET_ADMINS);
//   // Mutations
//   const [registerAdmin] = useMutation(REGISTER_ADMIN, {
//     onCompleted: () => {
//       refetch();
//       setShowCreateForm(false);
//       setFormState({ firstName: "", lastName: "", email: "", password: "" });
//     },
//   });
//   const [deleteUser] = useMutation(DELETE_USER, {
//     onCompleted: () => refetch(),
//   });
//   const [updateUserRole] = useMutation(UPDATE_USER_ROLE, {
//     onCompleted: () => refetch(),
//   });

//   // Handle form field changes
//   const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormState((prev) => ({ ...prev, [name]: value }));
//   };

//   // Create a new admin using the register mutation.  Defaults the role to admin
//   const handleCreateAdmin = () => {
//     // Basic validation
//     if (!formState.firstName || !formState.lastName || !formState.email || !formState.password) {
//       alert("Please fill all fields");
//       return;
//     }
//     registerAdmin({
//       variables: {
//         input: {
//           lastName: formState.lastName,
//           firstName: formState.firstName,
//           email: formState.email,
//           password: formState.password,
//         },
//       },
//     });
//   };

//   // Delete an existing admin.  Prompts before deletion.
//   const handleDelete = (userId: string) => {
//     if (!confirm("Are you sure you want to delete this admin?")) return;
//     deleteUser({ variables: { id: userId } });
//   };

//   // Demote an admin to manager.  This uses the updateUser mutation.
//   const handleDemote = (userId: string) => {
//     if (!confirm("Are you sure you want to demote this admin to manager?")) return;
//     updateUserRole({ variables: { id: userId, input: { role: "manager" } } });
//   };

//   if (loading) {
//     return <p>Loading admins...</p>;
//   }
//   if (error) {
//     return <p>Error loading admins.</p>;
//   }
//   const admins = data?.users ?? [];
//   return (
//     <div className="space-y-8">
//       <h1 className="text-2xl font-bold mb-4">Manage Admins</h1>
//       {/* Button to toggle the creation form */}
//       <button
//         onClick={() => setShowCreateForm((prev) => !prev)}
//         className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//       >
//         {showCreateForm ? "Cancel" : "Create Admin"}
//       </button>
//       {showCreateForm && (
//         <div className="mt-4 space-y-4 bg-white p-4 rounded-md shadow-sm border">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
//               <input
//                 type="text"
//                 name="firstName"
//                 value={formState.firstName}
//                 onChange={handleFormChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
//               <input
//                 type="text"
//                 name="lastName"
//                 value={formState.lastName}
//                 onChange={handleFormChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formState.email}
//                 onChange={handleFormChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
//               <input
//                 type="password"
//                 name="password"
//                 value={formState.password}
//                 onChange={handleFormChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               />
//             </div>
//             {/* Business type selection removed: administrators do not manage a single business */}
//           </div>
//           <button
//             onClick={handleCreateAdmin}
//             className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//           >
//             Save Admin
//           </button>
//         </div>
//       )}

//       {/* Table of existing admins */}
//       <div className="overflow-x-auto">
//         <table className="min-w-full divide-y divide-gray-200 border">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//               <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
//               <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
//               <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
//               <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {admins.map((user: any) => (
//               <tr key={user.id} className="hover:bg-gray-50">
//                 <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
//                   {user.firstName} {user.lastName}
//                 </td>
//                 <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
//                   {user.email}
//                 </td>
//                 <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 capitalize">
//                   {user.businessType || "-"}
//                 </td>
//                 <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 capitalize">
//                   {user.role}
//                 </td>
//                 <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right space-x-2">
//                   {/* Demote button appears only for admins */}
//                   <button
//                     onClick={() => handleDemote(user.id)}
//                     className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
//                   >
//                     Demote
//                   </button>
//                   <button
//                     onClick={() => handleDelete(user.id)}
//                     className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }



// test1




"use client"

import type React from "react"

import { gql, useQuery, useMutation } from "@apollo/client"
import { useState } from "react"
import { useLanguage } from "@/context/LanguageContext"
import useTranslation from "@/hooks/useTranslation"
import { UserPlus, Users, Shield, Trash2, ChevronDown, Mail, User, Building2, Crown } from "lucide-react"

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
`

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
`

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`

const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      id
      role
    }
  }
`

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })

  const { data, loading, error, refetch } = useQuery(GET_ADMINS)
  const [registerAdmin] = useMutation(REGISTER_ADMIN, {
    onCompleted: () => {
      refetch()
      setShowCreateForm(false)
      setFormState({ firstName: "", lastName: "", email: "", password: "" })
    },
  })
  const [deleteUser] = useMutation(DELETE_USER, {
    onCompleted: () => refetch(),
  })
  const [updateUserRole] = useMutation(UPDATE_USER_ROLE, {
    onCompleted: () => refetch(),
  })

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateAdmin = () => {
    if (!formState.firstName || !formState.lastName || !formState.email || !formState.password) {
      alert("Please fill all fields")
      return
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
    })
  }

  const handleDelete = (userId: string) => {
    if (!confirm("Are you sure you want to delete this admin?")) return
    deleteUser({ variables: { id: userId } })
  }

  const handleDemote = (userId: string) => {
    if (!confirm("Are you sure you want to demote this admin to manager?")) return
    updateUserRole({ variables: { id: userId, input: { role: "manager" } } })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-lg font-medium text-gray-700">Loading admins...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-600 text-lg font-medium">Error loading admins</div>
            <p className="text-red-500 mt-2">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    )
  }

  const admins = data?.users ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            Admin Management
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage system administrators, create new admin accounts, and control user permissions
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <UserPlus className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Create New Admin</h2>
            </div>
            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {showCreateForm ? (
                <>
                  <ChevronDown className="w-4 h-4 mr-2 rotate-180 transition-transform duration-200" />
                  Cancel
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Admin
                </>
              )}
            </button>
          </div>

          {showCreateForm && (
            <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formState.firstName}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formState.lastName}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Shield className="w-4 h-4 mr-2 text-gray-500" />
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formState.password}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter secure password"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCreateAdmin}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Admin Account
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Current Administrators</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {admins.length} {admins.length === 1 ? "Admin" : "Admins"}
              </span>
            </div>
          </div>

          {admins.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No administrators found</h3>
              <p className="text-gray-500">Create your first admin account to get started</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Administrator
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {admins.map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.firstName?.[0]}
                                  {user.lastName?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="w-4 h-4 mr-2" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Building2 className="w-4 h-4 mr-2" />
                            {user.businessType || "System Admin"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            <Crown className="w-3 h-3 mr-1" />
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleDemote(user.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors duration-200"
                          >
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Demote
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-200">
                {admins.map((user: any) => (
                  <div key={user.id} className="p-6 space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <div className="flex items-center mt-1">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center text-gray-500 mb-1">
                          <Building2 className="w-4 h-4 mr-1" />
                          Business Type
                        </div>
                        <p className="font-medium text-gray-900">{user.businessType || "System Admin"}</p>
                      </div>
                      <div>
                        <div className="flex items-center text-gray-500 mb-1">
                          <Crown className="w-4 h-4 mr-1" />
                          Role
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={() => handleDemote(user.id)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors duration-200"
                      >
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Demote
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
