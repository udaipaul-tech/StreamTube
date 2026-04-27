import { createFileRoute } from "@tanstack/react-router";
import NavBar from "@/components/NavBar";

export const Route = createFileRoute("/call")({ component: () => (
  <div className="min-h-screen bg-background text-foreground">
    <NavBar />
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Video calls</h1>
      <p className="mt-2 text-sm text-muted-foreground">VoIP room with screen-share + recording is coming next turn.</p>
    </main>
  </div>
)});
