// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// interface User {
//   id: string;
//   email: string;
//   name: string;
//   role: 'user' | 'admin';
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string) => Promise<void>;
//   register: (name: string, email: string, password: string) => Promise<void>;
//   logout: () => void;
//   isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       // In real app, verify token with backend
//       const userData = localStorage.getItem('user');
//       if (userData) {
//         setUser(JSON.parse(userData));
//       }
//     }
//     setIsLoading(false);
//   }, []);

//   const login = async (email: string, password: string): Promise<void> => {
//     // Mock authentication - replace with real GraphQL mutation
//     const mockUser: User = {
//       id: '1',
//       email,
//       name: 'John Doe',
//       role: 'admin'
//     };
    
//     localStorage.setItem('token', 'mock-token');
//     localStorage.setItem('user', JSON.stringify(mockUser));
//     setUser(mockUser);
//   };

//   const register = async (name: string, email: string, password: string): Promise<void> => {
//     // Mock registration - replace with real GraphQL mutation
//     const mockUser: User = {
//       id: '1',
//       email,
//       name,
//       role: 'user'
//     };
    
//     localStorage.setItem('token', 'mock-token');
//     localStorage.setItem('user', JSON.stringify(mockUser));
//     setUser(mockUser);
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };



"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { useQuery } from "@apollo/client"
import { ME_QUERY } from "../graphql/queries"

interface User {
  id: string
  email: string
  fullName: string
  role: string
  businessType?: string
  businessId?: string
  phone?: string
  avatar?: string
  preferences?: {
    notifications: {
      email: boolean
      sms: boolean
    }
    language: string
    timezone: string
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

type AuthAction =
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "UPDATE_USER"; payload: User }

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("authToken"),
  isAuthenticated: false,
  loading: true,
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      }
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      }
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      }
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      }
    default:
      return state
  }
}

interface AuthContextType extends AuthState {
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const { data, loading, error } = useQuery(ME_QUERY, {
    skip: !state.token,
    errorPolicy: "ignore",
  })

  useEffect(() => {
    if (loading) {
      dispatch({ type: "SET_LOADING", payload: true })
    } else if (data?.me) {
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: data.me,
          token: state.token!,
        },
      })
    } else if (error || !state.token) {
      dispatch({ type: "LOGOUT" })
      localStorage.removeItem("authToken")
      localStorage.removeItem("user")
    }
  }, [data, loading, error, state.token])

  const login = (user: User, token: string) => {
    localStorage.setItem("authToken", token)
    localStorage.setItem("user", JSON.stringify(user))
    dispatch({
      type: "LOGIN_SUCCESS",
      payload: { user, token },
    })
  }

  const logout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    dispatch({ type: "LOGOUT" })
  }

  const updateUser = (user: User) => {
    localStorage.setItem("user", JSON.stringify(user))
    dispatch({ type: "UPDATE_USER", payload: user })
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
