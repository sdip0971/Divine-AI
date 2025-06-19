"use client";
import {
  SignInButton,
  SignedIn,
  SignOutButton,
  SignedOut,
  UserButton,
  useUser,
  UserProfile,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DotIcon } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { handleClientScriptLoad } from "next/script";


export default function Header() {
    const { signOut } = useClerk();
    const handlesignout = async () => {
      try {
        await signOut();
        console.log("Sign out successful");
        router.push("/signin");
      } catch (error) {
        console.error("Sign out failed:", error);
      }
    };

  const { isSignedIn } = useUser();
  const router = useRouter();
  return (
    <div className="absolute flex flex-col w-full p-4 z-50">
      <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between bg-transparent">
        <div className="flex items-center">
          <img
            src="/icons/feather.jpg"
            alt="Feather Icon"
            className="w-12 h-12 rounded-full border-2 border-white shadow-md shadow-black/20"
          />
          <h1 className="ml-4 text-3xl font-light text-white tracking-wide drop-shadow-md">
            Divine AI
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton forceRedirectUrl={'/chat'}>
              <Button variant="outline">SignIn</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
