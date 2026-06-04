"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card className="border-white/10 bg-[#101315] text-zinc-100 shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-2xl text-zinc-100">
              Revisá tu email
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Te enviamos las instrucciones para cambiar la contraseña
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm leading-6 text-zinc-400">
              Si ese email está registrado, va a recibir un enlace para cambiar
              la contraseña.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-[#101315] text-zinc-100 shadow-2xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-2xl text-zinc-100">
              Recuperar contraseña
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Escribí tu email y te mandamos un enlace para cambiar la
              contraseña
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label className="text-zinc-300" htmlFor="email">
                    Email
                  </Label>
                  <Input
                    className="border-white/10 bg-[#080a0c] text-zinc-100 placeholder:text-zinc-500"
                    id="email"
                    type="email"
                    placeholder="usuario@local.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-rose-300">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar enlace"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-zinc-500">
                ¿Ya tenés una cuenta?{" "}
                <Link
                  href="/auth/login"
                  className="text-cyan-200 underline-offset-4 hover:underline"
                >
                  Volver al login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
