import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = {
    title: "Account Settings",
    description: "Manage your Velora profile and account.",
};

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, image: true, password: true },
    });

    if (!user) redirect("/login");

    return (
        <SettingsClient
            initialName={user.name ?? ""}
            initialImage={user.image ?? ""}
            email={user.email}
            hasPassword={!!user.password}
        />
    );
}
