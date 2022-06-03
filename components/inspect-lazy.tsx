import { FC, useState, useEffect } from "react";
import { inspect } from "util";

export const InspectLazy: FC<{ src: any; }> = ({ src }) => {
  const newLocal = inspect(src, { depth: null, maxArrayLength: null, colors: false });
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(true);
  }, []);
  if (!loaded)
    return null;
  return <pre><code>{newLocal}</code></pre>;
};
