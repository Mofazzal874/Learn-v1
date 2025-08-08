import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { 
  BookOpen, 
  CreditCard, 
  Smartphone, 
  Building2,
  Shield,
  CheckCircle,
  ArrowLeft,
  Lock,
  Star
} from "lucide-react";
import connectDB from "@/lib/db";
import { Course } from "@/models/Course";
import EnrollmentForm from "./components/EnrollmentForm";

// Function to get course from the database
async function getCourse(id: string) {
  await connectDB();
  try {
    const course = await Course.findById(id)
      .populate('tutorId', 'firstName lastName image')
      .lean();
    return JSON.parse(JSON.stringify(course));
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

export default async function CourseEnrollmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  
  if (!session) {
    redirect("/login");
  }

  const course = await getCourse(id);

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
          <p className="text-gray-400 mb-6">The course you&apos;re trying to enroll in doesn&apos;t exist.</p>
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

  const thumbnailUrl = course.thumbnailAsset?.secure_url || course.thumbnail;
  const finalPrice = course.isFree ? 0 : (course.discountedPrice && course.discountedPrice < course.price ? course.discountedPrice : course.price);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href={`/courses/${id}`}>
            <Button variant="outline" className="border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Course Summary */}
          <div>
            <Card className="bg-[#141414] border-gray-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="w-24 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={course.title}
                        width={96}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{course.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">{course.subtitle}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>By {course.tutorId?.firstName} {course.tutorId?.lastName}</span>
                      {course.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          <span>{course.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Price */}
                <div className="border-t border-gray-800 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Course Price:</span>
                    <div className="text-right">
                      {course.isFree ? (
                        <span className="text-2xl font-bold text-green-400">Free</span>
                      ) : course.discountedPrice && course.discountedPrice < course.price ? (
                        <div>
                          <span className="text-2xl font-bold text-white">${course.discountedPrice}</span>
                          <span className="text-lg text-gray-500 line-through ml-2">${course.price}</span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-white">${course.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="bg-[#141414] border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-green-400">
                  <Shield className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Secure Payment</p>
                    <p className="text-sm text-gray-400">Your payment information is encrypted and secure</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card className="bg-[#141414] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  {course.isFree ? 'Confirm Enrollment' : 'Payment Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnrollmentForm 
                  course={course}
                  userId={session.user?.id}
                  finalPrice={finalPrice}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}