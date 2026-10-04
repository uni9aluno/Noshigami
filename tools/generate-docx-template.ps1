param(
    [string]$Source = (Join-Path $PSScriptRoot '..\Noshigami Okaeshi - Edicao.docx'),
    [string]$Output = (Join-Path $PSScriptRoot '..\assets\modelo-docx.js')
)

$ErrorActionPreference = 'Stop'
$sourcePath = [System.IO.Path]::GetFullPath($Source)
$outputPath = [System.IO.Path]::GetFullPath($Output)

if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Template DOCX nao encontrado: $sourcePath"
}

$base64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($sourcePath))
$content = @"
/* Gerado automaticamente por tools/generate-docx-template.ps1.
   Fonte: Noshigami Okaeshi - Edicao.docx
   Nao edite manualmente. */
window.NOSHIGAMI_DOCX_TEMPLATE = '$base64';
"@

[System.IO.File]::WriteAllText(
    $outputPath,
    $content,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Output "Template embutido gerado em: $outputPath"
