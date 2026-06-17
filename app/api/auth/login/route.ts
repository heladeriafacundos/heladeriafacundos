import { NextResponse } from "next/server";

import { findAuthUserByUsernameOrEmail } from "@/lib/auth/admin-users";
import {
  getUserName,
  getUserRole,
  getUserUsername,
  isAdminEmail,
} from "@/lib/auth/user";
import { createOfflineSessionToken } from "@/lib/auth/offline-token";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      usuario?: string;
      password?: string;
    };

    const usuario = body.usuario?.trim() ?? "";
    const password = body.password?.trim() ?? "";

    if (!usuario || !password) {
      return NextResponse.json(
        { error: "Completá usuario y contraseña" },
        { status: 400 },
      );
    }

    const authUser = await findAuthUserByUsernameOrEmail(usuario);

    if (!authUser?.email) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 },
      );
    }

    const sessionUser = {
        id: data.user.id,
        email: data.user.email ?? null,
        username: getUserUsername(data.user),
        name: getUserName(data.user),
        isAdmin: isAdminEmail(data.user.email),
        role: getUserRole(data.user),
      };

    return NextResponse.json({
      offlineToken: createOfflineSessionToken(sessionUser),
      usuario: sessionUser,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}
