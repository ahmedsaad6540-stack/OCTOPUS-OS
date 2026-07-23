# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: youtube-oauth.spec.ts >> YouTube OAuth Flow >> unauthenticated connect rejected
- Location: e2e\youtube-oauth.spec.ts:4:7

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED ::1:8081
Call log:
  - → POST http://localhost:8081/api/integrations/youtube/connect
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```