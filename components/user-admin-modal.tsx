"use client";

import { useEffect, useState } from "react";
import { Pencil, ShieldPlus, Trash2, Users, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ManagedUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  isAdmin: boolean;
  role: "admin" | "dueno" | "empleado";
  lastSignInAt: string | null;
  createdAt: string | null;
};

const roleLabels = {
  admin: "Admin",
  dueno: "Dueño",
  empleado: "Empleado",
} as const;

const formatDate = (value: string | null) => {
  if (!value) return "Sin ingreso";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export function UserAdminModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<ManagedUser["role"]>("empleado");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingUserId, setIsDeletingUserId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingUser(null);
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("empleado");
  };

  const startEditing = (user: ManagedUser) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setNotice(null);
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setNotice(null);

    const response = await fetch("/api/auth/usuarios", {
      cache: "no-store",
    }).catch(() => null);

    if (!response?.ok) {
      const data = (await response?.json().catch(() => null)) as
        | { error?: string }
        | null;
      setNotice(data?.error ?? "No se pudieron cargar los usuarios");
      setIsLoadingUsers(false);
      return;
    }

    const data = (await response.json()) as { usuarios?: ManagedUser[] };
    setUsers(data.usuarios ?? []);
    setIsLoadingUsers(false);
  };

  const deleteUser = async (user: ManagedUser) => {
    const confirmed = window.confirm(
      `¿Eliminar el usuario ${user.name}? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    setIsDeletingUserId(user.id);
    setNotice(null);

    const response = await fetch("/api/auth/usuarios", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id }),
    });

    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setNotice(data?.error ?? "No se pudo eliminar el usuario");
      setIsDeletingUserId(null);
      return;
    }

    if (editingUser?.id === user.id) {
      resetForm();
    }

    setNotice("Usuario eliminado");
    setIsDeletingUserId(null);
    await loadUsers();
  };

  useEffect(() => {
    if (!isOpen) return;
    loadUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="erp-user-modal-shell fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex h-dvh w-full max-w-4xl flex-col overflow-hidden rounded-none border border-white/10 bg-[#101315] shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-lg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-3 sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-100 sm:size-10">
              <ShieldPlus className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-zinc-100">Usuarios del sistema</h2>
              <p className="text-xs text-zinc-500 sm:text-sm">
                Admin y dueño pueden crear y editar accesos
              </p>
            </div>
          </div>
          <Button
            aria-label="Cerrar usuarios"
            className="shrink-0 border-white/10 bg-white/5 px-2 text-zinc-100 hover:bg-white/10 sm:px-3"
            onClick={onClose}
            size="sm"
            type="button"
            variant="outline"
          >
            <X className="size-4" />
            <span className="hidden sm:inline">Cerrar</span>
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-4 xl:grid-cols-[360px_1fr]">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3 sm:p-4">
            <div className="mb-4">
              <p className="font-semibold text-zinc-100">
                {editingUser ? "Editar usuario" : "Crear usuario"}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {editingUser
                  ? "La contraseña solo cambia si escribís una nueva."
                  : "El usuario entra con su nombre de usuario y contraseña."}
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setIsSaving(true);
                setNotice(null);

                const response = await fetch("/api/auth/usuarios", {
                  method: editingUser ? "PATCH" : "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: editingUser?.id,
                    nombre: name,
                    usuario: username,
                    email,
                    password,
                    role,
                  }),
                });

                const data = (await response.json().catch(() => null)) as
                  | { error?: string }
                  | null;

                if (!response.ok) {
                  setNotice(
                    data?.error ??
                      (editingUser
                        ? "No se pudo editar el usuario"
                        : "No se pudo crear el usuario"),
                  );
                  setIsSaving(false);
                  return;
                }

                const message = editingUser ? "Usuario editado" : "Usuario creado";
                resetForm();
                setNotice(message);
                setIsSaving(false);
                await loadUsers();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="user-name">Nombre</Label>
                <Input
                  id="user-name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Mica Alvarez"
                  required
                  value={name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-username">Usuario</Label>
                <Input
                  id="user-username"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="mica.caja"
                  required
                  value={username}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="empleado@local.com"
                  required
                  type="email"
                  value={email}
                  disabled={Boolean(editingUser?.isAdmin)}
                />
                {editingUser?.isAdmin && (
                  <p className="text-xs text-zinc-500">
                    El email admin se administra desde ERP_ADMIN_EMAILS.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Contraseña</Label>
                <Input
                  id="user-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={editingUser ? "Dejar vacio para no cambiar" : ""}
                  required={!editingUser}
                  type="password"
                  value={password}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">Rol</Label>
                <select
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#080a0c] px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
                  id="user-role"
                  onChange={(event) =>
                    setRole(event.target.value as ManagedUser["role"])
                  }
                  value={role}
                  disabled={Boolean(editingUser?.isAdmin)}
                >
                  {editingUser?.isAdmin && <option value="admin">Admin</option>}
                  <option value="empleado">Empleado</option>
                  <option value="dueno">Dueño</option>
                </select>
              </div>

              {notice && <p className="text-sm text-zinc-300">{notice}</p>}

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <Button
                  className="w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"
                  onClick={() => {
                    resetForm();
                    setNotice(null);
                  }}
                  type="button"
                  variant="outline"
                >
                  {editingUser ? "Cancelar edición" : "Limpiar"}
                </Button>
                <Button
                  className="w-full bg-cyan-300 font-semibold text-zinc-950 hover:bg-cyan-200 sm:w-auto"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving
                    ? "Guardando..."
                    : editingUser
                      ? "Guardar cambios"
                      : "Crear usuario"}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-3 sm:p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-zinc-100">Usuarios cargados</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Accesos habilitados para entrar al sistema
                </p>
              </div>
              <Button
                className="w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"
                onClick={loadUsers}
                size="sm"
                type="button"
                variant="outline"
              >
                Actualizar
              </Button>
            </div>

            {isLoadingUsers ? (
              <div className="rounded-lg border border-white/10 bg-[#0f1213] p-4 text-sm text-zinc-400">
                Cargando usuarios...
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-[#0f1213] p-4 text-sm text-zinc-400">
                No hay usuarios cargados.
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    className="rounded-lg border border-white/10 bg-[#0f1213] p-3 sm:p-4"
                    key={user.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 break-words font-semibold text-zinc-100">
                            {user.name}
                          </p>
                          <Badge className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/5">
                            @{user.username}
                          </Badge>
                          <Badge
                            className={
                              user.role === "admin"
                                ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10"
                                : user.role === "dueno"
                                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/10"
                                  : "border-amber-300/20 bg-amber-300/10 text-amber-100 hover:bg-amber-300/10"
                            }
                          >
                            {roleLabels[user.role]}
                          </Badge>
                        </div>
                        <p className="break-all text-sm text-zinc-400">{user.email}</p>
                      </div>
                      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                        <div className="col-span-2 flex min-w-0 items-start gap-2 text-xs text-zinc-500 sm:text-sm">
                          <Users className="mt-0.5 size-4 shrink-0" />
                          <span className="min-w-0 break-words">
                            Último ingreso: {formatDate(user.lastSignInAt)}
                          </span>
                        </div>
                        <Button
                          className="w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 sm:w-auto"
                          onClick={() => startEditing(user)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Pencil className="size-4" />
                          Editar
                        </Button>
                        <Button
                          className="w-full border-rose-300/30 bg-rose-300/10 text-rose-100 hover:bg-rose-300/20 sm:w-auto"
                          disabled={user.isAdmin || isDeletingUserId === user.id}
                          onClick={() => deleteUser(user)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 className="size-4" />
                          {isDeletingUserId === user.id ? "Eliminando..." : "Eliminar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
