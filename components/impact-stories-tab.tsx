
"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { DemoModeBanner } from "@/components/demo-mode-banner"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AddImpactStoryForm } from "@/components/add-impact-story-form"
import { EditImpactStoryForm } from "@/components/edit-impact-story-form"
import { 
  Plus, 
  Droplets, 
  Wheat, 
  Trees, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ImpactStory {
  id: string
  title: string
  text: string
  media_urls: string[] | null
  category: 'water' | 'food_security' | 'beautification'
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export function ImpactStoriesTab() {
  const [stories, setStories] = useState<ImpactStory[]>([])
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'water' | 'food_security' | 'beautification'>('water')
  const { toast } = useToast()

  const categoryInfo = {
    water: { 
      icon: Droplets, 
      label: 'Water', 
      color: 'bg-blue-100 text-blue-800',
      description: 'Springs rehabilitation stories'
    },
    food_security: { 
      icon: Wheat, 
      label: 'Food Security', 
      color: 'bg-green-100 text-green-800',
      description: 'Food security impact stories'
    },
    beautification: { 
      icon: Trees, 
      label: 'Beautification', 
      color: 'bg-purple-100 text-purple-800',
      description: 'Community beautification projects'
    }
  }

  useEffect(() => {
    checkTableAndLoadStories()
  }, [])

  const checkTableAndLoadStories = async () => {
    if (isDemoMode) {
      setTableExists(false)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('impact_stories')
        .select('id')
        .limit(1)

      if (error) {
        console.error('Table check error:', error)
        setTableExists(false)
      } else {
        setTableExists(true)
        await loadStories()
      }
    } catch (error) {
      console.error('Error checking table:', error)
      setTableExists(false)
    } finally {
      setLoading(false)
    }
  }

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('impact_stories')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Error loading stories:', error)
        toast({
          title: "Error",
          description: "Failed to load impact stories",
          variant: "destructive",
        })
      } else {
        setStories(data || [])
      }
    } catch (error) {
      console.error('Error loading stories:', error)
    }
  }

  const handleStoryAdded = (newStory: ImpactStory) => {
    setStories(prev => [...prev, newStory])
    toast({
      title: "Success",
      description: "Impact story added successfully",
    })
  }

  const handleStoryUpdated = (updatedStory: ImpactStory) => {
    setStories(prev => prev.map(story => 
      story.id === updatedStory.id ? updatedStory : story
    ))
    toast({
      title: "Success",
      description: "Impact story updated successfully",
    })
  }

  const togglePublished = async (story: ImpactStory) => {
    try {
      const { error } = await supabase
        .from('impact_stories')
        .update({ is_published: !story.is_published, updated_at: new Date().toISOString() })
        .eq('id', story.id)

      if (error) {
        throw error
      }

      setStories(prev => prev.map(s => 
        s.id === story.id ? { ...s, is_published: !s.is_published } : s
      ))

      toast({
        title: "Success",
        description: `Story ${!story.is_published ? 'published' : 'hidden'}`,
      })
    } catch (error) {
      console.error('Error toggling published status:', error)
      toast({
        title: "Error",
        description: "Failed to update story status",
        variant: "destructive",
      })
    }
  }

  const updateDisplayOrder = async (storyId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('impact_stories')
        .update({ display_order: newOrder, updated_at: new Date().toISOString() })
        .eq('id', storyId)

      if (error) {
        throw error
      }

      await loadStories()
      toast({
        title: "Success",
        description: "Story order updated",
      })
    } catch (error) {
      console.error('Error updating order:', error)
      toast({
        title: "Error",
        description: "Failed to update story order",
        variant: "destructive",
      })
    }
  }

  const deleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('impact_stories')
        .delete()
        .eq('id', storyId)

      if (error) {
        throw error
      }

      setStories(prev => prev.filter(story => story.id !== storyId))
      toast({
        title: "Success",
        description: "Story deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting story:', error)
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive",
      })
    }
  }

  const getStoriesByCategory = (category: string) => {
    return stories.filter(story => story.category === category)
  }

  const getCategoryStats = () => {
    const waterStories = getStoriesByCategory('water')
    const foodStories = getStoriesByCategory('food_security')
    const beautificationStories = getStoriesByCategory('beautification')

    return {
      total: stories.length,
      published: stories.filter(s => s.is_published).length,
      water: waterStories.length,
      food_security: foodStories.length,
      beautification: beautificationStories.length,
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const stats = getCategoryStats()
  const currentCategoryStories = getStoriesByCategory(activeCategory)

  return (
    <div className="modern-page space-y-8">
      {(isDemoMode || !tableExists) && (
        <DemoModeBanner 
          isDemoMode={isDemoMode} 
          connectionStatus={tableExists ? 'connected' : 'demo'} 
        />
      )}

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Impact Stories Management</h1>
          <p className="text-muted-foreground">
            Manage stories for the "Our Impact" page on your website
          </p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.water}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Food Security</CardTitle>
            <Wheat className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.food_security}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beautification</CardTitle>
            <Trees className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.beautification}</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(value: any) => setActiveCategory(value)} className="w-full">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="water" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Water
            </TabsTrigger>
            <TabsTrigger value="food_security" className="flex items-center gap-2">
              <Wheat className="h-4 w-4" />
              Food Security
            </TabsTrigger>
            <TabsTrigger value="beautification" className="flex items-center gap-2">
              <Trees className="h-4 w-4" />
              Beautification
            </TabsTrigger>
          </TabsList>

          {tableExists && (
            <AddImpactStoryForm 
              category={activeCategory}
              onStoryAdded={handleStoryAdded}
            />
          )}
        </div>

        <TabsContent value="water" className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              {currentCategoryStories.length} stories
            </Badge>
            <span className="text-sm text-muted-foreground">
              Springs rehabilitation stories
            </span>
          </div>
          <StoryList 
            stories={currentCategoryStories}
            onTogglePublished={togglePublished}
            onUpdateOrder={updateDisplayOrder}
            onDelete={deleteStory}
            onStoryUpdated={handleStoryUpdated}
          />
        </TabsContent>

        <TabsContent value="food_security" className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              {currentCategoryStories.length} stories
            </Badge>
            <span className="text-sm text-muted-foreground">
              Food security impact stories
            </span>
          </div>
          <StoryList 
            stories={currentCategoryStories}
            onTogglePublished={togglePublished}
            onUpdateOrder={updateDisplayOrder}
            onDelete={deleteStory}
            onStoryUpdated={handleStoryUpdated}
          />
        </TabsContent>

        <TabsContent value="beautification" className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-800">
              {currentCategoryStories.length} stories
            </Badge>
            <span className="text-sm text-muted-foreground">
              Community beautification projects
            </span>
          </div>
          <StoryList 
            stories={currentCategoryStories}
            onTogglePublished={togglePublished}
            onUpdateOrder={updateDisplayOrder}
            onDelete={deleteStory}
            onStoryUpdated={handleStoryUpdated}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface StoryListProps {
  stories: ImpactStory[]
  onTogglePublished: (story: ImpactStory) => void
  onUpdateOrder: (storyId: string, newOrder: number) => void
  onDelete: (storyId: string) => void
  onStoryUpdated: (story: ImpactStory) => void
}

function StoryList({ stories, onTogglePublished, onUpdateOrder, onDelete, onStoryUpdated }: StoryListProps) {
  if (stories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">No stories yet</h3>
            <p className="text-muted-foreground">
              Add your first impact story to get started
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {stories.map((story, index) => (
        <Card key={story.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{story.title}</h3>
                  <Badge variant={story.is_published ? "default" : "secondary"}>
                    {story.is_published ? "Published" : "Draft"}
                  </Badge>
                  {story.media_urls && story.media_urls.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {story.media_urls.length} media
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground line-clamp-3">
                  {story.text}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Order: {story.display_order}</span>
                  <span>•</span>
                  <span>Updated: {new Date(story.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {/* Order controls */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateOrder(story.id, story.display_order - 1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateOrder(story.id, story.display_order + 1)}
                    disabled={index === stories.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Visibility toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTogglePublished(story)}
                >
                  {story.is_published ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </Button>

                {/* Edit button */}
                <EditImpactStoryForm 
                  story={story}
                  onStoryUpdated={onStoryUpdated}
                />

                {/* Delete button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Story</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{story.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(story.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
