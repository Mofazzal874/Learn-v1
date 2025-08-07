import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { Video, MoreVertical, Users, Star, Eye, Edit, Trash2, PlusCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import connectDB from "@/lib/db";
import { Video as VideoModel } from "@/models/Video";
import { User } from "@/models/User";
import { redirect } from "next/navigation";
import DeleteVideoButton from "./components/DeleteVideoButton";

interface VideoData {
  _id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  views: number;
  totalComments: number;
  rating: number;
  published: boolean;
  duration?: string;
  category: string;
  level: string;
  language: string;
  tags: string[];
}

// Function to get tutor's videos from the database
async function getTutorVideos(userId: string): Promise<VideoData[]> {
  await connectDB();
  const videos = await VideoModel.find({ userId }).sort({ createdAt: -1 });
  return JSON.parse(JSON.stringify(videos)); // Convert MongoDB docs to plain objects
}

export default async function TutorVideos() {
  const session = await auth();
  if (!session) return redirect("/login");

  // Fetch videos from the database
  const videos = await getTutorVideos(session.user.id);

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Your Videos</h1>
              <p className="text-gray-400">Manage and track your video content</p>
            </div>
            <Link href="/tutor/videos/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle className="h-4 w-4 mr-2" />
                Upload New Video
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {videos.length === 0 ? (
              <div className="text-center py-12">
                <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No videos yet</h3>
                <p className="text-gray-400 mb-6">Start sharing your expertise by uploading your first video</p>
                <Link href="/tutor/videos/new">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Upload Your First Video
                  </Button>
                </Link>
              </div>
            ) : (
              videos.map((video: VideoData) => (
                <Card key={video._id} className="bg-[#141414] border-gray-800">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-32 h-20 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden relative">
                          {video.thumbnail ? (
                            <Image
                              src={video.thumbnail}
                              alt={video.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Video className="h-8 w-8 text-gray-400" />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <Link href={`/tutor/videos/${video._id}`}>
                            <h3 className="text-xl font-semibold text-white mb-2 hover:text-blue-400 transition-colors">
                              {video.title}
                            </h3>
                          </Link>
                          {video.subtitle && (
                            <p className="text-gray-400 mb-2">{video.subtitle}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{video.views || 0} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{video.totalComments || 0} comments</span>
                            </div>
                            {video.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-400" />
                                <span>{video.rating}</span>
                              </div>
                            )}
                            <span>
                              {video.published ? (
                                <span className="text-green-400">Published</span>
                              ) : (
                                <span className="text-yellow-400">Draft</span>
                              )}
                            </span>
                            {video.duration && (
                              <span className="bg-black/50 px-2 py-1 rounded text-xs">
                                {video.duration}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-gray-800">
                          {/* <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                            <Link href={`/videos/${video._id}`} className="flex w-full items-center">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Link>
                          </DropdownMenuItem> */}
                          <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                            <Link href={`/tutor/videos/${video._id}/edit`} className="flex w-full items-center">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Video
                            </Link>
                          </DropdownMenuItem>
                          <DeleteVideoButton
                            videoId={video._id}
                            videoTitle={video.title}
                            variant="dropdown"
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-4">
                      <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                        <div className="text-sm text-gray-400">Category</div>
                        <div className="text-lg font-semibold text-blue-400 capitalize">
                          {video.category}
                        </div>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                        <div className="text-sm text-gray-400">Level</div>
                        <div className="text-lg font-semibold text-purple-400 capitalize">
                          {video.level}
                        </div>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                        <div className="text-sm text-gray-400">Language</div>
                        <div className="text-lg font-semibold text-green-400">
                          {video.language}
                        </div>
                      </div>

                      {video.tags && video.tags.length > 0 && (
                        <div className="bg-[#1a1a1a] rounded-lg px-4 py-2">
                          <div className="text-sm text-gray-400">Tags</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {video.tags.slice(0, 3).map((tag: string, index: number) => (
                              <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                            {video.tags.length > 3 && (
                              <span className="text-xs text-gray-400">+{video.tags.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}