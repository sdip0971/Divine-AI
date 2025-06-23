import React from "react";
import { SignIn } from "@clerk/nextjs";
function Signin() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <SignIn />
    </div>
  );
}

export default Signin;
