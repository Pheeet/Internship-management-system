import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * MIME type lookup helper.
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimeMap[ext] || "application/octet-stream";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  // 1. Mandatory Log at very start
  console.log(">>>> API OPTIONAL CATCH-ALL HIT <<<<");

  try {
    // 2. Await params (Next.js 15 Requirement)
    const { slug } = await params;

    // Check if we have both type and filename
    if (!slug || slug.length < 2) {
      console.log("ERROR: Missing path segments", slug);
      return new NextResponse("Invalid file path structure", { status: 400 });
    }

    // 3. Decode segments (Thai characters support)
    const type = decodeURIComponent(slug[0]);
    const filename = decodeURIComponent(slug[1]);

    console.log("---- API_STORAGE_DEBUG (slug) ----");
    console.log("Type:", type);
    console.log("Filename:", filename);

    const storageRoot = path.join(process.cwd(), "storage", "uploads");
    const filePath = path.join(storageRoot, type, filename);

    console.log("Resolved Disk Path:", filePath);

    if (!fs.existsSync(filePath)) {
      console.log("FILE NOT FOUND ON DISK:", filePath);
      return new NextResponse(`File ${filename} not found in ${type}`, { status: 404 });
    }

    // 4. Read and serve
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = getMimeType(filename);

    console.log("SUCCESS: Serving", filename, "as", contentType);
    console.log("---------------------------------------");

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`
      },
    });
  } catch (error) {
    console.error("CRITICAL API ERROR:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
