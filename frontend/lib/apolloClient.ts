// apolloClient.js
"use client";
import { getSession } from "@/app/actions";
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";


console.log('Initializing Apollo Client', process.env.NEXT_PUBLIC_BACKEND_URL + "/procheDeMoi");

// Create an HTTP link pointing to your GraphQL endpoint
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_BACKEND_URL + "/procheDeMoi",
  // credentials: "include", // Sends cookies with every request
});

// Create an auth link to attach the token.  On the server we can use
// getSession() directly.  On the client we fetch the session via the
// `/api/session` endpoint since server actions are not available.
const authLink = setContext(async (_, { headers }) => {
  let token: string | undefined;
  try {
    if (typeof window === "undefined") {
      // Running on the server: use server action to get the session
      const session = await getSession();
      token = session.token;
    } else {
      // Running on the client: fetch session from API route
      const res = await fetch("/api/session");
      if (res.ok) {
        const data = await res.json();
        token = data.token;
      }
    }
  } catch (err) {
    console.error("Failed to retrieve session for auth link", err);
  }
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Instantiate the Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;