// "use client"

// import type React from "react"

// import { useState, useEffect, useMemo } from "react"
// import { Plus, Edit, Trash2, Search, Filter, DollarSign, Clock, Star, UtensilsCrossed, X } from "lucide-react"
// import { gql, useQuery, useMutation } from "@apollo/client"
// import { ImageUpload } from "@/components/ui/ImageUpload"
// import { uploadImage } from "@/app/lib/firebase"

// interface MenuItem {
//   id: string
//   name: string
//   description?: string
//   price: number
//   category: string
//   available: boolean
//   popular: boolean
//   prepTime?: number
//   allergens: string[]
//   images: string[]
// }

// export default function RestaurantMenus() {
//   const [activeCategory, setActiveCategory] = useState<string>("")
//   const [searchTerm, setSearchTerm] = useState("")
//   const [showModal, setShowModal] = useState(false)
//   const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
//   const [uploading, setUploading] = useState(false)

//   // Fetch the current session to determine the restaurant context.  We
//   // derive the restaurantId and businessType from the session so that
//   // only items belonging to the logged in restaurant are loaded.
//   const [restaurantId, setRestaurantId] = useState<string | null>(null)
//   const [sessionLoading, setSessionLoading] = useState(true)
//   const [sessionError, setSessionError] = useState<string | null>(null)

//   useEffect(() => {
//     async function fetchSession() {
//       try {
//         const res = await fetch("/api/session")
//         if (!res.ok) {
//           setSessionLoading(false)
//           return
//         }
//         const data = await res.json()

//         console.log("Session data:", data)
//         if (data.businessType && data.businessType.toLowerCase() === "restaurant" && data.businessId) {
//           setRestaurantId(data.businessId)
//         } else {
//           setSessionError("You are not associated with a restaurant business.")
//         }
//       } catch (err) {
//         setSessionError("Failed to load session.")
//       } finally {
//         setSessionLoading(false)
//       }
//     }
//     fetchSession()
//   }, [])

//   // GraphQL operations for menu items
//   const GET_MENU_ITEMS = gql`
//     query GetMenuItems($restaurantId: ID!) {
//       menuItems(restaurantId: $restaurantId) {
//         id
//         name
//         description
//         category
//         price
//         prepTime
//         available
//         popular
//         allergens
//         images
//       }
//     }
//   `
//   const CREATE_MENU_ITEM = gql`
//     mutation CreateMenuItem($input: MenuItemInput!) {
//       createMenuItem(input: $input) {
//         id
//       }
//     }
//   `
//   const UPDATE_MENU_ITEM = gql`
//     mutation UpdateMenuItem($id: ID!, $input: MenuItemInput!) {
//       updateMenuItem(id: $id, input: $input) {
//         id
//       }
//     }
//   `
//   const DELETE_MENU_ITEM = gql`
//     mutation DeleteMenuItem($id: ID!) {
//       deleteMenuItem(id: $id)
//     }
//   `

//   // Query hook for loading menu items
//   const { data, loading, error, refetch } = useQuery(GET_MENU_ITEMS, {
//     variables: { restaurantId },
//     skip: !restaurantId,
//   })

//   // Mutation hooks
//   const [createMenuItem] = useMutation(CREATE_MENU_ITEM)
//   const [updateMenuItem] = useMutation(UPDATE_MENU_ITEM)
//   const [deleteMenuItem] = useMutation(DELETE_MENU_ITEM)

//   // Local form state
//   const [formData, setFormData] = useState<Partial<MenuItem & { image?: string }>>({
//     name: "",
//     description: "",
//     price: 0,
//     category: "",
//     available: true,
//     popular: false,
//     prepTime: 10,
//     allergens: [],
//     image: "",
//   })

//   // Compute categories dynamically based on loaded menu items
//   const categories = useMemo(() => {
//     const items = data?.menuItems || []
//     const unique = Array.from(new Set(items.map((item: any) => item.category)))
//     return unique.map((cat: string) => {
//       const count = items.filter((i: any) => i.category === cat).length
//       // Convert id to human readable name (capitalize and replace hyphens/underscores)
//       const name = cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
//       return { id: cat, name, count }
//     })
//   }, [data])

