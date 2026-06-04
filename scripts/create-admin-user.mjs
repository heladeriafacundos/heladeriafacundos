import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");

const env = {};
for (const rawLine of envContent.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const separatorIndex = line.indexOf("=");
  if (separatorIndex === -1) continue;
  const key = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();
  env[key] = value;
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Faltan variables de Supabase en .env.local");
}

const email = "matiasbarbeito23@gmail.com";
const password = "AdminLocal!2026";
const username = "matiasbarbeito23";
const name = "Matias Barbeito";
const role = "admin";

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function listAllUsers() {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    users.push(...data.users);

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return users;
}

const users = await listAllUsers();
const existingUser = users.find(
  (user) => user.email?.trim().toLowerCase() === email,
);

if (existingUser) {
  const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(existingUser.user_metadata ?? {}),
      name,
      username,
      role,
    },
  });

  if (error) {
    throw error;
  }

  console.log(
    JSON.stringify({
      ok: true,
      action: "updated",
      email,
      username,
      password,
      role,
    }),
  );
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      username,
      role,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error("No se pudo crear el usuario admin");
  }

  console.log(
    JSON.stringify({
      ok: true,
      action: "created",
      email,
      username,
      password,
      role,
    }),
  );
}
