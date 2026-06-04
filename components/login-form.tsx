"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const translateLoginError = (message: string) => {
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "Usuario o contraseña incorrectos";
  }

  if (normalized.includes("email not confirmed")) {
    return "Tu email todavía no fue confirmado";
  }

  if (normalized.includes("too many requests")) {
    return "Hay demasiados intentos. Esperá un momento y probá de nuevo";
  }

  if (normalized.includes("network")) {
    return "No se pudo conectar. Revisá internet e intentá de nuevo";
  }

  return message;
};

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: username,
          password,
        }),
      });

      const loginData = (await loginResponse.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!loginResponse.ok) {
        throw new Error(
          loginData?.error ?? "Usuario o contraseña incorrectos",
        );
      }

      window.location.replace("/");
      return;
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? translateLoginError(error.message)
          : "No se pudo iniciar sesión",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-white/10 bg-[#101315] text-zinc-100 shadow-2xl">
        <CardHeader className="border-b border-white/10 pb-5">
          <CardTitle className="text-2xl text-zinc-100">Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label className="text-zinc-300" htmlFor="username">
                  Usuario
                </Label>
                <Input
                  className="border-white/10 bg-[#080a0c] text-zinc-100 placeholder:text-zinc-500"
                  id="username"
                  type="text"
                  placeholder="usuario.admin"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label className="text-zinc-300" htmlFor="password">
                    Contraseña
                  </Label>
                </div>
                <Input
                  className="border-white/10 bg-[#080a0c] text-zinc-100"
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <Button
                type="submit"
                className="w-full border border-white/10 bg-white/5 font-semibold text-zinc-100 hover:bg-white/10"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              <a
                className="inline-block text-cyan-200 transition hover:text-cyan-100"
                href="/auth/forgot-password"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
