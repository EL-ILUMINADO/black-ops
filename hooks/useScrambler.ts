import { useState, useEffect } from "react";

export function useScrambler(text: string | undefined) {
  const [scrambled, setScrambled] = useState("");

  useEffect(() => {
    if (!text) return;

   
    const generateGhostId = (str: string) => {
      return str
        .split("")
        .map((char, i) => (i % 3 === 0 ? "x" : char.charCodeAt(0).toString(16).slice(-1)))
        .join("")
        .toUpperCase()
        .slice(0, 12); 
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScrambled(`AGENT_${generateGhostId(text)}`);
  }, [text]);

  return scrambled;
}