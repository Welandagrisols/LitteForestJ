import Link from "next/link"
import Image from "next/image"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/images/littleforest-logo.png"
            alt="LittleForest Logo"
            width={160}
            height={43}
            className="h-8 sm:h-10 w-auto"
            priority
            loading="eager"
            sizes="(max-width: 640px) 128px, 160px"
          />
        </Link>
        <div className="text-xs sm:text-sm text-primary font-medium hidden sm:block">
          Agrisols Farm Management System
        </div>
        <div className="text-xs text-primary font-medium sm:hidden">
          Farm Management
        </div>
      </div>
    </header>
  )
}