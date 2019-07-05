const DualPantoFramework = require('../..');
const {Broker} = DualPantoFramework;
const VoiceInteraction = Broker.voiceInteraction;
console.log('with promises');
VoiceInteraction.speakText('Hallo').then(
    () => VoiceInteraction.speakText('Welt')).then(
    () => withoutPromise());
let englishVoice;
switch (process.platform) {
  case 'darwin':
    englishVoice = 'Alex';
    break;
  case 'win32':
    englishVoice = 'Microsoft Zira Desktop';
    break;
  default:
    englishVoice = 'voice_kal_diphone';
    break;
}

const withoutPromise = () => {
  console.log('starting speaking without promise');
  VoiceInteraction.speakTextAsync('Dieser Text läuft während der Kode läuft!');
  setTimeout(() => console.log('1 sekunde'), 1000);
  setTimeout(() => console.log('2 sekunde'), 2000);
  setTimeout(() => console.log('3 sekunde'), 3000);
  setTimeout(voiceAndLanguages, 4000);
};

const voiceAndLanguages = () => {
  VoiceInteraction.speakText('We can also change the language', 'EN').then(
      () => VoiceInteraction.speakText('If I speak too slow', 'EN', 1)).then(
      () => VoiceInteraction.speakText('I can go way faster', 'EN', 2)).then(
      () => VoiceInteraction.speakText('I can also change my voice if you' +
      ' pass a voice as the last parameter', 'EN', 1.4, englishVoice));
};
