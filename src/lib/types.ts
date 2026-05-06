import { Priority, BoardRole, ActivityType } from "@prisma/client";

export interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Label {
    id: string;
    name: string;
    color: string;
    boardId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Board {
    id: string;
    title: string;
    background: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    user?: User;
    columns?: Column[];
    labels: Label[];
}

export interface Column {
    id: string;
    title: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    boardId: string;
    tasks?: Task[];
}

export interface Task {
    id: string;
    content: string;
    priority: Priority;
    dueDate: Date | null;
    reminderSentAt?: Date | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    columnId: string;
    labels: Label[];
}

export interface BoardMember {
    id: string;
    boardId: string;
    userId: string;
    role: BoardRole;
    createdAt: Date;
    user?: Pick<User, "id" | "name" | "email" | "image">;
}

export interface Activity {
    id: string;
    boardId: string;
    userId: string;
    type: ActivityType;
    meta: Record<string, unknown>;
    createdAt: Date;
    user?: Pick<User, "id" | "name" | "image">;
}

export interface BoardWithColumns extends Board {
    columns: ColumnWithTasks[];
    labels: Label[];
}

export interface ColumnWithTasks extends Column {
    tasks: Task[];
}

export interface CreateTaskPayload {
    content: string;
    priority?: Priority;
    columnId: string;
    dueDate?: string | null;
}

export interface UpdateTaskPayload {
    id: string;
    content?: string;
    priority?: Priority;
    dueDate?: string | null;
}

export interface MoveTaskPayload {
    taskId: string;
    targetColumnId: string;
    newOrder: number;
}

export const priorityColors = {
    LOW: {
        bg: "bg-velora-cyan/20",
        text: "text-velora-cyan",
        border: "border-velora-cyan/30",
    },
    MEDIUM: {
        bg: "bg-velora-pink/20",
        text: "text-velora-pink",
        border: "border-velora-pink/30",
    },
    HIGH: {
        bg: "bg-velora-purple/20",
        text: "text-velora-purple",
        border: "border-velora-purple/30",
    },
} as const;

export const BOARD_BACKGROUNDS = [
    { label: "Default", value: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" },
    { label: "Ocean", value: "linear-gradient(135deg, #0c1a45 0%, #0f3460 50%, #0c2940 100%)" },
    { label: "Forest", value: "linear-gradient(135deg, #0a1a0d 0%, #1a3a1f 50%, #0f2a0a 100%)" },
    { label: "Nebula", value: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4d 50%, #1a0f3a 100%)" },
    { label: "Ember", value: "linear-gradient(135deg, #1a0a00 0%, #3d1500 50%, #1a0800 100%)" },
    { label: "Steel", value: "linear-gradient(135deg, #0a1520 0%, #1a2d3d 50%, #0d1e2a 100%)" },
    { label: "Midnight", value: "linear-gradient(135deg, #050508 0%, #0d0d15 50%, #08080f 100%)" },
    { label: "Rose", value: "linear-gradient(135deg, #1a0a12 0%, #3d1525 50%, #1a0a15 100%)" },
] as const;

export const LABEL_COLORS = [
    "#22d3ee",
    "#f472b6",
    "#a78bfa",
    "#34d399",
    "#fb923c",
    "#f87171",
    "#facc15",
    "#60a5fa",
] as const;
