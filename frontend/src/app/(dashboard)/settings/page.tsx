'use client';

import { useState } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsListUnderlined,
  TabsTriggerUnderlined,
} from '@/components/ui/tabs';
import { UserAvatar } from '@/components/ui/avatar';
import {
  User,
  Building2,
  CreditCard,
  Palette,
  Upload,
  Check,
  AlertCircle,
  Zap,
  FileText,
  Users,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const [saving, setSaving] = useState(false);

  // Firm settings state
  const [firmSettings, setFirmSettings] = useState({
    name: 'Johnson & Associates Law Firm',
    address: '123 Legal Street, Suite 500',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90001',
    phone: '(555) 123-4567',
    email: 'contact@johnsonlaw.com',
    website: 'www.johnsonlaw.com',
    primaryColor: '#1F5FE6',
    letterheadText: '',
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success('Settings saved successfully');
  };

  if (!userLoaded) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage your account and preferences" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Settings"
        description="Manage your account, firm settings, and billing"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsListUnderlined>
          <TabsTriggerUnderlined value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTriggerUnderlined>
          <TabsTriggerUnderlined value="firm" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Firm Settings
          </TabsTriggerUnderlined>
          <TabsTriggerUnderlined value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTriggerUnderlined>
        </TabsListUnderlined>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Your personal information from your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <UserAvatar
                  name={user?.fullName || 'User'}
                  imageUrl={user?.imageUrl}
                  size="xl"
                />
                <div>
                  <h3 className="text-lg font-semibold">{user?.fullName}</h3>
                  <p className="text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Attorney
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={user?.firstName || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={user?.lastName || ''} disabled />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Email</Label>
                  <Input
                    value={user?.primaryEmailAddress?.emailAddress || ''}
                    disabled
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => user?.update({})}>
                  Manage Account in Clerk
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Choose what notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  title: 'Document Processing Complete',
                  description: 'Get notified when documents finish processing',
                  enabled: true,
                },
                {
                  title: 'Generation Complete',
                  description: 'Get notified when letter generation completes',
                  enabled: true,
                },
                {
                  title: 'Weekly Summary',
                  description: 'Receive a weekly summary of your cases',
                  enabled: false,
                },
              ].map((notification, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                  </div>
                  <Button
                    variant={notification.enabled ? 'default' : 'outline'}
                    size="sm"
                  >
                    {notification.enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Firm Settings Tab */}
        <TabsContent value="firm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Firm Information</CardTitle>
              <CardDescription>
                This information appears on generated documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Firm Name</Label>
                  <Input
                    value={firmSettings.name}
                    onChange={(e) =>
                      setFirmSettings((prev) => ({ ...prev, name: e.target.value }))
                    }
                    leftIcon={<Building2 className="h-4 w-4" />}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Street Address</Label>
                  <Input
                    value={firmSettings.address}
                    onChange={(e) =>
                      setFirmSettings((prev) => ({ ...prev, address: e.target.value }))
                    }
                    leftIcon={<MapPin className="h-4 w-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={firmSettings.city}
                    onChange={(e) =>
                      setFirmSettings((prev) => ({ ...prev, city: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={firmSettings.state}
                      onChange={(e) =>
                        setFirmSettings((prev) => ({ ...prev, state: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ZIP</Label>
                    <Input
                      value={firmSettings.zip}
                      onChange={(e) =>
                        setFirmSettings((prev) => ({ ...prev, zip: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={firmSettings.phone}
                    onChange={(e) =>
                      setFirmSettings((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    leftIcon={<Phone className="h-4 w-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={firmSettings.email}
                    onChange={(e) =>
                      setFirmSettings((prev) => ({ ...prev, email: e.target.value }))
                    }
                    leftIcon={<Mail className="h-4 w-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>
                Customize how your firm appears on documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Firm Logo</p>
                  <p className="text-sm text-muted-foreground">
                    Upload your firm logo for letterheads
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Upload Logo
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg border"
                    style={{ backgroundColor: firmSettings.primaryColor }}
                  />
                  <Input
                    value={firmSettings.primaryColor}
                    onChange={(e) =>
                      setFirmSettings((prev) => ({
                        ...prev,
                        primaryColor: e.target.value,
                      }))
                    }
                    className="w-32"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Letterhead Text</Label>
                <Textarea
                  placeholder="Custom text to appear on your letterhead..."
                  value={firmSettings.letterheadText}
                  onChange={(e) =>
                    setFirmSettings((prev) => ({
                      ...prev,
                      letterheadText: e.target.value,
                    }))
                  }
                  showCount
                  maxLength={500}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">Professional Plan</h3>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      $999/month • Billed monthly
                    </p>
                  </div>
                </div>
                <Button variant="outline">Manage Subscription</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
              <CardDescription>Your usage resets on the 1st of each month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  label: 'Cases Created',
                  used: 12,
                  limit: 50,
                  icon: FileText,
                },
                {
                  label: 'Documents Processed',
                  used: 145,
                  limit: 500,
                  icon: FileText,
                },
                {
                  label: 'Letters Generated',
                  used: 28,
                  limit: 100,
                  icon: Zap,
                },
                {
                  label: 'Team Members',
                  used: 3,
                  limit: 10,
                  icon: Users,
                },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">
                      {item.used} / {item.limit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(item.used / item.limit) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: 'Jan 1, 2026', amount: '$999.00', status: 'Paid' },
                  { date: 'Dec 1, 2025', amount: '$999.00', status: 'Paid' },
                  { date: 'Nov 1, 2025', amount: '$999.00', status: 'Paid' },
                ].map((invoice, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.date}</p>
                        <p className="text-sm text-muted-foreground">
                          Professional Plan
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{invoice.amount}</span>
                      <Badge variant="success" size="sm">
                        <Check className="mr-1 h-3 w-3" />
                        {invoice.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
