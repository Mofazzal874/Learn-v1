import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { 
  Play, 
  Users, 
  Star, 
  Clock, 
  Eye,
  Share2,
  User,
  Calendar,
  Globe,
  ArrowLeft,
  MessageSquare
} from "lucide-react";
import connectDB from "@/lib/db";
import { Video } from "@/models/Video";
import CommentsSection from "./components/CommentsSection";
import VideoProgressTracker from "./components/VideoProgressTracker";
import CopyLinkButton from "./components/CopyLinkButton";
import VideoRating from "./components/VideoRating";

// Function to get video from the database
async function getVideo(id: string) {
  await connectDB();
  try {
    const video = await Video.findById(id)
      .populate('userId', 'firstName lastName image')
      .populate('comments.userId', 'firstName lastName image')
      .lean();
    return JSON.parse(JSON.stringify(video));
  } catch (error) {
    console.error('Error fetching video:', error);
    return null;
  }
}

interface VideoPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function VideoDetailsPage({ params }: VideoPageProps) {
  const session = await auth();
  const resolvedParams = await params;
  const video = await getVideo(resolvedParams.id);

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Play className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Video Not Found</h1>
          <p className="text-gray-400 mb-6">The video you're looking for doesn't exist or has been removed.</p>
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

  const thumbnailUrl = video.thumbnailAsset?.secure_url || video.thumbnail;
  const videoUrl = video.videoAsset?.secure_url || video.videoLink;

  // Sort comments by newest first and limit to top 10
  const sortedComments = video.comments ? 
    [...video.comments]
      .sort((a: { createdAt: string }, b: { createdAt: string }) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10) : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Video Progress Tracker */}
      <VideoProgressTracker
        videoId={resolvedParams.id}
        videoTitle={video.title}
        videoDuration={video.duration || ''}
        videoOutcomes={video.outcomes || []}
        isLoggedIn={!!session}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/explore">
            <Button variant="outline" className="border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Button>
          </Link>
        </div>

        {/* Main Content - Single Column Layout */}
        <div className="max-w-5xl">
          {/* Video Player */}
          <div className="mb-6">
            <div className="aspect-video w-full bg-gray-800 rounded-lg overflow-hidden mb-4">
              {videoUrl ? (
                <video
                  controls
                  className="w-full h-full"
                  poster={thumbnailUrl}
                >
                  <source src={videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : thumbnailUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="h-16 w-16 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="h-20 w-20 text-gray-600" />
                </div>
              )}
            </div>

            {/* Video Title and Metadata */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm capitalize">
                  {video.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm capitalize">
                  {video.level}
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-3">{video.title}</h1>
              {video.subtitle && (
                <p className="text-lg text-gray-300 mb-4">{video.subtitle}</p>
              )}

              {/* Video Stats */}
              <div className="flex flex-wrap items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">{video.views || 0} views</span>
                </div>
                {video.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-300">{video.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">{video.totalComments || 0} comments</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 mb-6">
                <VideoRating 
                  videoId={resolvedParams.id}
                  isLoggedIn={!!session}
                />
                <CopyLinkButton />
              </div>
            </div>
          </div>

          {/* Creator Info Section (YouTube-style) */}
          <div className="mb-6">
            <Card className="bg-[#141414] border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {video.userId?.image ? (
                    <Image
                      src={video.userId.image}
                      alt={`${video.userId.firstName} ${video.userId.lastName}`}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">
                      {video.userId?.firstName} {video.userId?.lastName}
                    </h3>
                    <p className="text-gray-400 text-sm">Content Creator</p>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <div>Published: {new Date(video.createdAt).toLocaleDateString()}</div>
                    <div>Language: {video.language || 'English'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Description */}
          <Card className="bg-[#141414] border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">About this video</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="text-gray-300 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: video.description }}
              />
            </CardContent>
          </Card>

          {/* Combined Learning Information */}
          <Card className="bg-[#141414] border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Learning Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* What you'll learn */}
              {video.outcomes && video.outcomes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">What you&apos;ll learn</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {video.outcomes.map((outcome: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <Play className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prerequisites */}
              {video.prerequisites && video.prerequisites.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Prerequisites</h3>
                  <div className="space-y-2">
                    {video.prerequisites.map((prerequisite: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <Play className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{prerequisite}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <CommentsSection
            videoId={resolvedParams.id}
            initialComments={sortedComments}
            totalComments={video.totalComments || 0}
            isLoggedIn={!!session}
          />
        </div>
      </div>
    </div>
  );
}