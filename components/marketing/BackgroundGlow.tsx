export function BackgroundGlow() {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full h-full max-w-7xl opacity-30 pointer-events-none">
      <div className="absolute top-[-10%] left-[20%] w-72 h-72 bg-primary rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[128px] opacity-20 animate-pulse" />
      <div className="absolute top-[10%] right-[20%] w-72 h-72 bg-secondary rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[128px] opacity-20 animate-pulse delay-700" />
    </div>
  );
}


