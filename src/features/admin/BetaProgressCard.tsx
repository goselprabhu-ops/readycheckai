import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Rocket, Users, FileText } from 'lucide-react';
import { getBetaProgress, type BetaProgress } from '@/lib/beta-progress.functions';
import { BETA_MODE } from '@/config/beta';

export function BetaProgressCard() {
  const fn = useServerFn(getBetaProgress);
  const [data, setData] = useState<BetaProgress | null>(null);

  useEffect(() => {
    fn().then(setData).catch(() => setData(null));
  }, [fn]);

  if (!BETA_MODE) return null;

  const userPct = data ? Math.min(100, Math.round((data.users / data.targetUsers) * 100)) : 0;
  const resumePct = data ? Math.min(100, Math.round((data.resumes / data.targetResumes) * 100)) : 0;
  const ready = data && data.users >= data.targetUsers && data.resumes >= data.targetResumes;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="h-4 w-4 text-primary" />
          Beta Progress
        </CardTitle>
        {ready ? (
          <Badge className="bg-primary text-primary-foreground">Ready to enable payments</Badge>
        ) : (
          <Badge variant="secondary">Free during beta</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Signed-up users
            </span>
            <span className="font-medium">
              {data?.users ?? '—'} / {data?.targetUsers ?? 500}
            </span>
          </div>
          <Progress value={userPct} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Resumes uploaded
            </span>
            <span className="font-medium">
              {data?.resumes ?? '—'} / {data?.targetResumes ?? 500}
              {data && data.uniqueResumeUsers > 0 && (
                <span className="text-muted-foreground"> ({data.uniqueResumeUsers} unique)</span>
              )}
            </span>
          </div>
          <Progress value={resumePct} />
        </div>
        <p className="text-xs text-muted-foreground">
          Once both targets are met, flip <code className="px-1 rounded bg-muted">BETA_MODE</code> in{' '}
          <code className="px-1 rounded bg-muted">src/config/beta.ts</code> to re-enable paid subscriptions.
        </p>
      </CardContent>
    </Card>
  );
}