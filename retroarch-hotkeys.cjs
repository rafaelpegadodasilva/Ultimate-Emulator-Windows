'use strict';
// SDL2 exposes the DualSense touchpad click, unlike XInput.
function settings(){
 const keys={input_menu_toggle:'tab',input_menu_toggle_btn:'nul',input_menu_toggle_axis:'nul',input_menu_toggle_mbtn:'nul',input_menu_toggle_gamepad_combo:'0',input_joypad_driver:'sdl2',input_save_state:'num1',input_load_state:'num4',input_save_state_btn:'nul',input_load_state_btn:'nul',input_hold_fast_forward:'space',input_hold_fast_forward_btn:'nul',input_toggle_fast_forward:'nul',input_toggle_fast_forward_btn:'nul',input_enable_hotkey:'nul',input_enable_hotkey_btn:'nul',input_enable_hotkey_axis:'nul',input_enable_hotkey_mbtn:'nul',fastforward_ratio:'3.0',fastforward_ratio_throttle_enable:'true',notification_show_save_state:'true',notification_show_fast_forward:'true'};
 for(const action of ['save_state','load_state','hold_fast_forward','toggle_fast_forward'])for(const suffix of ['_axis','_mbtn'])keys['input_'+action+suffix]='nul';
 return keys;
}
function apply(lines){
 const values=settings(),keys=new Set(Object.keys(values));
 return lines.filter(line=>!keys.has(/^\s*([\w]+)\s*=/.exec(line)?.[1])).concat(Object.entries(values).map(([k,v])=>`${k} = "${v}"`));
}
module.exports={settings,apply};
