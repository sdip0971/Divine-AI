'use client'
import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const rashis = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export default function RashiDropdown() {
  const [selectedRashi, setSelectedRashi] = useState<string | null>(null);


  const handleSubmit = () => {
    if (selectedRashi) {
      console.log("Selected Rashi:", selectedRashi);
      // perform any action here
    }
  };

  return (
    <>
      <div className="flex w-full justify-center max-w-sm mx-auto my-2 space-y-4">
        <Select onValueChange={(val) => setSelectedRashi(val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your Rashi" />
          </SelectTrigger>
          <SelectContent >
            {rashis.map((rashi) => (
              <SelectItem key={rashi} value={rashi}>
                {rashi}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSubmit} disabled={!selectedRashi}>
          Submit
        </Button>
      </div>
      <div className="flex items-center shadow-2xs text-cyan-100 font-extrabold justify-center">
        {selectedRashi && (
          <p className=" font-inter text-blue-200 text-2xl text-shadow-teal-200 animate-pulse">
            You Selected: <strong>{selectedRashi}</strong>
          </p>
        )}
      </div>
    </>
  );
}

