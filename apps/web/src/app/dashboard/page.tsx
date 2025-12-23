"use client";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, House, PencilLine } from "lucide-react";
import { Button } from "../components/ui/Button";
export default function DashboardPage() {
  const router = useRouter();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 pb-24 md:pb-12 relative">
      <div className="hidden lg:block absolute h-full border-x border-x-neutral-800 right-0 w-30 bg-[image:repeating-linear-gradient(315deg,_var(--color-neutral-800)_0,_var(--color-neutral-800)_1px,transparent_0,_transparent_50%)] bg-[size:10px_10px]"></div>
      <div className="hidden lg:block absolute h-full border-x border-x-neutral-800 left-0 w-30 bg-[image:repeating-linear-gradient(315deg,_var(--color-neutral-800)_0,_var(--color-neutral-800)_1px,transparent_0,_transparent_50%)] bg-[size:10px_10px]"></div>

      <div className="max-w-2xl w-full text-center mb-12">
        <h1 className="text-3xl font-bold text-neutral-100 mb-3">
          Welcome to{" "}
          <span className="font-dancing-script text-4xl">DrawSpace</span>
        </h1>
        <p className="text-neutral-400 text-sm lg:text-base leading-6 lg:text-nowrap">
          Choose how you want to create. Collaborate with others in real-time or
          work on your own canvas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        {/* Collaborate Card */}
        <Card
          title="Collaborate"
          description="Create or join a room to draw together with your team in real-time.
            Share ideas instantly."
          // Icon={<UsersIcon className="w-6 h-6 text-neutral-300" />}
          onClick={() => router.push("/dashboard/rooms")}
        />

        <Card
          title="Local Canvas"
          description="Work on your own personal canvas. Perfect for quick sketches and solo brainstorming."
          // Icon={<MonitorIcon className="w-6 h-6 text-neutral-300" />}
          onClick={() => router.push("/local/canvas")}
        />
        {/* Local Canvas Card */}
      </div>
    </div>
  );
}

const Card = ({
  title,
  description,

  onClick,
}: {
  title: string;
  description: string;

  onClick: () => void;
}) => {
  return (
    <div className=" relative overflow-hidden  p-6 rounded-xl bg-neutral-900 border border-neutral-800  hover:shadow-[inset_0px_-20px_50px_rgba(255,255,255,0.04)] transition-all duration-200 text-left ">
      {/* <div className="w-12 h-12 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 flex items-center justify-center mb-4 transition-colors">
        {Icon}
      </div> */}

      <div className="absolute top-0 h-full mask-l mask-b mask-b-from-0% mask-b-to-100% mask-l-from-0% mask-l-to-100% right-0 w-30 bg-[image:repeating-linear-gradient(315deg,_var(--color-neutral-800)_0,_var(--color-neutral-800)_1px,transparent_0,_transparent_50%)] bg-[size:10px_10px]"></div>

      <h3 className=" text-lg font-semibold text-neutral-100 mb-2 flex items-center gap-2">
        {title}
        <ArrowRightIcon className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{description}</p>
      {title === "Collaborate" ? (
        <Button
          onClick={onClick}
          variant="primary"
          className=" flex gap-1 items-center  rounded-lg px-2 text-sm font-semibold tracking-tight mt-3 py-[4px] w-fit text-neutral-800"
        >
          <House size={16} />
          <span>Join Room</span>
        </Button>
      ) : (
        <Button
          onClick={onClick}
          variant="primary"
          className=" flex gap-1 items-center  rounded-lg px-2 text-sm font-semibold tracking-tight mt-3 py-[4px] w-fit text-neutral-800"
        >
          <PencilLine size={16} />
          <span>Start Drawing</span>
        </Button>
      )}
    </div>
  );
};
