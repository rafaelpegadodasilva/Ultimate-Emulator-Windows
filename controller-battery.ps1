$ErrorActionPreference='SilentlyContinue'
$items=@()
$detected=$false
try {
 $null=[Windows.Gaming.Input.Gamepad,Windows.Gaming.Input,ContentType=WindowsRuntime]
 $index=0
 foreach($pad in [Windows.Gaming.Input.Gamepad]::Gamepads){
  $detected=$true
  $report=$pad.TryGetBatteryReport()
  $full=$report.FullChargeCapacityInMilliwattHours
  $remaining=$report.RemainingCapacityInMilliwattHours
  $percent=$null
  if($report.Status.ToString() -ne 'NotPresent' -and $null -ne $full -and $full -gt 0 -and $null -ne $remaining){$percent=[math]::Max(0,[math]::Min(100,[math]::Round(100*$remaining/$full)))}
  $items+=@{index=$index;percent=$percent;charging=($report.Status.ToString() -eq 'Charging');source='Windows Gaming Input'}
  $index++
 }
}catch{}
if(-not ($items | Where-Object {$null -ne $_.percent})){
 try {
  $null=[Windows.Gaming.Input.RawGameController,Windows.Gaming.Input,ContentType=WindowsRuntime]
  foreach($pad in [Windows.Gaming.Input.RawGameController]::RawGameControllers){
   $detected=$true
   $report=$pad.TryGetBatteryReport()
   $full=$report.FullChargeCapacityInMilliwattHours
   $remaining=$report.RemainingCapacityInMilliwattHours
   if($report.Status.ToString() -ne 'NotPresent' -and $null -ne $full -and $full -gt 0 -and $null -ne $remaining){
    $percent=[math]::Max(0,[math]::Min(100,[math]::Round(100*$remaining/$full)))
    $items+=@{index=-1;id=$pad.DisplayName;percent=$percent;charging=($report.Status.ToString() -eq 'Charging');source='Windows Raw Game Controller'}
   }
  }
 }catch{}
}
if(-not ($items | Where-Object {$null -ne $_.percent})){
 $devices=Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match 'DualSense|DualShock|Wireless Controller|Xbox.*Controller|Controle.*Xbox|Controlador.*XBOX' }
 if($devices){$detected=$true}
 foreach($device in $devices){
  $properties=$device | Get-PnpDeviceProperty
  $battery=$properties | Where-Object { $_.KeyName -match 'BatteryLevel|BatteryLife|104EA319-6EE2-4701-BD47-8DDBF425BBE5.*2$' -and $_.KeyName -notmatch 'Known|Status|Charging' -and $_.Data -is [ValueType] -and $_.Data -isnot [bool] -and $_.Data -ge 0 -and $_.Data -le 100 } | Select-Object -First 1
  if($battery){$items+=@{index=-1;id=$device.FriendlyName;percent=[int]$battery.Data;charging=$false;source='Windows Bluetooth'} }
 }
}
ConvertTo-Json -Compress -Depth 4 -InputObject @{controllers=@($items);connected=$detected}
