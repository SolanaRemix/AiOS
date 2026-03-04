import { create } from "zustand";
import { Project, ProjectFile } from "@/types";
import { apiClient } from "@/lib/api";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  currentFile: ProjectFile | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setCurrentFile: (file: ProjectFile | null) => void;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProject: null,
  currentFile: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await apiClient.get<Project[]>("/projects");
      set({ projects, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch projects";
      set({ error: message, isLoading: false });
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await apiClient.get<Project>(`/projects/${id}`);
      set({ currentProject: project, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch project";
      set({ error: message, isLoading: false });
    }
  },

  setCurrentProject: (project: Project | null) =>
    set({ currentProject: project }),

  setCurrentFile: (file: ProjectFile | null) => set({ currentFile: file }),

  createProject: async (data: Partial<Project>) => {
    set({ isLoading: true, error: null });
    try {
      const project = await apiClient.post<Project>("/projects", data);
      set((state) => ({
        projects: [project, ...state.projects],
        isLoading: false,
      }));
      return project;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    try {
      const updated = await apiClient.patch<Project>(`/projects/${id}`, data);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        currentProject:
          state.currentProject?.id === id ? updated : state.currentProject,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update project";
      set({ error: message });
      throw err;
    }
  },

  deleteProject: async (id: string) => {
    try {
      await apiClient.delete(`/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject:
          state.currentProject?.id === id ? null : state.currentProject,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete project";
      set({ error: message });
      throw err;
    }
  },
}));
