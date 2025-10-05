'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, GripVertical, Video, FileText, RefreshCcw, Edit, Trash2, ArrowLeft } from "lucide-react";
import SectionEditor from './components/SectionEditor';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Lesson {
  _id?: string;
  id?: string;
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
  id?: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order?: number;
}

interface CourseContentData {
  sections: Section[];
  courseTitle: string;
}

export default function CourseContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const [contentData, setContentData] = useState<CourseContentData>({ sections: [], courseTitle: '' });
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; section: Section | null }>({ 
    open: false, 
    section: null 
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch course sections
  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tutor/courses/${courseId}/sections`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          router.push('/tutor/courses');
          return;
        }
        throw new Error('Failed to fetch sections');
      }

      const data = await response.json();
      setContentData(data);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchSections();
    }
  }, [courseId]);

  const handleAddSection = () => {
    setSelectedSection(null);
    setIsEditing(false);
    setShowEditor(true);
  };

  const handleEditSection = (section: Section) => {
    setSelectedSection(section);
    setIsEditing(true);
    setShowEditor(true);
  };

  const handleSectionSaved = (savedSection: Section) => {
    setShowEditor(false);
    setSelectedSection(null);
    setIsEditing(false);
    // Refresh the sections list
    fetchSections();
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setSelectedSection(null);
    setIsEditing(false);
  };

  const handleDeleteSection = (section: Section) => {
    setDeleteDialog({ open: true, section });
  };

  const confirmDeleteSection = async () => {
    if (!deleteDialog.section) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tutor/courses/${courseId}/sections/${deleteDialog.section._id || deleteDialog.section.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete section');
      }

      toast.success('Section deleted successfully!');
      setDeleteDialog({ open: false, section: null });
      // Refresh the sections list
      fetchSections();
    } catch (error) {
      console.error('Delete section error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete section');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0a0a0a] items-center justify-center">
        <div className="text-white">Loading course content...</div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course Content
            </Button>
            <h1 className="text-2xl font-bold text-white mb-2">
              {contentData.courseTitle}
            </h1>
          </div>
          
          <SectionEditor
            section={selectedSection}
            courseId={courseId}
            onSave={handleSectionSaved}
            onCancel={handleCancelEdit}
            isEditing={isEditing}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      <div className="flex-1 overflow-auto">
        <div className="h-full flex flex-col md:flex-row">
          {/* Content Structure Sidebar */}
          <div className="w-full md:w-80 border-r border-gray-800 bg-[#141414] p-4 md:h-screen">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Content</h2>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-gray-400"
                onClick={fetchSections}
                disabled={loading}
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="space-y-4">
                {contentData.sections.map((section: Section, index: number) => (
                  <Card key={section._id || section.id || index} className="bg-[#1a1a1a] border-gray-800">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-white">
                          <GripVertical className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{section.title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSection(section)}
                            className="text-gray-400 hover:text-blue-400 h-7 w-7 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSection(section)}
                            className="text-gray-400 hover:text-red-400 h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {section.description && (
                        <p className="text-xs text-gray-500 mb-2">{section.description}</p>
                      )}
                      
                      <div className="pl-6 space-y-2">
                        {section.lessons?.map((lesson: Lesson, lessonIdx: number) => (
                          <div
                            key={lesson._id || lesson.id || lessonIdx}
                            className="flex items-center gap-2 text-gray-400 text-sm"
                          >
                            {lesson.type === 'video' && <Video className="h-3 w-3 text-blue-400" />}
                            {lesson.type === 'article' && <FileText className="h-3 w-3 text-purple-400" />}
                            {lesson.type === 'resource' && <FileText className="h-3 w-3 text-green-400" />}
                            <span>{lesson.title}</span>
                            {lesson.duration && (
                              <span className="text-xs text-gray-600">({lesson.duration})</span>
                            )}
                          </div>
                        ))}
                        {(!section.lessons || section.lessons.length === 0) && (
                          <div className="text-xs text-gray-600 italic">No lessons yet</div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  onClick={handleAddSection}
                  className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </ScrollArea>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/tutor/courses/${courseId}`)}
                  className="text-gray-400 hover:text-white mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course Details
                </Button>
                
                <h1 className="text-2xl font-bold text-white mb-2">
                  {contentData.courseTitle}
                </h1>
                <p className="text-gray-400">
                  Manage your course content and structure
                </p>
              </div>

              {contentData.sections.length === 0 ? (
                <Card className="bg-[#141414] border-gray-800 p-8 text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">No Content Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Start building your course by adding sections and lessons.
                  </p>
                  <Button
                    onClick={handleAddSection}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Section
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {contentData.sections.map((section: Section, index: number) => (
                    <Card key={section._id || section.id || index} className="bg-[#141414] border-gray-800 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            Section {index + 1}: {section.title}
                          </h3>
                          {section.description && (
                            <p className="text-gray-400 text-sm">{section.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSection(section)}
                            className="border-gray-700 text-gray-400 hover:text-white"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {section.lessons?.map((lesson: Lesson, lessonIndex: number) => (
                          <div
                            key={lesson._id || lesson.id || lessonIndex}
                            className="flex items-center justify-between py-2 px-4 rounded-lg bg-[#0a0a0a]"
                          >
                            <div className="flex items-center gap-3">
                              {lesson.type === 'video' && <Video className="h-4 w-4 text-blue-400" />}
                              {lesson.type === 'article' && <FileText className="h-4 w-4 text-purple-400" />}
                              {lesson.type === 'resource' && <FileText className="h-4 w-4 text-green-400" />}
                              <span className="text-gray-300">{lesson.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                              {lesson.duration && <span>{lesson.duration}</span>}
                              <span className="text-xs">#{lessonIndex + 1}</span>
                            </div>
                          </div>
                        ))}
                        {(!section.lessons || section.lessons.length === 0) && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No lessons in this section yet
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, section: null })}>
        <DialogContent className="bg-[#141414] border-red-900/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete Section
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to delete the section{' '}
              <span className="font-semibold text-white">"{deleteDialog.section?.title}"</span>?
              <br />
              <span className="text-red-400 font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, section: null })}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDeleteSection}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Section'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}