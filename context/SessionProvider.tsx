
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type SessionContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  fullName: string | null;
  login: (username: string, fullName: string) => Promise<void>;
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
  const [fullName, setFullName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLoginState = async () => {
      try {
        const storedIsLoggedIn = await AsyncStorage.getItem('paymart:isLoggedIn');
        const storedFullName = await AsyncStorage.getItem('paymart:fullName');
        setIsLoggedIn(storedIsLoggedIn === 'true');
        setFullName(storedFullName);
      } catch (error) {
        console.warn('Failed to load login state', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLoginState();
  }, []);

  const login = async (username: string, fullName: string) => {
    try {
      setIsLoggedIn(true);
      setFullName(fullName);
      await AsyncStorage.setItem('paymart:isLoggedIn', 'true');
      await AsyncStorage.setItem('paymart:fullName', fullName);
    } catch (error) {
      console.warn('Failed to save login state', error);
    }
  };

  const logout = async () => {
    try {
      setIsLoggedIn(false);
      setFullName(null);
      await AsyncStorage.removeItem('paymart:isLoggedIn');
      await AsyncStorage.removeItem('paymart:loginIdentifier');
      await AsyncStorage.removeItem('paymart:fullName');
    } catch (error) {
      console.warn('Failed to clear login state', error);
    }
  };

  return (
    <SessionContext.Provider value={{ isLoggedIn, isLoading, fullName, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}
