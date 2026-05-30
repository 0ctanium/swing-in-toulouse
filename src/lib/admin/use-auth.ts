import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { fetchJson, fetchJsonVoid } from "@/lib/api/fetch-json";
import { adminQueryKeys } from "@/lib/admin/query-keys";

async function adminLogin(secret: string) {
  return fetchJson(
    "/api/admin/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    },
    "Connexion impossible.",
  );
}

export function useAdminLogin() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.all, "login"],
    mutationFn: adminLogin,
    onSuccess: () => {
      router.push("/admin/events");
      router.refresh();
    },
  });
}

async function adminLogout() {
  return fetchJsonVoid(
    "/api/admin/login",
    { method: "DELETE" },
    "Déconnexion impossible.",
  );
}

export function useAdminLogout() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.all, "logout"],
    mutationFn: adminLogout,
    onSuccess: () => {
      router.push("/admin/login");
      router.refresh();
    },
  });
}
