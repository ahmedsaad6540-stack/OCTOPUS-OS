$env:DATABASE_URL="postgresql://postgres:OfvcPdyAJTMGFteYOlwYarWsfdEcoMvD@tokaido.proxy.rlwy.net:24119/c3_2_test"
$env:TEST_DATABASE_URL=$env:DATABASE_URL
$env:NODE_ENV="test"
$env:CREDENTIAL_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"
$env:BASE_PATH="/"

# Force kill any process using ports 5002 and 8081
try {
    $port5002 = Get-NetTCPConnection -LocalPort 5002 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 }
    if ($port5002) { Stop-Process -Id $port5002.OwningProcess -Force -ErrorAction SilentlyContinue }
} catch {}
try {
    $port8081 = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -ne 0 }
    if ($port8081) { Stop-Process -Id $port8081.OwningProcess -Force -ErrorAction SilentlyContinue }
} catch {}

pnpm --filter @workspace/api-server build

$backend = Start-Process -FilePath "pnpm" -ArgumentList "--filter", "@workspace/api-server", "start" -PassThru -NoNewWindow
$frontend = Start-Process -FilePath "pnpm" -ArgumentList "--filter", "@workspace/octopus-os", "dev" -PassThru -NoNewWindow

Start-Sleep -Seconds 15
pnpm exec playwright test e2e/dogfooding.spec.ts

Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
