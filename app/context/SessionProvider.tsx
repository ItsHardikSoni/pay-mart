
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type SessionContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLoginState = async () => {
      try {
        const stored = await AsyncStorage.getItem('paymart:isLoggedIn');
        setIsLoggedIn(stored === 'true');
      } catch (error) {
        console.warn('Failed to load login state', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLoginState();
  }, []);

  const login = async () => {
    try {
      setIsLoggedIn(true);
      await AsyncStorage.setItem('paymart:isLoggedIn', 'true');
    } catch (error) {
      console.warn('Failed to save login state', error);
    }
  };

  const logout = async () => {
    try {
      setIsLoggedIn(false);
      await AsyncStorage.removeItem('paymart:isLoggedIn');
    } catch (error) {
      console.warn('Failed to clear login state', error);
    }
  };

  return (
    <SessionContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}
