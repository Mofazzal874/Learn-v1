import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Eye, Users, Star, Clock, Edit, Globe, Lock } from "lucide-react";
import Link from "next/link";
import connectDB from "@/lib/db";
import { Video as VideoModel } from "@/models/Video";
import { redirect } from "next/navigation";
import PublishUnpublishButtons from "./PublishUnpublishButtons";

async function getVideo(id: string, userId: string) {
  await connectDB();
  const video = await VideoModel.findOne({ _id: id, userId })
    .populate('userId', 'firstName lastName image')
    .populate('comments.userId', 'firstName lastName image')
    .lean();
  
  return video ? JSON.parse(JSON.stringify(video)) : null;
}

export default async function UserVideoDetails({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return redirect("/login");

  const video = await getVideo(params.id, session.user.id);
  
  if (!video) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Video Not Found</h1>
          <p className="text-gray-400 mb-6">The video you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/private/videos">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Back to My Videos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{video.title}</h1>
            <p className="text-gray-400">Video Details</p>
          </div>
          <div className="flex gap-4">
            <Link href={`/private/videos/${video._id}/edit`}>
              <Button variant="outline" className="border-gray-800 text-gray-400">
                <Edit className="h-4 w-4 mr-2" />
                Edit Video
              </Button>
            </Link>
            
            <PublishUnpublishButtons videoId={video._id} published={video.published} />
            
            <Link href="/private/videos">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Back to My Videos
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <Card className="bg-[#141414] border-gray-800 mb-6">
              <div className="p-6">
                <div className="aspect-video bg-gray-900 rounded-lg mb-4 overflow-hidden">
                  {video.videoLink ? (
                    <video
                      controls
                      className="w-full h-full"
                      poster={video.thumbnail || undefined}
                    >
                      <source src={video.videoLink} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-16 w-16 text-gray-600" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{video.views || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{video.totalComments || 0} comments</span>
                    </div>
                    {video.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{video.duration}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {video.published ? (
                        <>
                          <Globe className="h-4 w-4 text-green-400" />
                          <span className="text-green-400">Published</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-yellow-400" />
                          <span className="text-yellow-400">Draft</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-white mb-2">{video.title}</h2>
                {video.subtitle && (
                  <p className="text-gray-400 mb-4">{video.subtitle}</p>
                )}
                
                <div className="prose prose-invert max-w-none">
                  <div 
                    className="text-gray-300" 
                    dangerouslySetInnerHTML={{ __html: video.description || '' }}
                  />
                </div>
              </div>
            </Card>

            {/* Learning Outcomes */}
            {video.outcomes && video.outcomes.length > 0 && (
              <Card className="bg-[#141414] border-gray-800 mb-6">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">What you'll learn</h3>
                  <ul className="space-y-2">
                    {video.outcomes.map((outcome: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-green-400 mt-1">✓</span>
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}

            {/* Prerequisites */}
            {video.prerequisites && video.prerequisites.length > 0 && (
              <Card className="bg-[#141414] border-gray-800">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Prerequisites</h3>
                  <ul className="space-y-2">
                    {video.prerequisites.map((prerequisite: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-blue-400 mt-1">•</span>
                        {prerequisite}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Video Stats */}
            <Card className="bg-[#141414] border-gray-800 mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Video Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Views</span>
                    <span className="text-white font-semibold">{video.views || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Comments</span>
                    <span className="text-white font-semibold">{video.totalComments || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={video.published ? "text-green-400" : "text-yellow-400"}>
                      {video.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  {video.rating > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-white font-semibold">{video.rating}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Video Info */}
            <Card className="bg-[#141414] border-gray-800">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Video Information</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 text-sm">Category</span>
                    <p className="text-white capitalize">{video.category}</p>
                  </div>
                  {video.subcategory && (
                    <div>
                      <span className="text-gray-400 text-sm">Subcategory</span>
                      <p className="text-white capitalize">{video.subcategory}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400 text-sm">Level</span>
                    <p className="text-white capitalize">{video.level}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Language</span>
                    <p className="text-white">{video.language}</p>
                  </div>
                  {video.tags && video.tags.length > 0 && (
                    <div>
                      <span className="text-gray-400 text-sm">Tags</span>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {video.tags.map((tag: string, index: number) => (
                          <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}