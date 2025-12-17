"use client";
import { useRouter } from "next/navigation";
import { UsersIcon, MonitorIcon, ArrowRightIcon } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
      <div className="max-w-2xl w-full text-center mb-12">
        <h1 className="text-3xl font-bold text-neutral-100 mb-3">
          Welcome to Excalidraw
        </h1>
        <p className="text-neutral-400 text-lg">
          Choose how you want to create. Collaborate with others in real-time or
          work on your own canvas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        {/* Collaborate Card */}
        <button
          onClick={() => router.push("/dashboard/rooms")}
          className="group p-6 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/50 transition-all duration-200 text-left cursor-pointer"
        >
          <div className="w-12 h-12 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 flex items-center justify-center mb-4 transition-colors">
            <UsersIcon className="w-6 h-6 text-neutral-300" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-100 mb-2 flex items-center gap-2">
            Collaborate
            <ArrowRightIcon className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Create or join a room to draw together with your team in real-time.
            Share ideas instantly.
          </p>
        </button>

        {/* Local Canvas Card */}
        <button
          onClick={() => alert("Local mode not implemented yet")}
          className="group p-6 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/50 transition-all duration-200 text-left cursor-pointer"
        >
          <div className="w-12 h-12 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 flex items-center justify-center mb-4 transition-colors">
            <MonitorIcon className="w-6 h-6 text-neutral-300" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-100 mb-2 flex items-center gap-2">
            Local Canvas
            <ArrowRightIcon className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Work on your own personal canvas. Perfect for quick sketches and
            solo brainstorming.
          </p>
        </button>
      </div>
    </div>
  );
}
