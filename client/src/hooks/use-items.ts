import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Helper to construct query key based on filters
export function getItemsQueryKey(params?: z.infer<typeof api.items.list.input>) {
  return [api.items.list.path, params];
}

export function useItems(params?: z.infer<typeof api.items.list.input>) {
  return useQuery({
    queryKey: getItemsQueryKey(params),
    queryFn: async () => {
      // Build query string manually or use URLSearchParams
      const url = new URL(api.items.list.path, window.location.origin);
      if (params?.parentId) url.searchParams.append("parentId", params.parentId);
      if (params?.category) url.searchParams.append("category", params.category);
      if (params?.search) url.searchParams.append("search", params.search);

      const res = await fetch(url.toString(), { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch items");
      return api.items.list.responses[200].parse(await res.json());
    },
  });
}

export function useBreadcrumb(folderId?: number) {
  return useQuery({
    queryKey: [api.items.breadcrumb.path, folderId],
    queryFn: async () => {
      if (!folderId) return [];
      const url = buildUrl(api.items.breadcrumb.path, { id: folderId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return []; // Fallback gracefully
      return api.items.breadcrumb.responses[200].parse(await res.json());
    },
    enabled: !!folderId,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; parentId: number | null }) => {
      const res = await fetch(api.items.createFolder.path, {
        method: api.items.createFolder.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create folder");
      return api.items.createFolder.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.items.upload.path, {
        method: api.items.upload.method,
        body: formData, // Browser sets Content-Type to multipart/form-data automatically
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return api.items.upload.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & z.infer<typeof api.items.update.input>) => {
      const url = buildUrl(api.items.update.path, { id });
      const res = await fetch(url, {
        method: api.items.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Update failed");
      return api.items.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.items.delete.path, { id });
      const res = await fetch(url, {
        method: api.items.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
    },
  });
}
