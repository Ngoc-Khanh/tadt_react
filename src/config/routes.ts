export const routes = {
  root: "/",
  project: "/project",
  projectDetail: (projectId: string) => `/project/${projectId}/detail`,
}