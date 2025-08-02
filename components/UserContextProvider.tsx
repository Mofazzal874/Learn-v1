"use client";
import { UserContext } from "@/context/UserContext";
import { ClientLayout } from "@/components/ClientLayout";
import { useState } from "react";

export default function UserContextProvider({ initialuser, children }) {
  const [ user, setUser ] = useState(initialuser);
  return (
    <UserContext.Provider value={{ user , setUser }}>
      <ClientLayout>{children}</ClientLayout>
    </UserContext.Provider>
  );
}