'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle, 
  Play,
  FileText,
  Award,
  User,
  Globe,
  ArrowLeft,
  PlayCircle,
  Lock,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Download,
  Loader2
} from "lucide-react";

// Types
interface Lesson {
  _id?: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'article' | 'resource';
  videoLink?: string;
  assignmentLink?: string;
  assignmentDescription?: string;
}

interface Section {
  _id?: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order?: number;
}

interface Course {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  level: string;
  language?: string;
  certificate: boolean;
  prerequisites: string[];
  outcomes: string[];
  sections: Section[];
  totalStudents: number;
  tutorId: {
    firstName: string;
    lastName: string;
    image?: string;
  };
}

// Parse string arrays that might be JSON encoded
const parseStringArray = (data: any): string[] => {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string' && (item.startsWith('[') || item.startsWith('{'))) {
        try {
          const parsed = JSON.parse(item);
          return Array.isArray(parsed) ? parsed.join(', ') : parsed;
        } catch {
          return item;
        }
      }
      return item;
    });
  }
  
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [data];
    }
  }
  
  return [];
};

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Fetch course data and check enrollment
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!params.id || !session) return;

      try {
        setLoading(true);
        
        // Fetch course data and check enrollment in one API call
        const courseResponse = await fetch(`/api/courses/${params.id}/learn`);
        if (!courseResponse.ok) {
          if (courseResponse.status === 403) {
            setIsEnrolled(false);
            setLoading(false);
            return;
          }
          const errorData = await courseResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Course not found (${courseResponse.status})`);
        }
        
        const { course: courseData, isEnrolled: enrolled } = await courseResponse.json();
        setCourse(courseData);
        setIsEnrolled(enrolled);
        
        // Auto-select first section and lesson if available
        if (courseData.sections && courseData.sections.length > 0) {
          const firstSection = courseData.sections[0];
          setSelectedSection(firstSection);
          setExpandedSections(new Set([firstSection._id || '0']));
          
          if (firstSection.lessons && firstSection.lessons.length > 0) {
            setSelectedLesson(firstSection.lessons[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [params.id, session]);

  // Handle section click
  const handleSectionClick = useCallback((section: Section) => {
    const sectionId = section._id || section.title;
    setSelectedSection(section);
    
    // Toggle expansion
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return newExpanded;
    });

    // Auto-select first lesson in section
    if (section.lessons && section.lessons.length > 0) {
      setSelectedLesson(section.lessons[0]);
    } else {
      setSelectedLesson(null);
    }
  }, []);

  // Handle lesson click
  const handleLessonClick = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
  }, []);

  // Calculate progress
  const totalLessons = useMemo(() => 
    course?.sections?.reduce((sum, section) => 
      sum + (section.lessons?.length || 0), 0) || 0, [course?.sections]);

  const totalDuration = useMemo(() => 
    course?.sections?.reduce((total, section) => {
      return total + (section.lessons?.reduce((sectionTotal, lesson) => {
        const duration = lesson.duration || '0';
        const minutes = parseInt(duration) || 0;
        return sectionTotal + minutes;
      }, 0) || 0);
    }, 0) || 0, [course?.sections]);

  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  // Placeholder progress
  const completedLessons = 0;
  const progressPercentage = useMemo(() => 
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0, [totalLessons, completedLessons]);

  // Memoize parsed data before early returns
  const prerequisites = useMemo(() => course ? parseStringArray(course.prerequisites) : [], [course?.prerequisites]);
  const outcomes = useMemo(() => course ? parseStringArray(course.outcomes) : [], [course?.outcomes]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
          <p className="text-gray-400 mb-6">The course you&apos;re trying to access doesn&apos;t exist.</p>
          <Link href="/explore">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Lock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Enrollment Required</h1>
          <p className="text-gray-400 mb-6">
            You need to enroll in this course to access the learning content. 
            Click below to view course details and enroll.
          </p>
          <div className="space-y-3">
            <Link href={`/courses/${params.id}`}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                View Course & Enroll
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" className="w-full border-gray-600 text-gray-400 hover:text-white hover:bg-gray-800">
                Browse Other Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href={`/courses/${params.id}`}>
            <Button variant="outline" className="border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course Details
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Sections & Progress */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Progress Card */}
              {/* <Card className="bg-[#141414] border-gray-800 sticky top-4 z-10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Course Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Overall Progress</span>
                        <span className="text-blue-400">{Math.round(progressPercentage)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>

                    <div className="text-sm text-gray-400">
                      <div className="flex justify-between mb-1">
                        <span>Completed:</span>
                        <span>{completedLessons}/{totalLessons} lessons</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{formatDuration(totalDuration)}</span>
                      </div>
                    </div>

                    {course.certificate && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                          <Award className="h-4 w-4" />
                          <span>Certificate Available</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card> */}

              {/* Sections Navigation */}
              <Card className="bg-[#141414] border-gray-800 sticky top-[calc(4rem+1rem)] z-10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Course Content</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {course.sections?.map((section, index) => {
                      const sectionId = section._id || index.toString();
                      const isExpanded = expandedSections.has(sectionId);
                      const isSelected = selectedSection?._id === section._id || selectedSection?.title === section.title;

                      return (
                        <div key={sectionId}>
                          {/* Section Header */}
                          <button
                            onClick={() => handleSectionClick(section)}
                            className={`w-full p-3 text-left hover:bg-[#1a1a1a] transition-colors border-l-2 ${
                              isSelected ? 'border-blue-500 bg-[#1a1a1a]' : 'border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="text-white font-medium text-sm">
                                  {index + 1}. {section.title}
                                </h4>
                                <p className="text-gray-500 text-xs mt-1">
                                  {section.lessons?.length || 0} lessons
                                </p>
                              </div>
                              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`} />
                            </div>
                          </button>

                          {/* Section Lessons */}
                          {isExpanded && (
                            <div className="pl-4 border-l border-gray-800">
                              {section.lessons?.map((lesson, lessonIndex) => {
                                const isLessonSelected = selectedLesson?.title === lesson.title;
                                
                                return (
                                  <button
                                    key={lessonIndex}
                                    onClick={() => handleLessonClick(lesson)}
                                    className={`w-full p-2 text-left hover:bg-[#1a1a1a] transition-colors ${
                                      isLessonSelected ? 'bg-[#1a1a1a] border-l-2 border-blue-400' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="flex-shrink-0">
                                        {lesson.type === 'video' && (
                                          <PlayCircle className="h-3 w-3 text-blue-400" />
                                        )}
                                        {lesson.type === 'article' && (
                                          <FileText className="h-3 w-3 text-purple-400" />
                                        )}
                                        {lesson.type === 'resource' && (
                                          <BookOpen className="h-3 w-3 text-green-400" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-gray-300 text-xs font-medium truncate">
                                          {lesson.title}
                                        </p>
                                        {lesson.duration && (
                                          <p className="text-gray-500 text-xs">{lesson.duration}</p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Course Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm">
                  {course.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm">
                  {course.level}
                </span>
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
                  Enrolled
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              {course.subtitle && (
                <p className="text-xl text-gray-300 mb-4">{course.subtitle}</p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{course.tutorId?.firstName} {course.tutorId?.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{course.totalStudents || 0} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>{course.language || 'English'}</span>
                </div>
              </div>
            </div>

            {/* Lesson Content Display */}
            {selectedLesson ? (
              <Card className="bg-[#141414] border-gray-800 mb-8">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600">
                      {selectedLesson.type === 'video' && (
                        <PlayCircle className="h-5 w-5 text-white" />
                      )}
                      {selectedLesson.type === 'article' && (
                        <FileText className="h-5 w-5 text-white" />
                      )}
                      {selectedLesson.type === 'resource' && (
                        <BookOpen className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-xl">{selectedLesson.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="capitalize">{selectedLesson.type}</span>
                        {selectedLesson.duration && (
                          <>
                            <span>•</span>
                            <span>{selectedLesson.duration}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Lesson Description */}
                    {selectedLesson.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                        <p className="text-gray-300">{selectedLesson.description}</p>
                      </div>
                    )}

                                         {/* Video Link */}
                     {selectedLesson.videoLink && (
                       <div>
                         <h3 className="text-lg font-semibold text-white mb-2">Video Content</h3>
                         <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                               <Play className="h-5 w-5 text-blue-400" />
                               <span className="text-gray-300">Watch this lesson</span>
                             </div>
                             <a
                               href={selectedLesson.videoLink.startsWith('http') ? selectedLesson.videoLink : `https://${selectedLesson.videoLink}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-blue-400 hover:text-blue-300 transition-colors"
                             >
                               <ExternalLink className="h-4 w-4" />
                             </a>
                           </div>
                         </div>
                       </div>
                     )}

                     {/* Assignment */}
                     {(selectedLesson.assignmentLink || selectedLesson.assignmentDescription) && (
                       <div>
                         <h3 className="text-lg font-semibold text-white mb-2">Assignment</h3>
                         <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800 space-y-3">
                           {selectedLesson.assignmentDescription && (
                             <p className="text-gray-300">{selectedLesson.assignmentDescription}</p>
                           )}
                           {selectedLesson.assignmentLink && (
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                 <Download className="h-5 w-5 text-green-400" />
                                 <span className="text-gray-300">Download assignment materials</span>
                               </div>
                               <a
                                 href={selectedLesson.assignmentLink.startsWith('http') ? selectedLesson.assignmentLink : `https://${selectedLesson.assignmentLink}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-green-400 hover:text-green-300 transition-colors"
                               >
                                 <ExternalLink className="h-4 w-4" />
                               </a>
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                  </div>
                </CardContent>
              </Card>
            ) : selectedSection ? (
              <Card className="bg-[#141414] border-gray-800 mb-8">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{selectedSection.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedSection.description && (
                      <p className="text-gray-300">{selectedSection.description}</p>
                    )}
                    
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Select a Lesson</h3>
                      <p className="text-gray-400">
                        Choose a lesson from the sidebar to start learning.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#141414] border-gray-800 mb-8">
                <CardContent className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Welcome to the Course</h3>
                  <p className="text-gray-400 mb-6">
                    Select a section from the sidebar to begin your learning journey.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Course Info */}
            {!selectedLesson && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Prerequisites */}
                {prerequisites.length > 0 && (
                  <Card className="bg-[#141414] border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Prerequisites</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {prerequisites.map((prerequisite: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-gray-300">
                            <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span>{prerequisite}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Learning Outcomes */}
                {outcomes.length > 0 && (
                  <Card className="bg-[#141414] border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">What You&apos;ll Learn</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {outcomes.map((outcome: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-gray-300">
                            <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}