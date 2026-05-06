import { PrismaClient, Priority } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding Velora database...");

    // Clean existing data (in reverse order of dependencies)
    await prisma.task.deleteMany();
    await prisma.column.deleteMany();
    await prisma.board.deleteMany();
    await prisma.user.deleteMany();

    console.log("✓ Cleared existing data");

    // Create demo user
    const demoUser = await prisma.user.create({
        data: {
            email: "maya@velora.studio",
            name: "Maya Chen",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
        },
    });

    console.log("✓ Created demo user:", demoUser.name);

    // Create board with Velora gradient
    const designSprintBoard = await prisma.board.create({
        data: {
            title: "Velora Design Sprint",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
            userId: demoUser.id,
        },
    });

    console.log("✓ Created board:", designSprintBoard.title);

    // Create columns
    const columns = await Promise.all([
        prisma.column.create({
            data: {
                title: "To Do",
                order: 0,
                boardId: designSprintBoard.id,
            },
        }),
        prisma.column.create({
            data: {
                title: "In Progress",
                order: 1,
                boardId: designSprintBoard.id,
            },
        }),
        prisma.column.create({
            data: {
                title: "Done",
                order: 2,
                boardId: designSprintBoard.id,
            },
        }),
    ]);

    const [todoColumn, inProgressColumn, doneColumn] = columns;
    console.log("✓ Created columns:", columns.map((c) => c.title).join(", "));

    // Create sample tasks - Creative studio work
    const tasks = await Promise.all([
        // To Do tasks
        prisma.task.create({
            data: {
                content: "Finalize Moodboard for Q2 Campaign",
                priority: Priority.HIGH,
                order: 0,
                columnId: todoColumn.id,
            },
        }),
        prisma.task.create({
            data: {
                content: "Export SVG Icons for Design System",
                priority: Priority.MEDIUM,
                order: 1,
                columnId: todoColumn.id,
            },
        }),

        // In Progress tasks
        prisma.task.create({
            data: {
                content: "Client Review: Brand Guidelines v2",
                priority: Priority.HIGH,
                order: 0,
                columnId: inProgressColumn.id,
            },
        }),
        prisma.task.create({
            data: {
                content: "Animate Hero Section Prototype",
                priority: Priority.MEDIUM,
                order: 1,
                columnId: inProgressColumn.id,
            },
        }),

        // Done task
        prisma.task.create({
            data: {
                content: "Typography Scale Documentation",
                priority: Priority.LOW,
                order: 0,
                columnId: doneColumn.id,
            },
        }),
    ]);

    console.log("✓ Created tasks:", tasks.length);

    console.log("\n✨ Seeding complete!");
    console.log("   Demo user email:", demoUser.email);
    console.log("   Board:", designSprintBoard.title);
    console.log("   Columns:", columns.length);
    console.log("   Tasks:", tasks.length);
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
