"use client";

import { useMemo } from "react";
import { MultiSelect } from "@/components/ui/multi-select";

interface CityFilterProps {
  cities: (string | null | undefined)[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function CityFilter({ cities, selected, onChange }: CityFilterProps) {
  const options = useMemo(() => {
    const unique = [...new Set(cities.filter((c): c is string => Boolean(c && c.trim())))];
    unique.sort((a, b) => a.localeCompare(b, "fr"));
    return unique.map((c) => ({ value: c, label: c }));
  }, [cities]);

  return (
    <MultiSelect
      options={options}
      selected={selected}
      onChange={onChange}
      placeholder="Ville"
      searchPlaceholder="Rechercher une ville…"
      emptyText="Aucune ville."
      align="end"
      listClassName="max-h-[200px]"
    />
  );
}
