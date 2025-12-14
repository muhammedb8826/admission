"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

type StudentProfileFormData = {
  // Page 1: Choose Term
  semester: string;
  programLevel: string;
  programType: string;
  
  // Page 2: Personal Info
  firstNameEn: string;
  firstNameAm: string;
  fatherNameEn: string;
  fatherNameAm: string;
  grandFatherNameEn: string;
  grandFatherNameAm: string;
  dateOfBirth: string;
  natioanalId: string;
  phoneNumber: string;
  emergencyPhoneNumber: string;
  maritalStatus: string;
  gender: string;
  residentialKebele: string;
  birthKebele: string;
  ptbcFullName: string;
  ptbcKebele: string;
  ptbcPhone: string;
  ptbcAltPhone: string;
  specialNeed: string;
  specialNeedDescription: string;
  birthCountry: string;
  birthRegion: string;
  birthZone: string;
  birthWoreda: string;
  residentialCountry: string;
  residentialRegion: string;
  residentialZone: string;
  residentialWoreda: string;
  ptbcCountry: string;
  ptbcRegion: string;
  ptbcZone: string;
  
  // Page 3: School Info (placeholder fields)
  previousSchool: string;
  graduationYear: string;
  gpa: string;
  
  // Page 4: Field of Study
  fieldOfStudy: string;
  preferredProgram: string;
  
  // Page 5: Payment
  paymentMethod: string;
  paymentReference: string;
  
  // Page 6: Required Docs
  documentsSubmitted: boolean;
};

const TOTAL_PAGES = 7;

