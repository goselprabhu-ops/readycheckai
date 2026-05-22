import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login" });
    }
    // Phone OTP verification temporarily disabled while MSG91 is being fixed.
  },
  component: AuthedLayout,
  errorComponent: AuthedErrorBoundary,
  notFoundComponent: AuthedNotFound,
});

function AuthedErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "We couldn't load this page."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try again
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function AuthedNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function AuthedLayout() {
  return (
    <SidebarProvider>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-12 flex items-center gap-2 border-b bg-background/90 backdrop-blur px-2">
            <SidebarTrigger aria-label="Toggle navigation sidebar" />
            <Link to="/dashboard" className="font-display text-sm font-semibold">
              ReadyCheck Lab
            </Link>
          </header>
          <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 focus:outline-none">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}