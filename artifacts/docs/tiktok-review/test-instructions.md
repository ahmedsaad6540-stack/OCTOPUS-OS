# Test Instructions for TikTok Reviewers

Thank you for reviewing OCTOPUS AI LAB. Please follow these steps to test the OAuth and Video Upload integrations.

## Prerequisites
- A desktop web browser.
- A TikTok test account.

## Step-by-step Guide

1. Navigate to our testing URL: `https://[YOUR_DOMAIN]/demo` (or log in via the credentials provided in `reviewer-credentials.md`).
2. Navigate to the **Social Hub** from the left sidebar.
3. Click the **Connect** button next to the TikTok icon.
4. You will be redirected to the TikTok OAuth login screen.
5. Log in with your TikTok test account and authorize the requested scopes (`user.info.basic`, `video.upload`, `video.publish`).
6. Upon successful redirect back to our platform, you will see your TikTok Display Name and a green "Connected" badge.
7. Click the **Smart Publish** (🚀) button.
8. Enter a test Title and Description.
9. Click **Publish to all platforms**.
10. The system will process the video and upload it to your TikTok Inbox.
11. Open the TikTok app on your mobile device; you will receive a notification that a draft is ready for publishing.
12. (Optional) For Direct Post testing, our system will automatically push the video as "Private" if Direct Post is authorized for the test app.

## Data Deletion Verification
1. To test our revocation compliance, go to your TikTok App Settings -> Security -> Manage App Permissions.
2. Remove "OCTOPUS AI".
3. Refresh our Social Hub. You will notice the TikTok connection is broken and you must re-authenticate, proving that we respect token revocations immediately.
