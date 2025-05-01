import { auth } from "@/auth";
import { Course } from "@/models/Course";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { Plus, GripVertical, X } from "lucide-react";
import connectDB from "@/lib/db";
import { updateCourse } from "@/app/actions/course";
import { useState } from "react";

const categories = [
  "Programming",
  "Design",
  "Business",
  "Marketing",
  "Personal Development",
  "Music",
  "Photography",
  "Health & Fitness",
  "Language Learning",
  "Teaching & Academics",
];

interface Props {
  params: { id: string };
}

async function getCourse(id: string) {
  await connectDB();
  const course = await Course.findById(id);
  if (!course) throw new Error("Course not found");
  return course;
}

export default async function EditCourse({ params }: Props) {
  const session = await auth();
  if (!session) return null;

  const course = await getCourse(params.id);

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Edit Course</h1>
            <p className="text-gray-400 mt-2">
              Update your course details and content
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <form action={async (formData) => { await updateCourse(params.id, formData); }}>
                <Card className="bg-[#141414] border-gray-800 p-6">
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-white">
                        Course Information
                      </h2>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-white">
                            Course Title
                          </Label>
                          <Input
                            id="title"
                            name="title"
                            defaultValue={course.title}
                            required
                            className="bg-[#1a1a1a] border-gray-800 text-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-white">
                            Category
                          </Label>
                          <Select name="category" defaultValue={course.category}>
                            <SelectTrigger className="bg-[#1a1a1a] border-gray-800 text-white">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category.toLowerCase()}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="price" className="text-white">
                            Price (USD)
                          </Label>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={course.price}
                            required
                            className="bg-[#1a1a1a] border-gray-800 text-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="level" className="text-white">
                            Level
                          </Label>
                          <Select name="level" defaultValue={course.level}>
                            <SelectTrigger className="bg-[#1a1a1a] border-gray-800 text-white">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-white">
                            Course Description
                          </Label>
                          <Textarea
                            id="description"
                            name="description"
                            defaultValue={course.description}
                            required
                            className="min-h-[150px] bg-[#1a1a1a] border-gray-800 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-white">
                        Additional Details
                      </h2>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="prerequisites" className="text-white">
                            Prerequisites
                          </Label>
                          <Textarea
                            id="prerequisites"
                            name="prerequisites"
                            defaultValue={course.prerequisites?.join("\n")}
                            className="min-h-[100px] bg-[#1a1a1a] border-gray-800 text-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="outcomes" className="text-white">
                            Learning Outcomes
                          </Label>
                          <Textarea
                            id="outcomes"
                            name="outcomes"
                            defaultValue={course.outcomes?.join("\n")}
                            className="min-h-[100px] bg-[#1a1a1a] border-gray-800 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </Card>
              </form>
            </div>

            <div className="space-y-6">
              <Card className="bg-[#141414] border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Course Content
                </h3>
                <div className="space-y-4">
                  <Button
                    className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                    asChild
                  >
                    <a href={`/tutor/courses/${params.id}/content`}>
                      <Plus className="w-4 h-4 mr-2" />
                      Manage Content
                    </a>
                  </Button>
                </div>
              </Card>

              <Card className="bg-[#141414] border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Course Status
                </h3>
                <div className="space-y-4">
                  {course.published ? (
                    <form action={`/api/courses/${params.id}/unpublish`}>
                      <Button
                        type="submit"
                        className="w-full bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                      >
                        Unpublish Course
                      </Button>
                    </form>
                  ) : (
                    <form action={`/api/courses/${params.id}/publish`}>
                      <Button
                        type="submit"
                        className="w-full bg-green-500/10 text-green-500 hover:bg-green-500/20"
                      >
                        Publish Course
                      </Button>
                    </form>
                  )}
                  
                  <form action={`/api/courses/${params.id}/delete`}>
                    <Button
                      type="submit"
                      className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    >
                      Delete Course
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}