import Link from "next/link";
import { Suspense } from "react";
import { deleteResource, saveResource } from "@/app/(admin)/resource-actions";
import { SubmitButton } from "@/components/buttons";
import { Card, Empty, Flash, PageHeader, inputClass, labelClass } from "@/components/ui";
import { getDb } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { param, type SearchParams } from "@/lib/params";
import { RESOURCES, type Field, type Resource, type ResourceKey } from "@/lib/resources";

type Row = Record<string, unknown> & { id: number; created_at?: string };
type Options = Map<string, { value: string; label: string }[]>;

export function ResourcePage({
  resource: key,
  searchParams,
}: {
  resource: ResourceKey;
  searchParams: Promise<SearchParams>;
}) {
  const resource = RESOURCES[key];

  return (
    <>
      <PageHeader title={resource.title} description={resource.description} />
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <ResourceView resourceKey={key} resource={resource} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function loadOptions(resource: Resource): Promise<Options> {
  const { db } = await getDb();
  const options: Options = new Map();

  for (const field of resource.fields) {
    if (field.options) {
      options.set(field.name, field.options);
    } else if (field.optionsFrom) {
      const { data } = await db
        .from(field.optionsFrom.table)
        .select(`id, ${field.optionsFrom.label}`)
        .order(field.optionsFrom.label);

      options.set(
        field.name,
        ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
          value: String(row.id),
          label: String(row[field.optionsFrom!.label]),
        }))
      );
    }
  }

  return options;
}

async function ResourceView({
  resourceKey,
  resource,
  searchParams,
}: {
  resourceKey: ResourceKey;
  resource: Resource;
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { db } = await getDb();

  const [{ data, error }, options] = await Promise.all([
    db.from(resource.table).select("*").order(resource.orderBy.column, { ascending: resource.orderBy.ascending }).limit(500),
    loadOptions(resource),
  ]);

  if (error) {
    return <Flash error={`Could not load ${resource.title.toLowerCase()}: ${error.message}. Did you run the Week 7 migration?`} />;
  }

  const rows = (data ?? []) as Row[];
  const editId = Number(param(params, "edit"));
  const editing = rows.find((row) => row.id === editId) ?? null;
  const columns = resource.fields.filter((field) => !field.hideInTable);

  return (
    <div className="space-y-6">
      <Flash notice={param(params, "notice")} error={param(params, "error")} />

      <Card title={editing ? `Edit ${resource.singular}` : `New ${resource.singular}`}>
        <form key={editing?.id ?? "new"} action={saveResource} className="space-y-4">
          <input type="hidden" name="resource" value={resourceKey} />
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="grid gap-4 sm:grid-cols-2">
            {resource.fields.map((field) => (
              <FieldInput key={field.name} field={field} value={editing?.[field.name]} options={options.get(field.name)} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <SubmitButton>{editing ? "Save changes" : `Create ${resource.singular}`}</SubmitButton>
            {editing && (
              <Link href={resource.path} className="text-sm text-zinc-400 hover:text-zinc-100">
                Cancel
              </Link>
            )}
          </div>
        </form>
      </Card>

      {rows.length === 0 ? (
        <Empty>No {resource.title.toLowerCase()} yet.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-zinc-900 text-xs text-zinc-400">
              <tr>
                {columns.map((field) => (
                  <th key={field.name} className="px-4 py-3 font-medium">{field.label}</th>
                ))}
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.id} className={row.id === editing?.id ? "bg-zinc-900" : "hover:bg-zinc-900/60"}>
                  {columns.map((field) => (
                    <td key={field.name} className="max-w-xs px-4 py-3 align-top text-zinc-200">
                      <CellValue field={field} value={row[field.name]} options={options.get(field.name)} />
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 align-top text-zinc-500">
                    {row.created_at ? formatDate(row.created_at) : "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`${resource.path}?edit=${row.id}`}
                        className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                      >
                        Edit
                      </Link>
                      <form action={deleteResource}>
                        <input type="hidden" name="resource" value={resourceKey} />
                        <input type="hidden" name="id" value={row.id} />
                        <SubmitButton variant="danger" confirm={`Delete this ${resource.singular}?`}>
                          Delete
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  options,
}: {
  field: Field;
  value: unknown;
  options?: { value: string; label: string }[];
}) {
  const wide = field.type === "textarea" ? "sm:col-span-2" : "";
  const current = value === null || value === undefined ? "" : String(value);

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-200">
        <input type="checkbox" name={field.name} defaultChecked={value === undefined ? true : Boolean(value)} className="size-4 accent-zinc-100" />
        {field.label}
      </label>
    );
  }

  return (
    <label className={`block ${wide}`}>
      <span className={labelClass}>
        {field.label}
        {field.required && " *"}
      </span>
      {field.type === "textarea" ? (
        <textarea name={field.name} rows={3} required={field.required} defaultValue={current} placeholder={field.placeholder} className={inputClass} />
      ) : field.type === "select" ? (
        <select name={field.name} required={field.required} defaultValue={current} className={inputClass}>
          {!field.required && <option value="">None</option>}
          {field.required && !current && <option value="">Choose…</option>}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <input
          name={field.name}
          type={field.type}
          step={field.step}
          required={field.required}
          defaultValue={value === undefined ? field.defaultValue ?? "" : current}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )}
    </label>
  );
}

function CellValue({
  field,
  value,
  options,
}: {
  field: Field;
  value: unknown;
  options?: { value: string; label: string }[];
}) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-zinc-600">—</span>;
  }

  if (field.type === "checkbox") {
    return value ? <span className="text-emerald-400">Yes</span> : <span className="text-zinc-500">No</span>;
  }

  if (options) {
    return <>{options.find((option) => option.value === String(value))?.label ?? String(value)}</>;
  }

  return <span className="line-clamp-3 whitespace-pre-wrap">{String(value)}</span>;
}
