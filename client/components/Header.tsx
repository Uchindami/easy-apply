"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "./ui/sidebar"
import { useRef, useState, useEffect, useCallback } from "react"
import { Bookmark, MessageCircle, Send, User, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useProfileStore } from "@/store/profile-store"

// Types
interface HeaderProps {
  title: string
  onReset?: () => void
  isResetDisabled?: boolean
  savedJobsButtonProps?: {
    onClick: () => void
    isLoadingSavedJobs: boolean
    savedJobsCount: number
  }
}

interface Comment {
  id: string
  author: string
  content: string
  timestamp: Date
  page: string
}

interface CommentState {
  comments: Comment[]
  newComment: string
  isSubmitting: boolean
  isLoading: boolean  
  error: string | null
}

// Constants
const CURRENT_USER = useProfileStore.getState().user?.displayName || "Anonymous"
const COMMENTS_COLLECTION = "page_comments"

// Utility functions
const getCurrentPage = (): string => {
  if (typeof window === "undefined") return "/"

  const path = window.location.pathname

  // Generalize specific chat history pages
  if (path.startsWith("/dashboard/chatHistory/")) {
    return "/dashboard/chatHistory/"
  }

  return path
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}

const convertFirestoreTimestamp = (timestamp: any): Date => {
  return timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp)
}

const mapFirestoreComment = (doc: any): Comment => ({
  id: doc.id,
  author: doc.data().author,
  content: doc.data().content,
  page: doc.data().page,
  timestamp: convertFirestoreTimestamp(doc.data().timestamp),
})

// Custom hooks
const useRenderCount = () => {
  const renderCount = useRef(0)
  renderCount.current += 1
  return renderCount.current
}

const useCommentModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const currentPage = getCurrentPage()

  return {
    isOpen,
    setIsOpen,
    currentPage,
  }
}

const useCommentState = () => {
  const [state, setState] = useState<CommentState>({
    comments: [],
    newComment: "",
    isSubmitting: false,
    isLoading: false,
    error: null,
  })

  const updateState = useCallback((updates: Partial<CommentState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const resetError = useCallback(() => {
    updateState({ error: null })
  }, [updateState])

  const setComments = useCallback((comments: Comment[]) => {
    updateState({ comments })
  }, [updateState])

  const setNewComment = useCallback((newComment: string) => {
    updateState({ newComment })
  }, [updateState])

  const setLoading = useCallback((isLoading: boolean) => {
    updateState({ isLoading })
  }, [updateState])

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    updateState({ isSubmitting })
  }, [updateState])

  const setError = useCallback((error: string | null) => {
    updateState({ error })
  }, [updateState])

  return {
    state,
    setComments,
    setNewComment,
    setLoading,
    setSubmitting,
    setError,
    resetError,
  }
}

