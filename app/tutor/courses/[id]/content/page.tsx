import { auth } from "@/auth";
import { Course } from "@/models/Course";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, GripVertical, X, Video, FileText, RefreshCcw } from "lucide-react";
import connectDB from "@/lib/db";
import { redirect } from "next/navigation";

async function getCourse(id: string) {
  await connectDB();
  const course = await Course.findById(id);
  if (!course) throw new Error("Course not found");
  return course;
}

export default async function CourseContent({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const course = await getCourse(id);

  // Ensure the tutor owns this course
  if (course.tutorId.toString() !== session.user.id) {
    redirect("/tutor/courses");
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      <div className="flex-1 overflow-auto">
        <div className="h-full flex flex-col md:flex-row">
          {/* Content Structure Sidebar */}
          <div className="w-full md:w-80 border-r border-gray-800 bg-[#141414] p-4 md:h-screen">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Content</h2>
              <Button size="sm" variant="ghost" className="text-gray-400">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="space-y-4">
                {course.sections?.map((section: any, index: number) => (
                  <Card key={section._id} className="bg-[#1a1a1a] border-gray-800">
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-white mb-2">
                        <GripVertical className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{section.title}</span>
                      </div>
                      
                      <div className="pl-6 space-y-2">
                        {section.lessons?.map((lesson: any) => (
                          <div
                            key={lesson._id}
                            className="flex items-center gap-2 text-gray-400 text-sm"
                          >
                            {lesson.videoUrl ? (
                              <Video className="h-3 w-3" />
                            ) : (
                              <FileText className="h-3 w-3" />
                            )}
                            <span>{lesson.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </ScrollArea>
          </div>

          {/* Content Editor */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {course.title}
                </h1>
                <p className="text-gray-400">
                  Add and organize your course content
                </p>
              </div>

              <Card className="bg-[#141414] border-gray-800 p-6">
                <form className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="section-title" className="text-white">
                        Section Title
                      </Label>
                      <Input
                        id="section-title"
                        placeholder="Enter section title"
                        className="bg-[#1a1a1a] border-gray-800 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="section-description" className="text-white">
                        Section Description
                      </Label>
                      <Textarea
                        id="section-description"
                        placeholder="Enter section description"
                        className="bg-[#1a1a1a] border-gray-800 text-white mt-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Lessons</h3>
                    
                    <div className="space-y-4">
                      <Card className="bg-[#1a1a1a] border-gray-800 p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-medium">New Lesson</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="lesson-title" className="text-white">
                                Lesson Title
                              </Label>
                              <Input
                                id="lesson-title"
                                placeholder="Enter lesson title"
                                className="bg-[#141414] border-gray-800 text-white mt-2"
                              />
                            </div>

                            <div>
                              <Label htmlFor="video-url" className="text-white">
                                Video URL
                              </Label>
                              <Input
                                id="video-url"
                                placeholder="Enter video URL"
                                className="bg-[#141414] border-gray-800 text-white mt-2"
                              />
                            </div>

                            <div>
                              <Label htmlFor="lesson-description" className="text-white">
                                Description
                              </Label>
                              <Textarea
                                id="lesson-description"
                                placeholder="Enter lesson description"
                                className="bg-[#141414] border-gray-800 text-white mt-2"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Button
                        className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button variant="outline" className="border-gray-700 text-white">
                      Cancel
                    </Button>
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      Save Section
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}