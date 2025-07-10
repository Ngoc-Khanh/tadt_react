import { PiBuildingApartmentDuotone } from "react-icons/pi";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#1976d2] shadow-lg">
      <div className="mx-auto px-10">
        <div className="flex h-16 items-center justify-start">
          <div className="flex items-center gap-2">
            <PiBuildingApartmentDuotone className="h-6 w-6 text-white" />
            <h1 className="text-xl font-semibold text-white">Hệ thống quản lý tiến độ dự án xây dựng</h1>
          </div>
        </div>
      </div>
    </header>
  );
}