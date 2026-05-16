import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listRoleBenchmarks, updateRoleBenchmark } from "@/lib/admin-management.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Target } from "lucide-react";
import { toast } from "sonner";

interface Role { id: string; name: string; slug: string; description: string | null; dimension_weights: Record<string, number>; benchmark_ranges: Record<string, number[]>; is_active: boolean }

export function BenchmarksTab() {
  const list = useServerFn(listRoleBenchmarks);
  const update = useServerFn(updateRoleBenchmark);
  const [roles, setRoles] = useState<Role[]>([]);

  const load = async () => { try { const r = await list(); setRoles(r.roles as Role[]); } catch (e: any) { toast.error(e.message); } };
  useEffect(() => { load(); }, []);

  const updateWeight = (idx: number, dim: string, v: number) => {
    setRoles(prev => prev.map((r, i) => i === idx ? { ...r, dimension_weights: { ...r.dimension_weights, [dim]: v } } : r));
  };

  const save = async (r: Role) => {
    try {
      await update({ data: { id: r.id, dimension_weights: r.dimension_weights, is_active: r.is_active, description: r.description } });
      toast.success(`${r.name} updated`);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {roles.map((r, idx) => (
        <Card key={r.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" />{r.name}</CardTitle>
                <div className="text-xs text-muted-foreground mt-1">{r.slug}</div>
              </div>
              <Switch checked={r.is_active} onCheckedChange={v => setRoles(prev => prev.map((x, i) => i === idx ? { ...x, is_active: v } : x))} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={r.description ?? ""} placeholder="Description" onChange={e => setRoles(prev => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">Dimension weights</div>
              {Object.entries(r.dimension_weights).map(([dim, w]) => (
                <div key={dim} className="grid grid-cols-[100px_1fr_50px] items-center gap-2">
                  <div className="text-sm capitalize">{dim}</div>
                  <Slider value={[Math.round(w * 100)]} min={0} max={100} step={5} onValueChange={v => updateWeight(idx, dim, v[0] / 100)} />
                  <div className="text-xs tabular-nums text-right">{Math.round(w * 100)}%</div>
                </div>
              ))}
              <div className="text-[10px] text-muted-foreground">Sum: {Math.round(Object.values(r.dimension_weights).reduce((a, b) => a + b, 0) * 100)}% (target 100)</div>
            </div>
            <Button size="sm" onClick={() => save(r)}>Save weights</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}