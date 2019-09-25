{
    "targets": [{
        "target_name": "serial",
        "sources": [
            "./Utils/Serial/src/node/main.cpp",
            "./Utils/Serial/src/node/setup.cpp",
            "./Utils/Serial/src/node/poll.cpp",
            "./Utils/Serial/src/node/send.cpp",
            "./Utils/Serial/src/node/receiveHelpers.cpp",
            "./Utils/Serial/src/node/sendHelpers.cpp",
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
