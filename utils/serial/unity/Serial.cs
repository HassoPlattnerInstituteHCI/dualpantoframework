using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;

public class Serial : MonoBehaviour {
    public delegate void SyncDelegate(ulong handle);
    public delegate void HeartbeatDelegate(ulong handle);
    public delegate void PositionDelegate(ulong handle, [MarshalAs(UnmanagedType.LPArray, ArraySubType = UnmanagedType.R8, SizeConst = 10)] double[] positions);
    public delegate void LoggingDelegate(IntPtr msg);

    protected ulong Handle;
    
    [DllImport("serial")]
    private static extern uint GetRevision();
    [DllImport("serial")]
    private static extern void SetSyncHandler(SyncDelegate func);
    [DllImport("serial")]
    private static extern void SetHeartbeatHandler(HeartbeatDelegate func);
    [DllImport("serial")]
    private static extern void SetPositionHandler(PositionDelegate func);
    [DllImport("serial")]
    private static extern void SetLoggingHandler(LoggingDelegate func);
    [DllImport("serial")]
    private static extern ulong Open(IntPtr port);
    [DllImport("serial")]
    private static extern void Close(ulong handle);
    [DllImport("serial")]
    private static extern void Poll(ulong handle);
    [DllImport("serial")]
    private static extern void SendSyncAck(ulong handle);
    [DllImport("serial")]
    private static extern void SendHeartbeatAck(ulong handle);
    
    private static void SyncHandler(ulong handle)
    {
        Debug.Log("Received sync");
        SendSyncAck(handle);
    }
    
    private static void HeartbeatHandler(ulong handle)
    {
        Debug.Log("Received heartbeat");
        SendHeartbeatAck(handle);
    }

    private static void PositionHandler(ulong handle, [MarshalAs(UnmanagedType.LPArray, ArraySubType = UnmanagedType.R8, SizeConst = 10)] double[] positions)
    {
        Debug.Log("Received positions: (" + positions[0] + "|" + positions[1] + ")");
        //Debug.Log("Received positions");
    }

    private static void LogHandler(IntPtr msg)
    {
        Debug.Log(Marshal.PtrToStringAnsi(msg));
    }

    private static ulong OpenPort(string port)
    {
        return Open(Marshal.StringToHGlobalAnsi(port));
    }

    void Start ()
    {
        Debug.Log("Serial protocol revision: " + GetRevision());
        SetLoggingHandler(LogHandler);
        SetSyncHandler(SyncHandler);
        SetHeartbeatHandler(HeartbeatHandler);
        SetPositionHandler(PositionHandler);
        // should be discovered automatically
        Handle = OpenPort("//.//COM3");
    }
    
    void Update ()
    {
        Poll(Handle);
    }

    void OnDestroy()
    {
        Close(Handle);
    }
}
