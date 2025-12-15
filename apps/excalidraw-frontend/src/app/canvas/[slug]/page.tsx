"use client";
import CanvasComponentForWS from "@/app/(auth)/components/CanvasComponentForWS";
import CanvasComponent from "@/app/(auth)/components/CanvasComponentForWS";
import { fetchJSON } from "@/app/api/rooms";
import { BACKEND_BASE_URL } from "@/config/variables";
import { Content } from "@/types/canvas";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const checkOrGetAccess = async (
  slug: string,
  method: "GET" | "POST" = "GET",
  body?: any
) => {
  const response = await fetchJSON<{
    access: "user" | "admin" | "moderator" | undefined;
    success: boolean;
    prompt_password: boolean | undefined;
    userId: string;
  }>(`/room/${slug}`, {
    method,
    body: JSON.stringify(body),

    credentials: "include",
  });
  return response;
};

const CanvasPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [password, setPassword] = useState("");
  const [pageState, setPageState] = useState<
    "promptPassword" | "accessGranted" | "unavailable" | "loading"
  >("loading");
  const [user, setUser] = useState<{
    userId: undefined | string;
    access: "user" | "admin" | "moderator" | undefined;
  }>({ userId: undefined, access: undefined });

  useEffect(() => {
    async function checkAccess() {
      setPageState("loading");
      const response = await checkOrGetAccess(slug, "POST");

      if (response.success) {
        setUser({
          userId: response.userId,
          access: response.access,
        });
        if (response.prompt_password) {
          setPageState("promptPassword");
        } else {
          setPageState("accessGranted");
        }
      } else {
        setPageState("unavailable");
      }
      setPassword("");
    }
    checkAccess();
  }, [slug]);

  const handleSubmitPassword = async () => {
    setPageState("loading");
    const response = await checkOrGetAccess(slug, "POST", { password });
    setPassword("");

    if (response.success) {
      if (response.prompt_password) {
        setPageState("promptPassword");
      } else {
        setPageState("accessGranted");
      }
      console.log(
        "response id ",
        response.userId,
        "user access",
        response.access
      );
    } else {
      setPageState("unavailable");
    }
  };

  if (pageState === "promptPassword") {
    return (
      <div>
        <h1>Prompt Password</h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleSubmitPassword}>Submit</button>
      </div>
    );
  }
  if (pageState === "accessGranted") {
    return (
      <div>
        <CanvasComponentForWS user={user} slug={slug} />
      </div>
    );
  }

  if (pageState === "loading") {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div>
      <h1>Unavailable</h1>
    </div>
  );
  // const prevMessages = await getPreviousMessages(params.slug);
  // const existingShapes: string[] = prevMessages.messages.map(
  //   (msg: any) => msg.message
  // );
  // console.log("existing shapes are direct after fetching : ", existingShapes);
  // return (
  //   <div className="h-screen w-screen bg-neutral-900">
  //     <CanvasComponent existingShapes={existingShapes} />
  //   </div>
  // );
};
export default CanvasPage;
