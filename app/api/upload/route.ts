import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getAuthFromHeader } from '@/lib/auth';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  const authHeader = request.headers.get("Authorization") || request.headers.get("x-auth-token");
  let userId = "anonymous";
  if (authHeader) {
    const authPayload = getAuthFromHeader(authHeader);
    if (authPayload) {
      userId = authPayload.userId;
    }
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Return allowed content types
        return {
          allowedContentTypes: ['application/pdf'],
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log(`Upload completed for blob URL: ${blob.url}`);
        // Optionally save to database if we wanted, but we'll do it from the client via /api/notebooks/[id]/sources
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
