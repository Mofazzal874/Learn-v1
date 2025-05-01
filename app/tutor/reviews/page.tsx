import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ThumbsUp, MessageCircle } from "lucide-react";

export default async function TutorReviews() {
  const session = await auth();
  if (!session) return null;

  // Mock data for reviews (replace with actual data from your database)
  const reviews = [
    {
      id: 1,
      courseName: "Python Programming Masterclass",
      studentName: "John Doe",
      rating: 5,
      comment: "Excellent course! The instructor explains complex concepts in a very simple way.",
      helpful: 24,
      date: "2025-04-25",
    },
    {
      id: 2,
      courseName: "Web Development Bootcamp",
      studentName: "Jane Smith",
      rating: 4,
      comment: "Very comprehensive course. The projects were particularly helpful.",
      helpful: 18,
      date: "2025-04-23",
    },
    {
      id: 3,
      courseName: "Machine Learning Fundamentals",
      studentName: "Mike Johnson",
      rating: 5,
      comment: "Outstanding content and great practical examples. Really helped me understand ML concepts.",
      helpful: 31,
      date: "2025-04-20",
    },
  ];

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
              <div className="text-2xl font-bold text-white">4.8</div>
              <p className="text-xs text-yellow-400 mt-1">Across all courses</p>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Reviews</CardTitle>
              <MessageCircle className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">856</div>
              <p className="text-xs text-blue-400 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Helpful Votes</CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">2,431</div>
              <p className="text-xs text-green-400 mt-1">Total helpful marks</p>
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
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-800 last:border-0 pb-6 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-white font-medium">{review.courseName}</h3>
                      <p className="text-sm text-gray-400">{review.studentName}</p>
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
                  <p className="text-gray-300 mb-2">{review.comment}</p>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center text-gray-400">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      <span>{review.helpful} found this helpful</span>
                    </div>
                    <span className="text-gray-400">{review.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}