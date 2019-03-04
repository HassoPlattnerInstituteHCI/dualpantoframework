{
    "targets": [{
        "target_name": "serial",
        "sources": [ "./Utils/Serial/serial.cpp", "./Protocol/lib/protocol.cpp" ],
        "include_dirs": [ "./Protocol/include" ],
        "defines": [ "NODE_GYP" ]
    }]
}
