"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MessageData {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  body: string
  created_at: string
  sender?: Pick<Profile, "id" | "first_name" | "last_name">
  recipient?: Pick<Profile, "id" | "first_name" | "last_name">
}

interface MessagingInterfaceProps {
  currentUserId: string
  hrManagers: Pick<Profile, "id" | "first_name" | "last_name" | "email">[]
}

export function MessagingInterface({ currentUserId, hrManagers }: MessagingInterfaceProps) {
  const { toast } = useToast()
  const [sentMessages, setSentMessages] = useState<MessageData[]>([])
  const [receivedMessages, setReceivedMessages] = useState<MessageData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    recipient_id: "",
    subject: "",
    body: "",
  })

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        fetch("/api/messages?direction=sent"),
        fetch("/api/messages?direction=received"),
      ])

      if (sentRes.ok) setSentMessages(await sentRes.json())
      if (receivedRes.ok) setReceivedMessages(await receivedRes.json())
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.recipient_id || !formData.subject || !formData.body) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to send message")

      toast({
        title: "Success",
        description: "Message sent to HR",
      })

      setFormData({ recipient_id: "", subject: "", body: "" })
      loadMessages()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getManagerName = (id: string) => {
    const manager = hrManagers.find((m) => m.id === id)
    return manager ? `${manager.first_name} ${manager.last_name}` : "HR"
  }

  return (
    <Tabs defaultValue="compose" className="space-y-4">
      <TabsList>
        <TabsTrigger value="compose">Compose</TabsTrigger>
        <TabsTrigger value="sent">
          Sent ({sentMessages.length})
        </TabsTrigger>
        <TabsTrigger value="received">
          Received ({receivedMessages.length})
        </TabsTrigger>
      </TabsList>

      {/* Compose Tab */}
      <TabsContent value="compose">
        <Card>
          <CardHeader>
            <CardTitle>Send Message to HR</CardTitle>
            <CardDescription>
              Send a message to your HR department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Select value={formData.recipient_id} onValueChange={(value) =>
                  setFormData({ ...formData, recipient_id: value })
                }>
                  <SelectTrigger id="recipient">
                    <SelectValue placeholder="Select HR manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {hrManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.first_name} {manager.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Message subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Write your message..."
                  rows={6}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Sent Tab */}
      <TabsContent value="sent" className="space-y-4">
        {sentMessages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No sent messages</p>
            </CardContent>
          </Card>
        ) : (
          sentMessages.map((message) => (
            <Card key={message.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{message.subject}</CardTitle>
                    <CardDescription>
                      To: {getManagerName(message.recipient_id)}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Sent</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {message.body}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>

      {/* Received Tab */}
      <TabsContent value="received" className="space-y-4">
        {receivedMessages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No received messages</p>
            </CardContent>
          </Card>
        ) : (
          receivedMessages.map((message) => (
            <Card key={message.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{message.subject}</CardTitle>
                    <CardDescription>
                      From: {message.sender?.first_name} {message.sender?.last_name}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Inbox</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {message.body}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  )
}
