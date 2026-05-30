"use client";

import { useState } from "react";

import { useAdminLogin } from "@/lib/admin/use-auth";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const login = useAdminLogin();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await login.mutateAsync(secret);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Connexion impossible.",
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-16">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Administration</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Connexion avec le secret défini dans <code>ADMIN_SECRET</code>.
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm">
          Secret admin
          <input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            className="rounded-lg border bg-background px-3 py-2"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
