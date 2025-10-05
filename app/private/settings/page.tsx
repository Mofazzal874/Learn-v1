"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useUser } from "@/context/UserContext";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const notificationSettings: NotificationSetting[] = [
  {
    id: "course-updates",
    title: "Course Updates",
    description: "Get notified when your enrolled courses have new content",
    enabled: true,
  },
  {
    id: "achievements",
    title: "Achievements",
    description: "Receive notifications for new achievements and milestones",
    enabled: true,
  },
  {
    id: "reminders",
    title: "Learning Reminders",
    description: "Daily reminders to maintain your learning streak",
    enabled: false,
  },
];

function SettingSection({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: any;
  title: string;
}) {
  return (
    <Card className="bg-[#141414] border-gray-800">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>
        <CardTitle className="text-xl font-semibold text-white">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function NotificationToggle({ setting }: { setting: NotificationSetting }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-800 last:border-0">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-white">{setting.title}</h4>
        <p className="text-sm text-gray-400">{setting.description}</p>
      </div>
      <Switch defaultChecked={setting.enabled} />
    </div>
  );
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useUser();

  const isManualLogin = !user.authProviderId;

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

    const res = await fetch("/api/user/change-password", {
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
          <p className="text-gray-400 text-lg">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="space-y-8">
          {/* Notification Settings */}
          <SettingSection icon={Bell} title="Notification Preferences">
            <div className="space-y-4">
              {notificationSettings.map((setting) => (
                <NotificationToggle key={setting.id} setting={setting} />
              ))}
            </div>
          </SettingSection>

          {/* Account Settings */}
          {isManualLogin && (<SettingSection icon={Lock} title="Account Settings">
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="current-password" className="text-white">
                  Current Password
                </Label>
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
                <Label htmlFor="new-password" className="text-white">
                  New Password
                </Label>
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
                <Label htmlFor="confirm-password" className="text-white">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                  required
                />
              </div>
            </div>
          </SettingSection>)
        }

          {/* Save Button */}
          {!user.authProviderId && (
            <div className="flex justify-end">
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                onClick={handlePasswordChange}
                disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>)}
        </div>
      </div>
    </div>
  );
}
