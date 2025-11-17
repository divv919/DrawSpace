"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { SignupRequest, SignupResponse } from "@/types/auth";
export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });

  const { signup, populateUser } = useAuth();
  const mutation = useMutation<SignupResponse, Error, SignupRequest>({
    mutationFn: signup,
    onSuccess: (data) => {
      populateUser(data?.user);
      console.log("Signup Successful");
      router.push("/signin");
      //TODO: toast
    },
    onError: (error) => {
      console.log(error);
    },
  });
  const handleSignup = async () => {
    console.log("signup entered");
    if (mutation.isPending) {
      console.log("is pending");
      return;
    }
    console.log("about to mutate");

    const { email, username, password } = formData;
    mutation.mutate({ email, username, password });
    console.log("mutation done");
  };
  return (
    <div>
      <h1>Signup Here</h1>
      <input
        disabled={mutation.isPending}
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <input
        disabled={mutation.isPending}
        type="text"
        placeholder="Username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
      />
      <input
        type="password"
        disabled={mutation.isPending}
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      <button disabled={mutation.isPending} onClick={handleSignup}>
        Signup
      </button>
    </div>
  );
}
