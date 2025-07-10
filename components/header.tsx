
import Link from "next/link"
import Image from "next/image"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1">
            <span className="text-lg sm:text-xl font-bold text-orange-500">Little</span>
            <span className="text-lg sm:text-xl font-bold text-green-600">Forest</span>
          </div>
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
