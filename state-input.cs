using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
public class StateInput {
 [DllImport("kernel32",CharSet=CharSet.Unicode)] static extern bool SetDllDirectory(string path);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_Init(uint flags);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_SetHint(string name,string value);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_PumpEvents();
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_NumJoysticks();
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_IsGameController(int index);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern IntPtr SDL_GameControllerOpen(int index);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern IntPtr SDL_GameControllerGetJoystick(IntPtr pad);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_JoystickCurrentPowerLevel(IntPtr joystick);
 [StructLayout(LayoutKind.Sequential)] struct HidInterfaceData {public int cbSize;public Guid guid;public int flags;public IntPtr reserved;}
 [DllImport("hid.dll")] static extern void HidD_GetHidGuid(out Guid guid);
 [DllImport("setupapi.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr SetupDiGetClassDevs(ref Guid guid,IntPtr enumerator,IntPtr hwnd,uint flags);
 [DllImport("setupapi.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool SetupDiEnumDeviceInterfaces(IntPtr set,IntPtr device,ref Guid guid,uint index,ref HidInterfaceData data);
 [DllImport("setupapi.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool SetupDiGetDeviceInterfaceDetail(IntPtr set,ref HidInterfaceData data,IntPtr detail,uint size,ref uint needed,IntPtr device);
 [DllImport("setupapi.dll",SetLastError=true)] static extern bool SetupDiDestroyDeviceInfoList(IntPtr set);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern IntPtr CreateFile(string path,uint access,uint share,IntPtr security,uint creation,uint flags,IntPtr template);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool CloseHandle(IntPtr handle);
 [DllImport("kernel32.dll",SetLastError=true)] static extern bool ReadFile(IntPtr handle,byte[] buffer,uint length,out uint read,IntPtr overlapped);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_GameControllerClose(IntPtr pad);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_GameControllerGetAttached(IntPtr pad);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern byte SDL_GameControllerGetButton(IntPtr pad,int button);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_GameControllerGetNumTouchpads(IntPtr pad);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_GameControllerGetTouchpadFinger(IntPtr pad,int touchpad,int finger,out byte state,out float x,out float y,out float pressure);
 static bool TouchHeld(IntPtr pad) {
  // Native Sony exposes touchpad=20; older XInput/Parallels SDL mappings
  // expose the same physical click as button 10. Keep Guide=5 for legacy
  // bridges, but do not require a second button: holding touch alone must
  // behave exactly like holding Space.
  if(SDL_GameControllerGetButton(pad,20)!=0 ||
     SDL_GameControllerGetButton(pad,10)!=0 ||
     SDL_GameControllerGetButton(pad,5)!=0)return true;
  try {
   for(int t=0;t<SDL_GameControllerGetNumTouchpads(pad);t++)for(int f=0;f<2;f++){
    byte state;float x,y,pressure;
    if(SDL_GameControllerGetTouchpadFinger(pad,t,f,out state,out x,out y,out pressure)==0 && state!=0)return true;
   }
  }catch(EntryPointNotFoundException){}
  return false;
 }
 public class PanelChord {
  bool oldBack,oldStart,latched;long lastBack=-10000,lastStart=-10000;
  public bool Update(bool back,bool start,long now){
   bool b=back&&!oldBack,s=start&&!oldStart;
   bool trigger=!latched&&((b&&(start||now-lastStart<=400))||(s&&(back||now-lastBack<=400)));
   if(b)lastBack=now;if(s)lastStart=now;
   oldBack=back;oldStart=start;
   if(trigger){latched=true;lastBack=lastStart=-10000;}
   if(!back&&!start)latched=false;
   return trigger;
  }
 }
 public static bool PanelHeld(ushort buttons) {return (buttons & 0x30)==0x30;}
 public static bool XboxFastHeld(ushort buttons) {return (buttons & 0x220)==0x220;}
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_Quit();
 [DllImport("user32")] static extern void keybd_event(byte key,byte scan,uint flags,UIntPtr extra);
 [DllImport("kernel32")] static extern uint GetCurrentThreadId();
 [DllImport("user32")] static extern bool AttachThreadInput(uint a,uint b,bool attach);
 [DllImport("user32")] static extern bool SetForegroundWindow(IntPtr window);
 [DllImport("user32")] static extern bool BringWindowToTop(IntPtr window);
 [DllImport("user32")] static extern IntPtr SetFocus(IntPtr window);
 [DllImport("user32")] static extern bool IsIconic(IntPtr window);
 [DllImport("user32")] static extern bool ShowWindow(IntPtr window,int command);
 static void FocusGame(int target){
  try{
   var process=Process.GetProcessById(target);process.Refresh();var window=process.MainWindowHandle;
   if(window==IntPtr.Zero)return;
   uint foregroundPid,targetPid;
   uint foregroundThread=GetWindowThreadProcessId(GetForegroundWindow(),out foregroundPid);
   uint targetThread=GetWindowThreadProcessId(window,out targetPid),currentThread=GetCurrentThreadId();
   bool attachedForeground=false,attachedTarget=false;
   try{
    if(foregroundThread!=0&&foregroundThread!=currentThread)attachedForeground=AttachThreadInput(currentThread,foregroundThread,true);
    if(targetThread!=0&&targetThread!=currentThread&&targetThread!=foregroundThread)attachedTarget=AttachThreadInput(currentThread,targetThread,true);
    if(IsIconic(window))ShowWindow(window,9);
    BringWindowToTop(window);SetForegroundWindow(window);SetFocus(window);
   }finally{
    if(attachedTarget)AttachThreadInput(currentThread,targetThread,false);
    if(attachedForeground)AttachThreadInput(currentThread,foregroundThread,false);
   }
   GetWindowThreadProcessId(GetForegroundWindow(),out foregroundPid);
   Console.WriteLine("FOCUS target="+target+" foreground="+foregroundPid+" confirmed="+(foregroundPid==target));
  }catch(Exception error){Console.WriteLine("FOCUS_ERROR "+error.Message);}
 }
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern IntPtr SDL_GameControllerName(IntPtr pad);
 [DllImport("user32")] static extern short GetAsyncKeyState(int key);
 [DllImport("user32")] static extern IntPtr GetForegroundWindow();
 static void TapKey(byte key){
  keybd_event(key,0,0,UIntPtr.Zero);
  keybd_event(key,0,2,UIntPtr.Zero);
 }
 public static string KeyboardAction(bool save,bool load,bool oldSave,bool oldLoad,bool focused,bool modified){return focused&&!modified?Action(save,load,oldSave,oldLoad):null;}
 [DllImport("user32")] static extern uint GetWindowThreadProcessId(IntPtr window,out uint pid);

 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_GameControllerUpdate();
 [StructLayout(LayoutKind.Sequential)] struct PadState {public uint packet;public ushort buttons;public byte leftTrigger,rightTrigger;public short lx,ly,rx,ry;}
 [DllImport("xinput1_4",EntryPoint="XInputGetState")] static extern uint XInputGetState(uint index,out PadState state);
 public static string Action(bool left,bool right,bool oldLeft,bool oldRight) {
  if(left&&!oldLeft)return "SAVE_STATE";
  if(right&&!oldRight)return "LOAD_STATE";
  return null;
 }
 public static bool CanDispatch(uint foreground, int target, int owner) {
  return foreground == target || (owner > 0 && foreground == owner);
 }
 static string Json(string value){return (value??"").Replace("\\","\\\\").Replace("\"","\\\"");}
 static int PowerPercent(int level){switch(level){case 1:return 0;case 2:return 20;case 3:return 50;case 4:return 100;case 6:return 100;default:return -1;}}
 static string HidBattery(){
  try{
   Guid guid;HidD_GetHidGuid(out guid);IntPtr set=SetupDiGetClassDevs(ref guid,IntPtr.Zero,IntPtr.Zero,2|16);if(set==IntPtr.Zero||set==new IntPtr(-1))return null;
   try{for(uint i=0;;i++){
    var item=new HidInterfaceData();item.cbSize=Marshal.SizeOf(typeof(HidInterfaceData));if(!SetupDiEnumDeviceInterfaces(set,IntPtr.Zero,ref guid,i,ref item))break;
    uint need=0;SetupDiGetDeviceInterfaceDetail(set,ref item,IntPtr.Zero,0,ref need,IntPtr.Zero);if(need<8)continue;IntPtr buffer=Marshal.AllocHGlobal((int)need);
    try{Marshal.WriteInt32(buffer,8);if(!SetupDiGetDeviceInterfaceDetail(set,ref item,buffer,need,ref need,IntPtr.Zero))continue;string path=Marshal.PtrToStringUni(IntPtr.Add(buffer,4));if(String.IsNullOrEmpty(path)||path.IndexOf("VID_054C&PID_0CE6",StringComparison.OrdinalIgnoreCase)<0)continue;IntPtr handle=CreateFile(path,0x80000000,1|2,IntPtr.Zero,3,0,IntPtr.Zero);if(handle==IntPtr.Zero||handle==new IntPtr(-1))continue;try{byte[] report=new byte[64];uint read; if(ReadFile(handle,report,64,out read,IntPtr.Zero)&&read>=54&&report[0]==1){int status=(report[53]>>4)&0x0f;int level=report[53]&0x0f;int percent=status==2?100:Math.Max(0,Math.Min(100,level*10+5));bool charging=status==1;bool full=status==2;return "{\"index\":0,\"id\":\"DualSense\",\"percent\":"+percent+",\"charging\":"+(charging?"true":"false")+",\"full\":"+(full?"true":"false")+",\"status\":"+status+",\"source\":\"HID\"}";}}finally{CloseHandle(handle);}}finally{Marshal.FreeHGlobal(buffer);}
   }}finally{SetupDiDestroyDeviceInfoList(set);}
  }catch{}return null;
 }
 static int Battery(string dll){
  SetDllDirectory(dll);string hid=HidBattery();if(hid!=null){Console.WriteLine("{\"controllers\":["+hid+"],\"connected\":true}");return 0;}if(SDL_Init(0x2000|0x4000)!=0)return 3;
  var pads=new List<IntPtr>();try{
   SDL_PumpEvents();var parts=new List<string>();bool connected=false;
   for(int i=0;i<SDL_NumJoysticks();i++)if(SDL_IsGameController(i)!=0){var pad=SDL_GameControllerOpen(i);if(pad==IntPtr.Zero)continue;connected=true;pads.Add(pad);var name=Json(Marshal.PtrToStringAnsi(SDL_GameControllerName(pad)));var level=-1;try{level=PowerPercent(SDL_JoystickCurrentPowerLevel(SDL_GameControllerGetJoystick(pad)));}catch(EntryPointNotFoundException){};parts.Add("{\"index\":"+i+",\"id\":\""+name+"\",\"percent\":"+(level<0?"null":level.ToString())+",\"charging\":false,\"source\":\"SDL2\"}");}
   Console.WriteLine("{\"controllers\":["+String.Join(",",parts)+"],\"connected\":"+(connected?"true":"false")+"}");return 0;
  }finally{foreach(var pad in pads)SDL_GameControllerClose(pad);SDL_Quit();}
 }
 static void Dispatch(string action,string mode,UdpClient udp) {
  // MAME now uses the same Ultimate Emulator thumbnail chooser as RetroArch.
  // Do not synthesize a MAME UI key here: that would open its native selector.
  if(mode=="mame"){
   if(action!="SAVE_STATE" && action!="LOAD_STATE")return;
   Console.WriteLine("ACTION " + action);
   return;
  }
  Console.WriteLine("ACTION " + action);
 }
 public static int Main(string[] args) {
  if(args.Length>=2&&args[1]=="--battery")return Battery(args[0]);
  if(args.Length==1&&args[0]=="--self-test") {
   for(int player=0;player<2;player++) {
    if(Action(true,false,false,false)!="SAVE_STATE"||Action(false,true,false,false)!="LOAD_STATE"||Action(true,false,true,false)!=null||Action(false,true,false,true)!=null) return 2;
   }
   var chord=new PanelChord();
   if(chord.Update(true,false,1000)||!chord.Update(true,true,1100)||chord.Update(true,true,1200))return 7;
   chord.Update(false,false,1300);
   if(chord.Update(false,true,2000)||!chord.Update(true,false,2150))return 8;
   if(!PanelHeld(0x30)||PanelHeld(0x10)||PanelHeld(0x20)||PanelHeld(0))return 6;
   if(!XboxFastHeld(0x220) || XboxFastHeld(0x20) || XboxFastHeld(0x200) || XboxFastHeld(0))return 5;
   if(!CanDispatch(100,100,200) || !CanDispatch(200,100,200) || CanDispatch(300,100,200) || CanDispatch(0,100,0))return 4;
   Console.WriteLine("PASS: foreground game and overlay accepted; unrelated apps rejected.");
   Console.WriteLine("PASS: both controllers save on L3, load on R3, held buttons do not repeat.");return 0;
  }
  if(args.Length<3)return 1;
  SetDllDirectory(args[0]);SDL_SetHint("SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS","1");
  if(SDL_Init(0x2000|0x4000)!=0)return 3;
  bool syntheticSpace=false,keySaveOld=false,keyLoadOld=false;long panelLast=-10000;
  var sdlChords=new Dictionary<IntPtr,PanelChord>();var xChords=new PanelChord[]{new PanelChord(),new PanelChord(),new PanelChord(),new PanelChord()};
  var pads=new List<IntPtr>();var previous=new Dictionary<IntPtr,bool[]>();
  try {
   if(args[1]=="--probe") {SDL_PumpEvents();Console.WriteLine("SDL devices="+SDL_NumJoysticks());for(int i=0;i<SDL_NumJoysticks();i++)Console.WriteLine("device="+i+" controller="+SDL_IsGameController(i));return 0;}
   int target=int.Parse(args[1]);int owner=args.Length>3?int.Parse(args[3]):0;var game=Process.GetProcessById(target);
   var focusThread=new Thread(()=>{try{string line;while((line=Console.ReadLine())!=null){if(line=="FOCUS")FocusGame(target);}}catch{}});
   focusThread.IsBackground=true;focusThread.Start();
   var udp=new UdpClient();int tick=0;int deviceCount=-1;bool[] xLeft=new bool[4],xRight=new bool[4],xReady=new bool[4];string lastCommand=null;DateTime lastSent=DateTime.MinValue;
   while(!game.HasExited) {
    SDL_PumpEvents();SDL_GameControllerUpdate();
    if(tick++%30==0 && (deviceCount!=SDL_NumJoysticks() || pads.Exists(p=>SDL_GameControllerGetAttached(p)==0))) {
     deviceCount=SDL_NumJoysticks();foreach(var pad in pads)SDL_GameControllerClose(pad);pads.Clear();previous.Clear();sdlChords.Clear();
     for(int i=0;i<SDL_NumJoysticks()&&pads.Count<2;i++)if(SDL_IsGameController(i)!=0) {
      var pad=SDL_GameControllerOpen(i);if(pad!=IntPtr.Zero){pads.Add(pad);sdlChords[pad]=new PanelChord();Console.WriteLine("DEVICE "+Marshal.PtrToStringAnsi(SDL_GameControllerName(pad))+" touch-or-guide=20/5");previous[pad]=new bool[]{SDL_GameControllerGetButton(pad,7)!=0,SDL_GameControllerGetButton(pad,8)!=0};}
     }
    }
    uint foreground;GetWindowThreadProcessId(GetForegroundWindow(),out foreground);
    string command=null;bool fastHeld=false,panelHeld=false,panelTriggered=false;long now=DateTime.UtcNow.Ticks/TimeSpan.TicksPerMillisecond;
    foreach(var pad in pads) {
     if(SDL_GameControllerGetAttached(pad)==0)continue;
     bool left=SDL_GameControllerGetButton(pad,7)!=0,right=SDL_GameControllerGetButton(pad,8)!=0;
     bool back=SDL_GameControllerGetButton(pad,4)!=0,start=SDL_GameControllerGetButton(pad,6)!=0;
     panelHeld |= back&&start;panelTriggered |= sdlChords[pad].Update(back,start,now);
     fastHeld |= TouchHeld(pad) || (SDL_GameControllerGetButton(pad,4)!=0 && SDL_GameControllerGetButton(pad,10)!=0);
     var old=previous[pad];var action=Action(left,right,old[0],old[1]);old[0]=left;old[1]=right;
     if(action!=null)Console.WriteLine("INPUT pad="+pads.IndexOf(pad)+" action="+action+" foreground="+foreground+" target="+target);if(action!=null&&CanDispatch(foreground,target,owner)&&command==null)command=action;
    }
    for(uint player=0;player<4;player++) {
     PadState xs;bool connected=XInputGetState(player,out xs)==0;
     panelHeld |= connected && PanelHeld(xs.buttons);
     panelTriggered |= xChords[player].Update(connected&&(xs.buttons&0x20)!=0,connected&&(xs.buttons&0x10)!=0,now);
     fastHeld |= connected && XboxFastHeld(xs.buttons);
     bool left=connected&&(xs.buttons&0x40)!=0,right=connected&&(xs.buttons&0x80)!=0;
     var action=xReady[player]?Action(left,right,xLeft[player],xRight[player]):null;
     xLeft[player]=left;xRight[player]=right;xReady[player]=connected;
     if(action!=null)Console.WriteLine("INPUT XInput pad="+player+" action="+action+" foreground="+foreground+" target="+target);
     if(action!=null&&CanDispatch(foreground,target,owner)&&command==null)command=action;
    }
    if(panelTriggered && now-panelLast>600 && CanDispatch(foreground,target,owner)){panelLast=now;Dispatch("OPEN_PANEL",args[2],udp);}
    // 1 saves and 4 loads in every emulator. Keep the former 7/8 MAME and
    // 7/9 RetroArch pairs as additional shortcuts, never as replacements.
    bool keySave=(GetAsyncKeyState(0x31)&0x8000)!=0||(GetAsyncKeyState(0x61)&0x8000)!=0||
      (GetAsyncKeyState(0x37)&0x8000)!=0||(GetAsyncKeyState(0x67)&0x8000)!=0;
    bool keyLoad=(GetAsyncKeyState(0x34)&0x8000)!=0||(GetAsyncKeyState(0x64)&0x8000)!=0||
      (GetAsyncKeyState(args[2]=="mame"?0x38:0x39)&0x8000)!=0||
      (GetAsyncKeyState(args[2]=="mame"?0x68:0x69)&0x8000)!=0;
    bool keyModified=(GetAsyncKeyState(0x10)&0x8000)!=0||(GetAsyncKeyState(0x11)&0x8000)!=0||(GetAsyncKeyState(0x12)&0x8000)!=0;
    var keyboard=KeyboardAction(keySave,keyLoad,keySaveOld,keyLoadOld,foreground==target,keyModified);
    keySaveOld=keySave;keyLoadOld=keyLoad;
    // Keyboard save/load applies to RetroArch and standalone MAME. MAME
    // receives the corresponding 7/8 key in Dispatch(), while RetroArch is
    // handled by the Electron state window as before.
    if(keyboard!=null){
     // The MAME profile deliberately leaves native state bindings empty;
     // keyboard and controller both reach the shared thumbnail manager here.
     if(command==null)command=keyboard;
     Console.WriteLine("INPUT keyboard action="+keyboard+" foreground="+foreground+" mode="+args[2]);
    }
    if(command!=null&&(command!=lastCommand||(DateTime.UtcNow-lastSent).TotalMilliseconds>200)){Dispatch(command,args[2],udp);Console.WriteLine("SENT "+command);lastCommand=command;lastSent=DateTime.UtcNow;}
    // Use the proven native Space hold binding. Release on focus loss,
    // disconnection, process exit and exceptions; never leave a key held.
    bool accelerating=args[2]!="mame" && fastHeld && !panelHeld && foreground==target;
    if(accelerating!=syntheticSpace){
     keybd_event(0x20,0x39,accelerating?0u:2u,UIntPtr.Zero);
     syntheticSpace=accelerating;
     Console.WriteLine("FAST_FORWARD "+(accelerating?"ON":"OFF")+" native-space foreground="+foreground);
    }
    Thread.Sleep(8);
   }
   udp.Close();
  } catch(ArgumentException) {return 0;} finally {if(syntheticSpace)keybd_event(0x20,0x39,2,UIntPtr.Zero);foreach(var pad in pads)SDL_GameControllerClose(pad);SDL_Quit();}
  return 0;
 }
}
