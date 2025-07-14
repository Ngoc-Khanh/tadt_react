import { routes } from "@/config";
import MainLayout from "@/layouts/main";
import { ProjectDetailPage, ProjectPage } from "@/pages";
import { Navigate, type RouteObject } from "react-router-dom";

export const reactRouter: RouteObject[] = [
  {
    element: <MainLayout />,
    children: [
      {
        path: routes.root,
        element: <Navigate to={routes.project} />,
      },
      {
        path: routes.project,
        element: <ProjectPage />,
      },
      {
        path: routes.projectDetail(":projectId"),
        element: <ProjectDetailPage />,
      }
    ],
  },

  // FALLBACK 404 ROUTER
  { path: "*", element: <div>Not Found Error Page's</div> },
]