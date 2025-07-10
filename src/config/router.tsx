import { routes } from "@/config";
import MainLayout from "@/layouts/main";
import RootPage from "@/pages/Root";
import type { RouteObject } from "react-router-dom";

export const reactRouter: RouteObject[] = [
  {
    element: <MainLayout />,
    children: [
      {
        path: routes.root,
        element: <RootPage />,
      },
    ],
  },

  // FALLBACK 404 ROUTER
  { path: "*", element: <div>Not Found Error Page's</div> },
]