const DualPantoFramework = require('../..');
const {Broker} = DualPantoFramework;
const VoiceInteraction = Broker.voiceInteraction;
console.log('with promises');
VoiceInteraction.speakText('Hallo').then(
    () => VoiceInteraction.speakText('Welt')).then(() => withoutPromise());
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
  console.log('startting speaking without promise');
  VoiceInteraction.speakTextAsync('Dieser Text läuft während der Kode läuft!');
  setTimeout(() => console.log('1 sekunde'), 1000);
  setTimeout(() => console.log('2 sekunde'), 2000);
  setTimeout(() => console.log('3 sekunde'), 3000);
  setTimeout(voiceAndLanguages, 4000);
};

const voiceAndLanguages = () => {
  VoiceInteraction.speakText('We can also change the language', 'EN').then(
      () => VoiceInteraction.speakText('If I speak to slow', 'EN')).then(
      () => VoiceInteraction.speakText('I can go waay faster', 'EN', 3)).then(
      () => VoiceInteraction.speakText('Also I can change my Voice if you' +
      ' pass a Voice as the last parameter', 'EN', 1, englishVoice));
};
