'use client';

import { useState, useEffect, useRef } from 'react';
import { PlusIcon } from './icons.js';
import { SecretRow, Dialog, EmptyState } from './settings-shared.js';
import {
  getAgentJobSecrets,
  updateAgentJobSecret,
  deleteAgentJobSecretAction,
} from '../actions.js';

// ─────────────────────────────────────────────────────────────────────────────
// Add secret dialog
// ─────────────────────────────────────────────────────────────────────────────

function AddJobSecretDialog({ open, onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const nameRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName('');
      setValue('');
      setShowValue(false);
      setError(null);
      setSaving(false);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSave = async () => {
    const trimmed = name.trim().toUpperCase();
    if (!trimmed || !value) return;
    setSaving(true);
    setError(null);
    const result = await onAdd(trimmed, value);
    setSaving(false);
    if (result?.success) {
      onCancel();
    } else {
      setError(result?.error || 'Failed to add secret');
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} title="Add Job Secret">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Name</label>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
            placeholder="e.g. GOOGLE_SERVICE_ACCOUNT_KEY"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-foreground"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium">Value</label>
            <button
              type="button"
              onClick={() => setShowValue(!showValue)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showValue ? 'Hide' : 'Show'}
            </button>
          </div>
          {showValue ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter value (supports multi-line JSON)..."
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-foreground resize-y"
            />
          ) : (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter value (supports multi-line JSON)..."
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-foreground resize-y"
              style={{ WebkitTextSecurity: 'disc' }}
            />
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm font-medium border border-border text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={!name.trim() || !value || saving}
          className="rounded-md px-3 py-1.5 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Jobs page
// ─────────────────────────────────────────────────────────────────────────────

export function JobsPage() {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadSecrets = async () => {
    try {
      const result = await getAgentJobSecrets();
      setSecrets(Array.isArray(result) ? result : []);
    } catch {
      setSecrets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecrets();
  }, []);

  const handleAdd = async (name, value) => {
    const result = await updateAgentJobSecret(name, value);
    if (result?.success) await loadSecrets();
    return result;
  };

  const handleUpdate = async (name, value) => {
    const result = await updateAgentJobSecret(name, value);
    if (result?.success) await loadSecrets();
    return result;
  };

  const handleDelete = async (name) => {
    const result = await deleteAgentJobSecretAction(name);
    if (result?.success) await loadSecrets();
    return result;
  };

  if (loading) {
    return <div className="h-48 animate-pulse rounded-md bg-border/50" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-medium">Job Secrets</h2>
          <p className="text-sm text-muted-foreground">Custom environment variables passed to agent job containers. These are merged with built-in auth credentials when launching jobs.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 shrink-0 transition-colors"
        >
          <PlusIcon size={14} />
          Add secret
        </button>
      </div>
      <AddJobSecretDialog
        open={showAdd}
        onAdd={handleAdd}
        onCancel={() => setShowAdd(false)}
      />
      {secrets.length === 0 ? (
        <EmptyState
          message="No job secrets configured yet."
          actionLabel="Add secret"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <div className="rounded-lg border bg-card p-4">
          <div className="divide-y divide-border">
            {secrets.map((s) => (
              <SecretRow
                key={s.key}
                label={s.key}
                mono
                isSet={s.isSet}
                onSave={(val) => handleUpdate(s.key, val)}
                onDelete={() => handleDelete(s.key)}
                icon={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
