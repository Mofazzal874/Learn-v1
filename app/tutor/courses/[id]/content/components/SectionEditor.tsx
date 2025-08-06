'use client';

import React, { useState } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable 
} from '@hello-pangea/dnd';
import { Grip, Plus, Trash2, Video, FileText, Link, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

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

interface SectionEditorProps {
  section?: Section | null;
  courseId: string;
  onSave: (section: Section) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const SectionEditor = ({ section, courseId, onSave, onCancel, isEditing = false }: SectionEditorProps) => {
  const [sectionData, setSectionData] = useState<Section>(section || {
    title: '',
    description: '',
    lessons: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const addLesson = () => {
    setSectionData(prev => ({
      ...prev,
      lessons: [
        ...prev.lessons,
        {
          id: Date.now().toString(),
          title: '',
          description: '',
          duration: '',
          type: 'video',
        }
      ]
    }));
  };

  const removeLesson = (lessonId: string) => {
    setSectionData(prev => ({
      ...prev,
      lessons: prev.lessons.filter(lesson => (lesson.id || lesson._id) !== lessonId)
    }));
  };

  const updateLesson = (
    lessonId: string, 
    field: keyof Lesson, 
    value: string | 'video' | 'article' | 'resource'
  ) => {
    setSectionData(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => {
        if ((lesson.id || lesson._id) === lessonId) {
          return { ...lesson, [field]: value };
        }
        return lesson;
      })
    }));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newLessons = Array.from(sectionData.lessons);
    const [removed] = newLessons.splice(result.source.index, 1);
    newLessons.splice(result.destination.index, 0, removed);

    setSectionData(prev => ({
      ...prev,
      lessons: newLessons
    }));
  };

  const handleSave = async () => {
    if (!sectionData.title.trim()) {
      toast.error('Section title is required');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && section?._id) {
        // Update existing section
        const response = await fetch(`/api/tutor/courses/${courseId}/sections/${section._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: sectionData.title,
            description: sectionData.description,
            lessons: sectionData.lessons.map(lesson => ({
              ...lesson,
              // Only send _id if it's a valid MongoDB ObjectId (24 character hex string)
              ...(lesson._id && lesson._id.length === 24 && /^[0-9a-fA-F]{24}$/.test(lesson._id) 
                ? { _id: lesson._id } 
                : {}),
            })),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update section');
        }

        const result = await response.json();
        toast.success('Section updated successfully!');
        onSave(result.section);
      } else {
        // Create new section
        const response = await fetch(`/api/tutor/courses/${courseId}/sections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: sectionData.title,
            description: sectionData.description,
            lessons: sectionData.lessons,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create section');
        }

        const result = await response.json();
        toast.success('Section created successfully!');
        onSave(result.section);
      }
    } catch (error) {
      console.error('Save section error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save section');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-[#141414] border-gray-800 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          {isEditing ? 'Edit Section' : 'Add New Section'}
        </h2>
        <p className="text-gray-400">
          {isEditing ? 'Update your section content' : 'Create content for your course section'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Section Details */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="section-title" className="text-white">Section Title</Label>
            <Input
              id="section-title"
              value={sectionData.title}
              onChange={(e) => setSectionData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Introduction to React"
              className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
            />
          </div>

          <div>
            <Label htmlFor="section-description" className="text-white">Section Description</Label>
            <Textarea
              id="section-description"
              value={sectionData.description}
              onChange={(e) => setSectionData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what students will learn in this section"
              className="mt-2 bg-[#0a0a0a] border-gray-800 text-white"
            />
          </div>
        </div>

        {/* Lessons */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Lessons</h3>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="lessons">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {sectionData.lessons.map((lesson, index) => (
                    <Draggable 
                      key={lesson.id || lesson._id || index} 
                      draggableId={lesson.id || lesson._id || index.toString()} 
                      index={index}
                    >
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-[#1a1a1a] border-gray-700 p-4"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps}>
                                  <Grip className="w-4 h-4 text-gray-400" />
                                </div>
                                <h4 className="text-white font-medium">Lesson {index + 1}</h4>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeLesson(lesson.id || lesson._id || index.toString())}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                              <div className="col-span-3">
                                <Input
                                  value={lesson.title}
                                  onChange={(e) => updateLesson(lesson.id || lesson._id || index.toString(), 'title', e.target.value)}
                                  placeholder="Lesson Title"
                                  className="bg-[#222] border-gray-600 text-white"
                                />
                              </div>
                              <div className="col-span-1">
                                <Select 
                                  value={lesson.type} 
                                  onValueChange={(value: 'video' | 'article' | 'resource') => 
                                    updateLesson(lesson.id || lesson._id || index.toString(), 'type', value)
                                  }
                                >
                                  <SelectTrigger className="bg-[#222] border-gray-600 text-white">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                                    <SelectItem value="video">
                                      <div className="flex items-center gap-2">
                                        <Video className="h-4 w-4 text-blue-400" />
                                        Video
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="article">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-purple-400" />
                                        Article
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="resource">
                                      <div className="flex items-center gap-2">
                                        <Link className="h-4 w-4 text-green-400" />
                                        Resource
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <Textarea
                              value={lesson.description}
                              onChange={(e) => updateLesson(lesson.id || lesson._id || index.toString(), 'description', e.target.value)}
                              placeholder="Lesson Description"
                              className="bg-[#222] border-gray-600 text-white"
                            />

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-gray-400">Duration</Label>
                                <Input
                                  value={lesson.duration}
                                  onChange={(e) => updateLesson(lesson.id || lesson._id || index.toString(), 'duration', e.target.value)}
                                  placeholder="e.g., 30 mins"
                                  className="mt-2 bg-[#222] border-gray-600 text-white"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-400">Video Link (optional)</Label>
                                <Input
                                  value={lesson.videoLink || ''}
                                  onChange={(e) => updateLesson(lesson.id || lesson._id || index.toString(), 'videoLink', e.target.value)}
                                  placeholder="Paste video URL"
                                  className="mt-2 bg-[#222] border-gray-600 text-white"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-gray-400">Assignment Link (optional)</Label>
                              <Input
                                value={lesson.assignmentLink || ''}
                                onChange={(e) => updateLesson(lesson.id || lesson._id || index.toString(), 'assignmentLink', e.target.value)}
                                placeholder="Paste assignment URL"
                                className="bg-[#222] border-gray-600 text-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-gray-400">Assignment Description</Label>
                              <Textarea
                                value={lesson.assignmentDescription || ''}
                                onChange={(e) => updateLesson(lesson.id || lesson._id || index.toString(), 'assignmentDescription', e.target.value)}
                                placeholder="Describe the assignment tasks"
                                className="bg-[#222] border-gray-600 text-white"
                              />
                            </div>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <Button
            onClick={addLesson}
            className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lesson
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-700 text-white"
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !sectionData.title.trim()}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : isEditing ? 'Update Section' : 'Create Section'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SectionEditor;
