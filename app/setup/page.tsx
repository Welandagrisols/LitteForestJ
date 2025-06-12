import { SetupGuide } from "@/components/setup-guide"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export default function SetupPage() {
  return (
    <div className="min-h-screen">
      <header className="warm-header">
        <div className="container mx-auto px-4 py-6 flex flex-col items-center text-center relative">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <Image
            src="/images/littleforest-logo.png"
            alt="LittleForest Logo"
            width={250}
            height={67}
            className="h-14 w-auto mb-2"
            priority
          />
          <div className="text-primary font-medium">Agrisols Farm Management System</div>
          <h1 className="text-2xl font-bold mt-2">Database Setup Guide</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Welcome to the Farm Management System</h2>
            <p className="text-muted-foreground">
              Follow this guide to set up your database and start managing your nursery inventory, sales, and customers
              with Agrisols Farm Management System.
            </p>
          </div>

          <SetupGuide />
        </div>
      </main>
    </div>
  )
}
