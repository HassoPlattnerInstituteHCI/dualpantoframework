{
    "variables": {
        "cppdefs": "NODE_GYP",
    },
    "targets": [{
        "target_name": "serial",
        "sources": [
            "./utils/serial/src/node/main.cpp",
            "./utils/serial/src/node/setup.cpp",
            "./utils/serial/src/node/poll.cpp",
            "./utils/serial/src/node/send.cpp",
            "./utils/serial/src/node/receiveHelpers.cpp",
            "./utils/serial/src/node/sendHelpers.cpp",
            "./utils/serial/src/serial/shared.cpp",
            "./utils/serial/src/crashAnalyzer/buffer.cpp",
            "./utils/serial/src/crashAnalyzer/analyze.cpp",
            "./protocol/src/protocol/protocol.cpp"
        ],
        "conditions": [
            ["OS=='win'", {
                "sources": ["./utils/serial/src/serial/win.cpp"]
            }],
            ["OS!='win'", {
                "sources": ["./utils/serial/src/serial/unix.cpp"]
            }],
        ],
        "include_dirs": [
            "./utils/serial/include",
            "./protocol/include"
        ],
        "defines": [
            "<@(cppdefs)"
        ]
    }]
}
