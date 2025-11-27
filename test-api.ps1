# PowerShell script to test the API endpoint
$uri = "https://ai-bike-customizer.vercel.app/api/generate"

$body = @{
    model = "Yamaha YZF-R1"
    yearRange = "20152020"
    styleName = "Blue Racing Edition"
    primaryColors = "metallic Yamaha blue and pure white"
    accents = "R1 logos, Yamaha tuning fork decals, white racing stripes"
    finish = "glossy ABS plastic"
    brandLogos = "Yamaha, R1"
    prompt = "Exploded fairing kit layout for a Yamaha R1 track bike with an aggressive blue racing design."
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json" -Body $body
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
}

