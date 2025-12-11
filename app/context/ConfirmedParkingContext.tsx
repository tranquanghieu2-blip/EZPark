import React, { createContext, useContext } from 'react';
import { useConfirmedParking } from '@/hooks/useConfirmParking';

const ConfirmedParkingContext = createContext<ReturnType<typeof useConfirmedParking> | null>(null);

export const ConfirmedParkingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useConfirmedParking();
  return (
    <ConfirmedParkingContext.Provider value={value}>
      {children}
    </ConfirmedParkingContext.Provider>
  );
};

export const useConfirmedParkingContext = () => {
  const ctx = useContext(ConfirmedParkingContext);
  if (!ctx) {
    throw new Error('useConfirmedParkingContext must be used inside ConfirmedParkingProvider');
  }
  return ctx;
};
