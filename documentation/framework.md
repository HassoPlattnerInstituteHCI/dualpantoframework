[
  {
    "description": {
      "type": "root",
      "children": [
        {
          "type": "paragraph",
          "children": [
            {
              "type": "text",
              "value": "Class for voice input and output",
              "position": {
                "start": {
                  "line": 1,
                  "column": 1,
                  "offset": 0
                },
                "end": {
                  "line": 1,
                  "column": 33,
                  "offset": 32
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 1,
              "column": 1,
              "offset": 0
            },
            "end": {
              "line": 1,
              "column": 33,
              "offset": 32
            },
            "indent": []
          }
        }
      ],
      "position": {
        "start": {
          "line": 1,
          "column": 1,
          "offset": 0
        },
        "end": {
          "line": 1,
          "column": 33,
          "offset": 32
        }
      }
    },
    "tags": [
      {
        "title": "extends",
        "description": null,
        "lineNumber": 1,
        "type": null,
        "name": "EventEmitter"
      }
    ],
    "loc": {
      "start": {
        "line": 20,
        "column": 0
      },
      "end": {
        "line": 22,
        "column": 2
      }
    },
    "context": {
      "loc": {
        "start": {
          "line": 23,
          "column": 0
        },
        "end": {
          "line": 95,
          "column": 1
        }
      },
      "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
    },
    "augments": [
      {
        "title": "extends",
        "description": null,
        "lineNumber": 1,
        "type": null,
        "name": "EventEmitter"
      }
    ],
    "examples": [],
    "params": [],
    "properties": [],
    "returns": [],
    "sees": [],
    "throws": [],
    "todos": [],
    "constructorComment": {
      "description": {
        "type": "root",
        "children": [
          {
            "type": "paragraph",
            "children": [
              {
                "type": "text",
                "value": "Create a Voiceinteraction object.",
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 34,
                    "offset": 33
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 34,
                "offset": 33
              },
              "indent": []
            }
          }
        ],
        "position": {
          "start": {
            "line": 1,
            "column": 1,
            "offset": 0
          },
          "end": {
            "line": 1,
            "column": 34,
            "offset": 33
          }
        }
      },
      "tags": [],
      "loc": {
        "start": {
          "line": 24,
          "column": 2
        },
        "end": {
          "line": 26,
          "column": 4
        }
      },
      "context": {
        "loc": {
          "start": {
            "line": 27,
            "column": 2
          },
          "end": {
            "line": 30,
            "column": 3
          }
        },
        "file": "/Users/keyray/Documents/dualpantoframework/Framework.js",
        "sortKey": "!/Users/keyray/Documents/dualpantoframework/Framework.js 00000027",
        "code": "{\n  /**\n  * Create a Voiceinteraction object.\n  */\n  constructor(){\n    super();\n    this.voiceCommand;\n  }\n  /**\n   * Speaks a text.\n   * @param {String} txt - The text to speak.\n   * @param {String} [language=DE] - The language to speak.\n   * @param {number} [speed=1.4] - The speed that is spoken with.\n   */\n  speakText(txt, language = 'DE', speed = 1.4) {\n      var speak_voice = \"Anna\";\n      if (language == \"EN\") {\n          speak_voice = \"Alex\";\n      }\n      this.emit('saySpeak', txt);\n      return say.speak(txt, speak_voice, speed, (err) => {\n          if(err) {\n              console.error(err);\n              return;\n          }\n      });\n    }\n    /**\n     * Creates a script which speaks a german text with 1.4 speed.\n     * @param {String} txt - The text to speak.\n     */\n    sayText(txt) {\n      this.run_script([\n        () => this.speakText(txt)\n      ]);\n    }\n\n    playSound(filename) {\n      console.log('play sound is not implemented yet');\n    }\n\n    /**\n     * Sets up the voice input listener.\n     * @param {array} commands - List of Strings to listen for.\n     */\n    setCommands(commands){\n      this.voiceCommand = new VoiceCommand(commands);\n      this.voiceCommand.on('command', function(command) {\n        console.log('Keyword Recognized: ',command);\n        this.emit('keywordRecognized', command);\n      }.bind(this));\n    }\n    /**\n     * starts the listener.\n     */\n    beginListening(){\n      return new Promise (resolve => \n      {\n        this.voiceCommand.startListening();\n        resolve(resolve);\n      });\n    }\n    /**\n     * stops the listener.\n     */\n    haltListening(){\n      return new Promise (resolve => \n      {\n        this.voiceCommand.stopListening();\n        resolve(resolve);\n      });\n    }\n}"
      },
      "augments": [],
      "errors": [],
      "examples": [],
      "params": [],
      "properties": [],
      "returns": [],
      "sees": [],
      "throws": [],
      "todos": []
    },
    "name": "VoiceInteraction",
    "kind": "class",
    "members": {
      "global": [],
      "inner": [],
      "instance": [
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Speaks a text.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 15,
                        "offset": 14
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 15,
                    "offset": 14
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 15,
                "offset": 14
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "The text to speak.",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "String"
              },
              "name": "txt"
            },
            {
              "title": "param",
              "description": "The language to speak.",
              "lineNumber": 3,
              "type": {
                "type": "OptionalType",
                "expression": {
                  "type": "NameExpression",
                  "name": "String"
                }
              },
              "name": "language",
              "default": "DE"
            },
            {
              "title": "param",
              "description": "The speed that is spoken with.",
              "lineNumber": 4,
              "type": {
                "type": "OptionalType",
                "expression": {
                  "type": "NameExpression",
                  "name": "number"
                }
              },
              "name": "speed",
              "default": "1.4"
            }
          ],
          "loc": {
            "start": {
              "line": 31,
              "column": 2
            },
            "end": {
              "line": 36,
              "column": 5
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 37,
                "column": 2
              },
              "end": {
                "line": 49,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "txt",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "The text to speak.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 19,
                            "offset": 18
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 19,
                        "offset": 18
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 19,
                    "offset": 18
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "String"
              }
            },
            {
              "title": "param",
              "name": "language",
              "lineNumber": 3,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "The language to speak.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 23,
                            "offset": 22
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 23,
                        "offset": 22
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 23,
                    "offset": 22
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "String"
              },
              "default": "DE"
            },
            {
              "title": "param",
              "name": "speed",
              "lineNumber": 4,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "The speed that is spoken with.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 31,
                            "offset": 30
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 31,
                        "offset": 30
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 31,
                    "offset": 30
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "number"
              },
              "default": "1.4"
            }
          ],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "speakText",
          "kind": "function",
          "memberof": "VoiceInteraction",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "VoiceInteraction",
              "kind": "class"
            },
            {
              "name": "speakText",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "VoiceInteraction#speakText"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Creates a script which speaks a german text with 1.4 speed.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 60,
                        "offset": 59
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 60,
                    "offset": 59
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 60,
                "offset": 59
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "The text to speak.",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "String"
              },
              "name": "txt"
            }
          ],
          "loc": {
            "start": {
              "line": 50,
              "column": 4
            },
            "end": {
              "line": 53,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 54,
                "column": 4
              },
              "end": {
                "line": 58,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "txt",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "The text to speak.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 19,
                            "offset": 18
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 19,
                        "offset": 18
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 19,
                    "offset": 18
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "String"
              }
            }
          ],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "sayText",
          "kind": "function",
          "memberof": "VoiceInteraction",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "VoiceInteraction",
              "kind": "class"
            },
            {
              "name": "sayText",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "VoiceInteraction#sayText"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Sets up the voice input listener.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 34,
                        "offset": 33
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 34,
                    "offset": 33
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 34,
                "offset": 33
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "List of Strings to listen for.",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "array"
              },
              "name": "commands"
            }
          ],
          "loc": {
            "start": {
              "line": 64,
              "column": 4
            },
            "end": {
              "line": 67,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 68,
                "column": 4
              },
              "end": {
                "line": 74,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "commands",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "List of Strings to listen for.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 31,
                            "offset": 30
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 31,
                        "offset": 30
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 31,
                    "offset": 30
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "array"
              }
            }
          ],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "setCommands",
          "kind": "function",
          "memberof": "VoiceInteraction",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "VoiceInteraction",
              "kind": "class"
            },
            {
              "name": "setCommands",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "VoiceInteraction#setCommands"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "starts the listener.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 21,
                        "offset": 20
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 21,
                    "offset": 20
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 21,
                "offset": 20
              }
            }
          },
          "tags": [],
          "loc": {
            "start": {
              "line": 75,
              "column": 4
            },
            "end": {
              "line": 77,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 78,
                "column": 4
              },
              "end": {
                "line": 84,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "beginListening",
          "kind": "function",
          "memberof": "VoiceInteraction",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "VoiceInteraction",
              "kind": "class"
            },
            {
              "name": "beginListening",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "VoiceInteraction#beginListening"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "stops the listener.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 20,
                        "offset": 19
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 20,
                    "offset": 19
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 20,
                "offset": 19
              }
            }
          },
          "tags": [],
          "loc": {
            "start": {
              "line": 85,
              "column": 4
            },
            "end": {
              "line": 87,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 88,
                "column": 4
              },
              "end": {
                "line": 94,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "haltListening",
          "kind": "function",
          "memberof": "VoiceInteraction",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "VoiceInteraction",
              "kind": "class"
            },
            {
              "name": "haltListening",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "VoiceInteraction#haltListening"
        }
      ],
      "events": [],
      "static": []
    },
    "path": [
      {
        "name": "VoiceInteraction",
        "kind": "class"
      }
    ],
    "namespace": "VoiceInteraction"
  },
  {
    "description": {
      "type": "root",
      "children": [
        {
          "type": "paragraph",
          "children": [
            {
              "type": "text",
              "value": "Class for device handling and basic functions that is exportet as Dualpantoframework",
              "position": {
                "start": {
                  "line": 1,
                  "column": 1,
                  "offset": 0
                },
                "end": {
                  "line": 1,
                  "column": 85,
                  "offset": 84
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 1,
              "column": 1,
              "offset": 0
            },
            "end": {
              "line": 1,
              "column": 85,
              "offset": 84
            },
            "indent": []
          }
        }
      ],
      "position": {
        "start": {
          "line": 1,
          "column": 1,
          "offset": 0
        },
        "end": {
          "line": 1,
          "column": 85,
          "offset": 84
        }
      }
    },
    "tags": [
      {
        "title": "extends",
        "description": null,
        "lineNumber": 1,
        "type": null,
        "name": "EventEmitter"
      }
    ],
    "loc": {
      "start": {
        "line": 97,
        "column": 0
      },
      "end": {
        "line": 99,
        "column": 2
      }
    },
    "context": {
      "loc": {
        "start": {
          "line": 100,
          "column": 0
        },
        "end": {
          "line": 151,
          "column": 1
        }
      },
      "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
    },
    "augments": [
      {
        "title": "extends",
        "description": null,
        "lineNumber": 1,
        "type": null,
        "name": "EventEmitter"
      }
    ],
    "examples": [],
    "params": [],
    "properties": [],
    "returns": [],
    "sees": [],
    "throws": [],
    "todos": [],
    "constructorComment": {
      "description": {
        "type": "root",
        "children": [
          {
            "type": "paragraph",
            "children": [
              {
                "type": "text",
                "value": "Create a Brocker object.",
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 25,
                    "offset": 24
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 25,
                "offset": 24
              },
              "indent": []
            }
          }
        ],
        "position": {
          "start": {
            "line": 1,
            "column": 1,
            "offset": 0
          },
          "end": {
            "line": 1,
            "column": 25,
            "offset": 24
          }
        }
      },
      "tags": [],
      "loc": {
        "start": {
          "line": 101,
          "column": 4
        },
        "end": {
          "line": 103,
          "column": 6
        }
      },
      "context": {
        "loc": {
          "start": {
            "line": 104,
            "column": 4
          },
          "end": {
            "line": 110,
            "column": 5
          }
        },
        "file": "/Users/keyray/Documents/dualpantoframework/Framework.js",
        "sortKey": "!/Users/keyray/Documents/dualpantoframework/Framework.js 00000104",
        "code": "{\n    /**\n    * Create a Brocker object.\n    */\n    constructor() {\n        super();\n        this.devices = new Map();\n        this.prevDevices = new Set();\n        this.disconnectTimeout = 5; // Seconds\n        this.voiceInteraction = new VoiceInteraction();\n    }\n    /**\n     * Creates a script that executes a list of promises.\n     * @param {array} promise_list - the list of functions that invoke promises to execute.\n     */\n    run_script(promise_list) {\n        this._running_script = true;\n        var script_generator = conditional_promise_generator(promise_list, () => this._running_script);\n        co(script_generator)\n        .catch(console.log);\n    }\n    /**\n     * Generates a promise that creates a timeout.\n     * @param {number} ms - number ob ms to wait.\n     * @return {Promise} The promise executing the timeout.\n     */    \n    waitMS(ms) {\n        return new Promise(resolve => setTimeout(() => resolve(resolve), ms));\n    }\n    /**\n     * Returns all connected devices.\n     * @return {Set} The connected devices.\n     */ \n    getDevices() {\n        return new Set(this.devices.values());\n    }\n    /**\n     * Returns the device connected to a specific port\n     * @param {String} port - the port of the device\n     * @return {Device} The connected device.\n     */\n    getDeviceByPort(port) {\n        return this.devices.get(port);\n    }\n    /**\n     * Creates a new virtual device\n     * @return {Device} The new virtual device.\n     */\n    createVirtualDevice() {\n        return new Device('virtual');\n    }\n}"
      },
      "augments": [],
      "errors": [],
      "examples": [],
      "params": [],
      "properties": [],
      "returns": [],
      "sees": [],
      "throws": [],
      "todos": []
    },
    "name": "Broker",
    "kind": "class",
    "members": {
      "global": [],
      "inner": [],
      "instance": [
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Creates a script that executes a list of promises.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 51,
                        "offset": 50
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 51,
                    "offset": 50
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 51,
                "offset": 50
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "the list of functions that invoke promises to execute.",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "array"
              },
              "name": "promise_list"
            }
          ],
          "loc": {
            "start": {
              "line": 111,
              "column": 4
            },
            "end": {
              "line": 114,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 115,
                "column": 4
              },
              "end": {
                "line": 120,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "promise_list",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "the list of functions that invoke promises to execute.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 55,
                            "offset": 54
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 55,
                        "offset": 54
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 55,
                    "offset": 54
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "array"
              }
            }
          ],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "run_script",
          "kind": "function",
          "memberof": "Broker",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Broker",
              "kind": "class"
            },
            {
              "name": "run_script",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Broker#run_script"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Generates a promise that creates a timeout.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 44,
                        "offset": 43
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 44,
                    "offset": 43
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 44,
                "offset": 43
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "number ob ms to wait.",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "number"
              },
              "name": "ms"
            },
            {
              "title": "return",
              "description": "The promise executing the timeout.",
              "lineNumber": 3,
              "type": {
                "type": "NameExpression",
                "name": "Promise"
              }
            }
          ],
          "loc": {
            "start": {
              "line": 121,
              "column": 4
            },
            "end": {
              "line": 125,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 126,
                "column": 4
              },
              "end": {
                "line": 128,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "ms",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "number ob ms to wait.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 22,
                            "offset": 21
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 22,
                        "offset": 21
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 22,
                    "offset": 21
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "number"
              }
            }
          ],
          "properties": [],
          "returns": [
            {
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "The promise executing the timeout.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 35,
                            "offset": 34
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 35,
                        "offset": 34
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 35,
                    "offset": 34
                  }
                }
              },
              "title": "returns",
              "type": {
                "type": "NameExpression",
                "name": "Promise"
              }
            }
          ],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "waitMS",
          "kind": "function",
          "memberof": "Broker",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Broker",
              "kind": "class"
            },
            {
              "name": "waitMS",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Broker#waitMS"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Returns all connected devices.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 31,
                        "offset": 30
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 31,
                    "offset": 30
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 31,
                "offset": 30
              }
            }
          },
          "tags": [
            {
              "title": "return",
              "description": "The connected devices.",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "Set"
              }
            }
          ],
          "loc": {
            "start": {
              "line": 129,
              "column": 4
            },
            "end": {
              "line": 132,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 133,
                "column": 4
              },
              "end": {
                "line": 135,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [],
          "properties": [],
          "returns": [
            {
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "The connected devices.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 23,
                            "offset": 22
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 23,
                        "offset": 22
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 23,
                    "offset": 22
                  }
                }
              },
              "title": "returns",
              "type": {
                "type": "NameExpression",
                "name": "Set"
              }
            }
          ],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "getDevices",
          "kind": "function",
          "memberof": "Broker",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Broker",
              "kind": "class"
            },
            {
              "name": "getDevices",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Broker#getDevices"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Returns the device connected to a specific port",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 48,
                        "offset": 47
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 48,
                    "offset": 47
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 48,
                "offset": 47
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "the port of the device",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "String"
              },
              "name": "port"
            },
            {
              "title": "return",
              "description": "The connected device.",
              "lineNumber": 3,
              "type": {
                "type": "NameExpression",
                "name": "Device"
              }
            }
          ],
          "loc": {
            "start": {
              "line": 136,
              "column": 4
            },
            "end": {
              "line": 140,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 141,
                "column": 4
              },
              "end": {
                "line": 143,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "port",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "the port of the device",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 23,
                            "offset": 22
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 23,
                        "offset": 22
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 23,
                    "offset": 22
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "String"
              }
            }
          ],
          "properties": [],
          "returns": [
            {
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "The connected device.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 22,
                            "offset": 21
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 22,
                        "offset": 21
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 22,
                    "offset": 21
                  }
                }
              },
              "title": "returns",
              "type": {
                "type": "NameExpression",
                "name": "Device"
              }
            }
          ],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "getDeviceByPort",
          "kind": "function",
          "memberof": "Broker",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Broker",
              "kind": "class"
            },
            {
              "name": "getDeviceByPort",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Broker#getDeviceByPort"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Creates a new virtual device",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 29,
                        "offset": 28
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 29,
                    "offset": 28
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 29,
                "offset": 28
              }
            }
          },
          "tags": [
            {
              "title": "return",
              "description": "The new virtual device.",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "Device"
              }
            }
          ],
          "loc": {
            "start": {
              "line": 144,
              "column": 4
            },
            "end": {
              "line": 147,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 148,
                "column": 4
              },
              "end": {
                "line": 150,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [],
          "properties": [],
          "returns": [
            {
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "The new virtual device.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 24,
                            "offset": 23
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 24,
                        "offset": 23
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 24,
                    "offset": 23
                  }
                }
              },
              "title": "returns",
              "type": {
                "type": "NameExpression",
                "name": "Device"
              }
            }
          ],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "createVirtualDevice",
          "kind": "function",
          "memberof": "Broker",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Broker",
              "kind": "class"
            },
            {
              "name": "createVirtualDevice",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Broker#createVirtualDevice"
        }
      ],
      "events": [],
      "static": []
    },
    "path": [
      {
        "name": "Broker",
        "kind": "class"
      }
    ],
    "namespace": "Broker"
  },
  {
    "description": {
      "type": "root",
      "children": [
        {
          "type": "paragraph",
          "children": [
            {
              "type": "text",
              "value": "Class for panto interaction.",
              "position": {
                "start": {
                  "line": 1,
                  "column": 1,
                  "offset": 0
                },
                "end": {
                  "line": 1,
                  "column": 29,
                  "offset": 28
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 1,
              "column": 1,
              "offset": 0
            },
            "end": {
              "line": 1,
              "column": 29,
              "offset": 28
            },
            "indent": []
          }
        }
      ],
      "position": {
        "start": {
          "line": 1,
          "column": 1,
          "offset": 0
        },
        "end": {
          "line": 1,
          "column": 29,
          "offset": 28
        }
      }
    },
    "tags": [
      {
        "title": "extends",
        "description": null,
        "lineNumber": 1,
        "type": null,
        "name": "EventEmitter"
      }
    ],
    "loc": {
      "start": {
        "line": 157,
        "column": 0
      },
      "end": {
        "line": 159,
        "column": 2
      }
    },
    "context": {
      "loc": {
        "start": {
          "line": 160,
          "column": 0
        },
        "end": {
          "line": 413,
          "column": 1
        }
      },
      "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
    },
    "augments": [
      {
        "title": "extends",
        "description": null,
        "lineNumber": 1,
        "type": null,
        "name": "EventEmitter"
      }
    ],
    "examples": [],
    "params": [
      {
        "title": "param",
        "name": "port",
        "lineNumber": 2,
        "description": {
          "type": "root",
          "children": [
            {
              "type": "paragraph",
              "children": [
                {
                  "type": "text",
                  "value": "port on that the device is connected.",
                  "position": {
                    "start": {
                      "line": 1,
                      "column": 1,
                      "offset": 0
                    },
                    "end": {
                      "line": 1,
                      "column": 38,
                      "offset": 37
                    },
                    "indent": []
                  }
                }
              ],
              "position": {
                "start": {
                  "line": 1,
                  "column": 1,
                  "offset": 0
                },
                "end": {
                  "line": 1,
                  "column": 38,
                  "offset": 37
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 1,
              "column": 1,
              "offset": 0
            },
            "end": {
              "line": 1,
              "column": 38,
              "offset": 37
            }
          }
        },
        "type": {
          "type": "NameExpression",
          "name": "String"
        }
      }
    ],
    "properties": [],
    "returns": [],
    "sees": [],
    "throws": [],
    "todos": [],
    "constructorComment": {
      "description": {
        "type": "root",
        "children": [
          {
            "type": "paragraph",
            "children": [
              {
                "type": "text",
                "value": "Creates a new device.",
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 22,
                    "offset": 21
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 22,
                "offset": 21
              },
              "indent": []
            }
          }
        ],
        "position": {
          "start": {
            "line": 1,
            "column": 1,
            "offset": 0
          },
          "end": {
            "line": 1,
            "column": 22,
            "offset": 21
          }
        }
      },
      "tags": [
        {
          "title": "param",
          "description": "port on that the device is connected.",
          "lineNumber": 2,
          "type": {
            "type": "NameExpression",
            "name": "String"
          },
          "name": "port"
        }
      ],
      "loc": {
        "start": {
          "line": 161,
          "column": 4
        },
        "end": {
          "line": 164,
          "column": 7
        }
      },
      "context": {
        "loc": {
          "start": {
            "line": 165,
            "column": 4
          },
          "end": {
            "line": 193,
            "column": 5
          }
        },
        "file": "/Users/keyray/Documents/dualpantoframework/Framework.js",
        "sortKey": "!/Users/keyray/Documents/dualpantoframework/Framework.js 00000165",
        "code": "{\n    /**\n     * Creates a new device.\n     * @param {String} port - port on that the device is connected.\n     */\n    constructor(port) {\n        super();\n        if(port == 'virtual') {\n            let index = 0;\n            port = 'virtual0';\n            while(broker.devices.has(port))\n                port = 'virtual'+(index++);\n        } else {\n            if(process.platform == 'darwin') // macOS\n                port = port.replace('/tty.', '/cu.');\n            else if(process.platform == 'win32') // windows\n                port = '//.//'+port;\n            if(broker.devices.has(port))\n                return broker.devices.get(port);\n            this.serial = true;\n        }\n        this.port = port;\n        this.lastKnownPositions = [];\n        this.lastKnownPositions[0] = new Vector(0,0,0);\n        this.lastKnownPositions[1] = new Vector(0,0,0);\n        this.lastTargetPositions = [];\n        this.lastReceiveTime = process.hrtime();\n        broker.devices.set(this.port, this);\n        if(this.serial)\n            this.serial = serial.open(this.port);\n        this.obstacles = [];\n        this.me = new MoveObject();\n        this.it = new MoveObject();\n    }\n    /**\n     * Disconnect the device.\n     */\n    disconnect() {\n        if(this.serial)\n            serial.close(this.serial);\n        broker.devices.delete(this.port);\n    }\n    /**\n     * Pulls new data from serial connection and handles them.\n     */\n    poll() {\n      if(!this.serial)\n          return;\n      const time = process.hrtime();\n      if(time[0] > this.lastReceiveTime[0]+broker.disconnectTimeout) {\n          this.disconnect();\n          return;\n      }\n      const packets = serial.poll(this.serial);\n      if(packets.length == 0)\n          return;\n      this.lastReceiveTime = time;\n      const packet = packets[packets.length-1];\n      if(packet.length == 16)\n          this.hardwareConfigHash = packet;\n      else if(packet.length == 4*6) {\n          for(let i = 0; i < 2; ++i) {\n              const newPosition = new Vector(packet.readFloatLE(i*12), packet.readFloatLE(i*12+4), packet.readFloatLE(i*12+8));\n              let handleObject = this.getHandleObjects(i);\n              let difference = newPosition.difference(handleObject.position);\n              handleObject.setMovementForce(difference);\n              if(this.lastKnownPositions[i] && newPosition.difference(this.lastKnownPositions[i]).length() <= 0.0){\n                handleObject.move();\n                continue;\n              }\n              let collisionInformation = this.colliding(handleObject.position.sum(difference));\n              if(collisionInformation[0]){\n                if(!handleObject.handlesCollision){\n                  handleObject.handlesCollision = true;\n                  this.handleCollision(i, newPosition, handleObject, collisionInformation[1]);\n                }\n              } else{\n                if(handleObject.handlesCollision){\n                  handleObject.handlesCollision = false;\n                  this.unblock(i)\n                }\n                handleObject.move();\n              }\n              this.lastKnownPositions[i] = newPosition;\n              this.emit('handleMoved', i, this.lastKnownPositions[i]);\n          }\n      }\n    }\n\n    getHandleObjects(index){\n      if(index == 0){\n        return this.me;\n      } else{\n        return this.it;\n      }\n    }\n\n    /**\n     * returns a promise that creates a new obstacle\n     * @param {array} pointArray - list of cornerpoints (as Vectors) of the obstacle to create.\n     * @return {Promise} Promise that creates a new obstacle\n     */\n    createObstacle(pointArray){\n      return new Promise (resolve =>\n        {\n          this.obstacles.push(new Obstacle(pointArray));\n          resolve();\n        });\n    }\n\n    /**\n     * checks if a point is colling with any obstacle\n     * @param {Vector} point - Point to check for collision.\n     * @return {array} with boolen if collision was deteded and if so the edge.\n     */\n    colliding(point){\n      for(let i = 0; i < this.obstacles.length; i++){\n        if(this.obstacles[i].inside(point)[0]){\n          return this.obstacles[i].inside(point);\n        }\n      }\n      return [false];\n    }\n\n    /**\n     * handles collison\n     * @param {number} index - index of handle that has collided\n     * @param {Vector} newPosition - position of colliding handle\n     * @param {MoveObject} object - handle-object of the collinding handle\n     * @param {Obstacle} obstacle - obstacle that was collided with\n     */\n    handleCollision(index, newPosition, object, obstacle){\n      let movement_handle = newPosition.difference(object.position);\n      let collisionPoint = obstacle.findCollisionPoint(object.position, movement_handle);\n      object.setMovementForce(collisionPoint.difference(object.position).scale(0.9));\n      object.move();\n      let collisionDifference = object.position.difference(newPosition);\n      this.moveHandleTo(index, newPosition.sum(collisionDifference.scale(10)));\n    }\n\n    /**\n     * Sends a packet via the serial connection to the panto.\n     * @param {Buffer} packet - the packet to send\n     */\n    send(packet) {\n        if(this.serial)\n            serial.send(this.serial, packet);\n    }\n\n    /**\n     * sets new positions if handles are moved by ViDeb\n     * @param {number} index - index of moved handle\n     * @param {Vector} position - position the handle was moved to\n     */\n    handleMoved(index, position) {\n        position = new Vector(position.x, position.y, position.r);\n        this.emit('handleMoved', index, position);\n    }\n\n    /**\n     * moves a Handle to a position\n     * @param {number} index - index of handle to move\n     * @param {Vector} target - position the handle should be moved to\n     */\n    moveHandleTo(index, target) {\n        this.lastTargetPositions[index] = target;\n        this.emit('moveHandleTo', index, target);\n        if(!this.serial) {\n            this.lastKnownPositions[index] = target;\n            this.emit('moveHandleTo', index, this.lastKnownPositions[index]);\n            return;\n        }\n        const values = (target) ? [target.x, target.y, target.r] : [NaN, NaN, NaN],\n              packet = new Buffer(1+3*4);\n        packet[0] = index;\n        packet.writeFloatLE(values[0], 1);\n        packet.writeFloatLE(values[1], 5);\n        packet.writeFloatLE(values[2], 9);\n        this.send(packet);\n    }\n\n    /**\n     * Returns a promise that invokes handle movement with tween behaviour\n     * @param {number} index - index of handle to move\n     * @param {Vector} target - position the handle should be moved to\n     * @param {number} [duration=500] - time in ms that the movement shall take.\n     * @param {Object} [interpolation_method=TWEEN.Easing.Quadratic.Out] - tween function that is used to generate the movement.\n     * @return {promise} the promise executing the movement\n     */\n    movePantoTo(index, target, duration = 500, interpolation_method = TWEEN.Easing.Quadratic.Out) {\n        return new Promise (resolve => \n        {\n            this.tweenPantoTo(index, target, duration, interpolation_method);\n            resolve(resolve);\n        });\n    }\n\n    /**\n     * Returns a promise that unblocks a handle\n     * @param {number} index - index of handle to unblock\n     * @return {promise} the promise executing the unblock\n     */\n    unblockHandle(index){\n        return new Promise (resolve => \n        {\n            this.unblock(index);\n            resolve(resolve);\n        });\n    }\n\n    /**\n     * Unblocks a handle\n     * @param {number} index - index of handle to unblock\n     */\n    unblock(index) {\n      this.moveHandleTo(index);\n    }\n    \n    /**\n     * Moves a handle with tween movement behaviour\n     * @param {number} index - index of handle to move\n     * @param {Vector} target - position the handle should be moved to\n     * @param {number} [duration=500] - time in ms that the movement shall take.\n     * @param {Object} [interpolation_method=TWEEN.Easing.Quadratic.Out] - tween function that is used to generate the movement.\n     */\n    tweenPantoTo(index, target, duration = 500, interpolation_method = TWEEN.Easing.Quadratic.Out) {\n        let tweenPosition = undefined;\n        if (index == 0 && this.lastKnownPositions[0]) {\n            tweenPosition = this.lastKnownPositions[0];\n        } else if (index == 1 && this.lastKnownPositions[1]) {\n            tweenPosition = this.lastKnownPositions[1];\n        }\n        if(tweenPosition)\n        {\n          tween_stack_counter++;\n\n        if(tween_stack_counter == 1)\n        {\n            setTimeout(animateTween, TWEEN_INTERVAL);\n        }\n\n        let tween = new TWEEN.Tween(tweenPosition) // Create a new tween that modifies 'tweenPosition'.\n            .to(target, duration)\n            .easing(interpolation_method) // Use an easing function to make the animation smooth.\n            .onUpdate(() => { // Called after tween.js updates 'tweenPosition'.\n                this.moveHandleTo(index, tweenPosition);\n            })\n            .onComplete(() => {\n                tween_stack_counter--;\n            })\n            .start(); // Start the tween immediately.\n        }\n    }\n}"
      },
      "augments": [],
      "errors": [],
      "examples": [],
      "params": [
        {
          "title": "param",
          "name": "port",
          "lineNumber": 2,
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "port on that the device is connected.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 38,
                        "offset": 37
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 38,
                    "offset": 37
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 38,
                "offset": 37
              }
            }
          },
          "type": {
            "type": "NameExpression",
            "name": "String"
          }
        }
      ],
      "properties": [],
      "returns": [],
      "sees": [],
      "throws": [],
      "todos": []
    },
    "name": "Device",
    "kind": "class",
    "members": {
      "global": [],
      "inner": [],
      "instance": [
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Disconnect the device.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 23,
                        "offset": 22
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 23,
                    "offset": 22
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 23,
                "offset": 22
              }
            }
          },
          "tags": [],
          "loc": {
            "start": {
              "line": 194,
              "column": 4
            },
            "end": {
              "line": 196,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 197,
                "column": 4
              },
              "end": {
                "line": 201,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "disconnect",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "disconnect",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#disconnect"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Pulls new data from serial connection and handles them.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 56,
                        "offset": 55
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 56,
                    "offset": 55
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 56,
                "offset": 55
              }
            }
          },
          "tags": [],
          "loc": {
            "start": {
              "line": 202,
              "column": 4
            },
            "end": {
              "line": 204,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 205,
                "column": 4
              },
              "end": {
                "line": 247,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "poll",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "poll",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#poll"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "returns a promise that creates a new obstacle",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 46,
                        "offset": 45
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 46,
                    "offset": 45
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 46,
                "offset": 45
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "list of cornerpoints (as Vectors) of the obstacle to create.",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "array"
              },
              "name": "pointArray"
            },
            {
              "title": "return",
              "description": "Promise that creates a new obstacle",
              "lineNumber": 3,
              "type": {
                "type": "NameExpression",
                "name": "Promise"
              }
            }
          ],
          "loc": {
            "start": {
              "line": 257,
              "column": 4
            },
            "end": {
              "line": 261,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 262,
                "column": 4
              },
              "end": {
                "line": 268,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "pointArray",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "list of cornerpoints (as Vectors) of the obstacle to create.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 61,
                            "offset": 60
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 61,
                        "offset": 60
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 61,
                    "offset": 60
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "array"
              }
            }
          ],
          "properties": [],
          "returns": [
            {
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "Promise that creates a new obstacle",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 36,
                            "offset": 35
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 36,
                        "offset": 35
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 36,
                    "offset": 35
                  }
                }
              },
              "title": "returns",
              "type": {
                "type": "NameExpression",
                "name": "Promise"
              }
            }
          ],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "createObstacle",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "createObstacle",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#createObstacle"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "checks if a point is colling with any obstacle",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 47,
                        "offset": 46
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 47,
                    "offset": 46
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 47,
                "offset": 46
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "Point to check for collision.",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              },
              "name": "point"
            },
            {
              "title": "return",
              "description": "with boolen if collision was deteded and if so the edge.",
              "lineNumber": 3,
              "type": {
                "type": "NameExpression",
                "name": "array"
              }
            }
          ],
          "loc": {
            "start": {
              "line": 270,
              "column": 4
            },
            "end": {
              "line": 274,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 275,
                "column": 4
              },
              "end": {
                "line": 282,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "point",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "Point to check for collision.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 30,
                            "offset": 29
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 30,
                        "offset": 29
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 30,
                    "offset": 29
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              }
            }
          ],
          "properties": [],
          "returns": [
            {
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "with boolen if collision was deteded and if so the edge.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 57,
                            "offset": 56
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 57,
                        "offset": 56
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 57,
                    "offset": 56
                  }
                }
              },
              "title": "returns",
              "type": {
                "type": "NameExpression",
                "name": "array"
              }
            }
          ],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "colliding",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "colliding",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#colliding"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "handles collison",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 17,
                        "offset": 16
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 17,
                    "offset": 16
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 17,
                "offset": 16
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "index of handle that has collided",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "number"
              },
              "name": "index"
            },
            {
              "title": "param",
              "description": "position of colliding handle",
              "lineNumber": 3,
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              },
              "name": "newPosition"
            },
            {
              "title": "param",
              "description": "handle-object of the collinding handle",
              "lineNumber": 4,
              "type": {
                "type": "NameExpression",
                "name": "MoveObject"
              },
              "name": "object"
            },
            {
              "title": "param",
              "description": "obstacle that was collided with",
              "lineNumber": 5,
              "type": {
                "type": "NameExpression",
                "name": "Obstacle"
              },
              "name": "obstacle"
            }
          ],
          "loc": {
            "start": {
              "line": 284,
              "column": 4
            },
            "end": {
              "line": 290,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 291,
                "column": 4
              },
              "end": {
                "line": 298,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "index",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "index of handle that has collided",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 34,
                            "offset": 33
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 34,
                        "offset": 33
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 34,
                    "offset": 33
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "number"
              }
            },
            {
              "title": "param",
              "name": "newPosition",
              "lineNumber": 3,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "position of colliding handle",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 29,
                            "offset": 28
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 29,
                        "offset": 28
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 29,
                    "offset": 28
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              }
            },
            {
              "title": "param",
              "name": "object",
              "lineNumber": 4,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "handle-object of the collinding handle",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 39,
                            "offset": 38
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 39,
                        "offset": 38
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 39,
                    "offset": 38
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "MoveObject"
              }
            },
            {
              "title": "param",
              "name": "obstacle",
              "lineNumber": 5,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "obstacle that was collided with",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 32,
                            "offset": 31
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 32,
                        "offset": 31
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 32,
                    "offset": 31
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "Obstacle"
              }
            }
          ],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "handleCollision",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "handleCollision",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#handleCollision"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Sends a packet via the serial connection to the panto.",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 55,
                        "offset": 54
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 55,
                    "offset": 54
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 55,
                "offset": 54
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "the packet to send",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "Buffer"
              },
              "name": "packet"
            }
          ],
          "loc": {
            "start": {
              "line": 300,
              "column": 4
            },
            "end": {
              "line": 303,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 304,
                "column": 4
              },
              "end": {
                "line": 307,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "packet",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "the packet to send",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 19,
                            "offset": 18
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 19,
                        "offset": 18
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 19,
                    "offset": 18
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "Buffer"
              }
            }
          ],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "send",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "send",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#send"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "sets new positions if handles are moved by ViDeb",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 49,
                        "offset": 48
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 49,
                    "offset": 48
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 49,
                "offset": 48
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "index of moved handle",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "number"
              },
              "name": "index"
            },
            {
              "title": "param",
              "description": "position the handle was moved to",
              "lineNumber": 3,
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              },
              "name": "position"
            }
          ],
          "loc": {
            "start": {
              "line": 309,
              "column": 4
            },
            "end": {
              "line": 313,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 314,
                "column": 4
              },
              "end": {
                "line": 317,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "index",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "index of moved handle",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 22,
                            "offset": 21
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 22,
                        "offset": 21
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 22,
                    "offset": 21
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "number"
              }
            },
            {
              "title": "param",
              "name": "position",
              "lineNumber": 3,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "position the handle was moved to",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 33,
                            "offset": 32
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 33,
                        "offset": 32
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 33,
                    "offset": 32
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              }
            }
          ],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "handleMoved",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "handleMoved",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#handleMoved"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "moves a Handle to a position",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 29,
                        "offset": 28
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 29,
                    "offset": 28
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 29,
                "offset": 28
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "index of handle to move",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "number"
              },
              "name": "index"
            },
            {
              "title": "param",
              "description": "position the handle should be moved to",
              "lineNumber": 3,
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              },
              "name": "target"
            }
          ],
          "loc": {
            "start": {
              "line": 319,
              "column": 4
            },
            "end": {
              "line": 323,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 324,
                "column": 4
              },
              "end": {
                "line": 339,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "index",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "index of handle to move",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 24,
                            "offset": 23
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 24,
                        "offset": 23
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 24,
                    "offset": 23
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "number"
              }
            },
            {
              "title": "param",
              "name": "target",
              "lineNumber": 3,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "position the handle should be moved to",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 39,
                            "offset": 38
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 39,
                        "offset": 38
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 39,
                    "offset": 38
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              }
            }
          ],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "moveHandleTo",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "moveHandleTo",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#moveHandleTo"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Returns a promise that invokes handle movement with tween behaviour",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 68,
                        "offset": 67
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 68,
                    "offset": 67
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 68,
                "offset": 67
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "index of handle to move",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "number"
              },
              "name": "index"
            },
            {
              "title": "param",
              "description": "position the handle should be moved to",
              "lineNumber": 3,
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              },
              "name": "target"
            },
            {
              "title": "param",
              "description": "time in ms that the movement shall take.",
              "lineNumber": 4,
              "type": {
                "type": "OptionalType",
                "expression": {
                  "type": "NameExpression",
                  "name": "number"
                }
              },
              "name": "duration",
              "default": "500"
            },
            {
              "title": "param",
              "description": "tween function that is used to generate the movement.",
              "lineNumber": 5,
              "type": {
                "type": "OptionalType",
                "expression": {
                  "type": "NameExpression",
                  "name": "Object"
                }
              },
              "name": "interpolation_method",
              "default": "TWEEN.Easing.Quadratic.Out"
            },
            {
              "title": "return",
              "description": "the promise executing the movement",
              "lineNumber": 6,
              "type": {
                "type": "NameExpression",
                "name": "promise"
              }
            }
          ],
          "loc": {
            "start": {
              "line": 341,
              "column": 4
            },
            "end": {
              "line": 348,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 349,
                "column": 4
              },
              "end": {
                "line": 355,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "index",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "index of handle to move",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 24,
                            "offset": 23
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 24,
                        "offset": 23
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 24,
                    "offset": 23
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "number"
              }
            },
            {
              "title": "param",
              "name": "target",
              "lineNumber": 3,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "position the handle should be moved to",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 39,
                            "offset": 38
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 39,
                        "offset": 38
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 39,
                    "offset": 38
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              }
            },
            {
              "title": "param",
              "name": "duration",
              "lineNumber": 4,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "time in ms that the movement shall take.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 41,
                            "offset": 40
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 41,
                        "offset": 40
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 41,
                    "offset": 40
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "number"
              },
              "default": "500"
            },
            {
              "title": "param",
              "name": "interpolation_method",
              "lineNumber": 5,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "tween function that is used to generate the movement.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 54,
                            "offset": 53
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 54,
                        "offset": 53
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 54,
                    "offset": 53
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "Object"
              },
              "default": "TWEEN.Easing.Quadratic.Out"
            }
          ],
          "properties": [],
          "returns": [
            {
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "the promise executing the movement",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 35,
                            "offset": 34
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 35,
                        "offset": 34
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 35,
                    "offset": 34
                  }
                }
              },
              "title": "returns",
              "type": {
                "type": "NameExpression",
                "name": "promise"
              }
            }
          ],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "movePantoTo",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "movePantoTo",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#movePantoTo"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Returns a promise that unblocks a handle",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 41,
                        "offset": 40
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 41,
                    "offset": 40
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 41,
                "offset": 40
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "index of handle to unblock",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "number"
              },
              "name": "index"
            },
            {
              "title": "return",
              "description": "the promise executing the unblock",
              "lineNumber": 3,
              "type": {
                "type": "NameExpression",
                "name": "promise"
              }
            }
          ],
          "loc": {
            "start": {
              "line": 357,
              "column": 4
            },
            "end": {
              "line": 361,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 362,
                "column": 4
              },
              "end": {
                "line": 368,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "index",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "index of handle to unblock",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 27,
                            "offset": 26
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 27,
                        "offset": 26
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 27,
                    "offset": 26
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "number"
              }
            }
          ],
          "properties": [],
          "returns": [
            {
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "the promise executing the unblock",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 34,
                            "offset": 33
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 34,
                        "offset": 33
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 34,
                    "offset": 33
                  }
                }
              },
              "title": "returns",
              "type": {
                "type": "NameExpression",
                "name": "promise"
              }
            }
          ],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "unblockHandle",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "unblockHandle",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#unblockHandle"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Unblocks a handle",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 18,
                        "offset": 17
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 18,
                    "offset": 17
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 18,
                "offset": 17
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "index of handle to unblock",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "number"
              },
              "name": "index"
            }
          ],
          "loc": {
            "start": {
              "line": 370,
              "column": 4
            },
            "end": {
              "line": 373,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 374,
                "column": 4
              },
              "end": {
                "line": 376,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "index",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "index of handle to unblock",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 27,
                            "offset": 26
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 27,
                        "offset": 26
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 27,
                    "offset": 26
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "number"
              }
            }
          ],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "unblock",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "unblock",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#unblock"
        },
        {
          "description": {
            "type": "root",
            "children": [
              {
                "type": "paragraph",
                "children": [
                  {
                    "type": "text",
                    "value": "Moves a handle with tween movement behaviour",
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 45,
                        "offset": 44
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 45,
                    "offset": 44
                  },
                  "indent": []
                }
              }
            ],
            "position": {
              "start": {
                "line": 1,
                "column": 1,
                "offset": 0
              },
              "end": {
                "line": 1,
                "column": 45,
                "offset": 44
              }
            }
          },
          "tags": [
            {
              "title": "param",
              "description": "index of handle to move",
              "lineNumber": 2,
              "type": {
                "type": "NameExpression",
                "name": "number"
              },
              "name": "index"
            },
            {
              "title": "param",
              "description": "position the handle should be moved to",
              "lineNumber": 3,
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              },
              "name": "target"
            },
            {
              "title": "param",
              "description": "time in ms that the movement shall take.",
              "lineNumber": 4,
              "type": {
                "type": "OptionalType",
                "expression": {
                  "type": "NameExpression",
                  "name": "number"
                }
              },
              "name": "duration",
              "default": "500"
            },
            {
              "title": "param",
              "description": "tween function that is used to generate the movement.",
              "lineNumber": 5,
              "type": {
                "type": "OptionalType",
                "expression": {
                  "type": "NameExpression",
                  "name": "Object"
                }
              },
              "name": "interpolation_method",
              "default": "TWEEN.Easing.Quadratic.Out"
            }
          ],
          "loc": {
            "start": {
              "line": 378,
              "column": 4
            },
            "end": {
              "line": 384,
              "column": 7
            }
          },
          "context": {
            "loc": {
              "start": {
                "line": 385,
                "column": 4
              },
              "end": {
                "line": 412,
                "column": 5
              }
            },
            "file": "/Users/keyray/Documents/dualpantoframework/Framework.js"
          },
          "augments": [],
          "examples": [],
          "params": [
            {
              "title": "param",
              "name": "index",
              "lineNumber": 2,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "index of handle to move",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 24,
                            "offset": 23
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 24,
                        "offset": 23
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 24,
                    "offset": 23
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "number"
              }
            },
            {
              "title": "param",
              "name": "target",
              "lineNumber": 3,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "position the handle should be moved to",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 39,
                            "offset": 38
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 39,
                        "offset": 38
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 39,
                    "offset": 38
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "Vector"
              }
            },
            {
              "title": "param",
              "name": "duration",
              "lineNumber": 4,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "time in ms that the movement shall take.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 41,
                            "offset": 40
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 41,
                        "offset": 40
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 41,
                    "offset": 40
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "number"
              },
              "default": "500"
            },
            {
              "title": "param",
              "name": "interpolation_method",
              "lineNumber": 5,
              "description": {
                "type": "root",
                "children": [
                  {
                    "type": "paragraph",
                    "children": [
                      {
                        "type": "text",
                        "value": "tween function that is used to generate the movement.",
                        "position": {
                          "start": {
                            "line": 1,
                            "column": 1,
                            "offset": 0
                          },
                          "end": {
                            "line": 1,
                            "column": 54,
                            "offset": 53
                          },
                          "indent": []
                        }
                      }
                    ],
                    "position": {
                      "start": {
                        "line": 1,
                        "column": 1,
                        "offset": 0
                      },
                      "end": {
                        "line": 1,
                        "column": 54,
                        "offset": 53
                      },
                      "indent": []
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 1,
                    "column": 1,
                    "offset": 0
                  },
                  "end": {
                    "line": 1,
                    "column": 54,
                    "offset": 53
                  }
                }
              },
              "type": {
                "type": "NameExpression",
                "name": "Object"
              },
              "default": "TWEEN.Easing.Quadratic.Out"
            }
          ],
          "properties": [],
          "returns": [],
          "sees": [],
          "throws": [],
          "todos": [],
          "name": "tweenPantoTo",
          "kind": "function",
          "memberof": "Device",
          "scope": "instance",
          "members": {
            "global": [],
            "inner": [],
            "instance": [],
            "events": [],
            "static": []
          },
          "path": [
            {
              "name": "Device",
              "kind": "class"
            },
            {
              "name": "tweenPantoTo",
              "kind": "function",
              "scope": "instance"
            }
          ],
          "namespace": "Device#tweenPantoTo"
        }
      ],
      "events": [],
      "static": []
    },
    "path": [
      {
        "name": "Device",
        "kind": "class"
      }
    ],
    "namespace": "Device"
  }
]