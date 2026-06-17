import { AuthShell } from "@/components/auth-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm leading-6 text-zinc-400">
          Error de acceso: {params.error}
        </p>
      ) : (
        <p className="text-sm leading-6 text-zinc-400">
          Ocurrió un error durante la autenticación.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <AuthShell
      description="La autenticación no pudo completarse. Revisá el detalle y volvé a intentarlo."
      eyebrow="Error de acceso"
      title="No se pudo iniciar"
    >
        <div className="flex flex-col gap-6">
          <Card className="border-white/10 bg-[#101315] text-zinc-100 shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-2xl text-zinc-100">
                Algo salió mal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
    </AuthShell>
  );
}
