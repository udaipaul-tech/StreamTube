import { createFileRoute } from "@tanstack/react-router";
import NavBar from "@/components/NavBar";

export const Route = createFileRoute("/auth")({ component: () => <Stub title="Sign in" /> });

function Stub({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This screen is being built in the next step. The data model, gesture player, comments, plans, payments and call signaling are already wired up — UI for this route is coming.
        </p>
      </main>
    </div>
  );
}
