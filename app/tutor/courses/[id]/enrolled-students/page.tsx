"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  Calendar,
  User,
  Mail,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface EnrolledUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
  enrolledAt: string | null;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  lastAccessedAt: string | null;
}

interface EnrolledStudentsData {
  courseTitle: string;
  totalStudents: number;
  enrolledUsers: EnrolledUser[];
}

export default function EnrolledStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const [data, setData] = useState<EnrolledStudentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrolledStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tutor/courses/${courseId}/enrolled-students`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch enrolled students');
      }
      
      const studentsData = await response.json();
      setData(studentsData);
    } catch (err: unknown) {
      console.error('Error fetching enrolled students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load enrolled students');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchEnrolledStudents();
  }, [fetchEnrolledStudents]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/10';
      case 'in_progress':
        return 'text-blue-400 bg-blue-400/10';
      case 'dropped':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-yellow-400 bg-yellow-400/10';
    }
  };



  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading enrolled students...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => router.back()} className="bg-blue-600 hover:bg-blue-700">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/tutor/courses">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Enrolled Students</h1>
            <p className="text-gray-400">{data?.courseTitle}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#141414] border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-white">{data?.totalStudents || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-[#141414] border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Active Students</p>
                <p className="text-2xl font-bold text-white">
                  {data?.enrolledUsers.filter(u => u.status === 'in_progress' || u.status === 'enrolled').length || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-[#141414] border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-white">
                  {data?.enrolledUsers.filter(u => u.status === 'completed').length || 0}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-[#141414] border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Recent Enrollments</p>
                <p className="text-2xl font-bold text-white">
                  {data?.enrolledUsers.filter(u => {
                    const enrolledDate = new Date(u.enrolledAt || '');
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return enrolledDate >= weekAgo;
                  }).length || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Students List */}
        <Card className="bg-[#141414] border-gray-800">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Student Details</h2>
            
            {data?.enrolledUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No students enrolled yet</h3>
                <p className="text-gray-400">Students will appear here once they enroll in your course.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.enrolledUsers.map((student) => (
                  <div key={student._id} className="bg-[#1a1a1a] rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                          {student.image ? (
                            <Image 
                              src={student.image} 
                              alt={`${student.firstName} ${student.lastName}`}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {student.firstName} {student.lastName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail className="h-4 w-4" />
                            <span>{student.email}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Enrolled</p>
                        <p className="text-white font-medium">{formatDate(student.enrolledAt)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Last Activity</p>
                        <p className="text-white font-medium">{formatDate(student.lastAccessedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}