"use client";

import { useState } from "react";
import type { RegistrationFormData, DropdownOption } from "../types/registration.types";

type RegistrationFormProps = {
  genderOptions: DropdownOption[];
  nationalityOptions: DropdownOption[];
  alumniCategoryOptions: DropdownOption[];
};

export function RegistrationForm({
  genderOptions,
  nationalityOptions,
  alumniCategoryOptions,
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: "",
    fatherName: "",
    grandFatherName: "",
    phoneNumber: "",
    email: "",
    birthDate: "",
    gender: "",
    nationality: "",
    alumniCategory: "",
    jobTitle: "",
    companyName: "",
    address: "",
    password: "",
    confirmPassword: "",
    supportDescription: "",
    supportFile: null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof RegistrationFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, supportFile: file }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof RegistrationFormData, string>> = {};

    // Personal Information validation
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.fatherName.trim()) newErrors.fatherName = "Father name is required";
    if (!formData.grandFatherName.trim()) newErrors.grandFatherName = "Grand father name is required";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.birthDate) newErrors.birthDate = "Birth date is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.nationality) newErrors.nationality = "Nationality is required";

    // Alumni Category validation
    if (!formData.alumniCategory) newErrors.alumniCategory = "Alumni category is required";

    // Employment Information validation
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job title is required";
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";

    // Account Details validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Support validation
    if (!formData.supportDescription.trim()) {
      newErrors.supportDescription = "Please describe how you can support us";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "supportFile" && value instanceof File) {
          submitData.append(key, value);
        } else if (key === "confirmPassword") {
          // Don't send confirmPassword to server
          return;
        } else if (value !== null && value !== undefined) {
          submitData.append(key, String(value));
        }
      });

      const response = await fetch("/api/register", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      // Handle success with toast
      setToast({
        type: "success",
        message: "Registration submitted successfully! We'll be in touch soon.",
      });
      // Auto-hide after a few seconds
      setTimeout(() => {
        setToast(null);
      }, 5000);

      // Reset form
      setFormData({
        firstName: "",
        fatherName: "",
        grandFatherName: "",
        phoneNumber: "",
        email: "",
        birthDate: "",
        gender: "",
        nationality: "",
        alumniCategory: "",
        jobTitle: "",
        companyName: "",
        address: "",
        password: "",
        confirmPassword: "",
        supportDescription: "",
        supportFile: null,
      });
    } catch (error) {
      console.error("Registration error:", error);
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.",
      });
      setTimeout(() => {
        setToast(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg transition
          ${
            toast.type === "success"
              ? "border-emerald-500 bg-emerald-600 text-white"
              : "border-destructive/80 bg-destructive text-destructive-foreground"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 font-semibold">
              {toast.type === "success" ? "Success" : "Error"}
            </span>
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-xs underline hover:opacity-80"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground border-b-2 border-primary pb-2">
          Personal Information
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-1">
              First Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.firstName && (
              <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="fatherName" className="block text-sm font-medium mb-1">
              Father Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="fatherName"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.fatherName && (
              <p className="text-xs text-destructive mt-1">{errors.fatherName}</p>
            )}
          </div>

          <div>
            <label htmlFor="grandFatherName" className="block text-sm font-medium mb-1">
              Grand Father Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="grandFatherName"
              name="grandFatherName"
              value={formData.grandFatherName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.grandFatherName && (
              <p className="text-xs text-destructive mt-1">{errors.grandFatherName}</p>
            )}
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.phoneNumber && (
              <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium mb-1">
              Birth Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.birthDate && (
              <p className="text-xs text-destructive mt-1">{errors.birthDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium mb-1">
              Gender <span className="text-destructive">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select Gender</option>
              {genderOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.gender && (
              <p className="text-xs text-destructive mt-1">{errors.gender}</p>
            )}
          </div>

          <div>
            <label htmlFor="nationality" className="block text-sm font-medium mb-1">
              Nationality <span className="text-destructive">*</span>
            </label>
            <select
              id="nationality"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select Nationality</option>
              {nationalityOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.nationality && (
              <p className="text-xs text-destructive mt-1">{errors.nationality}</p>
            )}
          </div>
        </div>
      </section>

      {/* Alumni Category */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground border-b-2 border-primary pb-2">
          Alumni Category
        </h2>
        <div>
          <label htmlFor="alumniCategory" className="block text-sm font-medium mb-1">
            Category <span className="text-destructive">*</span>
          </label>
          <select
            id="alumniCategory"
            name="alumniCategory"
            value={formData.alumniCategory}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select Category</option>
            {alumniCategoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.alumniCategory && (
            <p className="text-xs text-destructive mt-1">{errors.alumniCategory}</p>
          )}
        </div>
      </section>

      {/* Employment Information */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground border-b-2 border-primary pb-2">
          Employment Information
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium mb-1">
              Job Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.jobTitle && (
              <p className="text-xs text-destructive mt-1">{errors.jobTitle}</p>
            )}
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium mb-1">
              Company Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.companyName && (
              <p className="text-xs text-destructive mt-1">{errors.companyName}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium mb-1">
              Address <span className="text-destructive">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.address && (
              <p className="text-xs text-destructive mt-1">{errors.address}</p>
            )}
          </div>
        </div>
      </section>

      {/* Account Details */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground border-b-2 border-primary pb-2">
          Account Details
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password <span className="text-destructive">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.password && (
              <p className="text-xs text-destructive mt-1">{errors.password}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirm Password <span className="text-destructive">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      </section>

      {/* How can you support us? */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground border-b-2 border-primary pb-2">
          How can you support us?
        </h2>
        <div>
          <label htmlFor="supportDescription" className="block text-sm font-medium mb-1">
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            id="supportDescription"
            name="supportDescription"
            value={formData.supportDescription}
            onChange={handleChange}
            rows={5}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Please describe how you can support our alumni community..."
            required
          />
          {errors.supportDescription && (
            <p className="text-xs text-destructive mt-1">{errors.supportDescription}</p>
          )}
        </div>

        <div>
          <label htmlFor="supportFile" className="block text-sm font-medium mb-1">
            File Attachment (Optional)
          </label>
          <input
            type="file"
            id="supportFile"
            name="supportFile"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          {formData.supportFile && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected: {formData.supportFile.name}
            </p>
          )}
        </div>
      </section>

      {/* Submit Button */}
      <div className="pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>
      </div>
    </form>
    </>
  );
}

