"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    setIsLoading(true);

    const response = await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    }).catch(() => null);

    if (response?.ok) {
      window.location.replace("/auth/login");
      return;
    }

    setIsLoading(false);
  };

  return (
    <Button disabled={isLoading} onClick={logout} size="sm" variant="outline">
      {isLoading ? "Cerrando..." : "Cerrar sesión"}
    </Button>
  );
}
