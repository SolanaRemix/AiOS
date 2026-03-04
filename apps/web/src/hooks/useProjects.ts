"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Project, ProjectCreateForm } from "@/types";
import { toast } from "sonner";

export function useProjects() {
  const queryClient = useQueryClient();

  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.get<Project[]>("/projects"),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectCreateForm) =>
      apiClient.post<Project>("/projects", data),
    onSuccess: (newProject) => {
      queryClient.setQueryData<Project[]>(["projects"], (old = []) => [
        newProject,
        ...old,
      ]);
      toast.success("Project created successfully");
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/projects/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Project[]>(["projects"], (old = []) =>
        old.filter((p) => p.id !== id)
      );
      toast.success("Project deleted");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  return {
    projects,
    isLoading,
    error,
    refetch,
    createProject: createProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
    deleteProject: deleteProjectMutation.mutate,
    isDeleting: deleteProjectMutation.isPending,
  };
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => apiClient.get<Project>(`/projects/${id}`),
    enabled: !!id,
  });
}
