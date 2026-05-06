import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
    title: "Create Account",
    description: "Sign up for Velora and start organizing your creative projects.",
};

export default function SignupPage() {
    return <SignupForm />;
}
