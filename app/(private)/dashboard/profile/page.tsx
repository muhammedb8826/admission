import type React from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  IdCard,
  Building,
  GraduationCap,
  FileText
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStrapiURL } from "@/lib/strapi/client";
import Link from "next/link";

function getInitials(firstName: string, email: string): string {
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

async function getStudentProfile(email: string, userId: string) {
  try {
    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return null;
    }

    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    
    // Fetch all profiles and filter server-side by logged-in user
    // This ensures security - we only return data for the authenticated user
    const response = await fetch(
      `${strapiUrl}/api/student-profiles?populate=*`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    
    // Filter server-side to only return the logged-in user's profile
    type ProfileData = {
      email?: string;
      userId?: string;
      user?: {
        email?: string;
        id?: number;
      };
      [key: string]: unknown;
    };
    
    if (result?.data) {
      if (Array.isArray(result.data)) {
        // Find profile matching the logged-in user
        const userProfile = result.data.find((profile: ProfileData) => {
          if (profile.email === email) return true;
          if (profile.user?.email === email) return true;
          if (profile.userId === userId) return true;
          if (profile.user?.id === Number(userId)) return true;
          return false;
        });
        return userProfile || null;
      } else if (result.data) {
        // Single object - check if it belongs to the user
        const profile = result.data as ProfileData;
        if (
          profile.email === email ||
          profile.user?.email === email ||
          profile.userId === userId ||
          profile.user?.id === Number(userId)
        ) {
          return profile;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return null;
  }
}

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "approved":
    case "accepted":
      return (
        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
          Approved
        </Badge>
      );
    case "rejected":
    case "denied":
      return (
        <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
          Rejected
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
          Pending
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status || "Not Started"}
        </Badge>
      );
  }
}

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = {
    name: session.firstName || "User",
    email: session.email,
    avatar: "",
    initials: getInitials(session.firstName, session.email),
  };

  // Fetch student profile (API route handles filtering by logged-in user)
  const studentProfile = await getStudentProfile(session.email, session.userId);

  const hasApplication = !!studentProfile;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader title="Profile" />
        <div className="flex min-h-screen flex-col bg-muted/20">
          {/* Profile header */}
          <header className="flex items-center gap-4 border-b bg-background px-6 py-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-semibold text-primary/80">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{user.initials}</span>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-foreground">
                  {hasApplication && studentProfile.firstNameEn 
                    ? `${studentProfile.firstNameEn} ${studentProfile.fatherNameEn || ""} ${studentProfile.grandFatherNameEn || ""}`.trim()
                    : user.name}
                </h1>
                {hasApplication && getStatusBadge(studentProfile.applicationStatus)}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {!hasApplication && (
              <Button asChild>
                <Link href="/dashboard/application">
                  Start Application
                </Link>
              </Button>
            )}
          </header>

          {/* Main content */}
          <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
            {hasApplication ? (
              <>
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your personal details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Full Name (English)</p>
                            <p className="text-sm font-medium">
                              {studentProfile.firstNameEn || "Not provided"}
                              {studentProfile.fatherNameEn && ` ${studentProfile.fatherNameEn}`}
                              {studentProfile.grandFatherNameEn && ` ${studentProfile.grandFatherNameEn}`}
                            </p>
                          </div>
                        </div>

                        {studentProfile.firstNameAm && (
                          <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm text-muted-foreground">Full Name (Amharic)</p>
                              <p className="text-sm font-medium">
                                {studentProfile.firstNameAm}
                                {studentProfile.fatherNameAm && ` ${studentProfile.fatherNameAm}`}
                                {studentProfile.grandFatherNameAm && ` ${studentProfile.grandFatherNameAm}`}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Date of Birth</p>
                            <p className="text-sm font-medium">
                              {studentProfile.dateOfBirth 
                                ? new Date(studentProfile.dateOfBirth).toLocaleDateString()
                                : "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <IdCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">National ID</p>
                            <p className="text-sm font-medium">
                              {studentProfile.natioanalId || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Gender</p>
                            <p className="text-sm font-medium">
                              {studentProfile.gender || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Marital Status</p>
                            <p className="text-sm font-medium">
                              {studentProfile.maritalStatus || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">{user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Phone Number</p>
                            <p className="text-sm font-medium">
                              {studentProfile.phoneNumber || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Emergency Phone</p>
                            <p className="text-sm font-medium">
                              {studentProfile.emergencyPhoneNumber || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Birth Location</CardTitle>
                      <CardDescription>Place of birth details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="text-sm font-medium">
                              {[
                                typeof studentProfile.birthCountry === 'object' ? studentProfile.birthCountry?.name : studentProfile.birthCountry,
                                typeof studentProfile.birthRegion === 'object' ? studentProfile.birthRegion?.name : studentProfile.birthRegion,
                                typeof studentProfile.birthZone === 'object' ? studentProfile.birthZone?.name : studentProfile.birthZone,
                                typeof studentProfile.birthWoreda === 'object' ? studentProfile.birthWoreda?.name : studentProfile.birthWoreda,
                                studentProfile.birthKebele,
                              ].filter(Boolean).join(", ") || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Residential Address</CardTitle>
                      <CardDescription>Current residence</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="text-sm font-medium">
                              {[
                                typeof studentProfile.residentialCountry === 'object' ? studentProfile.residentialCountry?.name : studentProfile.residentialCountry,
                                typeof studentProfile.residentialRegion === 'object' ? studentProfile.residentialRegion?.name : studentProfile.residentialRegion,
                                typeof studentProfile.residentialZone === 'object' ? studentProfile.residentialZone?.name : studentProfile.residentialZone,
                                typeof studentProfile.residentialWoreda === 'object' ? studentProfile.residentialWoreda?.name : studentProfile.residentialWoreda,
                                studentProfile.residentialKebele,
                              ].filter(Boolean).join(", ") || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Application Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Application Information</CardTitle>
                    <CardDescription>Your admission application details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm text-muted-foreground">Program Level</p>
                          <p className="text-sm font-medium">
                            {studentProfile.programLevel || "Not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm text-muted-foreground">Program Type</p>
                          <p className="text-sm font-medium">
                            {studentProfile.programType || "Not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm text-muted-foreground">Semester</p>
                          <p className="text-sm font-medium">
                            {studentProfile.semester || "Not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm text-muted-foreground">Student Type</p>
                          <p className="text-sm font-medium">
                            {studentProfile.studentType || "Not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm text-muted-foreground">Application Date</p>
                          <p className="text-sm font-medium">
                            {studentProfile.createdAt 
                              ? new Date(studentProfile.createdAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <div>
                            {getStatusBadge(studentProfile.applicationStatus)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Parent/Guardian Information */}
                {studentProfile.ptbcFullName && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Parent/Guardian Information</CardTitle>
                      <CardDescription>Contact person details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm text-muted-foreground">Full Name</p>
                              <p className="text-sm font-medium">
                                {studentProfile.ptbcFullName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm text-muted-foreground">Phone Number</p>
                              <p className="text-sm font-medium">
                                {studentProfile.ptbcPhone || "Not provided"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm text-muted-foreground">Alternate Phone</p>
                              <p className="text-sm font-medium">
                                {studentProfile.ptbcAltPhone || "Not provided"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm text-muted-foreground">Address</p>
                              <p className="text-sm font-medium">
                                {[
                                  typeof studentProfile.ptbcCountry === 'object' ? studentProfile.ptbcCountry?.name : studentProfile.ptbcCountry,
                                  typeof studentProfile.ptbcRegion === 'object' ? studentProfile.ptbcRegion?.name : studentProfile.ptbcRegion,
                                  typeof studentProfile.ptbcZone === 'object' ? studentProfile.ptbcZone?.name : studentProfile.ptbcZone,
                                  studentProfile.ptbcKebele,
                                ].filter(Boolean).join(", ") || "Not provided"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Special Needs */}
                {studentProfile.specialNeed === "Yes" && studentProfile.specialNeedDescription && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Special Needs</CardTitle>
                      <CardDescription>Special accommodation requirements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{studentProfile.specialNeedDescription}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Profile Found</CardTitle>
                  <CardDescription>
                    You haven&apos;t created an application profile yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start your admission application to create your profile and view your information here.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/application">
                      Start Application
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

