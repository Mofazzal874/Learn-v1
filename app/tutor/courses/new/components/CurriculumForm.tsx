'use client';

import React, { useState } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable 
} from '@hello-pangea/dnd';
import { Grip, Plus, Trash2, Video, FileText, Link } from 'lucide-react';
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

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'article' | 'resource';
  videoLink?: string;
  assignmentLink?: string;
  assignmentDescription?: string;
}

interface Section {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface CurriculumFormProps {
  onSave: (sections: Section[]) => void;
  onBack: () => void;
  onNext: () => void;
  initialData?: Section[];
}

const CurriculumForm = ({ onSave, onBack, onNext, initialData }: CurriculumFormProps) => {
  const [sections, setSections] = useState<Section[]>(initialData || [
    {
      id: '1',
      title: '',
      description: '',
      lessons: []
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: Date.now().toString(),
        title: '',
        description: '',
        lessons: []
      }
    ]);
  };

  const addLesson = (sectionId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lessons: [
            ...section.lessons,
            {
              id: Date.now().toString(),
              title: '',
              description: '',
              duration: '',
              type: 'video',
            }
          ]
        };
      }
      return section;
    }));
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
  };

  const removeLesson = (sectionId: string, lessonId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lessons: section.lessons.filter(lesson => lesson.id !== lessonId)
        };
      }
      return section;
    }));
  };

  const handleSectionChange = (sectionId: string, field: keyof Section, value: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, [field]: value };
      }
      return section;
    }));
  };

  const handleLessonChange = (
    sectionId: string, 
    lessonId: string, 
    field: keyof Lesson, 
    value: string | 'video' | 'article' | 'resource'
  ) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lessons: section.lessons.map(lesson => {
            if (lesson.id === lessonId) {
              return { ...lesson, [field]: value };
            }
            return lesson;
          })
        };
      }
      return section;
    }));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'section') {
      const newSections = Array.from(sections);
      const [removed] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, removed);
      setSections(newSections);
    } else if (type === 'lesson') {
      const sourceSection = sections.find(section => section.id === source.droppableId);
      const destSection = sections.find(section => section.id === destination.droppableId);

      if (!sourceSection || !destSection) return;

      if (source.droppableId === destination.droppableId) {
        const newLessons = Array.from(sourceSection.lessons);
        const [removed] = newLessons.splice(source.index, 1);
        newLessons.splice(destination.index, 0, removed);

        setSections(sections.map(section => {
          if (section.id === source.droppableId) {
            return { ...section, lessons: newLessons };
          }
          return section;
        }));
      } else {
        const sourceLessons = Array.from(sourceSection.lessons);
        const destLessons = Array.from(destSection.lessons);
        const [removed] = sourceLessons.splice(source.index, 1);
        destLessons.splice(destination.index, 0, removed);

        setSections(sections.map(section => {
          if (section.id === source.droppableId) {
            return { ...section, lessons: sourceLessons };
          }
          if (section.id === destination.droppableId) {
            return { ...section, lessons: destLessons };
          }
          return section;
        }));
      }
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      onSave(sections);
      onNext();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#141414] border border-gray-800 rounded-lg max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Course Curriculum</h2>
        <p className="text-gray-400">Organize your course content and structure</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections" type="section">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-6"
            >
              {sections.map((section, index) => (
                <Draggable 
                  key={section.id} 
                  draggableId={section.id} 
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="p-6 bg-[#141414] rounded-lg border border-gray-800"
                    >
                      <div className="flex items-start gap-4">
                        <div {...provided.dragHandleProps}>
                          <Grip className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <Input
                            placeholder="Section Title"
                            value={section.title}
                            onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                            className="bg-[#1a1a1a] border-gray-700 text-white"
                          />
                          <Textarea
                            placeholder="Section Description"
                            value={section.description}
                            onChange={(e) => handleSectionChange(section.id, 'description', e.target.value)}
                            className="bg-[#1a1a1a] border-gray-700 text-white"
                          />
                          <Droppable droppableId={section.id} type="lesson">
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="space-y-4"
                              >
                                {section.lessons.map((lesson, index) => (
                                  <Draggable
                                    key={lesson.id}
                                    draggableId={lesson.id}
                                    index={index}
                                  >
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-700 flex items-start gap-4"
                                      >
                                        <div {...provided.dragHandleProps}>
                                          <Grip className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                          <div className="grid grid-cols-4 gap-4">
                                            <div className="col-span-3">
                                              <Input
                                                placeholder="Lesson Title"
                                                value={lesson.title}
                                                onChange={(e) => handleLessonChange(section.id, lesson.id, 'title', e.target.value)}
                                                className="bg-[#222] border-gray-600 text-white"
                                              />
                                            </div>
                                            <div className="col-span-1">
                                              <Select 
                                                value={lesson.type} 
                                                onValueChange={(value: 'video' | 'article' | 'resource') => 
                                                  handleLessonChange(section.id, lesson.id, 'type', value)
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
                                            placeholder="Lesson Description"
                                            value={lesson.description}
                                            onChange={(e) => handleLessonChange(section.id, lesson.id, 'description', e.target.value)}
                                            className="bg-[#222] border-gray-600 text-white"
                                          />

                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-gray-400">Duration</Label>
                                              <Input
                                                placeholder="e.g., 30 mins"
                                                value={lesson.duration}
                                                onChange={(e) => handleLessonChange(section.id, lesson.id, 'duration', e.target.value)}
                                                className="mt-2 bg-[#222] border-gray-600 text-white"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-gray-400">Video Link (optional)</Label>
                                              <Input
                                                placeholder="Paste video URL"
                                                value={lesson.videoLink || ''}
                                                onChange={(e) => handleLessonChange(section.id, lesson.id, 'videoLink', e.target.value)}
                                                className="mt-2 bg-[#222] border-gray-600 text-white"
                                              />
                                            </div>
                                          </div>

                                          <div className="space-y-2">
                                            <Label className="text-gray-400">Assignment Link (optional)</Label>
                                            <Input
                                              placeholder="Paste assignment URL"
                                              value={lesson.assignmentLink || ''}
                                              onChange={(e) => handleLessonChange(section.id, lesson.id, 'assignmentLink', e.target.value)}
                                              className="bg-[#222] border-gray-600 text-white"
                                            />
                                          </div>

                                          <div className="space-y-2">
                                            <Label className="text-gray-400">Assignment Description</Label>
                                            <Textarea
                                              placeholder="Describe the assignment tasks"
                                              value={lesson.assignmentDescription || ''}
                                              onChange={(e) => handleLessonChange(section.id, lesson.id, 'assignmentDescription', e.target.value)}
                                              className="bg-[#222] border-gray-600 text-white"
                                            />
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeLesson(section.id, lesson.id)}
                                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                <Button
                                  variant="ghost"
                                  onClick={() => addLesson(section.id)}
                                  className="w-full border border-dashed border-gray-700 hover:border-blue-500 hover:bg-blue-500/5 text-gray-400 hover:text-blue-400"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Lesson
                                </Button>
                              </div>
                            )}
                          </Droppable>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSection(section.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <Button
                variant="ghost"
                onClick={addSection}
                className="w-full border border-dashed border-gray-700 hover:border-blue-500 hover:bg-blue-500/5 text-gray-400 hover:text-blue-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-gray-800 text-gray-400"
        >
          Back
        </Button>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => onSave(sections)}
            className="border-gray-800 text-gray-400"
          >
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CurriculumForm;