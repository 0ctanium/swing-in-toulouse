"use client";

import { useCallback, useEffect, useState } from "react";
import { ShareIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const footerLinkClass = "text-foreground underline hover:no-underline";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function PwaInstallButton() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      return;
    }

    setVisible(true);
    setIos(isIos());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    setInstructionsOpen(true);
  }, [deferredPrompt]);

  if (!visible) {
    return null;
  }

  return (
    <p>
      Raccourci sur votre téléphone :{" "}
      <button type="button" onClick={handleClick} className={footerLinkClass}>
        Installer l&apos;application
      </button>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Installer l&apos;application</DialogTitle>
          </DialogHeader>
          {ios ? (
            <ol className="list-decimal space-y-2 pl-4 text-muted-foreground">
              <li>
                Appuyez sur{" "}
                <ShareIcon
                  className="inline size-4 align-text-bottom"
                  aria-hidden
                />{" "}
                <span className="text-foreground">Partager</span> dans Safari.
              </li>
              <li>
                Faites défiler et choisissez{" "}
                <span className="text-foreground">
                  Sur l&apos;écran d&apos;accueil
                </span>
                .
              </li>
              <li>
                Appuyez sur <span className="text-foreground">Ajouter</span>.
              </li>
            </ol>
          ) : (
            <ol className="list-decimal space-y-2 pl-4 text-muted-foreground">
              <li>
                Ouvrez le menu du navigateur (icône{" "}
                <span className="text-foreground">⋮</span> ou{" "}
                <span className="text-foreground">⋯</span>).
              </li>
              <li>
                Choisissez{" "}
                <span className="text-foreground">
                  Installer l&apos;application
                </span>{" "}
                ou{" "}
                <span className="text-foreground">
                  Ajouter à l&apos;écran d&apos;accueil
                </span>
                .
              </li>
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </p>
  );
}
