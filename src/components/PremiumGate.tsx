import { Link } from '@tanstack/react-router';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';

interface Props {
  feature: string;
  description?: string;
  children: React.ReactNode;
  requires?: 'premium' | 'institution';
}

export function PremiumGate({ feature, description, children, requires = 'premium' }: Props) {
  const { loading, isPremium, isInstitution } = useSubscription();
  if (loading) return <div className="h-32 animate-pulse rounded-lg bg-muted" />;
  const allowed = requires === 'institution' ? isInstitution : isPremium;
  if (allowed) return <>{children}</>;
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> {feature} is a Premium feature
          </h3>
          {description && <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>}
        </div>
        <Button asChild>
          <Link to="/pricing">Upgrade to unlock</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
