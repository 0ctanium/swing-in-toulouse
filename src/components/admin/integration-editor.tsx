"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Code2,
  Eye,
  Globe,
  LayoutTemplate,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CustomDomainStatus } from "@/db/schema";
import { fetchJson, fetchJsonVoid } from "@/lib/api/fetch-json";
import { buildEmbedSnippet } from "@/lib/integrations/embed-snippet";
import {
  buildPreviewEmbedUrl,
  postIntegrationPreviewConfig,
} from "@/lib/integrations/embed-preview";
import type { IntegrationListItem } from "@/lib/integrations/serialize";
import {
  buildAppearanceFormState,
  buildIntegrationThemeDefaults,
  serializeAppearanceFormState,
  type IntegrationAppearanceFormState,
} from "@/lib/integrations/theme";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

type DnsRecord = {
  type: string;
  name: string;
  value: string;
  reason?: string;
};

type DomainState = {
  customDomain: string | null;
  customDomainStatus: CustomDomainStatus;
  customDomainAddedAt: string | null;
  customDomainVerifiedAt: string | null;
  dnsRecords: DnsRecord[];
};

type EditorSection = "general" | "display" | "embed" | "domain";

type IntegrationEditorProps = {
  integration: IntegrationListItem;
  organizationName: string;
};

const statusLabels: Record<CustomDomainStatus, string> = {
  none: "Non configuré",
  pending: "En attente",
  verified: "Vérifié",
  failed: "Échec",
};

const navItems: {
  id: EditorSection;
  label: string;
  icon: typeof Settings2;
}[] = [
  { id: "general", label: "Général", icon: Settings2 },
  { id: "display", label: "Affichage", icon: Eye },
  { id: "embed", label: "Intégration", icon: Code2 },
  { id: "domain", label: "Domaine", icon: Globe },
];

