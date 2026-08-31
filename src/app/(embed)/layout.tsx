import { EmbedLinkBehavior } from "@/components/embed/embed-link-behavior";

export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-full flex-1 flex-col bg-background">
      <EmbedLinkBehavior />
      {children}
    </main>
  );
}
