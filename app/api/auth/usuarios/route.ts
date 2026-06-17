import { NextResponse } from "next/server";

import {
  listAllAuthUsers,
  mapManagedUser,
} from "@/lib/auth/admin-users";
import { getSessionUser, isAdminEmail, type UserRole } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (currentUser.role !== "admin" && currentUser.role !== "dueno") {
    return NextResponse.json(
      { error: "Solo admin y dueño pueden ver usuarios" },
      { status: 403 },
    );
  }

  try {
    const users = await listAllAuthUsers();
    const visibleUsers = users.filter((user) => !isAdminEmail(user.email));
    return NextResponse.json({ usuarios: visibleUsers.map(mapManagedUser) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (currentUser.role !== "admin" && currentUser.role !== "dueno") {
    return NextResponse.json(
      { error: "Solo admin y dueño pueden crear usuarios" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      nombre?: string;
      usuario?: string;
      email?: string;
      password?: string;
      role?: UserRole;
    };

    const nombre = body.nombre?.trim() ?? "";
    const usuario = body.usuario?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const role = body.role;

    if (role !== "dueno" && role !== "empleado") {
      return NextResponse.json(
        { error: "Elegí un rol válido" },
        { status: 400 },
      );
    }

    if (!nombre || !usuario || !email || !password) {
      return NextResponse.json(
        { error: "Completá nombre, usuario, email y contraseña" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    const users = await listAllAuthUsers();
    const normalizedUsername = usuario.toLowerCase();

    const usernameExists = users.some(
      (user) =>
        String(user.user_metadata?.username ?? "")
          .trim()
          .toLowerCase() === normalizedUsername,
    );
    if (usernameExists) {
      return NextResponse.json(
        { error: "Ese usuario ya existe" },
        { status: 409 },
      );
    }

    const emailExists = users.some(
      (user) => user.email?.trim().toLowerCase() === email,
    );
    if (emailExists) {
      return NextResponse.json(
        { error: "Ese email ya existe" },
        { status: 409 },
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: nombre,
        username: usuario,
        role,
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "No se pudo crear el usuario" },
        { status: 500 },
      );
    }

    return NextResponse.json({ usuario: mapManagedUser(data.user) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (currentUser.role !== "admin" && currentUser.role !== "dueno") {
    return NextResponse.json(
      { error: "Solo admin y dueño pueden editar usuarios" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      nombre?: string;
      usuario?: string;
      email?: string;
      password?: string;
      role?: UserRole;
    };

    const id = body.id?.trim() ?? "";
    const nombre = body.nombre?.trim() ?? "";
    const usuario = body.usuario?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const role = body.role;

    if (!id) {
      return NextResponse.json(
        { error: "Falta el usuario para editar" },
        { status: 400 },
      );
    }

    if (!nombre || !usuario || !email) {
      return NextResponse.json(
        { error: "Completá nombre, usuario y email" },
        { status: 400 },
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    const users = await listAllAuthUsers();
    const target = users.find((user) => user.id === id);

    if (!target) {
      return NextResponse.json(
        { error: "No encontramos ese usuario" },
        { status: 404 },
      );
    }

    const targetIsAdmin = isAdminEmail(target.email);

    if (targetIsAdmin && currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Solo un admin puede editar otro admin" },
        { status: 403 },
      );
    }

    if (targetIsAdmin && email !== target.email?.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "El email admin se cambia desde ERP_ADMIN_EMAILS" },
        { status: 400 },
      );
    }

    if (!targetIsAdmin && role !== "dueno" && role !== "empleado") {
      return NextResponse.json(
        { error: "Elegí un rol válido" },
        { status: 400 },
      );
    }

    if (currentUser.id === id && !targetIsAdmin && role !== currentUser.role) {
      return NextResponse.json(
        { error: "No podés cambiar tu propio rol" },
        { status: 400 },
      );
    }

    const normalizedUsername = usuario.toLowerCase();

    const usernameExists = users.some(
      (user) =>
        user.id !== id &&
        String(user.user_metadata?.username ?? "")
          .trim()
          .toLowerCase() === normalizedUsername,
    );
    if (usernameExists) {
      return NextResponse.json(
        { error: "Ese usuario ya existe" },
        { status: 409 },
      );
    }

    const emailExists = users.some(
      (user) =>
        user.id !== id && user.email?.trim().toLowerCase() === email,
    );
    if (emailExists) {
      return NextResponse.json(
        { error: "Ese email ya existe" },
        { status: 409 },
      );
    }

    const supabase = createAdminClient();
    const metadata = {
      ...(target.user_metadata ?? {}),
      name: nombre,
      username: usuario,
      role: targetIsAdmin ? target.user_metadata?.role ?? "admin" : role,
    };
    const updatePayload = {
      email,
      user_metadata: metadata,
      ...(password ? { password } : {}),
    };

    const { data, error } = await supabase.auth.admin.updateUserById(
      id,
      updatePayload,
    );

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "No se pudo editar el usuario" },
        { status: 500 },
      );
    }

    return NextResponse.json({ usuario: mapManagedUser(data.user) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (currentUser.role !== "admin" && currentUser.role !== "dueno") {
    return NextResponse.json(
      { error: "Solo admin y dueño pueden eliminar usuarios" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as { id?: string };
    const id = body.id?.trim() ?? "";

    if (!id) {
      return NextResponse.json(
        { error: "Falta el usuario para eliminar" },
        { status: 400 },
      );
    }

    if (currentUser.id === id) {
      return NextResponse.json(
        { error: "No podés eliminar el usuario con el que estás conectado" },
        { status: 400 },
      );
    }

    const users = await listAllAuthUsers();
    const target = users.find((user) => user.id === id);

    if (!target) {
      return NextResponse.json(
        { error: "No encontramos ese usuario" },
        { status: 404 },
      );
    }

    if (isAdminEmail(target.email)) {
      return NextResponse.json(
        { error: "Las cuentas admin se administran desde ERP_ADMIN_EMAILS" },
        { status: 403 },
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
