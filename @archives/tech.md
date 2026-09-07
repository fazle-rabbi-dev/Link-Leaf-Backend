# Technical Decisions & Flow of different feature

## Authentication

- **Access token:** JWT, short-lived (1 hour)
- **Refresh token:** JWT → SHA-256 hash → stored hashed in DB
- **Storage:** HttpOnly cookies only — no tokens in response body
- **Rotation:** Refresh token rotates on every use
- **Auth middleware:** `verifyAuth` attaches user to `req.user` (non-optional, typed as `IUser`)
- **Token helpers:** All token logic lives in `src/utils/token.ts`

## User management

-

## Email

- All Verification/Confirmation related token: `crypto.randomBytes` SHA-256 hash → stored hashed in DB, one-time use
- Templates: HTML templates in `src/utils/emailTemplates.ts`
- Sending: `src/utils/sendEmail.ts` (Nodemailer or equivalent)
- Pending email change: stored in `user.auth.pendingEmail` until verified

## File Upload

- **Multer:** `memoryStorage` (no disk write)
- **Cloudinary:** upload via buffer stream, not temp file path

## Validation

- Express Validator schemas live in `src/validators/`
- Validator file provide an object through default export that contains validator chain variable like: `login, register`
- In route file import with name: _VALIDATOR_ and wire like: `VALIDATOR.login`
- After wire validator need to call middleware: `runValidation`
