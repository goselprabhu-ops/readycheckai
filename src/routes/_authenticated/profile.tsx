import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile, type ProfileInput } from "@/lib/profile.functions";
import { profileCompletion } from "@/lib/profile-completion";
import { toast } from "sonner";
import { Plus, Trash2, Camera, Loader2, Save, CheckCircle2, Download } from "lucide-react";
import { exportMyData } from "@/lib/gdpr.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type EduItem = { institution: string; degree: string; field: string; start: string; end: string; grade: string };
type ExpItem = { company: string; role: string; start: string; end: string; description: string };
type ProjItem = { name: string; description: string; link: string; tech: string[] };
type CertItem = { name: string; issuer: string; year: string };

const emptyEdu: EduItem = { institution: "", degree: "", field: "", start: "", end: "", grade: "" };
const emptyExp: ExpItem = { company: "", role: "", start: "", end: "", description: "" };
const emptyProj: ProjItem = { name: "", description: "", link: "", tech: [] };
const emptyCert: CertItem = { name: "", issuer: "", year: "" };

function ProfilePage() {
  const nav = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);
  const runExport = useServerFn(exportMyData);
  const [exporting, setExporting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Core fields
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [location, setLocation] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [summary, setSummary] = useState("");
  const [education, setEducation] = useState<EduItem[]>([]);
  const [experience, setExperience] = useState<ExpItem[]>([]);
  const [projects, setProjects] = useState<ProjItem[]>([]);
  const [certifications, setCertifications] = useState<CertItem[]>([]);
  const [languages, setLanguages] = useState<string>("");
  const [achievements, setAchievements] = useState<string>("");
  const [interests, setInterests] = useState<string>("");
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then(({ profile }) => {
        const p = (profile ?? {}) as any;
        setFullName(p.full_name ?? "");
        setHeadline(p.headline ?? "");
        setPhone(p.phone ?? "");
        setPhotoUrl(p.photo_url ?? "");
        setLocation(p.location ?? "");
        setDob(p.dob ?? "");
        setGender(p.gender ?? "");
        setCollege(p.college ?? "");
        setYear(p.year ?? "");
        setTargetRole(p.target_role ?? "");
        setLinkedin(p.linkedin_url ?? "");
        setGithub(p.github_url ?? "");
        setPortfolio(p.portfolio_url ?? "");
        setSummary(p.summary ?? "");
        setEducation(Array.isArray(p.education) ? p.education : []);
        setExperience(Array.isArray(p.experience) ? p.experience : []);
        setProjects(Array.isArray(p.projects) ? p.projects : []);
        setCertifications(Array.isArray(p.certifications) ? p.certifications : []);
        setLanguages((p.languages ?? []).join(", "));
        setAchievements((p.achievements ?? []).join("\n"));
        setInterests((p.interests ?? []).join(", "));
        setOnboarded(!!p.onboarded);
      })
      .finally(() => setLoading(false));
  }, []);

  const completion = useMemo(
    () =>
      profileCompletion({
        full_name: fullName,
        headline,
        phone,
        photo_url: photoUrl,
        location,
        target_role: targetRole,
        college,
        year,
        summary,
        linkedin_url: linkedin,
        github_url: github,
        portfolio_url: portfolio,
        education,
        experience,
        projects,
        certifications,
        languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
        achievements: achievements.split("\n").map((s) => s.trim()).filter(Boolean),
      }),
    [fullName, headline, phone, photoUrl, location, targetRole, college, year, summary, linkedin, github, portfolio, education, experience, projects, certifications, languages, achievements],
  );

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setUploadingPhoto(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      setPhotoUrl(pub.publicUrl);
      toast.success("Photo uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const save = async (markOnboarded = false) => {
    setSaving(true);
    try {
      const payload: ProfileInput = {
        full_name: fullName || null,
        headline: headline || null,
        phone: phone || null,
        photo_url: photoUrl || null,
        location: location || null,
        dob: dob || null,
        gender: gender || null,
        college: college || null,
        year: year || null,
        target_role: targetRole || null,
        linkedin_url: linkedin || null,
        github_url: github || null,
        portfolio_url: portfolio || null,
        summary: summary || null,
        education,
        experience,
        projects,
        certifications,
        languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
        achievements: achievements.split("\n").map((s) => s.trim()).filter(Boolean),
        interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
        onboarded: markOnboarded ? true : onboarded || undefined,
      };
      await saveProfile({ data: payload });
      if (markOnboarded) setOnboarded(true);
      toast.success("Profile saved");
      if (markOnboarded) nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header strip */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={photoUrl || undefined} alt="Profile photo" />
              <AvatarFallback>{(fullName || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer shadow ring-2 ring-background" aria-label="Upload photo">
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </label>
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-semibold">
                  {fullName || "Your profile"}
                </h1>
                <p className="text-sm text-muted-foreground">{headline || "Add a headline to stand out"}</p>
              </div>
              <Badge variant={completion >= 80 ? "default" : "secondary"} className="rounded-full">
                {completion}% complete
              </Badge>
            </div>
            <Progress value={completion} className="mt-3" />
          </div>
        </CardContent>
      </Card>

      {/* Basics */}
      <Section title="Basics">
        <Grid>
          <Field label="Full name" id="full_name"><Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aarav Kumar" /></Field>
          <Field label="Headline" id="headline"><Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Aspiring Data Analyst" /></Field>
          <Field label="Phone" id="phone"><Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98XXXXXXXX" /></Field>
          <Field label="Location" id="location"><Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru, India" /></Field>
          <Field label="Date of birth" id="dob"><Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
          <Field label="Gender" id="gender"><Input id="gender" value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Optional" /></Field>
          <Field label="Target role" id="target_role"><Input id="target_role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Data Analyst" /></Field>
          <Field label="College / University" id="college"><Input id="college" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="IIT Hyderabad" /></Field>
          <Field label="Year of study / graduation" id="year"><Input id="year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" /></Field>
        </Grid>
      </Section>

      <Section title="Online presence">
        <Grid>
          <Field label="LinkedIn URL" id="linkedin"><Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" /></Field>
          <Field label="GitHub URL" id="github"><Input id="github" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/…" /></Field>
          <Field label="Portfolio URL" id="portfolio"><Input id="portfolio" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://yoursite.com" /></Field>
        </Grid>
      </Section>

      <Section title="Professional summary">
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} placeholder="2–3 sentences about you, your strengths and goals." />
      </Section>

      {/* Education */}
      <RepeatableSection
        title="Education"
        items={education}
        onAdd={() => setEducation([...education, { ...emptyEdu }])}
        onRemove={(i) => setEducation(education.filter((_, idx) => idx !== i))}
        render={(e, i, update) => (
          <Grid>
            <Field label="Institution" id={`edu-inst-${i}`}><Input id={`edu-inst-${i}`} value={e.institution} onChange={(ev) => update({ ...e, institution: ev.target.value })} /></Field>
            <Field label="Degree" id={`edu-deg-${i}`}><Input id={`edu-deg-${i}`} value={e.degree} onChange={(ev) => update({ ...e, degree: ev.target.value })} placeholder="B.Tech / BSc" /></Field>
            <Field label="Field" id={`edu-field-${i}`}><Input id={`edu-field-${i}`} value={e.field} onChange={(ev) => update({ ...e, field: ev.target.value })} placeholder="Computer Science" /></Field>
            <Field label="Grade / CGPA" id={`edu-grade-${i}`}><Input id={`edu-grade-${i}`} value={e.grade} onChange={(ev) => update({ ...e, grade: ev.target.value })} placeholder="8.5 / 10" /></Field>
            <Field label="Start" id={`edu-start-${i}`}><Input id={`edu-start-${i}`} value={e.start} onChange={(ev) => update({ ...e, start: ev.target.value })} placeholder="2022" /></Field>
            <Field label="End" id={`edu-end-${i}`}><Input id={`edu-end-${i}`} value={e.end} onChange={(ev) => update({ ...e, end: ev.target.value })} placeholder="2026" /></Field>
          </Grid>
        )}
        setItems={setEducation}
      />

      {/* Experience */}
      <RepeatableSection
        title="Experience"
        items={experience}
        onAdd={() => setExperience([...experience, { ...emptyExp }])}
        onRemove={(i) => setExperience(experience.filter((_, idx) => idx !== i))}
        render={(x, i, update) => (
          <div className="space-y-3">
            <Grid>
              <Field label="Company" id={`xp-co-${i}`}><Input id={`xp-co-${i}`} value={x.company} onChange={(ev) => update({ ...x, company: ev.target.value })} /></Field>
              <Field label="Role" id={`xp-role-${i}`}><Input id={`xp-role-${i}`} value={x.role} onChange={(ev) => update({ ...x, role: ev.target.value })} /></Field>
              <Field label="Start" id={`xp-start-${i}`}><Input id={`xp-start-${i}`} value={x.start} onChange={(ev) => update({ ...x, start: ev.target.value })} placeholder="Jun 2024" /></Field>
              <Field label="End" id={`xp-end-${i}`}><Input id={`xp-end-${i}`} value={x.end} onChange={(ev) => update({ ...x, end: ev.target.value })} placeholder="Aug 2024 / Present" /></Field>
            </Grid>
            <Field label="Description" id={`xp-desc-${i}`}>
              <Textarea id={`xp-desc-${i}`} rows={3} value={x.description} onChange={(ev) => update({ ...x, description: ev.target.value })} placeholder="Impact, tools, outcomes…" />
            </Field>
          </div>
        )}
        setItems={setExperience}
      />

      {/* Projects */}
      <RepeatableSection
        title="Projects"
        items={projects}
        onAdd={() => setProjects([...projects, { ...emptyProj }])}
        onRemove={(i) => setProjects(projects.filter((_, idx) => idx !== i))}
        render={(p, i, update) => (
          <div className="space-y-3">
            <Grid>
              <Field label="Name" id={`pj-name-${i}`}><Input id={`pj-name-${i}`} value={p.name} onChange={(ev) => update({ ...p, name: ev.target.value })} /></Field>
              <Field label="Link" id={`pj-link-${i}`}><Input id={`pj-link-${i}`} value={p.link} onChange={(ev) => update({ ...p, link: ev.target.value })} placeholder="https://…" /></Field>
            </Grid>
            <Field label="Tech (comma separated)" id={`pj-tech-${i}`}>
              <Input id={`pj-tech-${i}`} value={p.tech.join(", ")} onChange={(ev) => update({ ...p, tech: ev.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="React, Postgres, Python" />
            </Field>
            <Field label="Description" id={`pj-desc-${i}`}>
              <Textarea id={`pj-desc-${i}`} rows={3} value={p.description} onChange={(ev) => update({ ...p, description: ev.target.value })} />
            </Field>
          </div>
        )}
        setItems={setProjects}
      />

      {/* Certifications */}
      <RepeatableSection
        title="Certifications"
        items={certifications}
        onAdd={() => setCertifications([...certifications, { ...emptyCert }])}
        onRemove={(i) => setCertifications(certifications.filter((_, idx) => idx !== i))}
        render={(c, i, update) => (
          <Grid>
            <Field label="Name" id={`ct-name-${i}`}><Input id={`ct-name-${i}`} value={c.name} onChange={(ev) => update({ ...c, name: ev.target.value })} /></Field>
            <Field label="Issuer" id={`ct-iss-${i}`}><Input id={`ct-iss-${i}`} value={c.issuer} onChange={(ev) => update({ ...c, issuer: ev.target.value })} /></Field>
            <Field label="Year" id={`ct-yr-${i}`}><Input id={`ct-yr-${i}`} value={c.year} onChange={(ev) => update({ ...c, year: ev.target.value })} placeholder="2024" /></Field>
          </Grid>
        )}
        setItems={setCertifications}
      />

      <Section title="Other">
        <Grid>
          <Field label="Languages (comma separated)" id="languages"><Input id="languages" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Hindi, Telugu" /></Field>
          <Field label="Interests (comma separated)" id="interests"><Input id="interests" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Open source, Chess" /></Field>
        </Grid>
        <div className="mt-3">
          <Field label="Achievements (one per line)" id="achievements">
            <Textarea id="achievements" rows={3} value={achievements} onChange={(e) => setAchievements(e.target.value)} placeholder="Won XYZ hackathon, 2024" />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border bg-background/90 p-3 shadow backdrop-blur">
        <span className="text-sm text-muted-foreground">Profile is {completion}% complete</span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            disabled={exporting}
            className="rounded-xl"
            onClick={async () => {
              setExporting(true);
              try {
                const payload = await runExport();
                const blob = new Blob([JSON.stringify(payload, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `readychecklab-export-${new Date()
                  .toISOString()
                  .slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Data exported");
              } catch (e: any) {
                toast.error(e?.message ?? "Export failed");
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export my data
          </Button>
          <Button variant="outline" onClick={() => save(false)} disabled={saving} className="rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save draft
          </Button>
          <Button onClick={() => save(true)} disabled={saving} className="rounded-xl">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Save & continue
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function RepeatableSection<T>({
  title,
  items,
  onAdd,
  onRemove,
  render,
  setItems,
}: {
  title: string;
  items: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  render: (item: T, i: number, update: (next: T) => void) => React.ReactNode;
  setItems: (next: T[]) => void;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="rounded-lg">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No {title.toLowerCase()} added yet.</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3">
            {render(item, i, (next) => {
              const arr = items.slice();
              arr[i] = next;
              setItems(arr);
            })}
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(i)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}