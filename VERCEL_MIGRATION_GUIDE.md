# Vercel Database Migration Guide

## Issue
The production database on Vercel still has `profilePicture` and `coverPhoto` as non-nullable fields, causing errors when the app tries to save `null` values.

## Solution: Run Migration on Production Database

### Method 1: Using Vercel Postgres CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Pull environment variables** (to get DATABASE_URL):
   ```bash
   vercel env pull .env.production
   ```

4. **Run the migration**:
   ```bash
   npx prisma migrate deploy --schema=./prisma/schema.prisma
   ```
   
   Or if you need to specify the database URL:
   ```bash
   DATABASE_URL="your-vercel-postgres-url" npx prisma migrate deploy
   ```

### Method 2: Using Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Your Postgres Database**
3. Click on **Query** tab
4. Run this SQL directly:

```sql
-- Update existing records first
UPDATE "User" SET "profilePicture" = NULL WHERE "profilePicture" = 'default.jpg';
UPDATE "User" SET "coverPhoto" = NULL WHERE "coverPhoto" = 'default_cover.jpg';

-- Make columns nullable
ALTER TABLE "User" ALTER COLUMN "profilePicture" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "profilePicture" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "coverPhoto" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "coverPhoto" DROP DEFAULT;
```

### Method 3: Redeploy with Migration

1. **Commit and push your changes**:
   ```bash
   git add .
   git commit -m "Update profile picture schema to nullable"
   git push origin master
   ```

2. **The build will now include prisma generate** (we updated package.json)

3. **After deployment, run migration** via Vercel CLI or dashboard as shown above

## Verification

After running the migration, check that it worked:

```sql
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('profilePicture', 'coverPhoto');
```

Both columns should show `is_nullable = 'YES'` and `column_default = NULL`.

## Notes

- The migration file is located at: `prisma/migrations/20251108064342_update_default_profile_picture/migration.sql`
- This change makes profilePicture and coverPhoto optional fields
- The app now uses `/images/default-avatar.svg` and `/images/default-cover.svg` as fallbacks
- The `resolveImageUrl()` utility function handles old "default.jpg" values gracefully
