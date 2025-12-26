<#
Check-DNS.ps1
PowerShell script untuk memeriksa record DNS yang penting untuk deliverability: SPF, DKIM (selector), dan DMARC.

Usage (PowerShell):
.\check-dns.ps1 -Domain "example.com" -DkimSelectors @("s1","s2")

#>
param(
  [Parameter(Mandatory=$true)]
  [string]$Domain,

  [string[]]$DkimSelectors = @('s1','s2')
)

function Get-TxtRecords([string]$name) {
  try {
    $r = Resolve-DnsName -Name $name -Type TXT -ErrorAction Stop
    return ($r | Select-Object -ExpandProperty Strings) -join "\n"
  } catch {
    return $null
  }
}

Write-Host "Memeriksa DNS untuk domain: $Domain`n" -ForegroundColor Cyan

# SPF
$spf = Get-TxtRecords $Domain
if ($spf) {
  Write-Host "SPF (TXT) untuk $Domain:" -ForegroundColor Green
  Write-Host $spf`n
} else {
  Write-Host "SPF (TXT) tidak ditemukan untuk $Domain" -ForegroundColor Yellow
}

# DKIM selectors
foreach ($sel in $DkimSelectors) {
  $name = "$sel._domainkey.$Domain"
  $dkim = Get-TxtRecords $name
  if ($dkim) {
    Write-Host "DKIM ($sel) record:" -ForegroundColor Green
    Write-Host $dkim`n
  } else {
    Write-Host "DKIM selector '$sel' tidak ditemukan pada $name" -ForegroundColor Yellow
  }
}

# DMARC
$dmarcName = "_dmarc.$Domain"
$dmarc = Get-TxtRecords $dmarcName
if ($dmarc) {
  Write-Host "DMARC record:" -ForegroundColor Green
  Write-Host $dmarc`n
} else {
  Write-Host "DMARC record tidak ditemukan untuk $Domain" -ForegroundColor Yellow
}

Write-Host "Selesai. Periksa nilai di atas. Gunakan hasil untuk menyesuaikan DNS/SPF/DKIM di provider Anda." -ForegroundColor Cyan