export function StudentApplicationForm() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState<StudentProfileFormData>({
    semester: "",
    programLevel: "",
    programType: "",
    firstNameEn: "",
    firstNameAm: "",
    fatherNameEn: "",
    fatherNameAm: "",
    grandFatherNameEn: "",
    grandFatherNameAm: "",
    dateOfBirth: "",
    natioanalId: "",
    phoneNumber: "",
    emergencyPhoneNumber: "",
    maritalStatus: "",
    gender: "",
    residentialKebele: "",
    birthKebele: "",
    ptbcFullName: "",
    ptbcKebele: "",
    ptbcPhone: "",
    ptbcAltPhone: "",
    specialNeed: "",
    specialNeedDescription: "",
    birthCountry: "",
    birthRegion: "",
    birthZone: "",
    birthWoreda: "",
    residentialCountry: "",
    residentialRegion: "",
    residentialZone: "",
    residentialWoreda: "",
    ptbcCountry: "",
    ptbcRegion: "",
    ptbcZone: "",
    previousSchool: "",
    graduationYear: "",
    gpa: "",
    fieldOfStudy: "",
    preferredProgram: "",
    paymentMethod: "",
    paymentReference: "",
    documentsSubmitted: false,
  });

  const handleInputChange = (field: keyof StudentProfileFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentPage < TOTAL_PAGES) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/student-profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            ...formData,
            studentType: "undergraduate",
            applicationStatus: "pending",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to submit application" }));
        throw new Error(error.error || "Failed to submit application");
      }

      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPage1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Term</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please select your preferred semester, program level, and program type.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="semester">Semester <span className="text-destructive">*</span></Label>
          <Select
            value={formData.semester}
            onValueChange={(value) => handleInputChange("semester", value)}
          >
            <SelectTrigger id="semester" className="w-full">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Semester 1</SelectItem>
              <SelectItem value="2">Semester 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="programLevel">Program Level <span className="text-destructive">*</span></Label>
          <Select
            value={formData.programLevel}
            onValueChange={(value) => handleInputChange("programLevel", value)}
          >
            <SelectTrigger id="programLevel" className="w-full">
              <SelectValue placeholder="Select program level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Undergraduate(UG)">Undergraduate (UG)</SelectItem>
              <SelectItem value="Postgraduate(PG)">Postgraduate (PG)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="programType">Program Type <span className="text-destructive">*</span></Label>
          <Select
            value={formData.programType}
            onValueChange={(value) => handleInputChange("programType", value)}
          >
            <SelectTrigger id="programType" className="w-full">
              <SelectValue placeholder="Select program type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Regular">Regular</SelectItem>
              <SelectItem value="Extension">Extension</SelectItem>
              <SelectItem value="Distance">Distance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderPage2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please provide your personal details.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstNameEn">First Name (English) <span className="text-destructive">*</span></Label>
            <Input
              id="firstNameEn"
              value={formData.firstNameEn}
              onChange={(e) => handleInputChange("firstNameEn", e.target.value)}
              placeholder="Enter first name in English"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstNameAm">First Name (Amharic)</Label>
            <Input
              id="firstNameAm"
              value={formData.firstNameAm}
              onChange={(e) => handleInputChange("firstNameAm", e.target.value)}
              placeholder="Enter first name in Amharic"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fatherNameEn">Father's Name (English) <span className="text-destructive">*</span></Label>
            <Input
              id="fatherNameEn"
              value={formData.fatherNameEn}
              onChange={(e) => handleInputChange("fatherNameEn", e.target.value)}
              placeholder="Enter father's name in English"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatherNameAm">Father's Name (Amharic)</Label>
            <Input
              id="fatherNameAm"
              value={formData.fatherNameAm}
              onChange={(e) => handleInputChange("fatherNameAm", e.target.value)}
              placeholder="Enter father's name in Amharic"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="grandFatherNameEn">Grandfather's Name (English)</Label>
            <Input
              id="grandFatherNameEn"
              value={formData.grandFatherNameEn}
              onChange={(e) => handleInputChange("grandFatherNameEn", e.target.value)}
              placeholder="Enter grandfather's name in English"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grandFatherNameAm">Grandfather's Name (Amharic)</Label>
            <Input
              id="grandFatherNameAm"
              value={formData.grandFatherNameAm}
              onChange={(e) => handleInputChange("grandFatherNameAm", e.target.value)}
              placeholder="Enter grandfather's name in Amharic"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="natioanalId">National ID</Label>
            <Input
              id="natioanalId"
              value={formData.natioanalId}
              onChange={(e) => handleInputChange("natioanalId", e.target.value)}
              placeholder="Enter national ID"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number <span className="text-destructive">*</span></Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyPhoneNumber">Emergency Phone Number</Label>
            <Input
              id="emergencyPhoneNumber"
              value={formData.emergencyPhoneNumber}
              onChange={(e) => handleInputChange("emergencyPhoneNumber", e.target.value)}
              placeholder="Enter emergency phone number"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Marital Status</Label>
            <Select
              value={formData.maritalStatus}
              onValueChange={(value) => handleInputChange("maritalStatus", value)}
            >
              <SelectTrigger id="maritalStatus" className="w-full">
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
                <SelectItem value="Widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange("gender", value)}
            >
              <SelectTrigger id="gender" className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Birth Location</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="birthCountry">Country</Label>
              <Input
                id="birthCountry"
                value={formData.birthCountry}
                onChange={(e) => handleInputChange("birthCountry", e.target.value)}
                placeholder="Enter country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthRegion">Region</Label>
              <Input
                id="birthRegion"
                value={formData.birthRegion}
                onChange={(e) => handleInputChange("birthRegion", e.target.value)}
                placeholder="Enter region"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthZone">Zone</Label>
              <Input
                id="birthZone"
                value={formData.birthZone}
                onChange={(e) => handleInputChange("birthZone", e.target.value)}
                placeholder="Enter zone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthWoreda">Woreda</Label>
              <Input
                id="birthWoreda"
                value={formData.birthWoreda}
                onChange={(e) => handleInputChange("birthWoreda", e.target.value)}
                placeholder="Enter woreda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthKebele">Kebele</Label>
              <Input
                id="birthKebele"
                value={formData.birthKebele}
                onChange={(e) => handleInputChange("birthKebele", e.target.value)}
                placeholder="Enter kebele"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Residential Address</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="residentialCountry">Country</Label>
              <Input
                id="residentialCountry"
                value={formData.residentialCountry}
                onChange={(e) => handleInputChange("residentialCountry", e.target.value)}
                placeholder="Enter country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialRegion">Region</Label>
              <Input
                id="residentialRegion"
                value={formData.residentialRegion}
                onChange={(e) => handleInputChange("residentialRegion", e.target.value)}
                placeholder="Enter region"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialZone">Zone</Label>
              <Input
                id="residentialZone"
                value={formData.residentialZone}
                onChange={(e) => handleInputChange("residentialZone", e.target.value)}
                placeholder="Enter zone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialWoreda">Woreda</Label>
              <Input
                id="residentialWoreda"
                value={formData.residentialWoreda}
                onChange={(e) => handleInputChange("residentialWoreda", e.target.value)}
                placeholder="Enter woreda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialKebele">Kebele</Label>
              <Input
                id="residentialKebele"
                value={formData.residentialKebele}
                onChange={(e) => handleInputChange("residentialKebele", e.target.value)}
                placeholder="Enter kebele"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Parent/Guardian Information</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ptbcFullName">Full Name</Label>
              <Input
                id="ptbcFullName"
                value={formData.ptbcFullName}
                onChange={(e) => handleInputChange("ptbcFullName", e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcPhone">Phone Number</Label>
              <Input
                id="ptbcPhone"
                value={formData.ptbcPhone}
                onChange={(e) => handleInputChange("ptbcPhone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcAltPhone">Alternate Phone</Label>
              <Input
                id="ptbcAltPhone"
                value={formData.ptbcAltPhone}
                onChange={(e) => handleInputChange("ptbcAltPhone", e.target.value)}
                placeholder="Enter alternate phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcKebele">Kebele</Label>
              <Input
                id="ptbcKebele"
                value={formData.ptbcKebele}
                onChange={(e) => handleInputChange("ptbcKebele", e.target.value)}
                placeholder="Enter kebele"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcCountry">Country</Label>
              <Input
                id="ptbcCountry"
                value={formData.ptbcCountry}
                onChange={(e) => handleInputChange("ptbcCountry", e.target.value)}
                placeholder="Enter country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcRegion">Region</Label>
              <Input
                id="ptbcRegion"
                value={formData.ptbcRegion}
                onChange={(e) => handleInputChange("ptbcRegion", e.target.value)}
                placeholder="Enter region"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcZone">Zone</Label>
              <Input
                id="ptbcZone"
                value={formData.ptbcZone}
                onChange={(e) => handleInputChange("ptbcZone", e.target.value)}
                placeholder="Enter zone"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Special Needs</h4>
          <div className="space-y-2">
            <Label htmlFor="specialNeed">Do you have any special needs?</Label>
            <Select
              value={formData.specialNeed}
              onValueChange={(value) => handleInputChange("specialNeed", value)}
            >
              <SelectTrigger id="specialNeed" className="w-full">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.specialNeed === "Yes" && (
            <div className="space-y-2">
              <Label htmlFor="specialNeedDescription">Description</Label>
              <Input
                id="specialNeedDescription"
                value={formData.specialNeedDescription}
                onChange={(e) => handleInputChange("specialNeedDescription", e.target.value)}
                placeholder="Please describe your special needs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPage3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">School Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please provide your previous educational background.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="previousSchool">Previous School/Institution</Label>
          <Input
            id="previousSchool"
            value={formData.previousSchool}
            onChange={(e) => handleInputChange("previousSchool", e.target.value)}
            placeholder="Enter school/institution name"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input
              id="graduationYear"
              type="number"
              value={formData.graduationYear}
              onChange={(e) => handleInputChange("graduationYear", e.target.value)}
              placeholder="Enter graduation year"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gpa">GPA / CGPA</Label>
            <Input
              id="gpa"
              type="number"
              step="0.01"
              value={formData.gpa}
              onChange={(e) => handleInputChange("gpa", e.target.value)}
              placeholder="Enter GPA"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPage4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Field of Study</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please select your preferred field of study and program.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fieldOfStudy">Field of Study <span className="text-destructive">*</span></Label>
          <Select
            value={formData.fieldOfStudy}
            onValueChange={(value) => handleInputChange("fieldOfStudy", value)}
          >
            <SelectTrigger id="fieldOfStudy" className="w-full">
              <SelectValue placeholder="Select field of study" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Medicine">Medicine</SelectItem>
              <SelectItem value="Law">Law</SelectItem>
              <SelectItem value="Arts">Arts</SelectItem>
              <SelectItem value="Science">Science</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredProgram">Preferred Program <span className="text-destructive">*</span></Label>
          <Input
            id="preferredProgram"
            value={formData.preferredProgram}
            onChange={(e) => handleInputChange("preferredProgram", e.target.value)}
            placeholder="Enter preferred program"
          />
        </div>
      </div>
    </div>
  );

  const renderPage5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please provide your payment details.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method <span className="text-destructive">*</span></Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => handleInputChange("paymentMethod", value)}
          >
            <SelectTrigger id="paymentMethod" className="w-full">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Mobile Money">Mobile Money</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentReference">Payment Reference Number</Label>
          <Input
            id="paymentReference"
            value={formData.paymentReference}
            onChange={(e) => handleInputChange("paymentReference", e.target.value)}
            placeholder="Enter payment reference number"
          />
        </div>
      </div>
    </div>
  );

  const renderPage6 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Required Documents</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please confirm that you have submitted all required documents.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="documentsSubmitted"
            checked={formData.documentsSubmitted}
            onCheckedChange={(checked) => handleInputChange("documentsSubmitted", checked === true)}
          />
          <Label htmlFor="documentsSubmitted" className="font-normal cursor-pointer">
            I confirm that I have submitted all required documents
          </Label>
        </div>

        <div className="rounded-md border bg-muted/50 p-4">
          <p className="text-sm font-medium mb-2">Required Documents:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Academic transcripts</li>
            <li>Certificate of completion</li>
            <li>National ID copy</li>
            <li>Passport size photo</li>
            <li>Medical certificate</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderPage7 = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Review Your Application</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please review all the information you have provided. Click submit to finalize your application.
        </p>
      </div>

      {submitError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">Error</p>
          <p className="mt-1">{submitError}</p>
        </div>
      )}

      {submitSuccess && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <p className="font-medium">Success!</p>
          <p className="mt-1">Your application has been submitted successfully.</p>
        </div>
      )}

      <div className="rounded-md border bg-muted/50 p-4 space-y-2">
        <p className="text-sm font-medium">Summary:</p>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Semester:</strong> {formData.semester || "Not specified"}</p>
          <p><strong>Program Level:</strong> {formData.programLevel || "Not specified"}</p>
          <p><strong>Program Type:</strong> {formData.programType || "Not specified"}</p>
          <p><strong>Name:</strong> {formData.firstNameEn || "Not specified"}</p>
          <p><strong>Phone:</strong> {formData.phoneNumber || "Not specified"}</p>
        </div>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 1:
        return renderPage1();
      case 2:
        return renderPage2();
      case 3:
        return renderPage3();
      case 4:
        return renderPage4();
      case 5:
        return renderPage5();
      case 6:
        return renderPage6();
      case 7:
        return renderPage7();
      default:
        return null;
    }
  };

  const pageTitles = [
    "Choose Term",
    "Personal Information",
    "School Information",
    "Field of Study",
    "Payment",
    "Required Documents",
    "Confirmation",
  ];

  return (
    <div className="space-y-6 rounded-md border bg-background p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Student Application Form
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {currentPage} of {TOTAL_PAGES}: {pageTitles[currentPage - 1]}
        </p>
      </div>
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {pageTitles.map((title, index) => (
              <div key={index} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index + 1 < currentPage
                      ? "bg-primary text-primary-foreground"
                      : index + 1 === currentPage
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1 < currentPage ? "✓" : index + 1}
                </div>
                {index < pageTitles.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index + 1 < currentPage ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">{renderCurrentPage()}</div>

        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentPage < TOTAL_PAGES ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || submitSuccess}
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

