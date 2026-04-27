import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/exit")({ component: () => (
  <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
    <div>
      <h1 className="text-3xl font-bold">👋 Goodbye!</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your browser doesn't allow scripts to close tabs they didn't open. You can close this tab, or…</p>
      <Link to="/" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go back home</Link>
    </div>
  </div>
)});
