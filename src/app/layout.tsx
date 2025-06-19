
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/header";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Inter, Cormorant_Garamond } from "next/font/google";
import Sidebar from "@/components/ui/sidebar";
import { CreatenewChatProvider } from "@/components/ui/CreatenewChatProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "700"],
  display: "swap",
});

//export const metadata: Metadata = {
 // title: "Divine Ai",
 //// description: "Spritual Ai help bot",
//};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <ClerkProvider>
      <CreatenewChatProvider>
      <html lang="en">
        <body
          className={`${cormorant.variable} ${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased h-screen   bg-blend-soft-light `}
        >
          <div className="relative w-screen h-screen ">
            <div
              className="absolute h-screen inset-0 bg-[url(/pexels-navneet-shanu-202773-672630.jpg)] bg-cover bg-center z-0"
              style={{
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm z-10 pointer-events-none" />
       
            <Header />
            <Sidebar />

            <main className="relative z-50 flex flex-grow items-center justify-center h-full">
              {children}
            </main>
          </div>
        </body>
      </html>
      </CreatenewChatProvider>
    </ClerkProvider>
  );
}
