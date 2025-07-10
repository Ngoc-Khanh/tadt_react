import Header from "@/components/layouts/header";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div vaul-drawer-wrapper="">
      <div className="relative flex min-h-svh flex-col bg-background">
        <div data-wrapper="" className="border-grid flex flex-1 flex-col">
          <Header />
          <div className="flex flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}