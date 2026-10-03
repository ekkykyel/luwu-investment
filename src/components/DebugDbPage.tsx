import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { 
  Database, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  Terminal, 
  ArrowLeft 
} from "lucide-react";

export default function DebugDbPage() {
  const [clientTesting, setClientTesting] = useState(false);
  const [clientResult, setClientResult] = useState<any>(null);
  
  const [serverTesting, setServerTesting] = useState(false);
  const [serverResult, setServerResult] = useState<any>(null);

  const [dbStatusTesting, setDbStatusTesting] = useState(false);
  const [dbStatusResult, setDbStatusResult] = useState<any>(null);

  // Client-side environment detection
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || "";
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  const urlConfigured = !!envUrl && envUrl !== "https://svxugvxchjsjuyfeddor.supabase.co";
  const anonKeyConfigured = !!envKey && envKey !== "sb_publishable_SyZQ0YW4CWEVfMjBS9NtZQ_T0tB4zJj";

  // Run client-side test
  const testClientConnection = async () => {
    setClientTesting(true);
    setClientResult(null);
    const start = Date.now();
    try {
      undefined;
      const { data, error } = await supabase
        .from("gis_kecamatan")
        .select("id")
        .limit(1);

      const duration = Date.now() - start;

      if (error) {
        setClientResult({
          success: false,
          error: error,
          latencyMs: duration
        });
      } else {
        setClientResult({
          success: true,
          data: data,
          latencyMs: duration
        });
      }
    } catch (err: any) {
      setClientResult({
        success: false,
        error: {
          message: err.message || String(err),
          name: err.name,
          stack: err.stack,
          isException: true
        },
        latencyMs: Date.now() - start
      });
    } finally {
      setClientTesting(false);
    }
  };

  // Run server-side test via Express API (Refactored to client side)
  const testServerConnection = async () => {
    setServerTesting(true);
    setServerResult(null);
    try {
      const startTime = Date.now();
      const { error } = await supabase.from('investments').select('id', { count: 'exact', head: true });
      const endTime = Date.now();
      
      setServerResult({
        success: !error,
        configured: true,
        url: import.meta.env.VITE_SUPABASE_URL || "Local Mode",
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        latencyMs: endTime - startTime,
        error: error ? error.message : null
      });
    } catch (err: any) {
      setServerResult({
        success: false,
        error: `Supabase Ping Exception: ${err.message || String(err)}`
      });
    } finally {
      setServerTesting(false);
    }
  };

  // Run db-status query (Refactored to client side)
  const testDbStatus = async () => {
    setDbStatusTesting(true);
    setDbStatusResult(null);
    try {
      const { data, error } = await supabase.from('investments').select('id');
      
      setDbStatusResult({
        success: !error,
        error: error ? error.message : null,
        message: !error ? `Connected. Rows: ${data?.length || 0}` : "Failed to read database"
      });
    } catch (err: any) {
      setDbStatusResult({
        success: false,
        error: `Supabase Exception: ${err.message || String(err)}`
      });
    } finally {
      setDbStatusTesting(false);
    }
  };

  useEffect(() => {
    // Run diagnostics automatically on mount
    testClientConnection();
    testServerConnection();
    testDbStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-mono text-xs uppercase tracking-widest mb-1">
            <Activity className="h-4 w-4 animate-pulse" />
            Database Telescope
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Supabase Connection Diagnostic Hub
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Exposing database connection telemetry, credential structures, and low-level errors directly from Vercel in real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.replace("/")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-white transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Application
          </button>
          <button
            onClick={() => {
              testClientConnection();
              testServerConnection();
              testDbStatus();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white shadow-lg transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-run All Checks
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Client Environment Specs */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
            Client Environment Check
          </h2>
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-xs text-slate-600 dark:text-slate-400">Vite Configured URL</span>
              {urlConfigured ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Configured
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                  <XCircle className="h-3 w-3" /> Using Fallback / Empty
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-xs text-slate-600 dark:text-slate-400">Anon Key Configured</span>
              {anonKeyConfigured ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Configured
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                  <XCircle className="h-3 w-3" /> Using Fallback / Empty
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono leading-relaxed space-y-1 text-slate-600 dark:text-slate-400">
              <div>VITE_SUPABASE_URL: <span className="text-indigo-300 font-semibold">{envUrl ? `${envUrl.slice(0, 15)}...` : "UNDEFINED"}</span></div>
              <div>VITE_SUPABASE_ANON_KEY: <span className="text-indigo-300 font-semibold">{envKey ? `${envKey.slice(0, 10)}... [HIDDEN]` : "UNDEFINED"}</span></div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-white block mb-1">💡 What does this mean?</span>
              If the variables show "Using Fallback/Empty", Vercel is not reading your .env configuration. Please double check that you have added <code className="text-slate-200 bg-slate-800 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="text-slate-200 bg-slate-800 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in the Vercel dashboard.
            </div>
          </div>
        </div>

        {/* Panel 2: Client Direct connection check */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
              Client Direct Query Check
            </h2>
            <button
              onClick={testClientConnection}
              disabled={clientTesting}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-white transition-all disabled:opacity-50"
            >
              Run Check
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-sans">Status</span>
              {clientTesting ? (
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 animate-pulse flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Testing...
                </span>
              ) : clientResult?.success ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20">
                  Success
                </span>
              ) : clientResult ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase border border-rose-500/20">
                  Failed
                </span>
              ) : (
                <span className="text-xs text-slate-600 dark:text-slate-400">Idle</span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-xs text-slate-600 dark:text-slate-400">Latency Check</span>
              <span className="text-xs text-white font-mono font-semibold">
                {clientResult ? `${clientResult.latencyMs}ms` : "-"}
              </span>
            </div>

            {/* RAW CLIENT ERROR REPORT */}
            <div className="flex-1 flex flex-col min-h-[140px]">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Raw Response / Error Object:</span>
              <pre className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono overflow-auto max-h-[180px] leading-relaxed text-slate-300">
                {clientTesting ? (
                  "Waiting for query result..."
                ) : clientResult ? (
                  JSON.stringify(clientResult.success ? { success: true, count: clientResult.data?.length, sample: clientResult.data } : clientResult.error, null, 2)
                ) : (
                  "Check not executed."
                )}
              </pre>
            </div>
          </div>
        </div>

        {/* Panel 3: Server API Proxy connection check */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
              Server API Proxy Check
            </h2>
            <button
              onClick={testServerConnection}
              disabled={serverTesting}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-white transition-all disabled:opacity-50"
            >
              Run Check
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-sans">Status</span>
              {serverTesting ? (
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 animate-pulse flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Testing...
                </span>
              ) : serverResult?.success ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase border border-emerald-500/20">
                  Success
                </span>
              ) : serverResult ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase border border-rose-500/20">
                  Failed
                </span>
              ) : (
                <span className="text-xs text-slate-600 dark:text-slate-400">Idle</span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <span className="text-xs text-slate-600 dark:text-slate-400">Connection Mode</span>
              <span className="text-xs text-indigo-700 dark:text-indigo-400 font-mono font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Direct Supabase Ping
              </span>
            </div>

            {/* RAW SERVER ERROR REPORT */}
            <div className="flex-1 flex flex-col min-h-[140px]">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Raw Client Response:</span>
              <pre className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono overflow-auto max-h-[180px] leading-relaxed text-slate-300">
                {serverTesting ? (
                  "Pinging Supabase REST API..."
                ) : serverResult ? (
                  JSON.stringify(serverResult, null, 2)
                ) : (
                  "Check not executed."
                )}
              </pre>
            </div>
          </div>
        </div>

      </div>

      {/* Database Hydration Sync Status Area */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Database Seeding / Hydration Cache Status</h2>
          </div>
          <button
            onClick={testDbStatus}
            disabled={dbStatusTesting}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white transition-all disabled:opacity-50"
          >
            Refresh Sync Status
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start gap-3">
              {dbStatusResult?.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              )}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sync Success Flag</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Indicates if the in-memory Cache synchronization from Supabase table has completed successfully without throwing exceptions or timeouts.
                </p>
                <div className="mt-2 text-xs font-mono">
                  Status: {dbStatusTesting ? "Checking..." : dbStatusResult?.success ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">READY / SYNCED</span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400 font-bold">NOT FULLY HYDRATED / SYNC FAILED</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Raw Sync Status Payload:</span>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[10px] font-mono overflow-auto max-h-[140px] text-slate-300">
              {dbStatusTesting ? (
                "Fetching payload..."
              ) : dbStatusResult ? (
                JSON.stringify(dbStatusResult, null, 2)
              ) : (
                "No status retrieved yet."
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
