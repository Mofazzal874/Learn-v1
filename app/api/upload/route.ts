import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadImage, uploadVideo } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { file, resourceType, folder } = body;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!['image', 'video'].includes(resourceType)) {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      );
    }

    let result;

    // Upload the file to Cloudinary using our existing helper functions
    if (resourceType === 'image') {
      result = await uploadImage(file, folder || 'courses/images');
    } else {
      result = await uploadVideo(file, folder || 'courses/videos');
    }

    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to upload file", message: (error as Error).message },
      { status: 500 }
    );
  }
}