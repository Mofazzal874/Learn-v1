// components/NodeDetailsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoadmapNode } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


import { X, ChevronDown, ChevronRight, BookOpen, Video, Loader2, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface NodeDetailsPanelProps {
  node: RoadmapNode;
  onClose: () => void;
  onUpdate: (node: RoadmapNode) => void;
  isMobile?: boolean;
  roadmapId?: string; // Optional: if provided, suggestions will be enabled
}

const ensureStringTitle = (title: string | React.ReactNode): string => {
  if (typeof title === 'string') {
    return cleanTitle(title);
  }
  if (typeof title === 'number') {
    return String(title);
  }
  // For any other type (React elements, objects, etc.), convert to string
  return cleanTitle(String(title || ''));
};

// Function to clean unwanted patterns from title
const cleanTitle = (title: string): string => {
  // Remove patterns like "4,h4,h4,h4,h4,h4,h" or "5,h5,h5,h5,h5,h" 
  // This matches patterns at the end: number followed by comma and h+number+comma sequences
  return title.replace(/\d+,(?:h\d*,?)*h?\d*$/, '').trim();
};



const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  onClose,
  onUpdate,
  isMobile = false,
  roadmapId,
}) => {
  const router = useRouter();
  const fixedNode = {...node, title: ensureStringTitle(node.title)};
  const [showSuggestedCourses, setShowSuggestedCourses] = useState(false);
  const [showSuggestedVideos, setShowSuggestedVideos] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  
  // Suggestions state
  const [suggestedCourses, setSuggestedCourses] = useState<Array<{
    courseId: string;
    title: string;
    subtitle: string;
    category: string;
    level: string;
    price: number;
    isFree: boolean;
    thumbnail: string;
    score: number;
    status?: boolean; // Optional status field for existing suggestions
  }>>([]);
  
  const [suggestedVideos, setSuggestedVideos] = useState<Array<{
    videoId: string;
    title: string;
    subtitle: string;
    category: string;
    level: string;
    duration: string;
    thumbnail: string;
    views: number;
    rating: number;
    score: number;
    status?: boolean; // Optional status field for existing suggestions
  }>>([]);
  
  // Loading states
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  
  // Fetched state to avoid re-fetching
  const [coursesFetched, setCoursesFetched] = useState(false);
  const [videosFetched, setVideosFetched] = useState(false);
  
  // Existing suggestion statuses
  const [existingSuggestionsStatus, setExistingSuggestionsStatus] = useState<{
    courses: { [courseId: string]: boolean };
    videos: { [videoId: string]: boolean };
  }>({
    courses: {},
    videos: {}
  });
  
  // Track if we have existing suggestions for this specific node
  const [hasExistingSuggestions, setHasExistingSuggestions] = useState(false);

  // Load existing suggestion statuses when roadmapId or node changes
  useEffect(() => {
    if (roadmapId && fixedNode.id) {
      // Reset states for new node
      setSuggestedCourses([]);
      setSuggestedVideos([]);
      setCoursesFetched(false);
      setVideosFetched(false);
      setShowSuggestedCourses(false);
      setShowSuggestedVideos(false);
      setHasExistingSuggestions(false);
      
      // Fetch existing suggestions for this node
      fetchExistingSuggestionsStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapId, fixedNode.id]);
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    onUpdate({
      ...fixedNode,
      [name]: value,
    });
  };

  const handleCompletedChange = (checked: boolean) => {
    onUpdate({
      ...fixedNode,
      completed: checked,
      completionTime: checked ? new Date().toISOString() : undefined,
    });
  };

  // Function to fetch suggested courses
  const fetchSuggestedCourses = async () => {
    if (!roadmapId) {
      alert("Please save the roadmap first to see suggested courses and videos");
      return;
    }

    if (coursesFetched || loadingCourses) return;

    setLoadingCourses(true);
    try {
      const queryText = `${fixedNode.title} ${Array.isArray(fixedNode.description) ? fixedNode.description.join(' ') : fixedNode.description || ''}`.trim();
      
      const response = await fetch('/api/roadmap/suggestions/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryText,
          topK: 5,
          roadmapId: roadmapId,
          nodeId: fixedNode.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course suggestions');
      }

      const data = await response.json();
      setSuggestedCourses(data.suggestions || []);
      setCoursesFetched(true);
      
      // After fetching, this node now has suggestions (even if empty)
      setHasExistingSuggestions(true);
    } catch (error) {
      console.error('Error fetching course suggestions:', error);
      alert('Failed to fetch course suggestions. Please try again.');
    } finally {
      setLoadingCourses(false);
    }
  };

  // Function to fetch suggested videos
  const fetchSuggestedVideos = async () => {
    if (!roadmapId) {
      alert("Please save the roadmap first to see suggested courses and videos");
      return;
    }

    if (videosFetched || loadingVideos) return;

    setLoadingVideos(true);
    try {
      const queryText = `${fixedNode.title} ${Array.isArray(fixedNode.description) ? fixedNode.description.join(' ') : fixedNode.description || ''}`.trim();
      
      const response = await fetch('/api/roadmap/suggestions/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryText,
          topK: 5,
          roadmapId: roadmapId,
          nodeId: fixedNode.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch video suggestions');
      }

      const data = await response.json();
      setSuggestedVideos(data.suggestions || []);
      setVideosFetched(true);
      
      // After fetching, this node now has suggestions (even if empty)
      setHasExistingSuggestions(true);
    } catch (error) {
      console.error('Error fetching video suggestions:', error);
      alert('Failed to fetch video suggestions. Please try again.');
    } finally {
      setLoadingVideos(false);
    }
  };

  // Handle course expand with fetching
  const handleShowSuggestedCourses = () => {
    if (!showSuggestedCourses) {
      setShowSuggestedCourses(true);
      // Only fetch if we don't have existing suggestions and haven't fetched yet
      if (!hasExistingSuggestions && !coursesFetched) {
        fetchSuggestedCourses();
      }
    } else {
      setShowSuggestedCourses(false);
    }
  };

  // Handle video expand with fetching
  const handleShowSuggestedVideos = () => {
    if (!showSuggestedVideos) {
      setShowSuggestedVideos(true);
      // Only fetch if we don't have existing suggestions and haven't fetched yet
      if (!hasExistingSuggestions && !videosFetched) {
        fetchSuggestedVideos();
      }
    } else {
      setShowSuggestedVideos(false);
    }
  };

  // Fetch existing suggestion statuses for this node
  const fetchExistingSuggestionsStatus = async () => {
    if (!roadmapId) return;

    try {
      const response = await fetch('/api/roadmap/suggestions/existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roadmapId,
          nodeId: fixedNode.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch existing suggestions');
      }

      const data = await response.json();
      const coursesStatus: { [courseId: string]: boolean } = {};
      const videosStatus: { [videoId: string]: boolean } = {};

      data.courses.forEach((course: { courseId: string; status: boolean }) => {
        coursesStatus[course.courseId] = course.status;
      });

      data.videos.forEach((video: { videoId: string; status: boolean }) => {
        videosStatus[video.videoId] = video.status;
      });

      setExistingSuggestionsStatus({
        courses: coursesStatus,
        videos: videosStatus
      });
      
      // Check if this node has any existing suggestions
      const hasCourses = data.courses.length > 0;
      const hasVideos = data.videos.length > 0;
      setHasExistingSuggestions(hasCourses || hasVideos);

      // If we have existing suggestions, populate the suggestion arrays
      if (hasCourses) {
        setSuggestedCourses(data.courses);
        setCoursesFetched(true); // Mark as fetched so we don't call the API
      }
      
      if (hasVideos) {
        setSuggestedVideos(data.videos);
        setVideosFetched(true); // Mark as fetched so we don't call the API
      }

      console.log('Loaded existing suggestion statuses:', { 
        coursesStatus, 
        videosStatus, 
        nodeId: fixedNode.id,
        hasCourses,
        hasVideos,
        hasExisting: hasCourses || hasVideos,
        loadedCourses: data.courses.length,
        loadedVideos: data.videos.length
      });
    } catch (error) {
      console.error('Error fetching existing suggestion statuses:', error);
      // Fail silently - this is not critical functionality
    }
  };

  // Handle suggestion status changes
  const handleSuggestionStatusChange = async (
    suggestionType: 'course' | 'video',
    suggestionId: string,
    status: boolean
  ) => {
    if (!roadmapId) {
      alert("Please save the roadmap first to update suggestion status");
      return;
    }

    try {
      const response = await fetch('/api/roadmap/suggestions/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roadmapId,
          nodeId: fixedNode.id,
          suggestionType,
          suggestionId,
          status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update suggestion status');
      }

      // Update local state
      if (suggestionType === 'course') {
        setExistingSuggestionsStatus(prev => ({
          ...prev,
          courses: { ...prev.courses, [suggestionId]: status }
        }));
        // Also update the suggestedCourses array
        setSuggestedCourses(prev => 
          prev.map(course => 
            course.courseId === suggestionId 
              ? { ...course, status } 
              : course
          )
        );
      } else {
        setExistingSuggestionsStatus(prev => ({
          ...prev,
          videos: { ...prev.videos, [suggestionId]: status }
        }));
        // Also update the suggestedVideos array
        setSuggestedVideos(prev => 
          prev.map(video => 
            video.videoId === suggestionId 
              ? { ...video, status } 
              : video
          )
        );
      }

      console.log(`Updated ${suggestionType} suggestion status:`, { suggestionId, status });
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      alert('Failed to update suggestion status. Please try again.');
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full",
      !isMobile && "w-96"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Node Details</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white">Title</Label>
          <Input
            id="title"
            name="title"
            value={fixedNode.title}
            onChange={handleInputChange}
            className="bg-[#1a1a1a] border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-white">Instructions</Label>
            {Array.isArray(fixedNode.description) && fixedNode.description.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingInstructions(!isEditingInstructions)}
                className="text-blue-400 hover:text-blue-300 text-xs h-auto p-1"
              >
                {isEditingInstructions ? 'Save' : 'Edit'}
              </Button>
            )}
          </div>
          
          {/* Toggle between numbered list view and edit mode */}
          {Array.isArray(fixedNode.description) && fixedNode.description.length > 0 && !isEditingInstructions ? (
            /* View Mode: Numbered list */
            <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-3">
              <ol className="list-decimal list-inside space-y-2 text-white text-sm">
                {fixedNode.description.map((instruction, index) => (
                  <li key={index} className="text-gray-300">
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            /* Edit Mode: Textarea */
            <Textarea
              id="description"
              name="description"
              value={Array.isArray(fixedNode.description) 
                ? fixedNode.description.join('\n') 
                : fixedNode.description || ''}
              onChange={(e) => {
                const newDescription = e.target.value.split('\n').filter(line => line.trim());
                onUpdate({
                  ...fixedNode,
                  description: newDescription
                });
              }}
              onBlur={() => {
                // Auto-save when user finishes editing
                if (Array.isArray(fixedNode.description) && fixedNode.description.length > 0) {
                  setIsEditingInstructions(false);
                }
              }}
              placeholder="Enter instructions, one per line..."
              className="min-h-[100px] bg-[#1a1a1a] border-white/10 text-white"
              autoFocus={isEditingInstructions}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeNeeded" className="text-white">Time Needed (hours)</Label>
          <Input
            id="timeNeeded"
            name="timeNeeded"
            type="number"
            value={fixedNode.timeNeeded || ""}
            onChange={handleInputChange}
            className="bg-[#1a1a1a] border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeConsumed" className="text-white">Time Consumed (hours)</Label>
          <Input
            id="timeConsumed"
            name="timeConsumed"
            type="number"
            value={fixedNode.timeConsumed || ""}
            onChange={handleInputChange}
            className="bg-[#1a1a1a] border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline" className="text-white">Deadline</Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            value={(() => {
              if (!fixedNode.deadline) return "";
              const deadline = fixedNode.deadline;
              try {
                if (deadline && typeof deadline === 'object' && 'toISOString' in deadline) {
                  return (deadline as Date).toISOString().split('T')[0];
                }
              } catch {
                // Fallback if it's not a valid Date object
              }
              return String(deadline).split('T')[0];
            })()}
            onChange={handleInputChange}
            className="bg-[#1a1a1a] border-white/10 text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="completed"
            checked={fixedNode.completed || false}
            onCheckedChange={handleCompletedChange}
          />
          <Label htmlFor="completed" className="text-white">Completed</Label>
        </div>

        {fixedNode.completed && fixedNode.completionTime && (
          <div className="text-sm text-gray-400">
            Completed on: {new Date(fixedNode.completionTime).toLocaleDateString()}
          </div>
        )}

        {/* Suggested Courses Section */}
        <div className="space-y-2">
          {!hasExistingSuggestions && !coursesFetched ? (
            // Show search button when no existing suggestions and not fetched yet
            <Button
              variant="outline"
              onClick={() => {
                setShowSuggestedCourses(true);
                fetchSuggestedCourses();
              }}
              disabled={loadingCourses || !roadmapId}
              className="w-full flex items-center justify-center bg-[#1a1a1a] border-white/10 text-white hover:bg-[#2a2a2a]"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {loadingCourses ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Searching Courses...
                </>
              ) : (
                "Search Courses"
              )}
              {!roadmapId && <AlertCircle className="h-3 w-3 ml-2 text-yellow-500" />}
            </Button>
          ) : (
            // Show expand/collapse button when have existing suggestions or already fetched
            <Button
              variant="outline"
              onClick={handleShowSuggestedCourses}
              className="w-full flex items-center justify-between bg-[#1a1a1a] border-white/10 text-white hover:bg-[#2a2a2a]"
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Suggested Courses {existingSuggestionsStatus.courses && Object.keys(existingSuggestionsStatus.courses).length > 0 ? `(${Object.keys(existingSuggestionsStatus.courses).length})` : ''}</span>
                {loadingCourses && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              <div className="flex items-center space-x-1">
                {!roadmapId && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                {showSuggestedCourses ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </Button>
          )}
          
          {showSuggestedCourses && (
            <div className="p-3 bg-[#1a1a1a] rounded-md border border-white/10">
              {loadingCourses ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span className="ml-2 text-sm text-gray-400">Loading suggestions...</span>
                </div>
              ) : suggestedCourses.length > 0 ? (
                <div className="space-y-3">
                  {suggestedCourses.map((course) => (
                    <div key={course.courseId} className="flex items-start space-x-3 p-2 rounded border border-white/5 bg-[#0f0f0f]">
                      <Switch
                        id={`course-${course.courseId}`}
                        className="mt-1"
                        checked={course.status !== undefined ? course.status : (existingSuggestionsStatus.courses[course.courseId] || false)}
                        onCheckedChange={(checked) => 
                          handleSuggestionStatusChange('course', course.courseId, checked)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={`course-${course.courseId}`}
                          className="text-sm font-medium text-white cursor-pointer hover:text-blue-300 transition-colors"
                          onClick={() => router.push(`/courses/${course.courseId}`)}
                        >
                          {course.title}
                        </Label>
                        {course.subtitle && (
                          <p className="text-xs text-gray-400 mt-1">{course.subtitle}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                            {course.category}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">
                            {course.level}
                          </span>
                          <span className="text-xs text-gray-500">
                            {course.isFree ? 'Free' : `$${course.price}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-gray-400">No courses found for this topic</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCoursesFetched(false);
                      setHasExistingSuggestions(false);
                      fetchSuggestedCourses();
                    }}
                    disabled={loadingCourses || !roadmapId}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                  >
                    {loadingCourses ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        Searching...
                      </>
                    ) : (
                      'Search Again'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Suggested Videos Section */}
        <div className="space-y-2">
          {!hasExistingSuggestions && !videosFetched ? (
            // Show search button when no existing suggestions and not fetched yet
            <Button
              variant="outline"
              onClick={() => {
                setShowSuggestedVideos(true);
                fetchSuggestedVideos();
              }}
              disabled={loadingVideos || !roadmapId}
              className="w-full flex items-center justify-center bg-[#1a1a1a] border-white/10 text-white hover:bg-[#2a2a2a]"
            >
              <Video className="h-4 w-4 mr-2" />
              {loadingVideos ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Searching Videos...
                </>
              ) : (
                "Search Videos"
              )}
              {!roadmapId && <AlertCircle className="h-3 w-3 ml-2 text-yellow-500" />}
            </Button>
          ) : (
            // Show expand/collapse button when have existing suggestions or already fetched
            <Button
              variant="outline"
              onClick={handleShowSuggestedVideos}
              className="w-full flex items-center justify-between bg-[#1a1a1a] border-white/10 text-white hover:bg-[#2a2a2a]"
            >
              <div className="flex items-center space-x-2">
                <Video className="h-4 w-4" />
                <span>Suggested Videos {existingSuggestionsStatus.videos && Object.keys(existingSuggestionsStatus.videos).length > 0 ? `(${Object.keys(existingSuggestionsStatus.videos).length})` : ''}</span>
                {loadingVideos && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              <div className="flex items-center space-x-1">
                {!roadmapId && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                {showSuggestedVideos ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </Button>
          )}
          
          {showSuggestedVideos && (
            <div className="p-3 bg-[#1a1a1a] rounded-md border border-white/10">
              {loadingVideos ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span className="ml-2 text-sm text-gray-400">Loading suggestions...</span>
                </div>
              ) : suggestedVideos.length > 0 ? (
                <div className="space-y-3">
                  {suggestedVideos.map((video) => (
                    <div key={video.videoId} className="flex items-start space-x-3 p-2 rounded border border-white/5 bg-[#0f0f0f]">
                      <Switch
                        id={`video-${video.videoId}`}
                        className="mt-1"
                        checked={video.status !== undefined ? video.status : (existingSuggestionsStatus.videos[video.videoId] || false)}
                        onCheckedChange={(checked) => 
                          handleSuggestionStatusChange('video', video.videoId, checked)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={`video-${video.videoId}`}
                          className="text-sm font-medium text-white cursor-pointer hover:text-blue-300 transition-colors"
                          onClick={() => router.push(`/videos/${video.videoId}`)}
                        >
                          {video.title}
                        </Label>
                        {video.subtitle && (
                          <p className="text-xs text-gray-400 mt-1">{video.subtitle}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                            {video.category}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">
                            {video.level}
                          </span>
                          {video.duration && (
                            <span className="text-xs text-gray-500">
                              {video.duration}
                            </span>
                          )}
                          {video.views > 0 && (
                            <span className="text-xs text-gray-500">
                              {video.views} views
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-gray-400">No videos found for this topic</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setVideosFetched(false);
                      setHasExistingSuggestions(false);
                      fetchSuggestedVideos();
                    }}
                    disabled={loadingVideos || !roadmapId}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                  >
                    {loadingVideos ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        Searching...
                      </>
                    ) : (
                      'Search Again'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom spacing to prevent Save Roadmap button overlap */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default NodeDetailsPanel;
