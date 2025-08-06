"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState,useEffect } from "react";
import { toast } from "react-toastify";
import { Camera, Mail, MapPin, Phone, GraduationCap, Award, Star, Users, User, Pencil } from "lucide-react";
import Image from "next/image";

export default function TutorProfilePage() {
 
  const [ tutorStats,setTutorStats] = useState(null);
  const [ user,setUser ] = useState(null);

  useEffect(()=>{
    const fetchtutorStats = async () =>{
      try{
        const res = await fetch("/api/tutor/profile");
        if(res.ok){
          const data = await res.json();
          console.log("done fetching",data);
          setTutorStats(data);
          setUser(data.user);
      }
    }catch(error){
      console.error("Error fetching user progress:",error.message);
    }
  };
  fetchtutorStats();
  },[]);

  const [loading, setLoading] = useState(false);

  const [editMode, setEditMode] = useState({
    firstName: false,
    lastName: false,
    phone: false,
    location: false,
  });
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        location: user.location || "",
      });
    }
  }, [user]);

  const handleEdit = (field) => setEditMode({ ...editMode, [field]: true });
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch("/api/tutor/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);

    if (res.ok) {
      setEditMode({
        firstName: false,
        lastName: false,
        phone: false,
        location: false,
      });

      const data = await res.json();
      console.log(data.message);

      toast.success("✅ Profile updated successfully!");
    } else {
      toast.error("❌ Failed to update profile.");
    }
  };

  const handleProfilePicChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  setLoading(true);
  const res = await fetch("/api/tutor/profile/image", {
    method: "POST",
    body: formData,
  });
  setLoading(false);

  if (res.ok) {
    const data = await res.json();
    setUser({...user,image:data.image});
    console.log(data.message);
    toast.success("✅ Profile picture updated!");
  } else {
    toast.error("❌ Failed to update profile picture.");
  }
};

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Profile Header */}
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-8">
          {/* Cover Image */}
          <div className="h-48 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-gray-800" />
          
          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-[#141414] border-4 border-[#0a0a0a] flex items-center justify-center">
              {user?.image ? (
                  <Image
                    src={user.image}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                id="profile-pic-upload"
                style={{ display: "none" }}
                onChange={handleProfilePicChange}
              />
              <button
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                onClick={() =>
                  document.getElementById("profile-pic-upload").click()
                }
                type="button"
                aria-label="Upload Profile Picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="mt-16 grid gap-8">
          {/* Basic Information */}
          <Card className="bg-[#141414] border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-400">First Name</label>
                  <div className="relative mt-1 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white">
                  {editMode.firstName ? (
                      <>
                        <input
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          className="p-2 rounded bg-[#1a1a1a] border border-gray-800 text-white"
                        />
                        <button
                          className="ml-2 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600"
                          onClick={() =>
                            setEditMode({ ...editMode, firstName: false })
                          }
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {form.firstName}
                        <button
                          className="absolute -top-2 -right-2 m-1 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center"
                          onClick={() => handleEdit("firstName")}
                          type="button"
                          aria-label="Edit"
                        >
                          <Pencil className="w-2 h-2" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Last Name</label>
                  <div className="relative mt-1 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white">
                  {editMode.lastName ? (
                      <>
                        <input
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                          className="p-2 rounded bg-[#1a1a1a] border border-gray-800 text-white"
                        />
                        <button
                          className="ml-2 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600"
                          onClick={() =>
                            setEditMode({ ...editMode, lastName: false })
                          }
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {form.lastName}
                        <button
                          className="absolute -top-2 -right-2 m-1 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center"
                          onClick={() => handleEdit("lastName")}
                          type="button"
                          aria-label="Edit"
                        >
                          <Pencil className="w-2 h-2" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Email</label>
                <div className="mt-1 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user?.email}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-400">Phone</label>
                  <div className="relative mt-1 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {editMode.phone ? (
                      <>
                        <input
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="p-2 rounded bg-[#1a1a1a] border border-gray-800 text-white"
                        />
                        <button
                          className="ml-2 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600"
                          onClick={() =>
                            setEditMode({ ...editMode, phone: false })
                          }
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {user?.phone ? (
                          form.phone
                        ) : (
                          <span className="text-gray-500">Not Provided</span>
                        )}
                        <button
                          className="absolute -top-2 -right-2 m-1 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center"
                          onClick={() => handleEdit("phone")}
                          type="button"
                          aria-label="Edit"
                        >
                          <Pencil className="w-2 h-2" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Location</label>
                  <div className="relative mt-1 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {editMode.location ? (
                      <>
                        <input
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          className="p-2 rounded bg-[#1a1a1a] border border-gray-800 text-white"
                        />
                        <button
                          className="ml-2 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600"
                          onClick={() =>
                            setEditMode({ ...editMode, location: false })
                          }
                          type="button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {user?.location ? (
                          form.location
                        ) : (
                          <span className="text-gray-500">Not Provided</span>
                        )}
                        <button
                          className="absolute -top-2 -right-2 m-1 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center"
                          onClick={() => handleEdit("location")}
                          type="button"
                          aria-label="Edit"
                        >
                          <Pencil className="w-2 h-2" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teaching Statistics */}
          <Card className="bg-[#141414] border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">Teaching Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-[#1a1a1a] border border-gray-800">
                  <div className="text-sm text-gray-400">Total Students</div>
                  <div className="mt-1 text-2xl font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    {tutorStats?.totalStudents? tutorStats.totalStudents : 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#1a1a1a] border border-gray-800">
                  <div className="text-sm text-gray-400">Active Courses</div>
                  <div className="mt-1 text-2xl font-semibold text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-green-400" />
                    {tutorStats?.activeCourses? tutorStats.activeCourses : 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#1a1a1a] border border-gray-800">
                  <div className="text-sm text-gray-400">Average Rating</div>
                  <div className="mt-1 text-2xl font-semibold text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    {tutorStats?.avgRating? tutorStats.avgRating:0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
          <Button
              className="bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleSave}
              disabled={loading || !Object.values(editMode).some(Boolean)}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}