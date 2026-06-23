import { Roles } from "@/types/global";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata.role === role;
};

export const assertRole = async (role: Roles) => {
  const { sessionClaims } = await auth();

  if (!sessionClaims) {
    redirect("/admin/login");
  }

  const isAdmin = sessionClaims.metadata.role === role;

  if (!isAdmin) {
    redirect("/admin");
  }
};
