import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <AuthShell
      description="Accedé con un usuario creado por el administrador."
      eyebrow="Acceso privado"
      title="Entrá al sistema"
    >
        <LoginForm />
    </AuthShell>
  );
}
