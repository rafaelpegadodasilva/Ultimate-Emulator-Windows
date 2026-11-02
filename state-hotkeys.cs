using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
public class StateHotkeys {
 [DllImport("kernel32",CharSet=CharSet.Unicode)] static extern bool SetDllDirectory(string path);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_Init(uint flags);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_SetHint(string name,string value);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_PumpEvents();
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_NumJoysticks();
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_IsGameController(int index);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern IntPtr SDL_GameControllerOpen(int index);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_GameControllerClose(IntPtr pad);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern int SDL_GameControllerGetAttached(IntPtr pad);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern byte SDL_GameControllerGetButton(IntPtr pad,int button);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_Quit();
 [DllImport("user32")] static extern IntPtr GetForegroundWindow();
 [DllImport("user32")] static extern uint GetWindowThreadProcessId(IntPtr window,out uint pid);
 [DllImport("user32")] static extern void keybd_event(byte key,byte scan,uint flags,UIntPtr extra);
 [DllImport("SDL2",CallingConvention=CallingConvention.Cdecl)] static extern void SDL_GameControllerUpdate();
 [StructLayout(LayoutKind.Sequential)] struct PadState {public uint packet;public ushort buttons;public byte leftTrigger,rightTrigger;public short lx,ly,rx,ry;}
 [DllImport("xinput1_4",EntryPoint="XInputGetState")] static extern uint XInputGetState(uint index,out PadState state);
 public static string Action(bool left,bool right,bool oldLeft,bool oldRight) {
  if(left&&!oldLeft)return "SAVE_STATE";
  if(right&&!oldRight)return "LOAD_STATE";
  return null;
 }
 static void Dispatch(string action,string mode,UdpClient udp) {
  if(mode=="retroarch") {byte[] data=Encoding.ASCII.GetBytes(action);udp.Send(data,data.Length,new IPEndPoint(IPAddress.Loopback,55355));}
  else {byte scan=(byte)(action=="SAVE_STATE"?2:5);byte key=(byte)(action=="SAVE_STATE"?0x31:0x34);keybd_event(key,scan,0,UIntPtr.Zero);Thread.Sleep(25);keybd_event(key,scan,2,UIntPtr.Zero);}
 }
 public static int Main(string[] args) {
  if(args.Length==1&&args[0]=="--self-test") {
   for(int player=0;player<2;player++) {
    if(Action(true,false,false,false)!="SAVE_STATE"||Action(false,true,false,false)!="LOAD_STATE"||Action(true,false,true,false)!=null||Action(false,true,false,true)!=null) return 2;
   }
   Console.WriteLine("PASS: both controllers save on L3, load on R3, held buttons do not repeat.");return 0;
  }
  if(args.Length<3)return 1;
  SetDllDirectory(args[0]);SDL_SetHint("SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS","1");
  if(SDL_Init(0x2000|0x4000)!=0)return 3;
  var pads=new List<IntPtr>();var previous=new Dictionary<IntPtr,bool[]>();
  try {
   if(args[1]=="--probe") {SDL_PumpEvents();Console.WriteLine("SDL devices="+SDL_NumJoysticks());for(int i=0;i<SDL_NumJoysticks();i++)Console.WriteLine("device="+i+" controller="+SDL_IsGameController(i));return 0;}
   int target=int.Parse(args[1]);var game=Process.GetProcessById(target);var udp=new UdpClient();int tick=0;int deviceCount=-1;bool[] xLeft=new bool[4],xRight=new bool[4],xReady=new bool[4];string lastCommand=null;DateTime lastSent=DateTime.MinValue;
   while(!game.HasExited) {
    SDL_PumpEvents();SDL_GameControllerUpdate();
    if(tick++%30==0 && (deviceCount!=SDL_NumJoysticks() || pads.Exists(p=>SDL_GameControllerGetAttached(p)==0))) {
     deviceCount=SDL_NumJoysticks();foreach(var pad in pads)SDL_GameControllerClose(pad);pads.Clear();previous.Clear();
     for(int i=0;i<SDL_NumJoysticks()&&pads.Count<2;i++)if(SDL_IsGameController(i)!=0) {
      var pad=SDL_GameControllerOpen(i);if(pad!=IntPtr.Zero){pads.Add(pad);previous[pad]=new bool[]{SDL_GameControllerGetButton(pad,7)!=0,SDL_GameControllerGetButton(pad,8)!=0};}
     }
    }
    uint foreground;GetWindowThreadProcessId(GetForegroundWindow(),out foreground);
    string command=null;
    foreach(var pad in pads) {
     if(SDL_GameControllerGetAttached(pad)==0)continue;
     bool left=SDL_GameControllerGetButton(pad,7)!=0,right=SDL_GameControllerGetButton(pad,8)!=0;
     var old=previous[pad];var action=Action(left,right,old[0],old[1]);old[0]=left;old[1]=right;
     if(action!=null)Console.WriteLine("INPUT pad="+pads.IndexOf(pad)+" action="+action+" foreground="+foreground+" target="+target);if(action!=null&&foreground==target&&command==null)command=action;
    }
    for(uint player=0;player<4;player++) {
     PadState xs;bool connected=XInputGetState(player,out xs)==0;
     bool left=connected&&(xs.buttons&0x40)!=0,right=connected&&(xs.buttons&0x80)!=0;
     var action=xReady[player]?Action(left,right,xLeft[player],xRight[player]):null;
     xLeft[player]=left;xRight[player]=right;xReady[player]=connected;
     if(action!=null)Console.WriteLine("INPUT XInput pad="+player+" action="+action+" foreground="+foreground+" target="+target);
     if(action!=null&&foreground==target&&command==null)command=action;
    }
    if(command!=null&&(command!=lastCommand||(DateTime.UtcNow-lastSent).TotalMilliseconds>200)){Dispatch(command,args[2],udp);Console.WriteLine("SENT "+command);lastCommand=command;lastSent=DateTime.UtcNow;}
    Thread.Sleep(16);
   }
   udp.Close();
  } catch(ArgumentException) {return 0;} finally {foreach(var pad in pads)SDL_GameControllerClose(pad);SDL_Quit();}
  return 0;
 }
}
