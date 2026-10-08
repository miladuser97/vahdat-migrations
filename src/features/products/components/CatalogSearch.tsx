"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/shared/SearchBar";
import { useState, useTransition } from "react";

interface CatalogSearchProps {
  placeholder?: string;
  suggestions?: string[];
}

/**
 * CatalogSearch
 * Client-side wrapper around SearchBar that handles URL state.
 * Uses useTransition to keep the UI responsive during search.
 */
export function CatalogSearch({ placeholder }: CatalogSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") || "");

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    params.delete("page");

    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch(value);
      }}
    >
      <SearchBar
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={() => {
          setValue("");
          handleSearch("");
        }}
        onSearch={handleSearch}
        loading={isPending}
      />
    </form>
  );
}