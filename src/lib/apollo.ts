// import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client"
// import { setContext } from "@apollo/client/link/context"
// import { onError } from "@apollo/client/link/error"

// // HTTP Link
// const httpLink = createHttpLink({
//   uri: process.env.REACT_APP_GRAPHQL_URI || "http://localhost:4000/graphql",
// })

// // Auth Link
// const authLink = setContext((_, { headers }) => {
//   const token = localStorage.getItem("authToken")
//   return {
//     headers: {
//       ...headers,
//       authorization: token ? `Bearer ${token}` : "",
//     },
//   }
// })

// // Error Link
// const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
//   if (graphQLErrors) {
//     graphQLErrors.forEach(({ message, locations, path }) => {
//       console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
//     })
//   }

//   if (networkError) {
//     console.error(`[Network error]: ${networkError}`)

//     // Handle authentication errors
//     if (networkError.statusCode === 401) {
//       localStorage.removeItem("authToken")
//       localStorage.removeItem("user")
//       window.location.href = "/login"
//     }
//   }
// })

// // Apollo Client
// const client = new ApolloClient({
//   link: from([errorLink, authLink, httpLink]),
//   cache: new InMemoryCache({
//     typePolicies: {
//       Hotel: {
//         fields: {
//           rooms: {
//             merge(existing = [], incoming) {
//               return incoming
//             },
//           },
//           reservations: {
//             merge(existing = [], incoming) {
//               return incoming
//             },
//           },
//         },
//       },
//       Restaurant: {
//         fields: {
//           tables: {
//             merge(existing = [], incoming) {
//               return incoming
//             },
//           },
//           menuItems: {
//             merge(existing = [], incoming) {
//               return incoming
//             },
//           },
//           reservations: {
//             merge(existing = [], incoming) {
//               return incoming
//             },
//           },
//         },
//       },
//       Salon: {
//         fields: {
//           services: {
//             merge(existing = [], incoming) {
//               return incoming
//             },
//           },
//           staff: {
//             merge(existing = [], incoming) {
//               return incoming
//             },
//           },
//           bookings: {
//             merge(existing = [], incoming) {
//               return incoming
//             },
//           },
//         },
//       },
//     },
//   }),
//   defaultOptions: {
//     watchQuery: {
//       errorPolicy: "all",
//     },
//     query: {
//       errorPolicy: "all",
//     },
//   },
// })

// export default client
