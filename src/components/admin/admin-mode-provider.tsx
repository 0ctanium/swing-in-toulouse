"use client";

import { createContext, useContext } from "react";

type AdminModeContextValue = {
  isAdminMode: boolean;
};

const AdminModeContext = createContext<AdminModeContextValue>({
  isAdminMode: false,
});

export function AdminModeProvider({
  isAdminMode,
  children,
}: {
  isAdminMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <AdminModeContext.Provider value={{ isAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  return useContext(AdminModeContext);
}
