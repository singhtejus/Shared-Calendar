"use server";

import { redirect } from "next/navigation";

import { clearUserSession } from "@/lib/auth";

export async function logoutAction() {
  await clearUserSession();
  redirect("/");
}
