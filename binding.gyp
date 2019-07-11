{
    "targets": [{
        "target_name": "serial",
        "sources": [
            "./Utils/Serial/src/node/node.cpp",
            "./Utils/Serial/src/serial/shared.cpp",
            "./Protocol/src/protocol/protocol.cpp"
        ],
        "conditions": [
            ["OS=='win'", {
                "sources": ["./Utils/Serial/src/serial/win.cpp"]
            }],
            ["OS!='win'", {
                "sources": ["./Utils/Serial/src/serial/unix.cpp"]
            }],
        ],
        "include_dirs": [
            "./Utils/Serial/include",
            "./Protocol/include"
        ],
        "defines": [ "NODE_GYP" ]
    }]
}
