import Link from "next/link"
import Image from "next/image"

export function Header() {
  return (
    <header className="warm-header sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/littleforest-logo.png"
            alt="LittleForest Logo"
            width={200}
            height={54}
            className="h-12 w-auto"
            priority
          />
        </Link>
        <div className="text-sm text-primary font-medium">Agrisols Farm Management System</div>
      </div>
    </header>
  )
}
