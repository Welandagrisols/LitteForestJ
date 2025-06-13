"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, Database, FileText, Settings, Users } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

export default function SetupGuide() {
  const [steps, setSteps] = useState([
    {
      id: "database",
      title: "Database Setup", 
      description: "Configure your inventory database",
      completed: false,
      icon: <Database className="w-5 h-5" />,
    },
    {
      id: "categories",
      title: "Plant Categories",
      description: "Set up plant categories",
      completed: false,
      icon: <FileText className="w-5 h-5" />,
    },
  ])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">LittleForest Setup</h1>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={step.id}>
            <CardHeader>
              <CardTitle>Step {index + 1}: {step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
