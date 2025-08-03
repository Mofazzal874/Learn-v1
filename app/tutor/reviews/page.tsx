"use client"

import { useState , useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ThumbsUp, MessageCircle } from "lucide-react";
import { setLazyProp } from "next/dist/server/api-utils";

interface Stats{
  averageRating: number,
  totalReviews: number,
  totalRatings: number,
}

export default function TutorReviews() {

  const [ reviews , setReviews ] = useState([]);
  const [ stats, setStats ] = useState<Stats>({
    averageRating: 0.0,
    totalReviews: 0,
    totalRatings: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try{
        const res = await fetch("/api/tutor/reviews");
        if(res.ok)
        {
          const data = await res.json();
          setReviews(data.reviews);
          setStats(data.stats);
        }
        else
        {
          throw new Error("Failed to fetch reviews");
        }
      }catch(error){
        console.error("Error fetching Reviews:",error.message);
      }finally{
        setLoading(false);
      }
    };

    fetchReviews();
  },[]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Course Reviews</h1>
          <p className="text-gray-400">Monitor and manage your course feedback</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#141414] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.averageRating}
              </div>
              <p className="text-xs text-yellow-400 mt-1">Across all courses</p>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Reviews</CardTitle>
              <MessageCircle className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalReviews}
              </div>
              <p className="text-xs text-blue-400 mt-1">Last 20 days</p>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Ratings</CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalRatings}
              </div>
              <p className="text-xs text-green-400 mt-1">Total No. of Ratings</p>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        <Card className="bg-[#141414] border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
            {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-800 last:border-0 pb-6 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-white font-medium">{review.courseName}</h3>
                        <p className="text-sm text-gray-400">
                          {review.userId.firstName} {review.userId.lastName}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300 mb-2">{review.review}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No reviews yet. Reviews will appear here once students start rating your courses.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}