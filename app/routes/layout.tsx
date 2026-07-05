import { Outlet } from "react-router";

import { BackgroundDither } from "~/components/Background";

export default function Layout() {
  return (
    <div className="flex flex-col h-screen">
      <BackgroundDither />
      <div className="flex-auto flex items-center justify-center p-4 md:py-24">
        <Outlet />
      </div>
    </div>
  );
}
