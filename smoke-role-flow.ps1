$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000/api/v1'
$suffix = Get-Random -Minimum 10000 -Maximum 99999

$adminEmail = "admin$suffix@example.com"
$adminUsername = "admin$suffix"
$memberEmail = "member$suffix@example.com"
$memberUsername = "member$suffix"
$password = 'Pass@1234'

$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$memberSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Post-Json($url, $session, $bodyObj) {
  $json = $bodyObj | ConvertTo-Json -Depth 10
  Invoke-RestMethod -Uri $url -Method Post -WebSession $session -ContentType 'application/json' -Body $json
}

function Patch-Json($url, $session, $bodyObj) {
  $json = $bodyObj | ConvertTo-Json -Depth 10
  Invoke-RestMethod -Uri $url -Method Patch -WebSession $session -ContentType 'application/json' -Body $json
}

Write-Output '1) Register admin and member'
Post-Json "$base/auth/register" $adminSession @{ email=$adminEmail; username=$adminUsername; fullName='Admin User'; password=$password } | Out-Null
Post-Json "$base/auth/register" $memberSession @{ email=$memberEmail; username=$memberUsername; fullName='Member User'; password=$password } | Out-Null

Write-Output '2) Login admin and member'
$adminLogin = Post-Json "$base/auth/login" $adminSession @{ email=$adminEmail; password=$password }
$memberLogin = Post-Json "$base/auth/login" $memberSession @{ email=$memberEmail; password=$password }
$memberUserId = $memberLogin.data.user._id

Write-Output '3) Admin creates project'
$projectResp = Post-Json "$base/projects" $adminSession @{ name="Project-$suffix"; description='Smoke validation project' }
$projectId = $projectResp.data._id

Write-Output '4) Member discovers and requests access'
$discover = Invoke-RestMethod -Uri "$base/projects/discover" -Method Get -WebSession $memberSession
$found = $discover.data | Where-Object { $_._id -eq $projectId }
if (-not $found) { throw 'Created project not discoverable by member' }
Post-Json "$base/projects/$projectId/join-requests" $memberSession @{} | Out-Null

Write-Output '5) Admin approves join request'
$pending = Invoke-RestMethod -Uri "$base/projects/$projectId/join-requests" -Method Get -WebSession $adminSession
$request = $pending.data | Where-Object { $_.requestedBy._id -eq $memberUserId } | Select-Object -First 1
if (-not $request) { throw 'Pending join request not found for member' }
Patch-Json "$base/projects/$projectId/join-requests/$($request._id)" $adminSession @{ action='approve' } | Out-Null

Write-Output '6) Admin assigns task to member'
$taskResp = Post-Json "$base/tasks/$projectId" $adminSession @{ title='Assigned smoke task'; description='Validate member task visibility'; assignedTo=$memberUserId; status='todo' }
$taskId = $taskResp.data._id

Write-Output '7) Member loads tasks'
$memberTasks = Invoke-RestMethod -Uri "$base/tasks/$projectId" -Method Get -WebSession $memberSession
$assigned = $memberTasks.data | Where-Object { $_._id -eq $taskId } | Select-Object -First 1
if (-not $assigned) { throw 'Assigned task not visible to member' }

Write-Output 'SMOKE TEST PASSED'
Write-Output ("projectId={0}" -f $projectId)
Write-Output ("memberId={0}" -f $memberUserId)
Write-Output ("taskId={0}" -f $taskId)
