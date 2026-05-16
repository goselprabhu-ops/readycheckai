import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPublicProfile } from "@/lib/public-profile.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScorePill } from "@/components/common/ScorePill";
import {
  Award,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Github,
  Linkedin,
  Globe,
  Mail,
  Phone,
  Trophy,
  Share2,
} from "lucide-react";

export const Route = createFileRoute("/user/$slug")({
  loader: async ({ params }) => {
    const { profile } = await getPublicProfile({ data: { slug: params.slug } });
    if (!profile) throw notFound();
    return { profile: profile as PublicProfilePayload };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    const name = p?.profile?.full_name ?? p?.slug ?? "Profile";
    const tagline = p?.tagline ?? p?.profile?.headline ?? "ReadyCheck Lab public profile";
    const desc = `${name} — ${tagline}`;
    return {
      meta: [
        { title: `${name} · ReadyCheck Lab` },
        { name: "description", content: desc },
        { property: "og:title", content: `${name} · ReadyCheck Lab` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: PublicProfilePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl p-12 text-center">
      <h1 className="text-2xl font-bold">Profile not found</h1>
      <p className="mt-2 text-muted-foreground">
        This profile doesn’t exist or has been set to private.
      </p>
      <Button asChild className="mt-4">
        <Link to="/">Back home</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-xl p-12 text-center">
      <h1 className="text-xl font-semibold">Couldn’t load profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

type PublicProfilePayload = {
  slug: string;
  tagline?: string | null;
  theme?: string;
  profile: {
    full_name?: string | null;
    headline?: string | null;
    photo_url?: string | null;
    location?: string | null;
    target_role?: string | null;
    college?: string | null;
    summary?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  sections: {
    experience: any[];
    education: any[];
    projects: any[];
    certifications: any[];
    achievements: string[];
    skills: { name: string; level: number }[];
  };
  readiness?: {
    readiness: number;
    level: string;
    sql_score: number;
    python_score: number;
    resume_score: number;
  } | null;
  badges: {
    key: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    tier: string;
    awarded_at: string;
  }[];
};

function initialsOf(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PublicProfilePage() {
  const { profile } = Route.useLoaderData();
  const p = profile.profile;
  const s = profile.sections;

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: p.full_name ?? "ReadyCheck Lab", url });
      } catch {/* cancelled */}
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20" />
      <div className="mx-auto -mt-20 w-full max-w-5xl px-4 pb-16">
        <Card className="border-border/60 shadow-lg">
          <CardContent className="flex flex-col items-start gap-6 p-6 sm:flex-row">
            <Avatar className="h-28 w-28 border-4 border-background shadow-sm">
              <AvatarImage src={p.photo_url ?? undefined} alt={p.full_name ?? ""} />
              <AvatarFallback className="text-2xl font-semibold">
                {initialsOf(p.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{p.full_name ?? "Anonymous"}</h1>
                  <p className="text-sm text-muted-foreground">
                    {profile.tagline ?? p.headline ?? p.target_role}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={onShare}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {p.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {p.location}
                  </span>
                ) : null}
                {p.college ? (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" /> {p.college}
                  </span>
                ) : null}
                {p.target_role ? (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {p.target_role}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {p.linkedin_url ? (
                  <a href={p.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                ) : null}
                {p.github_url ? (
                  <a href={p.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </a>
                ) : null}
                {p.portfolio_url ? (
                  <a href={p.portfolio_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Globe className="h-3.5 w-3.5" /> Portfolio
                  </a>
                ) : null}
                {p.email ? (
                  <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Mail className="h-3.5 w-3.5" /> {p.email}
                  </a>
                ) : null}
                {p.phone ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {p.phone}
                  </span>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {p.summary ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {p.summary}
                </CardContent>
              </Card>
            ) : null}

            {s.experience?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {s.experience.map((x: any, i: number) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-4">
                      <div className="text-sm font-semibold">{x.role}</div>
                      <div className="text-xs text-muted-foreground">
                        {x.company} · {x.start}{x.end ? ` – ${x.end}` : ""}
                      </div>
                      {x.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{x.description}</p>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {s.projects?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Projects</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {s.projects.map((pr: any, i: number) => (
                    <a
                      key={i}
                      href={pr.link || "#"}
                      target={pr.link ? "_blank" : undefined}
                      rel="noreferrer"
                      className="block rounded-md border border-border/60 p-3 transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div className="text-sm font-semibold">{pr.name}</div>
                      {pr.description ? (
                        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                          {pr.description}
                        </p>
                      ) : null}
                      {pr.tech?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {pr.tech.map((t: string) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </a>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {s.education?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Education</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {s.education.map((e: any, i: number) => (
                    <div key={i}>
                      <div className="text-sm font-semibold">{e.institution}</div>
                      <div className="text-xs text-muted-foreground">
                        {[e.degree, e.field].filter(Boolean).join(" · ")} · {e.start}{e.end ? ` – ${e.end}` : ""}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {s.certifications?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Certifications</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {s.certifications.map((c: any, i: number) => (
                    <div key={i} className="rounded-md bg-muted/40 p-2 text-sm">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.issuer} · {c.year}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {s.achievements?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                    {s.achievements.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            {profile.readiness ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Readiness
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="text-4xl font-bold tabular-nums">{profile.readiness.readiness}</div>
                    <Badge>{profile.readiness.level}</Badge>
                  </div>
                  <Progress value={profile.readiness.readiness} />
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div>
                      <ScorePill score={profile.readiness.sql_score} />
                      <div className="mt-1 text-muted-foreground">SQL</div>
                    </div>
                    <div>
                      <ScorePill score={profile.readiness.python_score} />
                      <div className="mt-1 text-muted-foreground">Python</div>
                    </div>
                    <div>
                      <ScorePill score={profile.readiness.resume_score} />
                      <div className="mt-1 text-muted-foreground">Resume</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {profile.badges?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4" /> Badges
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {profile.badges.map((b) => (
                    <div
                      key={b.key}
                      className={`rounded-md border p-2 text-center ${
                        b.tier === "gold"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : b.tier === "silver"
                            ? "border-slate-400/30 bg-slate-400/5"
                            : "border-orange-700/30 bg-orange-700/5"
                      }`}
                      title={b.description}
                    >
                      <Award
                        className={`mx-auto h-5 w-5 ${
                          b.tier === "gold"
                            ? "text-amber-600"
                            : b.tier === "silver"
                              ? "text-slate-500"
                              : "text-orange-700"
                        }`}
                      />
                      <div className="mt-1 text-xs font-semibold leading-tight">{b.name}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {s.skills?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Skills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {s.skills.slice(0, 12).map((sk) => (
                    <div key={sk.name}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{sk.name}</span>
                        <span className="tabular-nums text-muted-foreground">{sk.level}</span>
                      </div>
                      <Progress value={sk.level} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-dashed">
              <CardContent className="p-4 text-center text-xs text-muted-foreground">
                Powered by <Link to="/" className="font-medium text-primary hover:underline">ReadyCheck Lab</Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}