const DualPantoFramework = require('../..');
const {Broker} = DualPantoFramework;
const VoiceInteraction = Broker.voiceInteraction;
const soundsDir = __dirname + '/sounds';

VoiceInteraction.playSound(soundsDir + '/hello.mp3', false);
const soundPlayer = VoiceInteraction.playSound(soundsDir +
  '/example.mp3', true);
soundPlayer.pause();
setTimeout(() => console.log('unpausing player'), 1500);
setTimeout(() => soundPlayer.play(), 2000);
setTimeout(() => console.log('pausing soundplayer'), 3500);
setTimeout(() => soundPlayer.pause(), 4000);
setTimeout(() => console.log('unpausing player again'), 5500);
setTimeout(() => soundPlayer.play(), 6000);
setTimeout(() => console.log('killing soundplayer'), 7500);
setTimeout(() => soundPlayer.stop(), 8000);
setTimeout(() => VoiceInteraction.playSound(soundsDir +
  '/outro.mp3', true), 9000);
