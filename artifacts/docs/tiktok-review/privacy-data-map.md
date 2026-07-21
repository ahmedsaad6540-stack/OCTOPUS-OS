# Data Mapping and Privacy Architecture

As part of our commitment to user privacy and TikTok's developer rules, this document maps out exactly what data is pulled, where it is stored, and how it is destroyed.

| Scope Granted | Data Pulled | Storage Location | Deletion Trigger |
| --- | --- | --- | --- |
| `user.info.basic` | Display Name, Username, Follower Count | PostgreSQL (`social_accounts` table) | User clicks "Disconnect" OR revokes token in TikTok App. |
| (OAuth v2 Token) | Access Token, Refresh Token | PostgreSQL (Encrypted at rest) | Token expires and is not refreshed, or manual revocation. |
| `video.upload` | External Post ID (status only) | PostgreSQL (`campaigns` table) | Campaign deleted by user. |

### Hard Deletion Policy
We do not soft-delete TikTok OAuth tokens. When a user requests disconnection or deletion via the `/data-deletion` callback instructions, a `DELETE FROM social_accounts WHERE platform='tiktok' AND user_id=?` is executed immediately, scrubbing all relational data.
