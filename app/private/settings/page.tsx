import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, User, Lock, Globe, Moon, Mail, Phone } from "lucide-react";

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
    enabled: true
  },
  {
    id: "achievements",
    title: "Achievements",
    description: "Receive notifications for new achievements and milestones",
    enabled: true
  },
  {
    id: "reminders",
    title: "Learning Reminders",
    description: "Daily reminders to maintain your learning streak",
    enabled: false
  },
  {
    id: "newsletter",
    title: "Newsletter",
    description: "Weekly digest of learning resources and tips",
    enabled: true
  }
];

function SettingSection({ children, icon: Icon, title }: {
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
        <CardTitle className="text-xl font-semibold text-white">{title}</CardTitle>
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
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Settings</h1>
          <p className="text-gray-400 text-lg">Manage your account preferences and settings</p>
        </div>

        <div className="space-y-8">
          {/* Profile Settings */}
          <SettingSection icon={User} title="Profile Settings">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-white">Display Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  defaultValue="John Doe"
                  className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  defaultValue="john@example.com"
                  className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio" className="text-white">Bio</Label>
                <textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  className="min-h-[100px] rounded-md border bg-[#1c1c1c] border-gray-800 p-3 text-white placeholder:text-gray-500"
                  defaultValue="Learning enthusiast passionate about technology and programming."
                />
              </div>
            </div>
          </SettingSection>

          {/* Notification Settings */}
          <SettingSection icon={Bell} title="Notification Preferences">
            <div className="space-y-4">
              {notificationSettings.map((setting) => (
                <NotificationToggle key={setting.id} setting={setting} />
              ))}
            </div>
          </SettingSection>

          {/* Account Settings */}
          <SettingSection icon={Lock} title="Account Settings">
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="current-password" className="text-white">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password" className="text-white">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password" className="text-white">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
          </SettingSection>

          {/* Preferences */}
          <SettingSection icon={Globe} title="Preferences">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-b border-gray-800">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-white">Dark Mode</h4>
                  <p className="text-sm text-gray-400">Toggle dark mode theme</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-4 border-b border-gray-800">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-white">Email Notifications</h4>
                  <p className="text-sm text-gray-400">Receive updates via email</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </SettingSection>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}