//   // When categories load initially set the active category
//   useEffect(() => {
//     if (categories.length > 0 && !activeCategory) {
//       setActiveCategory(categories[0].id)
//     }
//   }, [categories, activeCategory])

//   // Filter menu items by active category and search term
//   const filteredItems = useMemo(() => {
//     const items = data?.menuItems || []
//     const byCategory = activeCategory ? items.filter((i: any) => i.category === activeCategory) : items
//     return byCategory.filter((item: any) => {
//       const term = searchTerm.toLowerCase()
//       return (
//         item.name.toLowerCase().includes(term) ||
//         (item.description ? item.description.toLowerCase().includes(term) : false)
//       )
//     })
//   }, [data, activeCategory, searchTerm])

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!restaurantId) return
//     try {
//       if (editingItem) {
//         // Update existing item
//         await updateMenuItem({
//           variables: {
//             id: editingItem.id,
//             input: {
//               restaurantId,
//               name: formData.name,
//               description: formData.description,
//               category: formData.category || activeCategory,
//               price: formData.price,
//               prepTime: formData.prepTime,
//               available: formData.available,
//               popular: formData.popular,
//               allergens: formData.allergens || [],
//               dietaryInfo: [],
//               spiceLevel: "mild",
//               ingredients: [],
//               nutritionalInfo: null,
//               images: formData.image ? [formData.image] : [],
//             },
//           },
//         })
//       } else {
//         await createMenuItem({
//           variables: {
//             input: {
//               restaurantId,
//               name: formData.name,
//               description: formData.description,
//               category: formData.category || activeCategory,
//               price: formData.price,
//               prepTime: formData.prepTime,
//               available: formData.available,
//               popular: formData.popular,
//               allergens: formData.allergens || [],
//               dietaryInfo: [],
//               spiceLevel: "mild",
//               ingredients: [],
//               nutritionalInfo: null,
//               images: formData.image ? [formData.image] : [],
//             },
//           },
//         })
//       }
//       await refetch()
//       setShowModal(false)
//       setEditingItem(null)
//       resetForm()
//     } catch (err) {
//       console.error(err)
//       alert("Failed to save menu item")
//     }
//   }

//   const resetForm = () => {
//     setFormData({
//       name: "",
//       description: "",
//       price: 0,
//       category: activeCategory,
//       available: true,
//       popular: false,
//       prepTime: 10,
//       allergens: [],
//       image: "",
//     })
//   }

//   const handleEdit = (item: MenuItem) => {
//     setEditingItem(item)
//     setFormData({
//       name: item.name,
//       description: item.description,
//       price: item.price,
//       category: item.category,
//       available: item.available,
//       popular: item.popular,
//       prepTime: item.prepTime || 10,
//       allergens: item.allergens || [],
//       image: item.images?.length ? item.images[0] : "",
//     })
//     setShowModal(true)
//   }

//   const handleDeleteItem = async (id: string) => {
//     if (!confirm("Are you sure you want to delete this menu item?")) return
//     try {
//       await deleteMenuItem({ variables: { id } })
//       await refetch()
//     } catch (err) {
//       console.error(err)
//       alert("Failed to delete menu item")
//     }
//   }

//   const handleImageUpload = async (files: File[]) => {
//     setUploading(true)
//     try {
//       const urls = await Promise.all(files.map(uploadImage))
//       setFormData({ ...formData, image: urls[0] })
//     } catch (err) {
//       console.error(err)
//       alert("Failed to upload image")
//     } finally {
//       setUploading(false)
//     }
//   }

//   const openCreateModal = () => {
//     setEditingItem(null)
//     resetForm()
//     setShowModal(true)
//   }

//   // Show loading or error states.  If the session or query is still
//   // loading we display a simple message.  Session errors or query
//   // errors are surfaced to the user as well.
//   if (sessionLoading || loading) {
//     return <div className="p-6">Loading...</div>
//   }
//   if (sessionError) {
//     return <div className="p-6 text-red-600">{sessionError}</div>
//   }
//   if (error) {
//     return <div className="p-6 text-red-600">Failed to load menu items.</div>
//   }

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
//           <p className="text-gray-600">Manage your restaurant menu items and categories</p>
//         </div>
//         <button
//           onClick={openCreateModal}
//           className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
//         >
//           <Plus className="h-4 w-4 mr-2" />
//           Add Menu Item
//         </button>
//       </div>

