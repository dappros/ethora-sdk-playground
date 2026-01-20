/**
 * API route for user operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSDKInstance } from '@/lib/sdk';
import { validateUserData, validateFileUploads } from '@/lib/user-validation';

export async function POST(request: NextRequest) {
  try {
    // Check if request is FormData (for file uploads) or JSON
    const contentType = request.headers.get("content-type") || "";
    let body: any = {};
    let files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const userId = formData.get("userId") as string;
      const userDataJson = formData.get("userData") as string;
      
      body = {
        userId,
        userData: userDataJson ? JSON.parse(userDataJson) : {},
      };

      // Extract files from FormData
      const fileEntries = Array.from(formData.entries()).filter(
        ([key]) => key.startsWith("file_")
      );
      files = fileEntries.map(([, value]) => value as File);
    } else {
      body = await request.json();
    }

    const { userId, userData } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate user data
    if (userData) {
      const validation = validateUserData(userData);
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Validation error: ${validation.error}` },
          { status: 400 }
        );
      }

      // Validate file uploads if files are provided
      if (files.length > 0) {
        const fileValidation = validateFileUploads([userData], files);
        if (!fileValidation.valid) {
          return NextResponse.json(
            { error: fileValidation.error },
            { status: 400 }
          );
        }
      }

      // Use validated user data
      body.userData = validation.value;
    }

    const sdk = getSDKInstance();
    
    // Convert files to buffers if present
    let fileBuffers: Buffer[] = [];
    if (files.length > 0) {
      fileBuffers = await Promise.all(
        files.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          return Buffer.from(arrayBuffer);
        })
      );
    }

    // Call SDK with files if available
    let result;
    try {
      if (fileBuffers.length > 0 && (sdk.createUser as any).length >= 3) {
        result = await (sdk.createUser as any)(userId, body.userData || {}, fileBuffers);
      } else {
        result = await sdk.createUser(userId, body.userData || {});
      }
    } catch (sdkError: any) {
      if (fileBuffers.length > 0 && sdkError.message?.includes('files')) {
        result = await sdk.createUser(userId, body.userData || {});
      } else {
        throw sdkError;
      }
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create user',
      },
      { status: 500 }
    );
  }
}

