"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { DatabaseZap, Play, Upload } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { endpoints } from "@/lib/api";

export default function AdminPage() {
  const health = useQuery({ queryKey: ["admin-health"], queryFn: endpoints.adminHealth });
  const users = useQuery({ queryKey: ["users"], queryFn: endpoints.users });
  const architecture = useQuery({ queryKey: ["etl-architecture"], queryFn: endpoints.etlArchitecture });
  const etl = useMutation({ mutationFn: endpoints.runEtl });

  return (
    <AppShell>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <DatabaseZap className="text-cyan-200" />
          <CardTitle className="mt-4">API Monitoring</CardTitle>
          <p className="mt-3 text-sm text-slate-400">Status: {health.data?.api ?? "checking"} &middot; Latency {health.data?.latencyMs ?? "--"}ms</p>
        </Card>
        <Card>
          <Upload className="text-cyan-200" />
          <CardTitle className="mt-4">Dataset Management</CardTitle>
          <p className="mt-3 text-sm text-slate-400">CSV upload endpoint available at `/api/admin/datasets/upload`.</p>
        </Card>
        <Card>
          <Play className="text-cyan-200" />
          <CardTitle className="mt-4">ETL Jobs</CardTitle>
          <Button onClick={() => etl.mutate()} className="mt-4">Trigger ETL</Button>
          {etl.data && <p className="mt-3 text-sm text-emerald-300">{etl.data.status}: {etl.data.jobId}</p>}
        </Card>
      </div>
      <Card className="mt-4">
        <CardTitle>PortWatch-Compatible ETL Architecture</CardTitle>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {architecture.data?.layers?.map((layer) => (
            <div key={layer.name} className="rounded-md border border-cyan-300/10 bg-slate-950/45 p-3">
              <p className="font-semibold text-[#D6A85F]">{layer.name}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{layer.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">Entities: {architecture.data?.entities?.join(", ")}</p>
      </Card>
      <Card className="mt-4">
        <CardTitle>User Management</CardTitle>
        <div className="mt-4 divide-y divide-slate-800">
          {users.data?.map((user) => (
            <div key={user.id} className="flex items-center justify-between py-3 text-sm">
              <div><p className="text-white">{user.name}</p><p className="text-slate-500">{user.email}</p></div>
              <span className="rounded-md border border-cyan-300/20 px-3 py-1 text-cyan-200">{user.role}</span>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