//       {/* Search and Filters */}
//       <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search menu items..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
//               />
//             </div>
//           </div>
//           <div className="flex gap-4">
//             <button className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
//               <Filter className="h-5 w-5 mr-2" />
//               Filters
//             </button>
//             <button className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
//               Export Menu
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         {/* Categories Sidebar */}
//         <div className="lg:col-span-1">
//           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
//             <div className="space-y-2">
//               {categories.map((category) => (
//                 <button
//                   key={category.id}
//                   onClick={() => setActiveCategory(category.id)}
//                   className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeCategory === category.id
//                     ? "bg-red-100 text-red-700 border border-red-200"
//                     : "hover:bg-gray-50 text-gray-700"
//                     }`}
//                 >
//                   <div className="flex justify-between items-center">
//                     <span className="font-medium">{category.name}</span>
//                     <span className="text-sm text-gray-500">{category.count}</span>
//                   </div>
//                 </button>
//               ))}
//             </div>

//             <div className="mt-6 pt-6 border-t border-gray-200">
//               <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center">
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add Category
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Menu Items */}
//         <div className="lg:col-span-3">
//           <div className="bg-white rounded-xl shadow-sm border border-gray-100">
//             <div className="p-6 border-b border-gray-100">
//               <div className="flex justify-between items-center">
//                 <h3 className="text-lg font-semibold text-gray-900 capitalize">
//                   {activeCategory.replace("_", " ")} ({filteredItems.length} items)
//                 </h3>
//                 <div className="flex space-x-2">
//                   <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
//                     Bulk Edit
//                   </button>
//                   <button
//                     onClick={openCreateModal}
//                     className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
//                   >
//                     Add Item
//                   </button>
//                 </div>
//               </div>
//             </div>

//             <div className="p-6">
//               <div className="space-y-4">
//                 {filteredItems.map((item: MenuItem) => {
//                   const imgSrc = item.images && item.images.length > 0 ? item.images[0] : "/placeholder.svg"

//                   return (
//                     <div
//                       key={item.id}
//                       className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
//                     >
//                       <div className="flex items-start space-x-4">
//                         <img
//                           src={imgSrc}
//                           alt={item.name}
//                           className="w-20 h-20 object-cover rounded-lg"
//                         />

//                         <div className="flex-1">
//                           <div className="flex justify-between items-start mb-2">
//                             <div>
//                               <div className="flex items-center space-x-2">
//                                 <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
//                                 {item.popular && (
//                                   <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
//                                     <Star className="h-3 w-3 mr-1" />
//                                     Popular
//                                   </span>
//                                 )}
//                                 <span
//                                   className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
//                                     }`}
//                                 >
//                                   {item.available ? "Available" : "Out of Stock"}
//                                 </span>
//                               </div>
//                               <p className="text-gray-600 mt-1">{item.description}</p>
//                             </div>

//                             <div className="flex items-center space-x-2">
//                               <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-blue-600">
//                                 <Edit className="h-4 w-4" />
//                               </button>
//                               <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-600">
//                                 <Trash2 className="h-4 w-4" />
//                               </button>
//                             </div>
//                           </div>

//                           <div className="flex items-center justify-between">
//                             <div className="flex items-center space-x-4">
//                               <div className="flex items-center text-sm text-gray-600">
//                                 <DollarSign className="h-4 w-4 mr-1" />
//                                 <span className="font-semibold text-gray-900">${item.price}</span>
//                               </div>
//                               <div className="flex items-center text-sm text-gray-600">
//                                 <Clock className="h-4 w-4 mr-1" />
//                                 {item.prepTime} min
//                               </div>
//                             </div>

//                             {item.allergens.length > 0 && (
//                               <div className="flex items-center space-x-1">
//                                 <span className="text-sm text-gray-500">Allergens:</span>
//                                 {item.allergens.map((allergen, index) => (
//                                   <span
//                                     key={index}
//                                     className="inline-flex px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded"
//                                   >
//                                     {allergen}
//                                   </span>
//                                 ))}
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )
//                 })}

//               </div>

