'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Star, Users, Eye, Clock, Search, ChevronRight, Play, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface Course {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  level: string;
  price?: number;
  isFree?: boolean;
  thumbnail?: string;
  thumbnailAsset?: {
    secure_url: string;
  };
  rating: number;
  totalStudents: number;
  totalReviews: number;
  tutorId: {
    firstName: string;
    lastName: string;
    image?: string;
  };
}

interface Video {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  level: string;
  thumbnail?: string;
  thumbnailAsset?: {
    secure_url: string;
  };
  rating: number;
  views: number;
  totalComments: number;
  userId: {
    firstName: string;
    lastName: string;
    image?: string;
  };
  duration?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CourseApiResponse {
  courses: Course[];
  pagination: Pagination;
}

interface VideoApiResponse {
  videos: Video[];
  pagination: Pagination;
}

function CourseCard({ course }: { course: Course }) {
  const thumbnailUrl = course.thumbnailAsset?.secure_url || course.thumbnail;
  
  return (
    <Link href={`/courses/${course._id}`}>
      <Card className="bg-[#141414] border-gray-800 shadow-xl overflow-hidden group flex flex-col hover:border-blue-500/40 transition-colors">
        <div className="aspect-video w-full bg-gray-800 relative overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
              <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white/30" />
            </>
          )}
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 capitalize">
              {course.category}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 capitalize">
              {course.level}
            </span>
          </div>
          <h3 className="text-sm font-semibold mb-2 text-slate-50 group-hover:text-blue-400 transition-colors line-clamp-2">
            {course.title}
          </h3>
          <p className="text-xs text-gray-400 mb-3 line-clamp-2">{course.subtitle}</p>
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-yellow-400">{course.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({course.totalReviews})</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{course.totalStudents}</span>
            </div>
            <span className="font-semibold text-green-400">
              {course.isFree ? 'Free' : `$${course.price}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function VideoCard({ video }: { video: Video }) {
  const thumbnailUrl = video.thumbnailAsset?.secure_url || video.thumbnail;
  
  return (
    <Link href={`/videos/${video._id}`}>
      <Card className="bg-[#141414] border-gray-800 shadow-xl overflow-hidden group flex flex-col hover:border-purple-500/40 transition-colors">
        <div className="aspect-video w-full bg-gray-800 relative overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20"></div>
              <Play className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white/30" />
            </>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 capitalize">
              {video.category}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 capitalize">
              {video.level}
            </span>
          </div>
          <h3 className="text-sm font-semibold mb-2 text-slate-50 group-hover:text-purple-400 transition-colors line-clamp-2">
            {video.title}
          </h3>
          <p className="text-xs text-gray-400 mb-3 line-clamp-2">{video.subtitle}</p>
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-yellow-400">{video.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{video.views}</span>
            </div>
            {video.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{video.duration}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}



export default function ExplorePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [coursePagination, setCoursePagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });
  const [videoPagination, setVideoPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [isVideosLoading, setIsVideosLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Debounce search query for smooth searching
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchCourses = async (search = '') => {
    try {
      setIsCoursesLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '100' // Load many items for horizontal scrolling
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/explore/popular-courses?${params}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data: CourseApiResponse = await response.json();
      setCourses(data.courses);
      setCoursePagination(data.pagination);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setIsCoursesLoading(false);
    }
  };

  const fetchVideos = async (search = '') => {
    try {
      setIsVideosLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '100' // Load many items for horizontal scrolling
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/explore/popular-videos?${params}`);
      if (!response.ok) throw new Error('Failed to fetch videos');
      
      const data: VideoApiResponse = await response.json();
      setVideos(data.videos);
      setVideoPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setIsVideosLoading(false);
    }
  };

  // Effect for debounced search
  useEffect(() => {
    if (!isInitialLoad) {
      // Search with new query
      fetchCourses(debouncedSearchQuery);
      fetchVideos(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, isInitialLoad]);

  // Initial load effect
  useEffect(() => {
    fetchCourses();
    fetchVideos();
    setIsInitialLoad(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Explore Learning Content</h1>
          <p className="text-gray-400 text-lg mb-8">Discover popular courses and videos to enhance your skills</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              {(isCoursesLoading || isVideosLoading) ? (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              <Input
                type="text"
                placeholder="Search courses and videos... (auto-search enabled)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 bg-[#141414] border-gray-800 text-white placeholder-gray-400 focus:border-blue-500 transition-all duration-200"
              />
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Popular Courses Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold">Popular Courses</h2>
              {isCoursesLoading && (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              )}
            </div>
            <span className="text-sm text-gray-400">
              {courses.length} courses {searchQuery && `for "${searchQuery}"`}
            </span>
          </div>
          
          {courses.length > 0 ? (
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
                {courses.map((course) => (
                  <div key={course._id} className="flex-shrink-0 w-80">
                    <CourseCard course={course} />
                  </div>
                ))}
                {/* Scroll hint */}
                {courses.length > 3 && (
                  <div className="flex-shrink-0 w-20 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <ChevronRight className="w-6 h-6 mx-auto mb-1 animate-pulse" />
                      <div className="text-xs">Scroll</div>
                    </div>
                  </div>
                )}
              </div>
              {coursePagination.total > courses.length && (
                <div className="text-center mt-4 text-sm text-gray-400">
                  Showing {courses.length} of {coursePagination.total} courses
                </div>
              )}
            </div>
          ) : isCoursesLoading ? (
            <div className="flex gap-6 overflow-x-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-80">
                  <Card className="bg-[#141414] border-gray-800 shadow-xl overflow-hidden animate-pulse">
                    <div className="aspect-video w-full bg-gray-700"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded mb-3 w-3/4"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchQuery ? `No courses found for "${searchQuery}"` : 'No courses found'}
              </p>
            </div>
          )}
        </div>

        {/* Popular Videos Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold">Popular Videos</h2>
              {isVideosLoading && (
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              )}
            </div>
            <span className="text-sm text-gray-400">
              {videos.length} videos {searchQuery && `for "${searchQuery}"`}
            </span>
          </div>
          
          {videos.length > 0 ? (
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
                {videos.map((video) => (
                  <div key={video._id} className="flex-shrink-0 w-80">
                    <VideoCard video={video} />
                  </div>
                ))}
                {/* Scroll hint */}
                {videos.length > 3 && (
                  <div className="flex-shrink-0 w-20 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <ChevronRight className="w-6 h-6 mx-auto mb-1 animate-pulse" />
                      <div className="text-xs">Scroll</div>
                    </div>
                  </div>
                )}
              </div>
              {videoPagination.total > videos.length && (
                <div className="text-center mt-4 text-sm text-gray-400">
                  Showing {videos.length} of {videoPagination.total} videos
                </div>
              )}
            </div>
          ) : isVideosLoading ? (
            <div className="flex gap-6 overflow-x-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-80">
                  <Card className="bg-[#141414] border-gray-800 shadow-xl overflow-hidden animate-pulse">
                    <div className="aspect-video w-full bg-gray-700"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded mb-3 w-3/4"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchQuery ? `No videos found for "${searchQuery}"` : 'No videos found'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 