import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Globe, Copy, ExternalLink, Sparkles, Award, Lock } from "lucide-react";
import {
  getMyPublicProfileSettings,
  updateMyPublicProfileSettings,
  getMyBadges,
  recomputeMyBadges,
} from "@/lib/public-profile.functions";

export const Route = createFileRoute("/_authenticated/public-profile")({
  component: PublicProfileSettingsPage,
});

const TOGGLES: { key: string; label: string; desc: string }[] = [
  { key: "show_readiness", label: "Readiness Score", desc: "Composite readiness gauge & level" },
  { key: "show_badges", label: "Badges", desc: "Earned achievements" },
  { key: "show_skills", label: "Skills", desc: "Skill levels by topic" },
  { key: "show_projects", label: "Projects", desc: "Portfolio projects" },
  { key: "show_experience", label: "Experience", desc: "Work history" },
  { key: "show_education", label: "Education", desc: "Degrees & institutions" },
  { key: "show_certifications", label: "Certifications", desc: "Issued certifications" },
  { key: "show_achievements", label: "Achievements", desc: "Awards & milestones" },
  { key: "show_contact", label: "Contact info", desc: "Email & phone (recruiters only)" },
];

function PublicProfileSettingsPage() {
  const fetchSettings = useServerFn(getMyPublicProfileSettings);
  const saveSettings = useServerFn(updateMyPublicProfileSettings);
  const fetchBadges = useServerFn(getMyBadges);
  const recompute = useServerFn(recomputeMyBadges);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [state, setState] = useState<any>({
    slug: "",
    is_public: false,
    tagline: "",
    theme: "default",
    show_readiness: true,
    show_badges: true,
    show_skills: true,
    show_projects: true,
    show_experience: true,
    show_education: true,
    show_certifications: true,
    show_achievements: true,
    show_contact: false,
  });
  const [badges, setBadges] = useState<{ definitions: any[]; ownedKeys: string[] }>({
    definitions: [],
    ownedKeys: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const [s, b] = await Promise.all([fetchSettings(), fetchBadges()]);
        if (s.settings) setState((prev: any) => ({ ...prev, ...s.settings }));
        setBadges({ definitions: b.definitions, ownedKeys: b.ownedKeys });
      } catch (e: any) {
        toast.error(e.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchSettings, fetchBadges]);

  async function save() {
    setSaving(true);
    try {
      const payload: any = { ...state };
      if (!payload.slug) payload.slug = null;
      await saveSettings({ data: payload });
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function runRecompute() {
    setRecomputing(true);
    try {
      const r = await recompute();
      const b = await fetchBadges();
      setBadges({ definitions: b.definitions, ownedKeys: b.ownedKeys });
      toast.success(
        r.awarded.length ? `Recomputed — ${r.awarded.length} badge(s) active` : "No new badges yet",
      );
    } catch (e: any) {
      toast.error(e.message ?? "Failed to recompute");
    } finally {
      setRecomputing(false);
    }
  }

  const publicUrl =
    state.slug && state.is_public
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/user/${state.slug}`
      : "";

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Public Profile</h1>
        <p className="text-sm text-muted-foreground">
          Showcase your readiness scores, skills, and projects to recruiters at a custom URL.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> Profile URL
          </CardTitle>
          <CardDescription>Pick a unique handle. Lowercase letters, digits, dashes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="flex items-center overflow-hidden rounded-md border border-input">
              <span className="select-none whitespace-nowrap bg-muted px-3 py-2 text-sm text-muted-foreground">
                /user/
              </span>
              <Input
                value={state.slug ?? ""}
                onChange={(e) => setState({ ...state, slug: e.target.value.toLowerCase() })}
                placeholder="john-doe"
                className="border-0 focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2">
              <Switch
                checked={!!state.is_public}
                onCheckedChange={(v) => setState({ ...state, is_public: v })}
              />
              <span className="text-sm font-medium">{state.is_public ? "Public" : "Private"}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Textarea
              id="tagline"
              value={state.tagline ?? ""}
              onChange={(e) => setState({ ...state, tagline: e.target.value })}
              placeholder="Aspiring Data Analyst · SQL · Python · Power BI"
              maxLength={160}
              rows={2}
            />
          </div>

          {publicUrl ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <a href={publicUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                {publicUrl}
              </a>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  toast.success("Link copied");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" /> Save with a slug and toggle public to share your link.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
          <CardDescription>Choose which sections recruiters see on your public page.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {TOGGLES.map((t) => (
            <label
              key={t.key}
              className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3"
            >
              <div>
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
              <Switch
                checked={!!state[t.key]}
                onCheckedChange={(v) => setState({ ...state, [t.key]: v })}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-4 w-4" /> Achievement Badges
            </CardTitle>
            <CardDescription>
              Earned automatically from assessments, interviews, resume, and readiness data.
            </CardDescription>
          </div>
          <Button onClick={runRecompute} disabled={recomputing} size="sm">
            {recomputing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Recompute
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.definitions.map((b) => {
            const owned = badges.ownedKeys.includes(b.key);
            return (
              <div
                key={b.key}
                className={`flex items-start gap-3 rounded-md border p-3 ${
                  owned ? "border-primary/30 bg-primary/5" : "border-border/40 opacity-60"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                    b.tier === "gold"
                      ? "bg-amber-500/15 text-amber-600"
                      : b.tier === "silver"
                        ? "bg-slate-400/15 text-slate-500"
                        : "bg-orange-700/15 text-orange-700"
                  }`}
                >
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{b.name}</span>
                    {owned ? (
                      <Badge variant="secondary" className="h-5 text-[10px]">
                        Earned
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </div>
    </div>
  );
}