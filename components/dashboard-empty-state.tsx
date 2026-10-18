'use client';

import Papa from 'papaparse';
import { Cloud, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { BillingRecord } from '@/lib/types';
import { normalizeRecord } from '@/lib/utils';

interface EmptyStateProps {
  onUploadComplete: () => Promise<void>;
}

export function DashboardEmptyState({ onUploadComplete }: EmptyStateProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const records = (results.data as Record<string, unknown>[])
          .map((row) => normalizeRecord(row))
          .filter(Boolean) as BillingRecord[];

        if (!records.length) {
          setMessage('No valid rows found. Required columns: date, service_name, cost.');
          setLoading(false);
          return;
        }

        try {
          const response = await fetch('/api/billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records }),
          });

          const data = await response.json();

          if (!response.ok) {
            setMessage(data.message ?? 'Upload failed. Please try again.');
            setLoading(false);
            return;
          }

          setMessage('Data uploaded successfully. Loading dashboard...');
          await onUploadComplete();
          setLoading(false);
        } catch (error) {
          console.error(error);
          setMessage('Upload failed. Please try again.');
          setLoading(false);
        }
      },
      error: (error) => {
        setMessage(error.message);
        setLoading(false);
      },
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-44 -left-32 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

      <div className="relative w-full max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="flex">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-lg border border-primary/20 bg-primary-light shadow-card">
                  <Cloud className="h-10 w-10 text-primary" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight text-foreground lg:text-6xl">
                Unlock your{' '}
                <span className="text-primary">
                  cloud insights
                </span>
              </h1>

              <div className="flex flex-wrap gap-2 pt-2">
                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
                  <span className="text-sm font-semibold text-primary">AWS</span>
                </div>
                <div className="inline-flex items-center rounded-full border border-error/30 bg-error/10 px-3 py-1.5">
                  <span className="text-sm font-semibold text-error">GCP</span>
                </div>
                <div className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5">
                  <span className="text-sm font-semibold text-accent">Azure</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 text-muted">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm font-medium">Real-time cost visibility across all cloud providers</span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm font-medium">Detect anomalies and unusual spending patterns</span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm font-medium">AI-powered optimization recommendations</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-8 shadow-card backdrop-blur-md">
            <div className="space-y-6">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-foreground">Upload your billing CSV</h2>
                <p className="text-sm text-muted">Drag and drop or click to select your file</p>
              </div>

              <div
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer rounded-lg border-2 border-dashed border-primary/30 bg-primary-light/30 p-8 text-center transition-all duration-300 hover:border-primary/50 hover:bg-primary-light/50"
              >
                <div className="mb-4 flex justify-center">
                  <div className="rounded-lg bg-primary-light p-3">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <p className="mb-1 font-semibold text-foreground">Click to upload</p>
                <p className="text-xs text-muted">or drag and drop your CSV file</p>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />

              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Required columns:</p>
                <div className="flex flex-wrap gap-2">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1">
                    <code className="font-mono text-xs text-primary">date</code>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1">
                    <code className="font-mono text-xs text-primary">service_name</code>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1">
                    <code className="font-mono text-xs text-primary">cost</code>
                  </div>
                </div>
              </div>

              {message && (
                <div className="rounded-[1rem] border border-border/80 bg-card-alt/85 p-3">
                  <p className="text-sm text-foreground">{message}</p>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0s' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: '0.2s' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-success" style={{ animationDelay: '0.4s' }} />
                  <span className="ml-2 text-sm font-medium">Processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
