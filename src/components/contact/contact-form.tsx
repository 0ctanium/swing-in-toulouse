"use client";

import { useActionState, useId } from "react";

import { submitContact, type ContactActionState } from "@/app/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_TOPICS } from "@/lib/contact/schema";

const initialState: ContactActionState = { status: "idle" };

type ContactFormProps = {
  pageContext?: string | null;
};

export function ContactForm({ pageContext }: ContactFormProps) {
  const [state, action, pending] = useActionState(submitContact, initialState);
  const formId = useId();

  if (state.status === "success") {
    return (
      <div
        className="rounded-xl border bg-card p-6 text-sm"
        role="status"
        aria-live="polite"
      >
        <p className="font-heading text-base font-medium text-foreground">
          Message envoyé
        </p>
        <p className="text-muted-foreground mt-2">
          Merci. Je lis ça dès que possible et je vous réponds.
        </p>
      </div>
    );
  }

  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const organizationId = `${formId}-organization`;
  const topicId = `${formId}-topic`;
  const messageId = `${formId}-message`;
  const errorId = `${formId}-error`;

  return (
    <form
      action={action}
      className="flex flex-col gap-4"
      aria-describedby={state.status === "error" ? errorId : undefined}
    >
      {pageContext ? (
        <input type="hidden" name="page" value={pageContext} />
      ) : null}

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        hidden
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={nameId}>Nom</Label>
        <Input
          id={nameId}
          name="name"
          type="text"
          required
          autoComplete="name"
          maxLength={120}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={organizationId}>
          Organisation{" "}
          <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <Input
          id={organizationId}
          name="organization"
          type="text"
          autoComplete="organization"
          maxLength={160}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={topicId}>Sujet</Label>
        <select
          id={topicId}
          name="topic"
          required
          defaultValue="erreur"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={messageId}>Message</Label>
        <Textarea
          id={messageId}
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          placeholder="Décrivez l'erreur, l'événement manquant, ou votre question."
        />
      </div>

      {state.status === "error" ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Envoi…" : "Envoyer"}
      </Button>
    </form>
  );
}
