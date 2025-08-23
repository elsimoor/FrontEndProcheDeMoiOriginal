"use client";
import React from 'react'
import { ApolloProvider } from "@apollo/client";
import { Provider } from "react-redux";
import store from '@/store';
import client from '@/lib/apolloClient';

export default function ClientApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <Provider store={store}>{children}</Provider>
    </ApolloProvider>
  );
}