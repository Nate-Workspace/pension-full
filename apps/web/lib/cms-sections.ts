import type { SitePageSectionInput } from "@repo/contracts";

export type CmsSectionField = {
  key: string;
  label: string;
  hint?: string;
  multiline?: boolean;
};

export function getSectionValue(
  sections: Array<{ sectionKey: string; content: string }> | undefined,
  key: string,
): string {
  return sections?.find((section) => section.sectionKey === key)?.content ?? "";
}

export function buildSectionsPayload(
  fields: CmsSectionField[],
  values: Record<string, string>,
): SitePageSectionInput[] {
  return fields.map((field, index) => ({
    sectionKey: field.key,
    content: values[field.key] ?? "",
    sortOrder: index,
  }));
}

export function sectionsToValues(
  fields: CmsSectionField[],
  sections: Array<{ sectionKey: string; content: string }> | undefined,
): Record<string, string> {
  return Object.fromEntries(
    fields.map((field) => [field.key, getSectionValue(sections, field.key)]),
  );
}
