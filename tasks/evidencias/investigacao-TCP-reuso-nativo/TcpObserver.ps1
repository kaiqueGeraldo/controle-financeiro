$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Net;
using System.Runtime.InteropServices;
public class TcpRow {
    public int Family {get;set;}
    public string LocalAddress {get;set;}
    public int LocalPort {get;set;}
    public string RemoteAddress {get;set;}
    public int RemotePort {get;set;}
    public int State {get;set;}
    public int Pid {get;set;}
}
public static class NativeTcp {
    [DllImport("iphlpapi.dll", SetLastError=true)]
    static extern uint GetExtendedTcpTable(IntPtr buffer, ref int size, bool order, int family, int tableClass, uint reserved);
    static int Port(IntPtr p, int offset) { return Marshal.ReadByte(p, offset)*256 + Marshal.ReadByte(p, offset+1); }
    static string Address(IntPtr p, int offset, int size) {
        var bytes=new byte[size]; Marshal.Copy(IntPtr.Add(p,offset),bytes,0,size); return new IPAddress(bytes).ToString();
    }
    public static TcpRow[] Snapshot(int port) {
        var result=new List<TcpRow>();
        foreach(int family in new[]{2,23}) {
            int size=0; uint code=GetExtendedTcpTable(IntPtr.Zero,ref size,false,family,5,0);
            if(code!=122) throw new Win32Exception((int)code,"TCP size query failed");
            IntPtr buffer=Marshal.AllocHGlobal(size);
            try {
                code=GetExtendedTcpTable(buffer,ref size,false,family,5,0);
                if(code!=0) throw new Win32Exception((int)code,"TCP snapshot failed");
                int count=Marshal.ReadInt32(buffer), stride=family==2?24:56;
                for(int i=0;i<count;i++) {
                    IntPtr row=IntPtr.Add(buffer,4+i*stride);
                    int local=Port(row,family==2?8:20), remote=Port(row,family==2?16:44);
                    if(port!=0 && local!=port && remote!=port) continue;
                    result.Add(new TcpRow { Family=family==2?4:6, LocalAddress=Address(row,family==2?4:0,family==2?4:16), LocalPort=local,
                        RemoteAddress=Address(row,family==2?12:24,family==2?4:16), RemotePort=remote,
                        State=Marshal.ReadInt32(row,family==2?0:48), Pid=Marshal.ReadInt32(row,family==2?20:52) });
                }
            } finally { Marshal.FreeHGlobal(buffer); }
        }
        return result.ToArray();
    }
}
'@
[Console]::Out.WriteLine('READY')
while ($null -ne ($line = [Console]::In.ReadLine())) {
    try {
        $port = [int]::Parse($line)
        $started = [Diagnostics.Stopwatch]::GetTimestamp()
        $rows = @([NativeTcp]::Snapshot($port))
        $record = @{ utc=[DateTime]::UtcNow.ToString('o'); monotonic=[Diagnostics.Stopwatch]::GetTimestamp(); frequency=[Diagnostics.Stopwatch]::Frequency; started=$started; rows=$rows }
        [Console]::Out.WriteLine(($record | ConvertTo-Json -Depth 5 -Compress))
    } catch {
        [Console]::Out.WriteLine((@{error=$_.Exception.Message} | ConvertTo-Json -Compress))
    }
}
