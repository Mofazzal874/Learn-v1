'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Star, Users, Eye, Clock, Search, ChevronLeft, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

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

interface ApiResponse<T> {
  [key: string]: T[] | Pagination;
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

function Pagination({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (page: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pagination.currentPage - 1)}
        disabled={!pagination.hasPrev}
        className="border-gray-700 text-gray-300"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>
      
      <div className="flex items-center gap-2">
        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
          const page = i + 1;
          const isActive = page === pagination.currentPage;
          
          return (
            <Button
              key={page}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={isActive ? "bg-blue-600" : "border-gray-700 text-gray-300"}
            >
              {page}
            </Button>
          );
        })}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pagination.currentPage + 1)}
        disabled={!pagination.hasNext}
        className="border-gray-700 text-gray-300"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
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
  const [activeSearch, setActiveSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchCourses = async (page = 1, search = '') => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/explore/popular-courses?${params}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data: ApiResponse<Course> = await response.json();
      setCourses(data.courses as Course[]);
      setCoursePagination(data.pagination);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVideos = async (page = 1, search = '') => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/explore/popular-videos?${params}`);
      if (!response.ok) throw new Error('Failed to fetch videos');
      
      const data: ApiResponse<Video> = await response.json();
      setVideos(data.videos as Video[]);
      setVideoPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setActiveSearch(query);
    await Promise.all([
      fetchCourses(1, query),
      fetchVideos(1, query)
    ]);
  };

  const handleCoursePageChange = (page: number) => {
    fetchCourses(page, activeSearch);
  };

  const handleVideoPageChange = (page: number) => {
    fetchVideos(page, activeSearch);
  };

  useEffect(() => {
    // Initial load
    fetchCourses();
    fetchVideos();
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search courses and videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                className="pl-10 pr-4 py-3 bg-[#141414] border-gray-800 text-white placeholder-gray-400 focus:border-blue-500"
              />
              <Button
                onClick={() => handleSearch(searchQuery)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading content...</p>
          </div>
        )}

        {/* Popular Courses Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Popular Courses</h2>
            <span className="text-sm text-gray-400">
              {coursePagination.total} courses found
            </span>
          </div>
          
          {courses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
              
              <Pagination
                pagination={coursePagination}
                onPageChange={handleCoursePageChange}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No courses found</p>
            </div>
          )}
        </div>

        {/* Popular Videos Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Popular Videos</h2>
            <span className="text-sm text-gray-400">
              {videoPagination.total} videos found
            </span>
          </div>
          
          {videos.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>
              
              <Pagination
                pagination={videoPagination}
                onPageChange={handleVideoPageChange}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No videos found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 