"use client";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/useToast";
import { SigninRequest, SigninResponse } from "@/types/auth";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function Signin() {
  const [formData, setFormData] = useState<SigninRequest>({
    email: "",
    password: "",
  });
  const router = useRouter();
  const { signin, populateUser } = useAuth();
  const { showToast } = useToast();
  const mutation = useMutation<SigninResponse, Error, SigninRequest>({
    mutationFn: signin,
    onSuccess: (data) => {
      populateUser(data?.user);
      console.log("Signin Successful");
      router.push("/");
      showToast({
        title: "Sign in Successful",
        message: "You are now signed in to your account",
        type: "success",
      });
    },
    onError: (error) => {
      console.log(error);
    },
  });
  const handleSignin = () => {
    if (mutation.isPending) {
      return;
    }
    const { email, password } = formData;
    mutation.mutate({ email, password });
  };
  return (
    <div>
      <h1>Signin Here</h1>
      <input
        disabled={mutation.isPending}
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <input
        disabled={mutation.isPending}
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      <button disabled={mutation.isPending} onClick={handleSignin}>
        Signin
      </button>
    </div>
  );
}