// Firebase operations
const useFirebaseComments = (page: string, isModalOpen: boolean) => {
  const {
    state,
    setComments,
    setNewComment,
    setLoading,
    setSubmitting,
    setError,
    resetError,
  } = useCommentState()

  // Add comment to Firebase
  const addComment = useCallback(async (content: string) => {
    if (!content.trim()) return

    setSubmitting(true)
    resetError()

    try {
      const commentsRef = collection(db, COMMENTS_COLLECTION)
      const docRef = await addDoc(commentsRef, {
        content: content.trim(),
        page,
        author: CURRENT_USER,
        timestamp: serverTimestamp(),
      })

      // Optimistically add to UI
      const newCommentObj: Comment = {
        id: docRef.id,
        author: CURRENT_USER,
        content: content.trim(),
        timestamp: new Date(),
        page,
      }

      setComments([newCommentObj, ...state.comments])
      setNewComment("")
    } catch (err) {
      console.error("Error adding comment:", err)
      setError("Failed to post comment. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }, [page, state.comments, setComments, setNewComment, setSubmitting, setError, resetError])

  // Set up real-time listener
  useEffect(() => {
    if (!isModalOpen) return

    const commentsRef = collection(db, COMMENTS_COLLECTION)
    const q = query(commentsRef, where("page", "==", page), orderBy("timestamp", "desc"))

    setLoading(true)
    resetError()

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedComments = snapshot.docs.map(mapFirestoreComment)
        setComments(fetchedComments)
        setLoading(false)
      },
      (err) => {
        console.error("Error listening to comments:", err)
        // setError("Failed to load comments. Please try again.")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [isModalOpen, page, setComments, setLoading, setError, resetError])

  return {
    ...state,
    addComment,
    setNewComment,
  }
}

// Component parts
const CommentForm: React.FC<{
  newComment: string
  isSubmitting: boolean
  onCommentChange: (comment: string) => void
  onSubmit: (content: string) => void
}> = ({ newComment, isSubmitting, onCommentChange, onSubmit }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(newComment)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Add a comment about this page..."
        value={newComment}
        onChange={(e) => onCommentChange(e.target.value)}
        className="min-h-[80px] resize-none"
        disabled={isSubmitting}
      />
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Commenting as {CURRENT_USER}</span>
        <Button
          type="submit"
          size="sm"
          disabled={!newComment.trim() || isSubmitting}
          className="flex items-center gap-1"
        >
          <Send className="h-3 w-3" />
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  )
}

const CommentsList: React.FC<{
  comments: Comment[]
  isLoading: boolean
  currentPage: string
}> = ({ comments, isLoading, currentPage }) => {
  const pageComments = comments.filter(comment => comment.page === currentPage)

  const getCommentsTitle = () => {
    if (isLoading) return "Loading comments..."
    if (pageComments.length === 0) return "No comments yet"
    return `${pageComments.length} comment${pageComments.length === 1 ? "" : "s"}`
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 animate-pulse">
          <div className="h-8 w-8 bg-muted rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )

  const EmptyState = () => (
    <div className="text-center py-8 text-muted-foreground">
      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
      <p>Be the first to comment on this page!</p>
    </div>
  )

  const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="text-xs">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.author}</span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(comment.timestamp)}
          </span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
      </div>
    </div>
  )


  return (
    <div className="flex flex-col flex-1 min-h-0 border-t pt-4">
      <h3 className="font-medium mb-3">{getCommentsTitle()}</h3>
      <ScrollArea className="flex-1 overflow-y-auto pr-4">
        <div className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : pageComments.length > 0 ? (
            pageComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

const CommentsModal: React.FC<{
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentPage: string
  pageComments: Comment[]
}> = ({ isOpen, onOpenChange, currentPage, pageComments }) => {
  const {
    comments,
    newComment,
    isSubmitting,
    isLoading,
    error,
    addComment,
    setNewComment,
  } = useFirebaseComments(currentPage, isOpen)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Comments</span>
          {pageComments.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {pageComments.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Page Comments
            <Badge variant="outline" className="ml-2">
              {currentPage}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <CommentForm
            newComment={newComment}
            isSubmitting={isSubmitting}
            onCommentChange={setNewComment}
            onSubmit={addComment}
          />

          <CommentsList
            comments={comments}
            isLoading={isLoading}
            currentPage={currentPage}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

const SavedJobsButton: React.FC<{
  onClick: () => void
  isLoadingSavedJobs: boolean
  savedJobsCount: number
}> = ({ onClick, isLoadingSavedJobs, savedJobsCount }) => (
  <Button
    variant="outline"
    size="sm"
    className="flex items-center gap-1"
    onClick={onClick}
  >
    <Bookmark className="h-4 w-4 text-primary" />
    <span className="text-primary">Saved Jobs</span>
    {!isLoadingSavedJobs && savedJobsCount > 0 && (
      <span className="ml-1 bg-foreground/50 text-white rounded-full text-xs px-1.5 py-0.5 min-w-5 text-center">
        {savedJobsCount}
      </span>
    )}
  </Button>
)

// Main component
export function Header({ title, onReset, isResetDisabled, savedJobsButtonProps }: HeaderProps) {
  const renderCount = useRenderCount()
  const { isOpen, setIsOpen, currentPage } = useCommentModal()
  
  // Get current page comments for badge count (simple filter without Firebase call)
  const [pageCommentsCount, setPageCommentsCount] = useState(0)
  const pageComments = Array.from({ length: pageCommentsCount }, (_, i) => ({
    id: `${i}`,
    author: "",
    content: "",
    timestamp: new Date(),
    page: currentPage,
  }))

  return (
    <header className="border-b bg-background p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-[1200px] mx-auto">
        <div className="flex items-center space-x-2">
          <SidebarTrigger className="mr-4" />
          <h1 className="md:text-xl font-bold">{title}</h1>
          <span className="text-xs text-muted-foreground">
            Renders: {renderCount}
            <span className="text-xs text-muted-foreground ml-2">
              <span className="hidden md:inline">development mode</span>
            </span>
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {onReset && (
            <Button onClick={onReset} variant="ghost" disabled={isResetDisabled}>
              Reset
            </Button>
          )}

          <CommentsModal
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            currentPage={currentPage}
            pageComments={pageComments}
          />

          {savedJobsButtonProps && (
            <SavedJobsButton {...savedJobsButtonProps} />
          )}
        </div>
      </div>
    </header>
  )
}