/**
 * User data validation using Joi
 */

import Joi from 'joi';

// User data validation schema
export const userDataSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  firstName: Joi.string().min(3).required(),
  lastName: Joi.string().min(2).required(),
  password: Joi.string().min(4).optional(),
  uuid: Joi.string().trim().min(2).optional(),
  profileImage: Joi.string().optional(),
  profileImageFileIndex: Joi.number().integer().min(0).optional(),
  displayName: Joi.string().optional(),
}).unknown(false); // Reject unknown fields

// Validation for updateUsers - array of users
// Note: email is optional for updates since the API doesn't accept it in update requests
// Use xmppUsername as the identifier instead
export const updateUsersSchema = Joi.array()
  .items(
    Joi.object({
      email: Joi.string().email().trim().lowercase().optional(),
      firstName: Joi.string().min(3).optional(),
      lastName: Joi.string().min(2).optional(),
      password: Joi.string().min(4).optional(),
      uuid: Joi.string().trim().min(2).optional(),
      profileImage: Joi.string().optional(),
      profileImageFileIndex: Joi.number().integer().min(0).optional(),
      displayName: Joi.string().optional(),
      xmppUsername: Joi.string().optional(),
    }).unknown(false)
  )
  .min(1)
  .max(100);

/**
 * Validate user data
 * @param userData - User data to validate
 * @returns Validation result with error message if invalid
 */
export function validateUserData(userData: any): { valid: boolean; error?: string; value?: any } {
  const { error, value } = userDataSchema.validate(userData, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(', ');
    return { valid: false, error: errorMessages };
  }

  // Validate that profileImage and profileImageFileIndex are mutually exclusive
  if (value.profileImage && value.profileImageFileIndex !== undefined) {
    return {
      valid: false,
      error: 'Cannot use both profileImage and profileImageFileIndex. Use profileImage for file URL or profileImageFileIndex for direct file upload.',
    };
  }

  return { valid: true, value };
}

/**
 * Validate update users array
 * @param users - Array of users to validate
 * @returns Validation result with error message if invalid
 */
export function validateUpdateUsers(users: any[]): { valid: boolean; error?: string; value?: any[] } {
  const { error, value } = updateUsersSchema.validate(users, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(', ');
    return { valid: false, error: errorMessages };
  }

  // Validate that profileImage and profileImageFileIndex are mutually exclusive for each user
  // Also ensure at least one identifier (xmppUsername) is present for updates
  if (value) {
    for (let i = 0; i < value.length; i++) {
      const user = value[i];
      if (user.profileImage && user.profileImageFileIndex !== undefined) {
        return {
          valid: false,
          error: `User at index ${i}: Cannot use both profileImage and profileImageFileIndex. Use profileImage for file URL or profileImageFileIndex for direct file upload.`,
        };
      }
      // xmppUsername is required to identify which user to update (email is not accepted by API)
      if (!user.xmppUsername) {
        return {
          valid: false,
          error: `User at index ${i}: xmppUsername is required to identify the user for updates.`,
        };
      }
    }
  }

  return { valid: true, value };
}

/**
 * Validate file uploads and profileImageFileIndex
 * @param users - Array of users
 * @param files - Array of files
 * @returns Validation result
 */
export function validateFileUploads(
  users: any[],
  files?: File[]
): { valid: boolean; error?: string } {
  if (!files || files.length === 0) {
    // If no files, all users should use profileImage (string) or no image
    return { valid: true };
  }

  // Check if any user has profileImageFileIndex
  const hasFileIndex = users.some((user) => user.profileImageFileIndex !== undefined);

  if (hasFileIndex) {
    // Validate all profileImageFileIndex values are valid
    for (const user of users) {
      if (user.profileImageFileIndex !== undefined) {
        const index = user.profileImageFileIndex;
        if (!Number.isInteger(index) || index < 0 || index >= files.length) {
          return {
            valid: false,
            error: `Invalid profileImageFileIndex ${index} for user. Must be between 0 and ${files.length - 1}`,
          };
        }
      }
    }
  }

  return { valid: true };
}
