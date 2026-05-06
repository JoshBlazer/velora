import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Velora",
        short_name: "Velora",
        description: "Visual kanban for creative workflows",
        start_url: "/boards",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#22d3ee",
        icons: [
            {
                src: "/icons/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "maskable",
            },
        ],
    };
}
