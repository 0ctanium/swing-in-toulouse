export default function EmbedNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="font-heading text-xl font-semibold">Agenda introuvable</h1>
      <p className="text-muted-foreground text-sm">
        Cette intégration n&apos;existe pas ou n&apos;est pas disponible.
      </p>
    </div>
  );
}
