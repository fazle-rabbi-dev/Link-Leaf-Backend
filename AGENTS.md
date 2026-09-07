<div align="center">
<img src="./logo.png"
   width="70"
   alt="Link-Leaf logo">
<h1>Link-Leaf</h1>
</div>

> Do not read the `.env` file. All environment variables are exported from `src/config/env.ts`. Always import from there, never from `process.env` directly.

---

## Project Overview

Link-Leaf is a "LinkTree" web app and this project is the backend part of the application. It follows industry-standard conventions for project structure, naming, and code style.

Refer to the [API Documentation](/API_DOCS.md) for details on the API endpoints.

---

## Tech Stack

- **Runtime:** Node.js with TypeScript
- Express.js
- MongoDB with Mongoose
- **Package Manager:** Bun (only)
- `tsc` compilation, auto-reload on changes
- **Logging:** Morgan + Winston
- **Validation:** Express Validator
- **File Upload:** Multer, Cloudinary
- **Auth:** JWT (for access & refresh token, token received from httponly cookie)

---

## Core Features

- User registration and login with email & password along email verification
   - social login/signup with google & github
- JWT-based authentication with access token & refresh token rotation
- Public profile management (name, username, bio, avatar)
- Link management — two types:
   - `social[]` — predefined platforms (Instagram, GitHub, etc.)
   - `custom[]` — user-defined label + URL pairs
- Avatar upload via Multer + Cloudinary
- Profile customization with color scheme, fonts, button style, social link section positioning, seo meta tags
- Email delivery (verification, password reset, email change)
- Analytics: profile views, link clicks

---

## Folder Structure

> **Note:** Read the current folder tree for all present (up to date) folders & files when you need to know what files present inside a specific folder.

### Heres a quick overview of the folder structure:

```
src/
├── app.ts                      ← Express App
├── index.ts                    ← Server Entry Point
├── config/
│   ├── connect-db.ts           ← Database Connection
│   └── env.ts                  ← all env vars exported from here
├── constants/
│   └── index.ts
├── controllers/
│   └── v1/
│       └── auth.controller.ts
│       └── user.controller.ts
├── middlewares/
│   ├── errorHandler.ts
│   ├── notFound.ts             ← 404 handler
│   ├── runValidation.ts
│   └── verifyAuth.ts
├── models/
│   ├── profile
│   └── user
├── routes/
│   └── v1/
│       ├── auth.routes.ts
│       └── user.routes.ts
├── utils/
│   ├── index.ts                ← barrel export (always update this)
│   ├── ApiError.ts
│   ├── apiResponse.ts
│   ├── asyncHandler.ts
│   ├── emailTemplates.ts
│   ├── logger.ts
│   ├── sendEmail.ts
│   └── token.ts
└── validators/
│   └── v1/
│       ├── auth.validator.ts
│       └── user.validator.ts
```

---

## Key Utilities & Middleware

| Name             | Location           | Purpose                                                                              |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------ |
| `asyncHandler`   | `src/utils/`       | Wraps async route handlers                                                           |
| `ApiError`       | `src/utils/`       | Standardized error throwing                                                          |
| `apiResponse`    | `src/utils/`       | Standardized API responses                                                           |
| `logger`         | `src/utils/`       | Winston logger instance                                                              |
| `token`          | `src/utils/`       | Token generation & verification, verification link generation for email verification |
| `sendEmail`      | `src/utils/`       | Email sending helper                                                                 |
| `emailTemplates` | `src/utils/`       | Email HTML templates                                                                 |
| `errorHandler`   | `src/middlewares/` | Global error handler                                                                 |
| `runValidation`  | `src/middlewares/` | Runs express-validator checks                                                        |
| `verifyAuth`     | `src/middlewares/` | JWT auth guard                                                                       |

---

## Code style guidelines

- Always follow the existing folder structure.
- Always use the existing coding style and naming conventions.
- Always use the defined tech stack — do not introduce new libraries unless asked or ask for permission.
- Do not suggest anything that was not asked for.
- When adding a new utility inside `src/utils/`, always update the barrel export file `src/utils/index.ts`.

- All routes, controllers and validators are versioned under `v1/`. New breaking changes go into `v2/` — never modify existing versioned files in a breaking way.

- For file uploads used this pattern: `multer -> memoryStorage -> deliver cloudinary`

## Naming Conventions

- Files: `camelCase.ts` for utils
- Classes: `PascalCase` (e.g. `ApiError`)
- Functions: `camelCase`
- Constants/enums: `UPPER_SNAKE_CASE`
- route,model,controller: `lowercase` **e.g:** auth.routes.ts

## Dev Tooling

- Dev server: `tsx watch`
- TypeScript strict mode

### Commands

- `npm run dev` — start dev server with nodemon
- `npm run dev-tsx` — start dev server with tsx watch
- `npm run build` — build for production
- `npm run start` — start production server

## Error Handling

- All errors thrown as `new ApiError({statusCode, message})`
   - Global catches them
- API responses always use `apiResponse` helper for consistent shape
