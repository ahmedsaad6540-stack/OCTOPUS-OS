# Pre-Submission Review Checklist

Before clicking "Submit for Review" in the TikTok Developer Portal, verify the following:

- [ ] All redirect URIs match your production domain exactly (no trailing slashes mismatch).
- [ ] Your privacy policy URL (`/privacy`) is accessible without authentication.
- [ ] Your terms of service URL (`/terms`) is accessible without authentication.
- [ ] The app description is concise and clearly explains the value proposition (see `app-description.md`).
- [ ] Justification for scopes (`video.upload`, `video.publish`, `user.info.basic`) is accurate (see `scope-justification.md`).
- [ ] You have recorded and attached the screencast demonstration (see `demo-video-script.md`).
- [ ] You have provided test credentials in the "Reviewer Instructions" section (see `reviewer-credentials.md`).
- [ ] Webhooks for revocation events (if applicable) are returning `200 OK`.
- [ ] App Logo complies with TikTok's visual guidelines (no misleading TikTok branding).
