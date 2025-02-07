'use client';

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input } from "./ui/input";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchBarProps {
  className?: string;
  variant?: 'navbar' | 'standalone';
}

export function SearchBar({ className = '', variant = 'navbar' }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const debouncedValue = useDebounce(searchQuery, 500);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    if (debouncedValue) {
      router.push(`/explore?${createQueryString('q', debouncedValue)}`);
    } else if (searchParams.get('q')) {
      router.push('/explore');
    }
  }, [debouncedValue, router, createQueryString, searchParams]);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder="Search topics, courses, or skills..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`pl-10 pr-3 py-2 w-full border border-gray-700 rounded-md bg-gray-900 text-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          ${variant === 'standalone' ? 'h-10 text-base' : 'h-9 text-sm'}`}
      />
    </div>
  );
} 