//               {filteredItems.length === 0 && (
//                 <div className="text-center py-12">
//                   <div className="text-gray-400 mb-4">
//                     <UtensilsCrossed className="h-12 w-12 mx-auto" />
//                   </div>
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
//                   <p className="text-gray-600 mb-4">
//                     {searchTerm ? "Try adjusting your search terms" : "Start by adding your first menu item"}
//                   </p>
//                   <button
//                     onClick={openCreateModal}
//                     className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
//                   >
//                     Add Menu Item
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold text-gray-900">
//                 {editingItem ? "Edit Menu Item" : "Create New Menu Item"}
//               </h2>
//               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
//                 <X className="h-6 w-6" />
//               </button>
//             </div>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
//                   <input
//                     type="text"
//                     required
//                     value={formData.name || ""}
//                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     required
//                     value={formData.price || 0}
//                     onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
//                   <select
//                     required
//                     value={formData.category || activeCategory}
//                     onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
//                   >
//                     <option value="appetizers">Appetizers</option>
//                     <option value="mains">Main Courses</option>
//                     <option value="desserts">Desserts</option>
//                     <option value="beverages">Beverages</option>
//                     <option value="specials">Daily Specials</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (minutes)</label>
//                   <input
//                     type="number"
//                     min="1"
//                     required
//                     value={formData.prepTime || 10}
//                     onChange={(e) => setFormData({ ...formData, prepTime: Number.parseInt(e.target.value) })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
//                   />
//                 </div>
//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//                   <textarea
//                     required
//                     value={formData.description || ""}
//                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                     rows={3}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
//                   />
//                 </div>
//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Allergens (comma-separated)</label>
//                   <input
//                     type="text"
//                     value={formData.allergens?.join(", ") || ""}
//                     // onChange={(e) =>
//                     //   setFormData({ ...formData, allergens: e.target.value.split(", ").filter((a) => a.trim()) })
//                     // }

//                     onChange={(e) =>
//                       setFormData({
//                         ...formData,
//                         allergens: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
//                       })
//                     }
//                     placeholder="gluten, dairy, nuts"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
//                   />
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
//                   <ImageUpload onUpload={handleImageUpload} uploading={uploading} />
//                   {formData.image && (
//                     <div className="mt-4">
//                       <img src={formData.image} alt="Menu item image" className="w-32 h-32 object-cover rounded-lg" />
//                     </div>
//                   )}
//                 </div>

//                 <div className="md:col-span-2 flex items-center space-x-4">
//                   <label className="flex items-center">
//                     <input
//                       type="checkbox"
//                       checked={formData.available || false}
//                       onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
//                       className="mr-2"
//                     />
//                     Available
//                   </label>
//                   <label className="flex items-center">
//                     <input
//                       type="checkbox"
//                       checked={formData.popular || false}
//                       onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
//                       className="mr-2"
//                     />
//                     Popular Item
//                   </label>
//                 </div>

//                 <div className="flex justify-end space-x-3 pt-4">
//                   <button
//                     type="button"
//                     onClick={() => setShowModal(false)}
//                     className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
//                   >
//                     Cancel
//                   </button>
//                   <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
//                     {editingItem ? "Update" : "Create"} Menu Item
//                   </button>
//                 </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Quick Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//           <div className="text-center">
//             <p className="text-2xl font-bold text-red-600">{(data?.menuItems?.length ?? 0)}</p>
//             <p className="text-sm text-gray-600">Total Items</p>
//           </div>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//           <div className="text-center">
//             <p className="text-2xl font-bold text-green-600">
//               {(data?.menuItems?.filter((item: any) => item.available).length ?? 0)}
//             </p>
//             <p className="text-sm text-gray-600">Available</p>
//           </div>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//           <div className="text-center">
//             <p className="text-2xl font-bold text-yellow-600">
//               {(data?.menuItems?.filter((item: any) => item.popular).length ?? 0)}
//             </p>
//             <p className="text-sm text-gray-600">Popular Items</p>
//           </div>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
//           <div className="text-center">
//             <p className="text-2xl font-bold text-gray-900">
//               ${(() => {
//                 const items = data?.menuItems ?? []
//                 if (items.length === 0) return "0.00"
//                 const sum = items.reduce((s: number, i: any) => s + (i.price || 0), 0)
//                 return (sum / items.length).toFixed(2)
//               })()}
//             </p>
//             <p className="text-sm text-gray-600">Avg. Price</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }





// test1




