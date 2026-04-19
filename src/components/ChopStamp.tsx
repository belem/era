interface ChopStampProps {
  name?: string;
  size?: number;
  className?: string;
}

export function ChopStamp({ name = "松", size = 72, className = "" }: ChopStampProps) {
  const fontSize = size <= 48 ? "text-lg" : "text-2xl";
  const borderWidth = size <= 48 ? "border-2" : "border-[3px]";
  return (
    <div
      className={`mx-auto rounded-[4px] ${borderWidth} border-primary flex items-center justify-center font-heading ${fontSize} text-primary -rotate-[5deg] animate-[stampIn_0.4s_ease] ${className}`}
      style={{ width: size, height: size }}
    >
      {name}
    </div>
  );
}
