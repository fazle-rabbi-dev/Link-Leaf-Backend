# Link-Leaf API Documentation

**Base URL:** `https://api-dot-link-leaf.vercel.app`

---

## Authentication

Protected endpoints require either:

- `Authorization: Bearer <accessToken>` header
- `accessToken` httpOnly cookie

Refresh token is stored in an httpOnly cookie (`refreshToken`).

## Rate Limiting

| Scope                  | Limit        | Window |
| ---------------------- | ------------ | ------ |
| Global (all endpoints) | 100 requests | 15 min |
| Auth endpoints         | 10 requests  | 15 min |

Exceeded limit returns `429`:

```json
{ "success": false, "message": "Too many requests, please try again later." }
```

## Error Response Format

```json
{ "success": false, "message": "Error description" }
```

## Table of Contents

- [Health](#health)
- [Seed](#seed)
- [Auth](#auth)
- [User](#user)
- [Profile](#profile)

---

## Health

### `GET /health`

Public. No auth, no rate limit.

**Response 200:**

```json
{ "message": "Server is up & running 🚀" }
```

[Back to Top](#table-of-contents)

---

## Seed

All seed routes are prefixed with `/api/v1/seed`. Development only — returns `403` in production.

### `GET /users`

Dev only. No auth.

**Response 200:**

```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": { "users": [{ ...full user documents with sessions... }] }
}
```

**Errors:** `403` not in development mode.

[Back to Top](#table-of-contents)

---

### `POST /users`

Dev only. No auth. No body.

Deletes all users, then seeds from mock data. Creates a profile for each seeded user.

**Response 201:**

```json
{
	"success": true,
	"message": "Users seeded successfully",
	"data": { "count": 5 }
}
```

**Errors:** `403` not in development mode.

[Back to Top](#table-of-contents)

---

## Auth

All auth routes are prefixed with `/api/v1/auth`.

### `POST /register`

Rate limited (auth). Public.

| Field      | Type   | Rules                                                                                |
| ---------- | ------ | ------------------------------------------------------------------------------------ |
| `name`     | string | required, 2-50 chars, letters and spaces only                                        |
| `username` | string | required, 3-30 chars, lowercase alphanumeric + underscore, cannot start/end with `_` |
| `email`    | string | required, valid email                                                                |
| `password` | string | required, 6-30 chars                                                                 |

**Response 201:**

```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your email address",
  "data": {
    "user": { "_id", "name", "username", "email", "avatar", "profile", "createdAt", "updatedAt" }
  }
}
```

**Errors:** `409` email or username already exists.

[Back to Top](#table-of-contents)

---

### `POST /login`

Rate limited (auth). Public.

| Field      | Type   | Rules                           |
| ---------- | ------ | ------------------------------- |
| `email`    | string | optional, valid email           |
| `username` | string | optional, 3-30 chars, lowercase |
| `password` | string | required, 6-30 chars            |

At least one of `email` or `username` must be provided.

**Response 200:**

```json
{
  "success": true,
  "message": "Successfully logged in",
  "data": {
    "user": { "_id", "name", "username", "email", "avatar", "profile", "createdAt", "updatedAt" },
    "accessToken": "string"
  }
}
```

Sets http only cookies: `accessToken`, `refreshToken`, `sessionId`.

**Errors:** `401` invalid credentials, `403` email not verified.

[Back to Top](#table-of-contents)

---

### `POST /social-login`

Rate limited (auth). Public.

| Field    | Type   | Rules                                             |
| -------- | ------ | ------------------------------------------------- |
| `userId` | string | required, Firebase UID, 20-128 alphanumeric chars |

**Response 200:** Same as `/login`.

**Errors:** `401` invalid credentials, `400` no email associated, `403`

[Back to Top](#table-of-contents)

---

### `POST /resend-verification-email`

Rate limited (auth). Public.

| Field   | Type   | Rules                 |
| ------- | ------ | --------------------- |
| `email` | string | required, valid email |

**Response 200:**

```json
{
	"success": true,
	"message": "If an account with that email exists, a verification email has been sent"
}
```

Always returns 200 (prevents enumeration).

[Back to Top](#table-of-contents)

---

### `POST /verify-email`

Public. No rate limit.

| Field   | Type   | Rules    |
| ------- | ------ | -------- |
| `token` | string | required |

**Response 200:**

```json
{ "success": true, "message": "Email verified successfully" }
```

**Errors:** `400` invalid or expired token.

[Back to Top](#table-of-contents)

---

### `POST /forgot-password`

Rate limited (auth). Public.

| Field   | Type   | Rules                 |
| ------- | ------ | --------------------- |
| `email` | string | required, valid email |

**Response 200:**

```json
{
	"success": true,
	"message": "If an account with that email exists, a password reset link has been sent"
}
```

[Back to Top](#table-of-contents)

---

### `POST /reset-password`

Rate limited (auth). Public.

| Field         | Type   | Rules                |
| ------------- | ------ | -------------------- |
| `token`       | string | required             |
| `newPassword` | string | required, 6-30 chars |

**Response 200:**

```json
{ "success": true, "message": "Password reset successfully" }
```

**Errors:** `400` invalid or expired token.

[Back to Top](#table-of-contents)

---

### `POST /refresh-token`

Public. No rate limit. No request body.

Reads `refreshToken` from cookie.

**Response 200:**

```json
{
	"success": true,
	"message": "Token refreshed successfully",
	"data": { "accessToken": "string" }
}
```

Updates cookies: `refreshToken`, `accessToken`, `sessionId`.

**Errors:** `401` missing or invalid refresh token.

[Back to Top](#table-of-contents)

---

### `DELETE /logout`

Public. No rate limit. No request body.

Reads `refreshToken` and `sessionId` from cookies.

**Response 200:**

```json
{ "success": true, "message": "Logged out successfully" }
```

Clears cookies: `accessToken`, `refreshToken`, `sessionId`.

[Back to Top](#table-of-contents)

---

### `DELETE /logout-all`

Public. No rate limit. No request body.

Reads `refreshToken` and `sessionId` from cookies.

**Response 200:**

```json
{ "success": true, "message": "Logged out from all devices successfully" }
```

Clears cookies: `refreshToken`, `sessionId`. Wipes all sessions.

[Back to Top](#table-of-contents)

---

## User

All user routes are prefixed with `/api/v1/users`. Protected endpoints require auth.

### `GET /me`

Protected.

**Response 200:**

```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": {
    "user": { "_id", "name", "username", "email", "avatar", "profile", "pendingEmail", "createdAt", "updatedAt" },
    "profile": { "_id", "userId", "bio", "views", "isPublished", "socialIconPosition", "theme", "links", "seo" }
  }
}
```

[Back to Top](#table-of-contents)

---

### `PATCH /me`

Protected. Accepts `multipart/form-data`.

| Field       | Type   | Rules                                                     |
| ----------- | ------ | --------------------------------------------------------- |
| `name`      | string | optional, 2-50 chars, letters and spaces                  |
| `username`  | string | optional, 3-30 chars, lowercase alphanumeric + underscore |
| `bio`       | string | optional, 1-200 chars                                     |
| `avatarUrl` | string | optional, valid URL                                       |
| `avatar`    | file   | optional, image (jpg, png, webp, svg), max 100KB          |

At least one field required. `avatar` file takes precedence over `avatarUrl`.

**Response 200:**

```json
{
  "success": true,
  "message": "User details updated successfully",
  "data": { "user": { "_id", "name", "username", "email", "avatar", "profile", "createdAt", "updatedAt" } }
}
```

**Errors:** `400` no fields provided, `409` username taken.

[Back to Top](#table-of-contents)

---

### `POST /change-password`

Protected.

| Field             | Type   | Rules                                           |
| ----------------- | ------ | ----------------------------------------------- |
| `currentPassword` | string | required, min 6 chars                           |
| `newPassword`     | string | required, min 6 chars, must differ from current |

**Response 200:**

```json
{ "success": true, "message": "Password changed successfully" }
```

**Errors:** `401` current password incorrect.

[Back to Top](#table-of-contents)

---

### `POST /change-email/request`

Protected.

| Field             | Type   | Rules                 |
| ----------------- | ------ | --------------------- |
| `currentPassword` | string | required, 6-30 chars  |
| `newEmail`        | string | required, valid email |

**Response 200:**

```json
{ "success": true, "message": "Verification link sent to your new email address" }
```

**Errors:** `401` wrong password, `400` email change cooldown (7 days) or same email, `409` email in use.

[Back to Top](#table-of-contents)

---

### `POST /change-email/verify`

Public.

| Field   | Type   | Rules                      |
| ------- | ------ | -------------------------- |
| `token` | string | required, exactly 64 chars |

**Response 200:**

```json
{ "success": true, "message": "Email changed successfully" }
```

**Errors:** `400` invalid or expired token.

[Back to Top](#table-of-contents)

---

### `POST /change-email/revert`

Public.

| Field   | Type   | Rules                      |
| ------- | ------ | -------------------------- |
| `token` | string | required, exactly 64 chars |

**Response 200:**

```json
{ "success": true, "message": "Account recovered. Please log in and reset your password." }
```

**Errors:** `400` invalid or expired token.

[Back to Top](#table-of-contents)

---

## Profile

All profile routes are prefixed with `/api/v1/profile`.

### `GET /:username`

Public.

**Path param:** `username` (string, 3-30 chars, lowercase alphanumeric + underscore)

**Response 200:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "profile": {
      "name": "string",
      "username": "string",
      "avatar": "string (url)",
      "bio": "string",
      "socialIconPosition": "top" | "bottom",
      "theme": { "type", "preset", "custom": { "background", "foregroundColor", "fontName", "button" } },
      "links": {
        "social": [{ "_id", "platform", "url", "isActive", "order" }],
        "custom": [{ "_id", "title", "url", "isActive", "order", "icon": { "kind", "value" } }]
      },
      "seo": { "title", "description", "ogImage" }
    }
  }
}
```

**Errors:** `404` not found, `403` not published.

[Back to Top](#table-of-contents)

---

### `PATCH /social-icon-position`

Protected.

| Field      | Type   | Rules                           |
| ---------- | ------ | ------------------------------- |
| `position` | string | required, `"top"` or `"bottom"` |

**Response 200:**

```json
{
	"success": true,
	"message": "Social icon position updated successfully",
	"data": { "socialIconPosition": "top" }
}
```

[Back to Top](#table-of-contents)

---

### `PATCH /publish`

Protected. No body.

Toggles `isPublished`.

**Response 200:**

```json
{ "success": true, "message": "Profile published successfully", "data": { "isPublished": true } }
```

[Back to Top](#table-of-contents)

---

### `PATCH /theme`

Protected.

| Field                        | Type   | Rules                                                                             |
| ---------------------------- | ------ | --------------------------------------------------------------------------------- |
| `type`                       | string | optional, `"preset"` or `"custom"`                                                |
| `preset`                     | string | optional, one of: `leaf`, `island`, `ocean`, `sunset` (required when type=preset) |
| `custom`                     | object | optional (required when type=custom)                                              |
| `custom.background.type`     | string | `"color"`, `"image"`, `"gradient"`                                                |
| `custom.background.color`    | string | optional, 1-20 chars (required when type=color)                                   |
| `custom.background.gradient` | string | optional, 1-200 chars (required when type=gradient)                               |
| `custom.foregroundColor`     | string | optional, 1-20 chars                                                              |
| `custom.fontName`            | string | optional, 1-50 chars                                                              |
| `custom.button.bgColor`      | string | optional, 1-20 chars                                                              |
| `custom.button.fgColor`      | string | optional, 1-20 chars                                                              |
| `custom.button.shape`        | string | optional, `"rounded"`, `"pill"`, `"square"`                                       |
| `custom.button.style`        | string | optional, `"solid"`, `"outline"`                                                  |

**Response 200:**

```json
{ "success": true, "message": "Theme updated successfully", "data": { "theme": { "type", "preset", "custom" } } }
```

[Back to Top](#table-of-contents)

---

### `PATCH /seo`

Protected.

| Field         | Type   | Rules                  |
| ------------- | ------ | ---------------------- |
| `title`       | string | optional, 4-60 chars   |
| `description` | string | optional, 10-160 chars |
| `ogImage`     | string | optional, valid URL    |

At least one field required.

**Response 200:**

```json
{ "success": true, "message": "SEO settings updated successfully", "data": { "seo": { "title", "description", "ogImage" } } }
```

[Back to Top](#table-of-contents)

---

### `POST /links/custom`

Protected. Accepts `multipart/form-data`.

| Field        | Type   | Rules                                                 |
| ------------ | ------ | ----------------------------------------------------- |
| `title`      | string | required, max 50 chars                                |
| `url`        | string | required, valid URL                                   |
| `icon.kind`  | string | optional, `"emoji"` or `"gif"`                        |
| `icon.value` | string | optional, emoji or GIF URL                            |
| `icon`       | file   | optional, image (jpg, png, webp, avif, svg), max 50KB |

Icon priority: file > icon object > none.

**Response 201:**

```json
{
  "success": true,
  "message": "Custom link added successfully",
  "data": { "link": { "_id", "title", "url", "isActive", "order", "icon": { "kind", "value" } } }
}
```

[Back to Top](#table-of-contents)

---

### `PATCH /links/custom/reorder`

Protected.

| Field   | Type     | Rules                                                          |
| ------- | -------- | -------------------------------------------------------------- |
| `links` | string[] | required, array of ObjectIds, min 2, must match existing count |

**Response 200:**

```json
{ "success": true, "message": "Custom links reordered successfully", "data": { "links": [...] } }
```

[Back to Top](#table-of-contents)

---

### `PATCH /links/custom/:linkId`

Protected. Accepts `multipart/form-data`.

**Path param:** `linkId` (ObjectId)

| Field              | Type    | Rules                           |
| ------------------ | ------- | ------------------------------- |
| `title`            | string  | optional, max 50 chars          |
| `url`              | string  | optional, valid URL             |
| `icon.kind`        | string  | optional, `"emoji"` or `"gif"`  |
| `icon.value`       | string  | optional                        |
| `icon`             | file    | optional, image, max 50KB       |
| `shouldRemoveIcon` | boolean | optional, removes existing icon |

At least one field required.

**Response 200:**

```json
{ "success": true, "message": "Custom link updated successfully", "data": { "link": { "_id", "title", "url", "isActive", "order", "icon" } } }
```

[Back to Top](#table-of-contents)

---

### `DELETE /links/custom/:linkId`

Protected.

**Path param:** `linkId` (ObjectId)

**Response 200:**

```json
{ "success": true, "message": "Custom link deleted successfully" }
```

[Back to Top](#table-of-contents)

---

### `PATCH /links/custom/:linkId/toggle`

Protected.

**Path param:** `linkId` (ObjectId)

Toggles `isActive`.

**Response 200:**

```json
{ "success": true, "message": "Custom link activated successfully", "data": { "link": { "_id", "title", "url", "isActive", "order", "icon" } } }
```

[Back to Top](#table-of-contents)

---

### `POST /links/social`

Protected.

| Field      | Type   | Rules                                                |
| ---------- | ------ | ---------------------------------------------------- |
| `platform` | string | required, one of the supported platforms (see below) |
| `url`      | string | required, valid URL                                  |

**Platforms:** `email`, `facebook`, `twitter`, `instagram`, `youtube`, `buy_me_a_coffee`, `1_on_1`, `spotify`, `github`, `behance`, `dribbble`, `discord`, `medium`, `reddit`, `gift_app`, `tiktok`, `sound_cloud`, `bandcamp`, `linkedin`, `clubhouse`, `telegram`, `signal`, `twitch`, `patreon`, `substack`, `pinterest`, `product_hunt`, `amazon`, `cameo`, `whatsapp`, `goodreads`, `figma`, `strava`, `tumblr`, `mastodon`, `phone`, `music`, `apple`, `google_play`, `etsy`, `poshmark`, `snapchat`, `website`, `bluesky`

**Response 201:**

```json
{
  "success": true,
  "message": "Social link added successfully",
  "data": { "link": { "_id", "platform", "url", "isActive", "order" } }
}
```

**Errors:** `409` platform already exists.

[Back to Top](#table-of-contents)

---

### `PATCH /links/social/reorder`

Protected.

| Field   | Type     | Rules                                                          |
| ------- | -------- | -------------------------------------------------------------- |
| `links` | string[] | required, array of ObjectIds, min 2, must match existing count |

**Response 200:**

```json
{ "success": true, "message": "Social links reordered successfully", "data": { "links": [...] } }
```

[Back to Top](#table-of-contents)

---

### `PATCH /links/social/:linkId`

Protected.

**Path param:** `linkId` (ObjectId)

| Field | Type   | Rules               |
| ----- | ------ | ------------------- |
| `url` | string | required, valid URL |

**Response 200:**

```json
{ "success": true, "message": "Social link updated successfully", "data": { "link": { "_id", "platform", "url", "isActive", "order" } } }
```

[Back to Top](#table-of-contents)

---

### `DELETE /links/social/:linkId`

Protected.

**Path param:** `linkId` (ObjectId)

**Response 200:**

```json
{ "success": true, "message": "Social link deleted successfully" }
```

[Back to Top](#table-of-contents)

---

### `PATCH /links/social/:linkId/toggle`

Protected.

**Path param:** `linkId` (ObjectId)

Toggles `isActive`.

**Response 200:**

```json
{ "success": true, "message": "Social link activated successfully", "data": { "link": { "_id", "platform", "url", "isActive", "order" } } }
```

[Back to Top](#table-of-contents)
