"use client";

import { useMemo, useState } from "react";

import {
  CmsEditorHeader,
  CmsField,
  cmsInputClassName,
  cmsTextareaClassName,
} from "@/components/cms/cms-editor-ui";
import { useCmsEntities } from "@/components/cms/hooks/use-cms-entities";
import { LoadingSpinner } from "@/components/ui";
import type { CmsEntityConfig, CmsEntityRecord } from "@/lib/cms-entities";

type DraftState = {
  id: string | null;
  values: Record<string, string | number>;
};

function recordToValues(
  config: CmsEntityConfig,
  record: CmsEntityRecord,
): Record<string, string | number> {
  return Object.fromEntries(
    config.fields.map((field) => [
      field.key,
      (record as Record<string, string | number>)[field.key] ?? "",
    ]),
  );
}

function parsePayload(
  config: CmsEntityConfig,
  values: Record<string, string | number>,
): Record<string, string | number> {
  const payload: Record<string, string | number> = {};

  for (const field of config.fields) {
    const raw = values[field.key];

    if (field.type === "number") {
      payload[field.key] = Number(raw ?? 0);
      continue;
    }

    payload[field.key] = String(raw ?? "").trim();
  }

  return payload;
}

function getRecordLabel(config: CmsEntityConfig, record: CmsEntityRecord): string {
  if ("name" in record && record.name) {
    return record.name;
  }
  if ("question" in record && record.question) {
    return record.question;
  }
  if ("caption" in record && record.caption) {
    return record.caption;
  }
  if ("imageUrl" in record && record.imageUrl) {
    return record.imageUrl;
  }

  return `${config.label} item`;
}

type CmsEntityListEditorProps = {
  config: CmsEntityConfig;
};

export function CmsEntityListEditor({ config }: CmsEntityListEditorProps) {
  const { items, isLoading, isSaving, error, create, update, remove } = useCmsEntities(
    config.kind,
  );
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const sortedItems = useMemo(
    () => [...items].sort((left, right) => left.sortOrder - right.sortOrder),
    [items],
  );

  const startCreate = () => {
    setFormError(null);
    setStatusMessage(null);
    setDraft({
      id: null,
      values: { ...config.defaultItem },
    });
  };

  const startEdit = (record: CmsEntityRecord) => {
    setFormError(null);
    setStatusMessage(null);
    setDraft({
      id: record.id,
      values: recordToValues(config, record),
    });
  };

  const cancelDraft = () => {
    setDraft(null);
    setFormError(null);
  };

  const handleSaveDraft = () => {
    if (!draft) {
      return;
    }

    setFormError(null);
    setStatusMessage(null);

    const payload = parsePayload(config, draft.values);

    for (const field of config.fields) {
      if (field.required && !String(payload[field.key] ?? "").trim()) {
        setFormError(`${field.label} is required.`);
        return;
      }
    }

    void (async () => {
      try {
        if (draft.id) {
          await update({ id: draft.id, input: payload });
          setStatusMessage(`${config.label} item updated.`);
        } else {
          await create(payload);
          setStatusMessage(`${config.label} item added.`);
        }
        setDraft(null);
      } catch (saveError) {
        setFormError(
          saveError instanceof Error ? saveError.message : "Unable to save item.",
        );
      }
    })();
  };

  const handleDelete = (id: string) => {
    setFormError(null);
    setStatusMessage(null);

    void (async () => {
      try {
        await remove(id);
        if (draft?.id === id) {
          setDraft(null);
        }
        setStatusMessage(`${config.label} item removed.`);
      } catch (deleteError) {
        setFormError(
          deleteError instanceof Error ? deleteError.message : "Unable to delete item.",
        );
      }
    })();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-3 text-sm text-slate-600">
        <LoadingSpinner className="h-5 w-5" />
        <span>Loading {config.label}...</span>
      </div>
    );
  }

  return (
    <div>
      <CmsEditorHeader
        slug={config.slug}
        title={config.label}
        description={config.description}
      />

      {statusMessage ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {formError || error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError ??
            (error instanceof Error ? error.message : `Unable to load ${config.label}.`)}
        </div>
      ) : null}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={startCreate}
          disabled={isSaving}
          className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          Add item
        </button>
      </div>

      {draft ? (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">
            {draft.id ? "Edit item" : "New item"}
          </h3>
          <div className="mt-4 space-y-4">
            {config.fields.map((field) => (
              <CmsField key={field.key} label={field.label}>
                {field.multiline ? (
                  <textarea
                    value={String(draft.values[field.key] ?? "")}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              values: { ...current.values, [field.key]: event.target.value },
                            }
                          : current,
                      )
                    }
                    className={cmsTextareaClassName}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                    value={String(draft.values[field.key] ?? "")}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              values: {
                                ...current.values,
                                [field.key]:
                                  field.type === "number"
                                    ? Number(event.target.value)
                                    : event.target.value,
                              },
                            }
                          : current,
                      )
                    }
                    className={cmsInputClassName}
                    placeholder={field.placeholder}
                  />
                )}
              </CmsField>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-medium text-white"
            >
              {isSaving ? "Saving..." : "Save item"}
            </button>
            <button
              type="button"
              onClick={cancelDraft}
              disabled={isSaving}
              className="inline-flex h-10 items-center rounded-full border border-slate-200 px-5 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {sortedItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
          {config.emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((record) => (
            <article
              key={record.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <h3 className="font-medium text-slate-900">
                  {getRecordLabel(config, record as CmsEntityRecord)}
                </h3>
                <p className="mt-1 text-xs text-slate-500">Sort order: {record.sortOrder}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(record as CmsEntityRecord)}
                  disabled={isSaving}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(record.id)}
                  disabled={isSaving}
                  className="rounded-full border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
