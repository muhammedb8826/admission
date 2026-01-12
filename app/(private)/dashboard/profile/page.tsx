
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

import { getSession } from "@/lib/auth/session";
import { getStrapiURL } from "@/lib/strapi/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function getInitials(firstName: string, email: string): string {
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

async function getStudentProfile(userId: string) {
  try {
    const strapiUrl = getStrapiURL();
    if (!strapiUrl) {
      return null;
    }

    const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
    
    // Fetch profile with all nested data, filtered by user ID
    const response = await fetch(
      `${strapiUrl}/api/student-profiles?populate[residentialAddress][populate]=*&populate[birthAddress][populate]=*&populate[personToBeContacted][populate]=*&populate[primary_education][populate]=*&populate[secondary_education][populate]=*&populate[tertiary_educations][populate]=*&filters[user][id][$eq]=${userId}`,
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
    
    // Return the first profile (should only be one due to filter)
    if (result?.data) {
      if (Array.isArray(result.data)) {
        return result.data[0] || null;
      }
      return result.data;
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

  // Fetch student profile filtered by logged-in user
  const studentProfile = await getStudentProfile(session.userId);

  const hasApplication = !!studentProfile;
  const isProfileComplete = studentProfile?.isProfileComplete === true;

  return (
    
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
            <div className="flex items-center gap-2">
              {hasApplication && !isProfileComplete && (
                <Button asChild variant="default">
                  <Link href="/dashboard/profile/complete">
                    Complete Profile
                  </Link>
                </Button>
              )}
              {hasApplication && isProfileComplete && (
                <Button asChild variant="outline">
                  <Link href="/dashboard/profile/complete">
                    Edit Profile
                  </Link>
                </Button>
              )}
              {!hasApplication && (
                <Button asChild>
                  <Link href="/dashboard/application">
                    Start Application
                  </Link>
                </Button>
              )}
            </div>
          </header>

          {/* Main content */}
          <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8">
            {hasApplication && !isProfileComplete && (
              <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                <CardHeader>
                  <CardTitle className="text-yellow-800 dark:text-yellow-200">
                    Profile Incomplete
                  </CardTitle>
                  <CardDescription className="text-yellow-700 dark:text-yellow-300">
                    Your profile is not yet complete. Please complete your profile to continue.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/dashboard/profile/complete">
                      Complete Your Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
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
                              {studentProfile.birthAddress?.dateOfBirth 
                                ? new Date(studentProfile.birthAddress.dateOfBirth).toLocaleDateString()
                                : "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <IdCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">National ID</p>
                            {studentProfile.birthAddress?.natioanalId ? (
                              typeof studentProfile.birthAddress.natioanalId === 'object' && studentProfile.birthAddress.natioanalId?.url ? (
                                <div className="mt-2">
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}${studentProfile.birthAddress.natioanalId.url}`}
                                    alt="National ID"
                                    width={200}
                                    height={150}
                                    className="border rounded object-contain"
                                  />
                                </div>
                              ) : (
                                <p className="text-sm font-medium">Uploaded</p>
                              )
                            ) : (
                              <p className="text-sm font-medium">Not provided</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Gender</p>
                            <p className="text-sm font-medium">
                              {studentProfile.birthAddress?.gender || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Marital Status</p>
                            <p className="text-sm font-medium">
                              {studentProfile.birthAddress?.maritalStatus || "Not provided"}
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
                              {studentProfile.birthAddress?.phoneNumber || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Emergency Phone</p>
                            <p className="text-sm font-medium">
                              {studentProfile.birthAddress?.emergencyPhoneNumber || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-muted-foreground">Email Address</p>
                            <p className="text-sm font-medium">
                              {studentProfile.birthAddress?.emailAddress || "Not provided"}
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
                              {studentProfile.birthAddress ? [
                                studentProfile.birthAddress.country?.name,
                                studentProfile.birthAddress.region?.name,
                                studentProfile.birthAddress.zone?.name,
                                studentProfile.birthAddress.woreda?.name,
                                studentProfile.birthAddress.kebele,
                              ].filter(Boolean).join(", ") || "Not provided" : "Not provided"}
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
                              {studentProfile.residentialAddress ? [
                                studentProfile.residentialAddress.country?.name,
                                studentProfile.residentialAddress.region?.name,
                                studentProfile.residentialAddress.zone?.name,
                                studentProfile.residentialAddress.woreda?.name,
                                studentProfile.residentialAddress.kebele,
                                studentProfile.residentialAddress.houseNumber,
                              ].filter(Boolean).join(", ") || "Not provided" : "Not provided"}
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

                {/* Person to be Contacted */}
                {studentProfile.personToBeContacted?.fullName && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Person to be Contacted</CardTitle>
                      <CardDescription>Emergency contact person details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm text-muted-foreground">Full Name</p>
                              <p className="text-sm font-medium">
                                {studentProfile.personToBeContacted.fullName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm text-muted-foreground">Phone Number</p>
                              <p className="text-sm font-medium">
                                {studentProfile.personToBeContacted.phoneNumber || "Not provided"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm text-muted-foreground">Alternate Phone</p>
                              <p className="text-sm font-medium">
                                {studentProfile.personToBeContacted.altPhoneNumber || "Not provided"}
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
                                  studentProfile.personToBeContacted.country?.name,
                                  studentProfile.personToBeContacted.region?.name,
                                  studentProfile.personToBeContacted.zone?.name,
                                  studentProfile.personToBeContacted.woreda?.name,
                                  studentProfile.personToBeContacted.kebele,
                                ].filter(Boolean).join(", ") || "Not provided"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Education Information */}
                {(studentProfile.primary_education || studentProfile.secondary_education || studentProfile.tertiary_educations?.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Education Information</CardTitle>
                      <CardDescription>Your educational background</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Primary Education */}
                        {studentProfile.primary_education && (
                          <div className="border-b pb-4 last:border-0 last:pb-0">
                            <h4 className="font-semibold mb-3">Primary Education</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="flex items-start gap-3">
                                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm text-muted-foreground">School Name</p>
                                  <p className="text-sm font-medium">
                                    {studentProfile.primary_education.schoolName || "Not provided"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm text-muted-foreground">Years</p>
                                  <p className="text-sm font-medium">
                                    {studentProfile.primary_education.yearStarted && studentProfile.primary_education.yearCompleted
                                      ? `${studentProfile.primary_education.yearStarted} - ${studentProfile.primary_education.yearCompleted}`
                                      : "Not provided"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm text-muted-foreground">Location</p>
                                  <p className="text-sm font-medium">
                                    {[
                                      studentProfile.primary_education.country?.name,
                                      studentProfile.primary_education.region?.name,
                                      studentProfile.primary_education.zone?.name,
                                      studentProfile.primary_education.woreda?.name,
                                    ].filter(Boolean).join(", ") || "Not provided"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Secondary Education */}
                        {studentProfile.secondary_education && (
                          <div className="border-b pb-4 last:border-0 last:pb-0">
                            <h4 className="font-semibold mb-3">Secondary Education</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="flex items-start gap-3">
                                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm text-muted-foreground">School Name</p>
                                  <p className="text-sm font-medium">
                                    {studentProfile.secondary_education.schoolName || "Not provided"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm text-muted-foreground">Stream</p>
                                  <p className="text-sm font-medium">
                                    {studentProfile.secondary_education.stream || "Not provided"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm text-muted-foreground">Years</p>
                                  <p className="text-sm font-medium">
                                    {studentProfile.secondary_education.yearStarted && studentProfile.secondary_education.yearCompleted
                                      ? `${studentProfile.secondary_education.yearStarted} - ${studentProfile.secondary_education.yearCompleted}`
                                      : "Not provided"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm text-muted-foreground">Location</p>
                                  <p className="text-sm font-medium">
                                    {[
                                      studentProfile.secondary_education.country?.name,
                                      studentProfile.secondary_education.region?.name,
                                      studentProfile.secondary_education.zone?.name,
                                      studentProfile.secondary_education.woreda?.name,
                                    ].filter(Boolean).join(", ") || "Not provided"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Tertiary Education */}
                        {studentProfile.tertiary_educations && studentProfile.tertiary_educations.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3">Tertiary Education</h4>
                            <div className="space-y-4">
                              {studentProfile.tertiary_educations.map((tertiary: {
                                institution?: string;
                                fieldOfStudy?: string;
                                gpaScore?: number;
                                yearStarted?: number;
                                yearCompleted?: number;
                                country?: { name?: string };
                                region?: { name?: string };
                                zone?: { name?: string };
                                woreda?: { name?: string };
                              }, index: number) => (
                                <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex items-start gap-3">
                                      <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1 space-y-1">
                                        <p className="text-sm text-muted-foreground">Institution</p>
                                        <p className="text-sm font-medium">
                                          {tertiary.institution || "Not provided"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1 space-y-1">
                                        <p className="text-sm text-muted-foreground">Field of Study</p>
                                        <p className="text-sm font-medium">
                                          {tertiary.fieldOfStudy || "Not provided"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1 space-y-1">
                                        <p className="text-sm text-muted-foreground">GPA Score</p>
                                        <p className="text-sm font-medium">
                                          {tertiary.gpaScore || "Not provided"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1 space-y-1">
                                        <p className="text-sm text-muted-foreground">Years</p>
                                        <p className="text-sm font-medium">
                                          {tertiary.yearStarted && tertiary.yearCompleted
                                            ? `${tertiary.yearStarted} - ${tertiary.yearCompleted}`
                                            : "Not provided"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1 space-y-1">
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="text-sm font-medium">
                                          {[
                                            tertiary.country?.name,
                                            tertiary.region?.name,
                                            tertiary.zone?.name,
                                            tertiary.woreda?.name,
                                          ].filter(Boolean).join(", ") || "Not provided"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Special Needs */}
                {studentProfile.specialNeed && studentProfile.specialNeedDescription && (
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
  );
}

