import { createFileRoute } from "@tanstack/react-router";
import { RoleStub } from "@/components/role-stub";

export const Route = createFileRoute("/_authenticated/college")({
  component: () => (
    <RoleStub
      title="College Placement Cell"
      desc="Track student readiness, placement funnels, and recruiter engagement."
      bullets={["Cohort readiness analytics", "Placement funnel & offers", "Recruiter relationship tracking"]}
    />
  ),
});