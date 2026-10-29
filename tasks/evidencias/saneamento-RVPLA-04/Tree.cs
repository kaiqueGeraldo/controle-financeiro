using System;using System.IO;using System.Diagnostics;using System.Threading;
class Tree {
 static void Wait(string file){var w=Stopwatch.StartNew();while(!File.Exists(file)){if(w.ElapsedMilliseconds>20000)throw new Exception("Missing tree barrier "+file);Thread.Sleep(25);}}
 static void Mark(string root,string role){using(var p=Process.GetCurrentProcess()){string name=Path.Combine(root,role+".identity");File.WriteAllText(name+".tmp",p.Id+"|"+p.StartTime.ToUniversalTime().Ticks);File.Move(name+".tmp",name);}}
 static void Start(string root,string role){var s=new ProcessStartInfo(Process.GetCurrentProcess().MainModule.FileName,"\""+root+"\" "+role){UseShellExecute=false,CreateNoWindow=true};Process.Start(s);}
 [STAThread]static void Main(string[] args){string root=args[0],role=args[1];Mark(root,role);
  if(role=="parent"){Wait(Path.Combine(root,"release-parent"));Start(root,"child");Wait(Path.Combine(root,"grandchild.identity"));Wait(Path.Combine(root,"release-parent-exit"));return;}
  if(role=="child")Start(root,"grandchild");
  Wait(Path.Combine(root,"finish-tree"));
 }
}
