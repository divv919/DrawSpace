import { Button } from "@repo/ui/button";
import input from "@repo/ui/input";

const AuthComponent = ({ isSignup }: { isSignup: boolean }) => {
  return (
    <div className="w-screen h-screen flex justify-center">
      {isSignup && <input placeholder="Enter name" />}
      <input placeholder="Enter username" />
      <input placeholder="Enter password" />
      <button>{isSignup ? "Sign up" : "Log In"}</button>
    </div>
  );
};
export default AuthComponent;
