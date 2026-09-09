import { ContactErrorLink } from "@/components/contact/contact-error-link";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-3xl font-semibold">Page introuvable</h1>
      <p className="text-muted-foreground">
        Cet événement, cet organisateur ou ce lieu n&apos;existe pas (encore).
      </p>
      <ContactErrorLink />
    </div>
  );
}
