import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";
import { hashPassword } from "../src/lib/password";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = hashPassword("1234");

async function main() {
  console.log("🌱 Seeding database...");

  // ── Preserve existing data, only upsert accounts ──────────────────────────

  // ── Original demo account (phet_stu) ──
  await prisma.user.upsert({
    where: { id: "phet_stu" },
    update: { passwordHash: DEFAULT_PASSWORD },
    create: {
      id: "phet_stu",
      email: "phet_stu@cmu.ac.th",
      role: "STUDENT",
      hasAcceptedToS: true,
      passwordHash: DEFAULT_PASSWORD,
      profile: {
        create: {
          title: "นาย",
          firstName: "ภฤศ",
          lastName: "วุฒิพัฒน์ธินลวง",
          gender: "ชาย",
          dateOfBirth: new Date("2003-05-15"),
          phone: "0812345678",
          address: "123 ถ.ห้วยแก้ว ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200",
          parentPhone: "0898765432",
          educationLevel: "ปริญญาตรี",
          institution: "มหาวิทยาลัยเชียงใหม่",
          faculty: "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี",
          major: "วิศวกรรมซอฟต์แวร์",
          coopAdvisorName: "ผศ.ดร. สมศักดิ์ แสงทอง",
          advisorPhone: "053942000",
        },
      },
    },
  });

  // ── Original demo admin (phet_admin) ──
  await prisma.user.upsert({
    where: { id: "phet_admin" },
    update: { passwordHash: DEFAULT_PASSWORD },
    create: {
      id: "phet_admin",
      email: "phet_admin@cmu.ac.th",
      role: "ADMIN",
      hasAcceptedToS: true,
      passwordHash: DEFAULT_PASSWORD,
    },
  });

  // ── New student accounts (no profile — they will fill it in themselves) ──
  const newStudents = [
    { id: "pstu1", email: "pstu1@cmu.ac.th" },
    { id: "pstu2", email: "pstu2@cmu.ac.th" },
    { id: "pstu3", email: "pstu3@cmu.ac.th" },
  ];

  for (const s of newStudents) {
    await prisma.user.upsert({
      where: { id: s.id },
      update: { passwordHash: DEFAULT_PASSWORD },
      create: {
        id: s.id,
        email: s.email,
        role: "STUDENT",
        hasAcceptedToS: false, // จะต้องยืนยัน ToS เมื่อ login ครั้งแรก
        passwordHash: DEFAULT_PASSWORD,
      },
    });
    console.log(`✅ Upserted student: ${s.email}`);
  }

  // ── New admin accounts ──
  const newAdmins = [
    { id: "padmin1", email: "padmin1@cmu.ac.th" },
    { id: "padmin2", email: "padmin2@cmu.ac.th" },
  ];

  for (const a of newAdmins) {
    await prisma.user.upsert({
      where: { id: a.id },
      update: { passwordHash: DEFAULT_PASSWORD },
      create: {
        id: a.id,
        email: a.email,
        role: "ADMIN",
        hasAcceptedToS: true,
        passwordHash: DEFAULT_PASSWORD,
      },
    });
    console.log(`✅ Upserted admin:   ${a.email}`);
  }

  console.log("\n🔑 All accounts use password: 1234");
  console.log("🎉 Seeding completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
