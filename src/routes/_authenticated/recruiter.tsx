import { createFileRoute } from "@tanstack/react-router";
import { RoleStub } from "@/components/role-stub";

export const Route = createFileRoute("/_authenticated/recruiter")({
  component: () => (
    <RoleStub
      title="Recruiter Workspace"
      desc="Search, filter, and shortlist candidates by skill, score, and market fit."
      bullets={["Candidate search by composite score", "Skill-based filters & saved searches", "Outreach & pipeline tracking"]}
    />
  ),
});