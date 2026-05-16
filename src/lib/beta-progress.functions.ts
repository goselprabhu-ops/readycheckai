import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { BETA_TARGET_USERS, BETA_TARGET_RESUMES } from '@/config/beta';

export interface BetaProgress {
  users: number;
  resumes: number;
  uniqueResumeUsers: number;
  targetUsers: number;
  targetResumes: number;
}

export const getBetaProgress = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BetaProgress> => {
    const { supabase } = context;

    const [{ count: users }, { count: resumes }, { data: resumeUsers }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('resumes').select('*', { count: 'exact', head: true }),
      supabase.from('resumes').select('user_id'),
    ]);

    const unique = new Set((resumeUsers ?? []).map((r: any) => r.user_id)).size;

    return {
      users: users ?? 0,
      resumes: resumes ?? 0,
      uniqueResumeUsers: unique,
      targetUsers: BETA_TARGET_USERS,
      targetResumes: BETA_TARGET_RESUMES,
    };
  });