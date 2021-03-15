{
    "variables": {
        "cppdefs": "NODE_GYP",
    },
    "targets": [{
        "target_name": "serial",
        "sources": [
            "./src/node/main.cpp",
            "./src/node/setup.cpp",
            "./src/node/poll.cpp",
            "./src/node/send.cpp",
            "./src/node/receiveHelpers.cpp",
            "./src/node/sendHelpers.cpp",
            "./src/serial/shared.cpp",
            "./src/cppLib/lib.cpp",
            "./src/crashAnalyzer/buffer.cpp",
            "./src/crashAnalyzer/analyze.cpp",
            "../protocol/src/protocol/protocol.cpp"
        ],
        "conditions": [
            ["OS=='win'", {
                "sources": ["./src/serial/win.cpp"]
            }],
            ["OS!='win'", {
                "sources": ["./src/serial/unix.cpp"]
            }],
        ],
        "include_dirs": [
            "./include",
            "../protocol/include"
        ],
        "defines": [
            "<@(cppdefs)"
        ]
    }]
}
