'use client';

import React, { useState } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable 
} from '@hello-pangea/dnd';
import { Grip, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Section {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
}

const CurriculumForm = () => {
  const [sections, setSections] = useState<Section[]>([
    {
      id: '1',
      title: '',
      description: '',
      lessons: []
    }
  ]);

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
              duration: ''
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

  return (
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
                          onChange={(e) => {
                            setSections(sections.map(s => {
                              if (s.id === section.id) {
                                return { ...s, title: e.target.value };
                              }
                              return s;
                            }));
                          }}
                          className="bg-[#1a1a1a] border-gray-700 text-white"
                        />
                        <Textarea
                          placeholder="Section Description"
                          value={section.description}
                          onChange={(e) => {
                            setSections(sections.map(s => {
                              if (s.id === section.id) {
                                return { ...s, description: e.target.value };
                              }
                              return s;
                            }));
                          }}
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
                                        <Input
                                          placeholder="Lesson Title"
                                          value={lesson.title}
                                          onChange={(e) => {
                                            setSections(sections.map(s => {
                                              if (s.id === section.id) {
                                                return {
                                                  ...s,
                                                  lessons: s.lessons.map(l => {
                                                    if (l.id === lesson.id) {
                                                      return { ...l, title: e.target.value };
                                                    }
                                                    return l;
                                                  })
                                                };
                                              }
                                              return s;
                                            }));
                                          }}
                                          className="bg-[#222] border-gray-600 text-white"
                                        />
                                        <div className="flex gap-4">
                                          <Input
                                            placeholder="Duration (e.g., 30 mins)"
                                            value={lesson.duration}
                                            onChange={(e) => {
                                              setSections(sections.map(s => {
                                                if (s.id === section.id) {
                                                  return {
                                                    ...s,
                                                    lessons: s.lessons.map(l => {
                                                      if (l.id === lesson.id) {
                                                        return { ...l, duration: e.target.value };
                                                      }
                                                      return l;
                                                    })
                                                  };
                                                }
                                                return s;
                                              }));
                                            }}
                                            className="bg-[#222] border-gray-600 text-white"
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeLesson(section.id, lesson.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
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
  );
};

export default CurriculumForm;