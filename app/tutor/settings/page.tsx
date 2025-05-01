import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bell, Lock, Users, Globe, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const tutorNotifications: NotificationSetting[] = [
  {
    id: "new-enrollment",
    title: "New Student Enrollments",
    description: "Get notified when a student enrolls in your course",
    enabled: true
  },
  {
    id: "course-feedback",
    title: "Course Reviews & Feedback",
    description: "Receive notifications for new course reviews and ratings",
    enabled: true
  },
  {
    id: "course-questions",
    title: "Student Questions",
    description: "Get notified when students ask questions in your courses",
    enabled: true
  },
  {
    id: "earnings-update",
    title: "Earnings Updates",
    description: "Receive notifications about your earnings and payouts",
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
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Icon className="h-6 w-6 text-blue-400" />
        </div>
        <CardTitle className="text-xl text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function NotificationToggle({ setting }: { setting: NotificationSetting }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-800 last:border-0">
      <div>
        <div className="font-medium text-white mb-1">{setting.title}</div>
        <div className="text-sm text-gray-400">{setting.description}</div>
      </div>
      <Switch checked={setting.enabled} />
    </div>
  );
}

export default function TutorSettingsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Settings</h1>
          <p className="text-gray-400 text-lg">Manage your tutor account preferences and notifications</p>
        </div>

        <div className="space-y-8">
          {/* Notification Settings */}
          <SettingSection icon={Bell} title="Notification Preferences">
            <div className="space-y-1">
              {tutorNotifications.map((setting) => (
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
              <Button className="bg-blue-500 hover:bg-blue-600">Update Password</Button>
            </div>
          </SettingSection>

          {/* Teaching Settings */}
          <SettingSection icon={Users} title="Teaching Settings">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <div className="font-medium text-white mb-1">Direct Messaging</div>
                  <div className="text-sm text-gray-400">Allow students to send you direct messages</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <div className="font-medium text-white mb-1">Course Reviews</div>
                  <div className="text-sm text-gray-400">Show course ratings and reviews publicly</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between pb-4">
                <div>
                  <div className="font-medium text-white mb-1">Student Progress Tracking</div>
                  <div className="text-sm text-gray-400">Track and analyze student progress in your courses</div>
                </div>
                <Switch defaultChecked />
              </div>
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