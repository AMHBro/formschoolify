/**
 * Compare with GitHub latest commit to see if Production serves the same build.
 * Vercel sets VERCEL_GIT_COMMIT_SHA on deployed serverless functions.
 */
export async function GET() {
  return Response.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  });
}
