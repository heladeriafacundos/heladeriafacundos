import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function Page() {
  return (
    <AuthShell
      description="Si ya tenés acceso, podés recuperar tu contraseña desde acá sin abrir el registro público."
      eyebrow="Soporte de acceso"
      title="Recuperar contraseña"
    >
        <ForgotPasswordForm />
    </AuthShell>
  );
}
