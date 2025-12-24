"use client";
import { RevealLogo } from "@/app/components/RevealLogo";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/hooks/useToast";
import { toTitleCase } from "@/app/lib/util";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
function Signin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorHandledRef = useRef(false);
  const error = searchParams.get("error");
  const { showToast } = useToast();

  useEffect(() => {
    // Check for OAuth errors in URL
    if (error && !errorHandledRef.current) {
      errorHandledRef.current = true;
      let errorMessage = "An error occurred during sign in.";
      if (error === "OAuthCallback") {
        errorMessage =
          "OAuth callback failed. Please check your Google OAuth configuration and ensure the redirect URI is set correctly in Google Cloud Console.";
      } else if (error === "Configuration") {
        errorMessage =
          "OAuth configuration error. Please check your GOOGLE_CLIENT_ID and GOOGLE_SECRET environment variables.";
      } else if (error === "AccessDenied") {
        errorMessage =
          "Access denied. Please try again or use a different account.";
      }
      showToast({
        message: errorMessage,
        title: "Sign In Error",
        type: "error",
      });
      // Clean up the error from URL
      router.replace("/signin");
    }
    // Reset the ref when error is cleared
    if (!error) {
      errorHandledRef.current = false;
    }
  }, [error, showToast, router]);

  return (
    <div className="h-full w-full flex flex-col gap-8 items-center justify-center min-h-screen relative">
      <div className="hidden lg:block absolute h-full border-x border-x-neutral-800 right-0 w-30 bg-[image:repeating-linear-gradient(315deg,_var(--color-neutral-800)_0,_var(--color-neutral-800)_1px,transparent_0,_transparent_50%)] bg-[size:10px_10px]"></div>
      <div className="hidden lg:block absolute h-full border-x border-x-neutral-800 left-0 w-30 bg-[image:repeating-linear-gradient(315deg,_var(--color-neutral-800)_0,_var(--color-neutral-800)_1px,transparent_0,_transparent_50%)] bg-[size:10px_10px]"></div>

      <div className="flex flex-col gap-1 items-center">
        <h1 className="text-3xl font-bold font-manrope">
          Welcome to{" "}
          <span className="font-dancing-script text-4xl pb-1 ">DrawSpace</span>
        </h1>
        <h4 className="text-[15px] font-medium text-neutral-400 font-manrope">
          A shared space to think visually.
        </h4>
      </div>
      <div className="flex flex-col gap-3">
        {" "}
        <AuthButton provider="google" />
        <AuthButton provider="github" />
      </div>
    </div>
  );
}

export default function SuspenceWrappedSignin() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-full w-full min-h-screen">
          <RevealLogo />
        </div>
      }
    >
      <Signin />
    </Suspense>
  );
}
const AuthButton = ({ provider }: { provider: "github" | "google" }) => {
  const { showToast } = useToast();
  const { status } = useSession();

  return (
    <Button
      variant="primary"
      className="text-[15px]  px-10 py-[10px] flex items-center text-nowrap gap-2"
      disabled={status === "loading"}
      onClick={async () => {
        try {
          const origin =
            typeof window !== "undefined" ? window.location.origin : "";
          const result = await signIn(provider, {
            callbackUrl: `${origin}/`,
            redirect: true,
          });
          if (result?.error) {
            showToast({
              message: `Sign in failed: ${result.error}`,
              title: "Error",
              type: "error",
            });
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            showToast({
              message: error.message,
              title: "Error",
              type: "error",
            });
          } else {
            showToast({
              message: "Failed to initiate sign in",
              title: "Error",
              type: "error",
            });
          }
        }
      }}
    >
      {provider === "google" ? <GoogleLogo /> : <GithubLogo />}
      Continue with {toTitleCase(provider)}
    </Button>
  );
};

const GoogleLogo = () => {
  return (
    <svg
      className="w-6 h-6"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
    >
      <path
        d="M29.44,16.318c0-.993-.089-1.947-.255-2.864h-13.185v5.422h7.535c-.331,1.744-1.324,3.22-2.813,4.213v3.525h4.544c2.647-2.444,4.175-6.033,4.175-10.296Z"
        fill="#4285F4"
      ></path>
      <path
        d="M16,30c3.78,0,6.949-1.247,9.265-3.385l-4.544-3.525c-1.247,.84-2.838,1.349-4.722,1.349-3.64,0-6.733-2.456-7.84-5.765l-2.717,2.09-1.941,1.525c2.304,4.569,7.025,7.713,12.498,7.713Z"
        fill="#0F9D58"
      ></path>
      <path
        d="M8.16,18.66c-.28-.84-.445-1.731-.445-2.66s.165-1.82,.445-2.66v-3.615H3.502c-.955,1.884-1.502,4.009-1.502,6.275s.547,4.391,1.502,6.275h3.332s1.327-3.615,1.327-3.615Z"
        fill="#F4B400"
      ></path>
      <path
        d="M16,7.575c2.062,0,3.895,.713,5.358,2.087l4.009-4.009c-2.431-2.265-5.587-3.653-9.367-3.653-5.473,0-10.195,3.144-12.498,7.725l4.658,3.615c1.107-3.309,4.2-5.765,7.84-5.765Z"
        fill="#DB4437"
      ></path>
    </svg>
  );
};
const GithubLogo = () => {
  return (
    <svg
      className="w-6 h-6"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
    >
      <path
        d="M16,2.345c7.735,0,14,6.265,14,14-.002,6.015-3.839,11.359-9.537,13.282-.7,.14-.963-.298-.963-.665,0-.473,.018-1.978,.018-3.85,0-1.312-.437-2.152-.945-2.59,3.115-.35,6.388-1.54,6.388-6.912,0-1.54-.543-2.783-1.435-3.762,.14-.35,.63-1.785-.14-3.71,0,0-1.173-.385-3.85,1.435-1.12-.315-2.31-.472-3.5-.472s-2.38,.157-3.5,.472c-2.677-1.802-3.85-1.435-3.85-1.435-.77,1.925-.28,3.36-.14,3.71-.892,.98-1.435,2.24-1.435,3.762,0,5.355,3.255,6.563,6.37,6.913-.403,.35-.77,.963-.893,1.872-.805,.368-2.818,.963-4.077-1.155-.263-.42-1.05-1.452-2.152-1.435-1.173,.018-.472,.665,.017,.927,.595,.332,1.277,1.575,1.435,1.978,.28,.787,1.19,2.293,4.707,1.645,0,1.173,.018,2.275,.018,2.607,0,.368-.263,.787-.963,.665-5.719-1.904-9.576-7.255-9.573-13.283,0-7.735,6.265-14,14-14Z"
        fill="black"
      ></path>
    </svg>
  );
};
