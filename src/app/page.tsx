import React from 'react'
import {Button} from '@/components/ui/button';
import Link from 'next/link';
function LandingPage() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-white">
      {/* Enhanced Heading */}
      <h1 className="text-5xl font-extrabold mb-4 tracking-wide drop-shadow-md">
        Welcome to Divine AI
      </h1>
      {/* Enhanced Paragraph */}
      <p className="text-lg font-light mb-8 tracking-tight opacity-90">
        Your spiritual AI companion, bringing peace and clarity.
      </p>
      {/* Button */}
      <Button className="px-6 py-3 text-white rounded-lg font-medium tracking-wide shadow-md hover:shadow-lg">
        <Link href="/signin">Get Started</Link>
      </Button>
    </div>
  );
}

export default LandingPage

