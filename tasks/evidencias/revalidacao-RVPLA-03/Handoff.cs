using System;using System.IO;using System.Diagnostics;using System.Threading;
class Handoff {
 static void Wait(string file){var clock=Stopwatch.StartNew();while(!File.Exists(file)){if(clock.ElapsedMilliseconds>20000)throw new Exception("Missing handoff barrier");Thread.Sleep(10);}}
 [STAThread]static void Main(string[]args){
  string root=args[0];
  using(var self=Process.GetCurrentProcess()){
   if(args[1]=="parent"){
    File.WriteAllText(Path.Combine(root,"parent.identity"),self.Id+"|"+self.StartTime.ToUniversalTime().Ticks);
    File.WriteAllText(Path.Combine(root,"parent-ready"),"ready");Wait(Path.Combine(root,"query-captured"));
    var start=new ProcessStartInfo(self.MainModule.FileName,"\""+root+"\" child"){UseShellExecute=false,CreateNoWindow=true};Process.Start(start);
    Wait(Path.Combine(root,"child-ready"));return;
   }
   File.WriteAllText(Path.Combine(root,"child.identity"),self.Id+"|"+self.StartTime.ToUniversalTime().Ticks);
   File.WriteAllText(Path.Combine(root,"child-ready"),"ready");Wait(Path.Combine(root,"after-complete"));
   File.WriteAllText(Path.Combine(root,"late-effect.txt"),"child="+self.Id+" input="+File.ReadAllText(Path.Combine(root,"source","input"))+" at="+DateTimeOffset.UtcNow.ToString("o"));
   Wait(Path.Combine(root,"finish-child"));
  }
 }
}