export function IntegrationEditor({
  integration: initialIntegration,
  organizationName,
}: IntegrationEditorProps) {
  const router = useRouter();
  const [section, setSection] = useState<EditorSection>("general");
  const [integration, setIntegration] =
    useState<IntegrationListItem>(initialIntegration);
  const [name, setName] = useState(initialIntegration.name);
  const [isActive, setIsActive] = useState(initialIntegration.isActive);
  const themeDefaults = buildIntegrationThemeDefaults({
    integrationName: integration.name,
    organizationName,
  });
  const [appearanceForm, setAppearanceForm] =
    useState<IntegrationAppearanceFormState>(() =>
      buildAppearanceFormState(initialIntegration.theme, themeDefaults),
    );
  const [savedAppearanceForm, setSavedAppearanceForm] =
    useState<IntegrationAppearanceFormState>(appearanceForm);
  const [domain, setDomain] = useState(initialIntegration.customDomain ?? "");
  const [domainState, setDomainState] = useState<DomainState>({
    customDomain: initialIntegration.customDomain,
    customDomainStatus: initialIntegration.customDomainStatus,
    customDomainAddedAt: null,
    customDomainVerifiedAt: null,
    dnsRecords: [],
  });
  const [pending, setPending] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const { url: embedUrl, snippet: embedSnippet } = buildEmbedSnippet({
    integrationId: integration.id,
    organizationName,
    integrationName: integration.name,
  });

  const [previewSrc, setPreviewSrc] = useState(() =>
    buildPreviewEmbedUrl(embedUrl, appearanceForm),
  );

  const sendPreviewConfig = useCallback(() => {
    postIntegrationPreviewConfig(
      previewIframeRef.current?.contentWindow,
      window.location.origin,
      appearanceForm,
    );
  }, [appearanceForm]);

  useEffect(() => {
    setPreviewSrc(buildPreviewEmbedUrl(embedUrl, appearanceForm));
  }, [embedUrl]);

  useEffect(() => {
    sendPreviewConfig();
  }, [sendPreviewConfig]);

  const refreshPreview = useCallback(() => {
    setPreviewSrc(buildPreviewEmbedUrl(embedUrl, appearanceForm));
    setPreviewKey((current) => current + 1);
  }, [appearanceForm, embedUrl]);

  useEffect(() => {
    if (!integration.customDomain) {
      return;
    }

    let cancelled = false;

    void fetchJson<{ domain: DomainState }>(
      `/api/admin/integrations/${integration.id}/custom-domain`,
      undefined,
      "Chargement du domaine impossible.",
    )
      .then((result) => {
        if (!cancelled) {
          setDomainState(result.domain);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [integration.customDomain, integration.id]);

  async function handleSaveDisplay() {
    setPending(true);

    try {
      const result = await fetchJson<{ integration: IntegrationListItem }>(
        `/api/admin/integrations/${integration.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            theme: {
              ...(integration.theme ?? {}),
              ...serializeAppearanceFormState(appearanceForm),
            },
          }),
        },
        "Enregistrement impossible.",
      );
      const nextDefaults = buildIntegrationThemeDefaults({
        integrationName: result.integration.name,
        organizationName,
      });
      const nextAppearanceForm = buildAppearanceFormState(
        result.integration.theme,
        nextDefaults,
      );
      setIntegration(result.integration);
      setAppearanceForm(nextAppearanceForm);
      setSavedAppearanceForm(nextAppearanceForm);
      refreshPreview();
      router.refresh();
      toast.success("Affichage enregistré.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleSaveGeneral() {
    setPending(true);

    try {
      const result = await fetchJson<{ integration: IntegrationListItem }>(
        `/api/admin/integrations/${integration.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            isActive,
          }),
        },
        "Enregistrement impossible.",
      );
      setIntegration(result.integration);
      setName(result.integration.name);
      setIsActive(result.integration.isActive);
      refreshPreview();
      router.refresh();
      toast.success("Intégration enregistrée.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleRegisterDomain(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);

    try {
      const result = await fetchJson<{ domain: DomainState }>(
        `/api/admin/integrations/${integration.id}/custom-domain`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        },
        "Configuration du domaine impossible.",
      );
      setDomainState(result.domain);
      setDomain(result.domain.customDomain ?? "");
      setIntegration((current) => ({
        ...current,
        customDomain: result.domain.customDomain,
        customDomainStatus: result.domain.customDomainStatus,
      }));
      toast.success("Domaine envoyé à Vercel.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Configuration impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyDomain() {
    setPending(true);

    try {
      const result = await fetchJson<{ domain: DomainState }>(
        `/api/admin/integrations/${integration.id}/custom-domain/verify`,
        { method: "POST" },
        "Vérification impossible.",
      );
      setDomainState(result.domain);
      setIntegration((current) => ({
        ...current,
        customDomainStatus: result.domain.customDomainStatus,
      }));
      toast.success(
        result.domain.customDomainStatus === "verified"
          ? "Domaine vérifié."
          : "Le domaine n'est pas encore vérifié.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Vérification impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleRefreshDomain() {
    setPending(true);

    try {
      const result = await fetchJson<{ domain: DomainState }>(
        `/api/admin/integrations/${integration.id}/custom-domain`,
        undefined,
        "Chargement du domaine impossible.",
      );
      setDomainState(result.domain);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Actualisation impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteDomain() {
    setPending(true);

    try {
      const result = await fetchJson<{ domain: DomainState }>(
        `/api/admin/integrations/${integration.id}/custom-domain`,
        { method: "DELETE" },
        "Suppression impossible.",
      );
      setDomainState(result.domain);
      setDomain("");
      setIntegration((current) => ({
        ...current,
        customDomain: null,
        customDomainStatus: "none",
      }));
      toast.success("Domaine supprimé.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteIntegration() {
    if (
      !window.confirm(
        `Supprimer l'intégration « ${integration.name} » ? Cette action est irréversible.`,
      )
    ) {
      return;
    }

    setPending(true);

    try {
      await fetchJsonVoid(
        `/api/admin/integrations/${integration.id}`,
        { method: "DELETE" },
        "Suppression impossible.",
      );
      toast.success("Intégration supprimée.");
      router.push("/admin/integration");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  const generalDirty =
    name.trim() !== integration.name || isActive !== integration.isActive;
  const displayDirty =
    JSON.stringify(appearanceForm) !== JSON.stringify(savedAppearanceForm);

  return (
    <div className="bg-background flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/integration" />}
          >
            <ArrowLeft data-icon="inline-start" />
            Intégrations
          </Button>
          <div className="bg-border hidden h-5 w-px sm:block" />
          <div className="min-w-0">
            <p className="truncate font-medium">{integration.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {organizationName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={integration.isActive ? "outline" : "secondary"}>
            {integration.isActive ? "Active" : "Inactive"}
          </Badge>
          {section === "general" && generalDirty ? (
            <Button
              type="button"
              size="sm"
              disabled={pending || !name.trim()}
              onClick={() => void handleSaveGeneral()}
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          ) : null}
          {section === "display" && displayDirty ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => void handleSaveDisplay()}
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        <aside className="flex w-14 shrink-0 flex-col border-r">
          <TooltipProvider delay={0}>
            <nav className="flex flex-col items-center gap-1 p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = section === item.id;

                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          onClick={() => setSection(item.id)}
                          aria-label={item.label}
                          className={cn(
                            "flex size-9 items-center justify-center rounded-md transition-colors",
                            isActive
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          )}
                        />
                      }
                    >
                      <Icon className="size-4 shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </TooltipProvider>
        </aside>

        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full min-h-0 min-w-0 flex-1"
        >
          <ResizablePanel
            id="integration-settings"
            defaultSize="38%"
            minSize={360}
            maxSize="65%"
          >
            <div className="flex h-full min-h-0 flex-col overflow-y-auto p-6">
              {section === "general" ? (
                <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-semibold">Général</h2>
                    <p className="text-muted-foreground text-sm">
                      Nom et statut de l&apos;intégration.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="integration-name">Nom</Label>
                      <Input
                        id="integration-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        disabled={pending}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Active</p>
                        <p className="text-muted-foreground text-sm">
                          Désactivez pour masquer l&apos;intégration sans la
                          supprimer.
                        </p>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        disabled={pending}
                      />
                    </div>

                    <div className="border-t pt-6">
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={pending}
                        onClick={() => void handleDeleteIntegration()}
                      >
                        Supprimer l&apos;intégration
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {section === "display" ? (
                <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-semibold">Affichage</h2>
                    <p className="text-muted-foreground text-sm">
                      Personnalisez le contenu et la mise en page de
                      l&apos;intégration embarquée.
                    </p>
                  </div>

                  <div className="flex flex-col gap-6">
                    <section className="flex flex-col gap-3">
                      <h3 className="text-sm font-semibold">Général</h3>
                      <div className="flex flex-col gap-4 rounded-lg border p-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="appearance-page-title">
                            Titre de la page
                          </Label>
                          <Input
                            id="appearance-page-title"
                            value={appearanceForm.general.pageTitle}
                            disabled={pending}
                            onChange={(event) => {
                              setAppearanceForm((current) => ({
                                ...current,
                                general: {
                                  ...current.general,
                                  pageTitle: event.target.value,
                                },
                              }));
                            }}
                          />
                          <p className="text-muted-foreground text-xs">
                            Titre SEO. Laissez vide pour ne pas afficher de
                            titre.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="appearance-page-description">
                            Description de la page
                          </Label>
                          <Textarea
                            id="appearance-page-description"
                            value={appearanceForm.general.pageDescription}
                            disabled={pending}
                            rows={3}
                            onChange={(event) => {
                              setAppearanceForm((current) => ({
                                ...current,
                                general: {
                                  ...current.general,
                                  pageDescription: event.target.value,
                                },
                              }));
                            }}
                          />
                          <p className="text-muted-foreground text-xs">
                            Description SEO. Laissez vide pour ne pas en
                            définir.
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="flex flex-col gap-3">
                      <h3 className="text-sm font-semibold">En-tête</h3>
                      <div className="overflow-hidden rounded-lg border">
                        <div className="flex items-center justify-between gap-4 p-4">
                          <div>
                            <p className="font-medium">Afficher l&apos;en-tête</p>
                            <p className="text-muted-foreground text-sm">
                              Bloc titre au-dessus de l&apos;agenda.
                            </p>
                          </div>
                          <Switch
                            checked={appearanceForm.header.displayHeader}
                            disabled={pending}
                            onCheckedChange={(checked) => {
                              setAppearanceForm((current) => ({
                                ...current,
                                header: {
                                  ...current.header,
                                  displayHeader: checked,
                                },
                              }));
                            }}
                          />
                        </div>

                        <div
                          className={cn(
                            "border-t bg-muted/30 px-4 py-3",
                            !appearanceForm.header.displayHeader && "opacity-60",
                          )}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="appearance-main-title">
                                Titre principal
                              </Label>
                              <Input
                                id="appearance-main-title"
                                value={appearanceForm.header.mainTitle}
                                disabled={
                                  pending || !appearanceForm.header.displayHeader
                                }
                                onChange={(event) => {
                                  setAppearanceForm((current) => ({
                                    ...current,
                                    header: {
                                      ...current.header,
                                      mainTitle: event.target.value,
                                    },
                                  }));
                                }}
                              />
                              <p className="text-muted-foreground text-xs">
                                Vide pour masquer. Défaut :{" "}
                                {themeDefaults.header.mainTitle}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="appearance-secondary-title">
                                Sous-titre
                              </Label>
                              <Input
                                id="appearance-secondary-title"
                                value={appearanceForm.header.secondaryTitle}
                                disabled={
                                  pending || !appearanceForm.header.displayHeader
                                }
                                onChange={(event) => {
                                  setAppearanceForm((current) => ({
                                    ...current,
                                    header: {
                                      ...current.header,
                                      secondaryTitle: event.target.value,
                                    },
                                  }));
                                }}
                              />
                              <p className="text-muted-foreground text-xs">
                                Vide pour masquer. Défaut :{" "}
                                {themeDefaults.header.secondaryTitle}
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-md border bg-background px-3 py-2.5">
                              <div>
                                <p className="text-sm font-medium">
                                  Lien vers la fiche organisateur
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Affiche « Voir la fiche complète ».
                                </p>
                              </div>
                              <Switch
                                checked={
                                  appearanceForm.header.displayOrganizerLink
                                }
                                disabled={
                                  pending || !appearanceForm.header.displayHeader
                                }
                                onCheckedChange={(checked) => {
                                  setAppearanceForm((current) => ({
                                    ...current,
                                    header: {
                                      ...current.header,
                                      displayOrganizerLink: checked,
                                    },
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="flex flex-col gap-3">
                      <h3 className="text-sm font-semibold">Agenda</h3>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                          <div>
                            <p className="font-medium">Filtres</p>
                            <p className="text-muted-foreground text-sm">
                              Affiche les filtres catégorie et lieu au-dessus de
                              l&apos;agenda.
                            </p>
                          </div>
                          <Switch
                            checked={appearanceForm.agenda.showFilters}
                            disabled={pending}
                            onCheckedChange={(checked) => {
                              setAppearanceForm((current) => ({
                                ...current,
                                agenda: {
                                  ...current.agenda,
                                  showFilters: checked,
                                },
                              }));
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                          <div>
                            <p className="font-medium">Vue planning</p>
                            <p className="text-muted-foreground text-sm">
                              Liste chronologique des prochains événements.
                            </p>
                          </div>
                          <Switch
                            checked={appearanceForm.agenda.planningViewEnabled}
                            disabled={
                              pending ||
                              (appearanceForm.agenda.planningViewEnabled &&
                                !appearanceForm.agenda.calendarViewEnabled)
                            }
                            onCheckedChange={(checked) => {
                              setAppearanceForm((current) => ({
                                ...current,
                                agenda: {
                                  ...current.agenda,
                                  planningViewEnabled: checked,
                                },
                              }));
                            }}
                          />
                        </div>

                        <div className="overflow-hidden rounded-lg border">
                          <div className="flex items-center justify-between gap-4 p-4">
                            <div>
                              <p className="font-medium">Vue calendrier</p>
                              <p className="text-muted-foreground text-sm">
                                Active l&apos;onglet Agenda avec le calendrier.
                              </p>
                            </div>
                            <Switch
                              checked={appearanceForm.agenda.calendarViewEnabled}
                              disabled={
                                pending ||
                                (appearanceForm.agenda.calendarViewEnabled &&
                                  !appearanceForm.agenda.planningViewEnabled)
                              }
                              onCheckedChange={(checked) => {
                                setAppearanceForm((current) => ({
                                  ...current,
                                  agenda: {
                                    ...current.agenda,
                                    calendarViewEnabled: checked,
                                  },
                                }));
                              }}
                            />
                          </div>

                          <div
                            className={cn(
                              "border-t bg-muted/30 px-4 py-3",
                              !appearanceForm.agenda.calendarViewEnabled &&
                                "opacity-60",
                            )}
                          >
                            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                              Sous-vues du calendrier
                            </p>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-4 rounded-md border bg-background px-3 py-2.5">
                                <div>
                                  <p className="text-sm font-medium">Vue mois</p>
                                  <p className="text-muted-foreground text-xs">
                                    Calendrier mensuel.
                                  </p>
                                </div>
                                <Switch
                                  checked={appearanceForm.agenda.monthViewEnabled}
                                  disabled={
                                    pending ||
                                    !appearanceForm.agenda.calendarViewEnabled ||
                                    (appearanceForm.agenda.monthViewEnabled &&
                                      !appearanceForm.agenda.fourWeeksViewEnabled)
                                  }
                                  onCheckedChange={(checked) => {
                                    setAppearanceForm((current) => ({
                                      ...current,
                                      agenda: {
                                        ...current.agenda,
                                        monthViewEnabled: checked,
                                      },
                                    }));
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between gap-4 rounded-md border bg-background px-3 py-2.5">
                                <div>
                                  <p className="text-sm font-medium">
                                    Vue 4 semaines
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    Grille glissante sur 4 semaines.
                                  </p>
                                </div>
                                <Switch
                                  checked={
                                    appearanceForm.agenda.fourWeeksViewEnabled
                                  }
                                  disabled={
                                    pending ||
                                    !appearanceForm.agenda.calendarViewEnabled ||
                                    (appearanceForm.agenda.fourWeeksViewEnabled &&
                                      !appearanceForm.agenda.monthViewEnabled)
                                  }
                                  onCheckedChange={(checked) => {
                                    setAppearanceForm((current) => ({
                                      ...current,
                                      agenda: {
                                        ...current.agenda,
                                        fourWeeksViewEnabled: checked,
                                      },
                                    }));
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              ) : null}

              {section === "embed" ? (
                <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-semibold">Intégration</h2>
                    <p className="text-muted-foreground text-sm">
                      Copiez ce code sur le site de l&apos;organisateur.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      nativeButton={false}
                      render={<Link href={embedUrl} target="_blank" />}
                    >
                      Ouvrir l&apos;agenda embarqué
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard.writeText(embedSnippet);
                        toast.success("Code copié.");
                      }}
                    >
                      Copier le code
                    </Button>
                  </div>

                  <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs">
                    <code>{embedSnippet}</code>
                  </pre>

                  <div className="flex flex-col gap-2">
                    <Label>URL directe</Label>
                    <Input readOnly value={embedUrl} />
                  </div>
                </div>
              ) : null}

              {section === "domain" ? (
                <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Domaine personnalisé
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Un sous-domaine dédié à cette intégration (ex.
                      agenda.example.fr).
                    </p>
                  </div>

                  <form
                    className="flex flex-col gap-3"
                    onSubmit={handleRegisterDomain}
                  >
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="custom-domain">Domaine</Label>
                      <Input
                        id="custom-domain"
                        value={domain}
                        onChange={(event) => setDomain(event.target.value)}
                        placeholder="agenda.example.fr"
                        disabled={pending}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-fit"
                      disabled={pending || !domain.trim()}
                    >
                      Enregistrer
                    </Button>
                  </form>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        domainState.customDomainStatus === "verified"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {statusLabels[domainState.customDomainStatus]}
                    </Badge>
                    {domainState.customDomain ? (
                      <span className="text-muted-foreground text-sm">
                        {domainState.customDomain}
                      </span>
                    ) : null}
                  </div>

                  {domainState.dnsRecords.length > 0 ? (
                    <div className="rounded-lg border">
                      <div className="grid grid-cols-3 gap-2 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                        <span>Type</span>
                        <span>Nom</span>
                        <span>Valeur</span>
                      </div>
                      {domainState.dnsRecords.map((record, index) => (
                        <div
                          key={`${record.type}-${record.name}-${index}`}
                          className="grid grid-cols-3 gap-2 px-3 py-2 text-sm"
                        >
                          <span>{record.type}</span>
                          <span className="break-all">{record.name}</span>
                          <span className="break-all">{record.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleVerifyDomain()}
                      disabled={pending || !domainState.customDomain}
                    >
                      Vérifier
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleRefreshDomain()}
                      disabled={pending || !domainState.customDomain}
                    >
                      Actualiser
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void handleDeleteDomain()}
                      disabled={pending || !domainState.customDomain}
                    >
                      Supprimer le domaine
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="w-1.5" />

          <ResizablePanel
            id="integration-preview"
            defaultSize="62%"
            minSize="25%"
          >
            <div className="bg-muted/30 flex h-full min-h-0 flex-col">
              <div className="text-muted-foreground flex shrink-0 items-center gap-2 border-b px-4 py-2 text-xs font-medium">
                <LayoutTemplate className="size-3.5" />
                Aperçu
              </div>
              <div className="relative min-h-0 flex-1 p-4">
                <iframe
                  ref={previewIframeRef}
                  key={previewKey}
                  src={previewSrc}
                  title={`${integration.name} — ${organizationName}`}
                  className="bg-background h-full w-full rounded-lg border shadow-sm"
                  loading="lazy"
                  onLoad={sendPreviewConfig}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
