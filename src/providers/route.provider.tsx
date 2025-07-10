import { reactRouter } from "@/config";
import { createBrowserRouter, RouterProvider as RouterProviderRC } from "react-router-dom";

export default function RouterProvider() {
  const router = createBrowserRouter(reactRouter);
  return <RouterProviderRC router={router} />;
}