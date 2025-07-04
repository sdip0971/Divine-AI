// Header.tsx
"use client";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useSidebar } from "../Sidebarprovide";

export default function Header() {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 w-full flex justify-between items-center p-4 z-30 ">

      <Button
        onClick={toggleSidebar}
        aria-label="Close sidebar"
        className="md:hidden p-2 rounded-md bg-black/70 text-white"
      >
        <Menu size={20} />
      </Button>

      <h1 className="ml-3 mt-2 text-4xl font-semibold tracking-widest text-indigo-100 drop-shadow-[0_1px_1px_rgba(255,255,255,0.1)] font-cormorant">
        Divine AI
      </h1>

      <div className="flex items-center space-x-4 ml-auto">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton forceRedirectUrl={"/chat"}>
            <Button variant="outline">SignIn</Button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  );
}
