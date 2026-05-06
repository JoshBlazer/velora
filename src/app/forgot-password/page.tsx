import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
    title: "Forgot Password",
    description: "Reset your Velora password via email.",
};

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />;
}
