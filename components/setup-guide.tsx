"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function SetupGuide() {
  const [activeTab, setActiveTab] = useState("create-tables")
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "SQL script copied to clipboard",
    })
  }

  const sqlScript = `-- Create inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_name VARCHAR(255) NOT NULL,
  scientific_name VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
