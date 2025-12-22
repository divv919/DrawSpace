"use client";
import { LogOutIcon } from "lucide-react";
import { Button } from "../components/ui/Button";
import UsernameDashboard from "../components/UsernameDashboard";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Dialog, {
  DialogActions,
  DialogBackground,
  DialogContent,
  DialogTitle,
} from "../components/ui/Dialog";
import { signOut } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="w-screen min-h-screen bg-neutral-950 flex flex-col font-manrope relative">
      {isLogoutDialogOpen && (
        <DialogBackground>
          <Dialog>
            <DialogTitle>Logout</DialogTitle>
            <DialogContent>Are you sure you want to logout?</DialogContent>
            <DialogActions>
              <Button
                variant="secondary"
                onClick={() => setIsLogoutDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  signOut();
                }}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </DialogBackground>
      )}

      {/* <div className="absolute bottom-30 right-60 z-10 rotate-180">
        <DrawArrow />
      </div> */}
      {/* Header */}
      <header className="w-full max-w-screen px-8 py-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl gap-2 mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-400 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-neutral-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div> */}
            <span
              onClick={() => router.push("/")}
              className="text-xl md:text-2xl font-semibold text-neutral-100 cursor-pointer font-dancing-script"
            >
              DrawSpace
            </span>
          </div>
          <div className="flex items-center gap-4 lg:gap-6">
            <UsernameDashboard />
            <Button
              onClick={() => {
                setIsLogoutDialogOpen(true);
              }}
              variant="secondary"
              className="text-xs flex items-center gap-1 bg-neutral-700 px-3 py-2 text-neutral-200 hover:text-neutral-100"
            >
              <LogOutIcon size={14} className="" />
              <span className="text-xs ">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
