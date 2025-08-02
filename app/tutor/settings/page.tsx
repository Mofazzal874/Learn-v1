"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import {  Lock, DollarSign } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function SettingSection({ children, icon: Icon, title }: {
  children: React.ReactNode;
  icon: any;
  title: string;
}) {
  return (
    <Card className="bg-[#141414] border-gray-800">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Icon className="h-6 w-6 text-blue-400" />
        </div>
        <CardTitle className="text-xl text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}



export default function TutorSettingsPage() {

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  

  const handlePasswordChange = async () => {

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/tutor/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    setLoading(false);

    const data = await res.json();

    if (res.ok) {
      toast.success(data.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(data.message || "Failed to change password.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Settings</h1>
          <p className="text-gray-400 text-lg">Manage your tutor account preferences and notifications</p>
        </div>

        <div className="space-y-8">
          

          {/* Account Settings */}
          <SettingSection icon={Lock} title="Account Settings">
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="current-password" className="text-white">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password" className="text-white">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password" className="text-white">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                  required
                />
              </div>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                onClick={handlePasswordChange}
                disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            </div>
          </SettingSection>

          {/* Payment Settings */}
          <SettingSection icon={DollarSign} title="Payment Settings">
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="payment-email" className="text-white">Payment Email</Label>
                <Input
                  id="payment-email"
                  type="email"
                  className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                  placeholder="Enter payment email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment-method" className="text-white">Default Payment Method</Label>
                <Input
                  id="payment-method"
                  type="text"
                  className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                  placeholder="Enter payment method"
                />
              </div>
              <Button className="bg-blue-500 hover:bg-blue-600">Update Payment Settings</Button>
            </div>
          </SettingSection>
        </div>
      </div>
    </div>
  );
}