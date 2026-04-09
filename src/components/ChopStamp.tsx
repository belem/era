interface ChopStampProps {
  name?: string;
}

export function ChopStamp({ name = "松" }: ChopStampProps) {
  return (
    <div className="w-[72px] h-[72px] mx-auto rounded-[4px] border-[3px] border-primary flex items-center justify-center font-heading text-2xl text-primary -rotate-[5deg] animate-[stampIn_0.4s_ease]">
      {name}
    </div>
  );
}