"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Plus, Edit, Trash2, Search, Filter, DollarSign, Clock, Star, UtensilsCrossed, X } from "lucide-react"
import { gql, useQuery, useMutation } from "@apollo/client"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { uploadImage } from "@/app/lib/firebase"

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  available: boolean
  popular: boolean
  prepTime?: number
  allergens: string[]
  images: string[]
}

export default function RestaurantMenus() {
  const [activeCategory, setActiveCategory] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [uploading, setUploading] = useState(false)

  // Session-derived context
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) {
          setSessionLoading(false)
          return
        }
        const data = await res.json()

        if (data.businessType && data.businessType.toLowerCase() === "restaurant" && data.businessId) {
          setRestaurantId(data.businessId)
        } else {
          setSessionError("You are not associated with a restaurant business.")
        }
      } catch {
        setSessionError("Failed to load session.")
      } finally {
        setSessionLoading(false)
      }
    }
    fetchSession()
  }, [])

  // GraphQL operations
  const GET_MENU_ITEMS = gql`
    query GetMenuItems($restaurantId: ID!) {
      menuItems(restaurantId: $restaurantId) {
        id
        name
        description
        category
        price
        prepTime
        available
        popular
        allergens
        images
      }
    }
  `
  const CREATE_MENU_ITEM = gql`
    mutation CreateMenuItem($input: MenuItemInput!) {
      createMenuItem(input: $input) {
        id
      }
    }
  `
  const UPDATE_MENU_ITEM = gql`
    mutation UpdateMenuItem($id: ID!, $input: MenuItemInput!) {
      updateMenuItem(id: $id, input: $input) {
        id
      }
    }
  `
  const DELETE_MENU_ITEM = gql`
    mutation DeleteMenuItem($id: ID!) {
      deleteMenuItem(id: $id)
    }
  `

  // Data hooks
  const { data, loading, error, refetch } = useQuery(GET_MENU_ITEMS, {
    variables: { restaurantId },
    skip: !restaurantId,
  })

  const [createMenuItem] = useMutation(CREATE_MENU_ITEM)
  const [updateMenuItem] = useMutation(UPDATE_MENU_ITEM)
  const [deleteMenuItem] = useMutation(DELETE_MENU_ITEM)

  // Local form state
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    available: true,
    popular: false,
    prepTime: 10,
    allergens: [],
    images: [],
  })

  // Categories
  const categories = useMemo(() => {
    const items = data?.menuItems || []
    const unique = Array.from(new Set(items.map((item: any) => item.category)))
    return unique.map((cat: string) => {
      const count = items.filter((i: any) => i.category === cat).length
      const name = cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      return { id: cat, name, count }
    })
  }, [data])

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id)
    }
  }, [categories, activeCategory])

  // Filtered items
  const filteredItems = useMemo(() => {
    const items = data?.menuItems || []
    const byCategory = activeCategory ? items.filter((i: any) => i.category === activeCategory) : items
    const term = searchTerm.toLowerCase()
    return byCategory.filter((item: any) => {
      return (
        item.name.toLowerCase().includes(term) ||
        (item.description ? item.description.toLowerCase().includes(term) : false)
      )
    })
  }, [data, activeCategory, searchTerm])

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId) return
    try {
      if (editingItem) {
        await updateMenuItem({
          variables: {
            id: editingItem.id,
            input: {
              restaurantId,
              name: formData.name,
              description: formData.description,
              category: formData.category || activeCategory,
              price: formData.price,
              prepTime: formData.prepTime,
              available: formData.available,
              popular: formData.popular,
              allergens: formData.allergens || [],
              dietaryInfo: [],
              spiceLevel: "mild",
              ingredients: [],
              nutritionalInfo: null,
              images: formData.images,
            },
          },
        })
      } else {
        await createMenuItem({
          variables: {
            input: {
              restaurantId,
              name: formData.name,
              description: formData.description,
              category: formData.category || activeCategory,
              price: formData.price,
              prepTime: formData.prepTime,
              available: formData.available,
              popular: formData.popular,
              allergens: formData.allergens || [],
              dietaryInfo: [],
              spiceLevel: "mild",
              ingredients: [],
              nutritionalInfo: null,
              images: formData.images,
            },
          },
        })
      }
      await refetch()
      setShowModal(false)
      setEditingItem(null)
      resetForm()
    } catch (err) {
      console.error(err)
      alert("Failed to save menu item")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: activeCategory,
      available: true,
      popular: false,
      prepTime: 10,
      allergens: [],
      images: [],
    })
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      popular: item.popular,
      prepTime: item.prepTime || 10,
      allergens: item.allergens || [],
      images: item.images || [],
    })
    setShowModal(true)
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return
    try {
      await deleteMenuItem({ variables: { id } })
      await refetch()
    } catch (err) {
      console.error(err)
      alert("Failed to delete menu item")
    }
  }

  const handleImageUpload = async (files: File[]) => {
    setUploading(true)
    try {
      const urls = await Promise.all(files.map(uploadImage))
      setFormData({ ...formData, images: [...(formData.images || []), ...urls] })
    } catch (err) {
      console.error(err)
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    resetForm()
    setShowModal(true)
  }

  // Loading / error
  if (sessionLoading || loading) {
    return <div className="p-6">Loading...</div>
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>
  }
  if (error) {
    return <div className="p-6 text-red-600">Failed to load menu items.</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant menu items and categories</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>
            <button className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Export Menu
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500">{category.count}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {activeCategory.replace("_", " ")} ({filteredItems.length} items)
                </h3>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                    Bulk Edit
                  </button>
                  <button
                    onClick={openCreateModal}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {filteredItems.map((item: MenuItem) => {
                  const imgSrc = item.images && item.images.length > 0 ? item.images[0] : "/placeholder.svg"
                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-4">
                        <img src={imgSrc} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                                {item.popular && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                    <Star className="h-3 w-3 mr-1" />
                                    Popular
                                  </span>
                                )}
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {item.available ? "Available" : "Out of Stock"}
                                </span>
                              </div>
                              <p className="text-gray-600 mt-1">{item.description}</p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-blue-600">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <DollarSign className="h-4 w-4 mr-1" />
                                <span className="font-semibold text-gray-900">${item.price}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-1" />
                                {item.prepTime} min
                              </div>
                            </div>

                            {item.allergens.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <span className="text-sm text-gray-500">Allergens:</span>
                                {item.allergens.map((allergen, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded"
                                  >
                                    {allergen}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <UtensilsCrossed className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "Start by adding your first menu item"}
                  </p>
                  <button
                    onClick={openCreateModal}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Add Menu Item
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Menu Item" : "Create New Menu Item"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    required
                    value={formData.category || activeCategory}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="appetizers">Appetizers</option>
                    <option value="mains">Main Courses</option>
                    <option value="desserts">Desserts</option>
                    <option value="beverages">Beverages</option>
                    <option value="specials">Daily Specials</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.prepTime || 10}
                    onChange={(e) => setFormData({ ...formData, prepTime: Number.parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergens (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.allergens?.join(", ") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allergens: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="gluten, dairy, nuts"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                  <ImageUpload onUpload={handleImageUpload} uploading={uploading} multiple />
                  <div className="mt-4 flex flex-wrap gap-4">
                    {formData.images?.map((image, index) => (
                      <div key={index} className="relative">
                        <img src={image} alt="Menu item image" className="w-32 h-32 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, images: formData.images?.filter((_, i) => i !== index) })}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.available || false}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="mr-2"
                    />
                    Available
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.popular || false}
                      onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                      className="mr-2"
                    />
                    Popular Item
                  </label>
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                    {editingItem ? "Update" : "Create"} Menu Item
                  </button>
                </div>
              </div>{/* <-- closes the grid wrapper */}
            </form>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{data?.menuItems?.length ?? 0}</p>
            <p className="text-sm text-gray-600">Total Items</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {data?.menuItems?.filter((item: any) => item.available).length ?? 0}
            </p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {data?.menuItems?.filter((item: any) => item.popular).length ?? 0}
            </p>
            <p className="text-sm text-gray-600">Popular Items</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              $
              {(() => {
                const items = data?.menuItems ?? []
                if (items.length === 0) return "0.00"
                const sum = items.reduce((s: number, i: any) => s + (i.price || 0), 0)
                return (sum / items.length).toFixed(2)
              })()}
            </p>
            <p className="text-sm text-gray-600">Avg. Price</p>
          </div>
        </div>
      </div>
    </div>
  )
}
