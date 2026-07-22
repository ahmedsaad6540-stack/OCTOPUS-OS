# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: youtube-oauth.spec.ts >> YouTube OAuth Flow >> safe status response
- Location: e2e\youtube-oauth.spec.ts:16:7

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED ::1:8081
Call log:
  - → GET http://localhost:8081/api/integrations/youtube/status
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```