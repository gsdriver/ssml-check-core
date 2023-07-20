
const lib = require('../index');

let succeeded = 0;
let failed = 0;

function runTest(testName, ssml, options, expectedResult) {
  return lib.check(ssml, options).then((retVal) => {
    let result;

    if (retVal) {
      result = '';
      retVal.forEach((value) => {
        if (value.position) {
          // Mark the position
          result += 'at position ' + value.position + ' ';
        }

        if (value.message) {
          result += value.message
        } else if (value.type === 'audio') {
          // It's an audio error
          result += 'audio file ' + value.value + ' ' + value.detail;
        } else if (value.tag) {
          result += value.tag + ' tag has invalid ';
          if (value.value) {
            result += value.attribute + ' value ' + value.value;
          } else if (value.attribute) {
            result += 'attribute ' + value.attribute;
          } else {
            result += 'thing';
          }
        } else {
          result += value.type;
        }
      });
    } else {
      result = 'valid';
    }

    if (result == expectedResult) {
      succeeded++;
    } else {
      console.log('FAIL: ' + testName + ' returned ' + result + ' rather than ' + expectedResult);
      failed++;
    }
    return 0;
  });
}

function runCorrection(testName, ssml, options, expectedResult) {
  return lib.verifyAndFix(ssml, options).then((retVal) => {
    let result = (retVal.fixedSSML) ? retVal.fixedSSML : 'valid';
    if (result == expectedResult) {
      succeeded++;
    } else {
      result = retVal.fixedSSML || JSON.stringify(retVal.errors) || 'valid';
      console.log('FAIL: ' + testName + ' returned ' + result + ' rather than ' + expectedResult);
      failed++;
    }

    return 0;
  });
}

const start = Date.now();
const promises = [];

// simple Speak tag test
promises.push(runTest('Simple SSML', '<speak>Simple test</speak>', null, 'valid'));
promises.push(runTest('Missing SSML', 'Simple test', null, 'Text data outside of root node.\nLine: 0\nColumn: 11\nChar: t'));

// Amazon alexa:name test
promises.push(runTest('alexa:name test', '<speak>Hi <alexa:name type="first" personId="amzn1.ask.person.ABCDEF"/> nice to meet you!</speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('alexa:name test (invalid type)', '<speak>Hi <alexa:name type="last" personId="amzn1.ask.person.ABCDEF"/> nice to meet you!</speak>', {platform: 'amazon'}, 'alexa:name tag has invalid type value last'));
promises.push(runTest('alexa:name test (invalid persomId)', '<speak>Hi <alexa:name type="first" personId="none"/> nice to meet you!</speak>', {platform: 'amazon'}, 'alexa:name tag has invalid personId value none'));
promises.push(runTest('alexa:name test (invalid persomId)', '<speak>Hi <alexa:name type="first" personId=""/> nice to meet you!</speak>', {platform: 'amazon'}, 'alexa:name tag has invalid attribute personId'));
promises.push(runTest('alexa:name test (missing type)', '<speak>Hi <alexa:name personId="amzn1.ask.person.ABCDEF"/> nice to meet you!</speak>', {platform: 'amazon'}, 'alexa:name tag has invalid attribute missing type'));
promises.push(runTest('alexa:name test (missing personId)', '<speak>Hi <alexa:name type="first"/> nice to meet you!</speak>', {platform: 'amazon'}, 'alexa:name tag has invalid attribute missing personId'));
promises.push(runTest('alexa:name test (missing type and personId)', '<speak>Hi <alexa:name /> nice to meet you!</speak>', {platform: 'amazon'}, 'alexa:name tag has invalid attribute missing typealexa:name tag has invalid attribute missing personId'));

// Amazon effect tests
promises.push(runTest('Whisper effect', '<speak><amazon:effect name="whispered">Simple test <break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Whisper effect', '<speak><amazon:effect name="whispering">Simple test <break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'amazon:effect tag has invalid name value whispering'));
promises.push(runTest('Phonation', '<speak><amazon:effect name="drc" phonation="soft">Simple test with phonation<break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Invalid Phonation', '<speak><amazon:effect name="drc" phonation="softly">Simple test with phonation<break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'amazon:effect tag has invalid phonation value softly'));
promises.push(runTest('Vocal tract negative', '<speak><amazon:effect name="whispered" vocal-tract-length="-20%">Simple test with lower vocal tract length<break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Vocal tract positive', '<speak><amazon:effect name="whispered" vocal-tract-length="+20%">Simple test with higher vocal tract length<break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Vocal tract out of range', '<speak><amazon:effect name="whispered" vocal-tract-length="-70%">Simple test with lower vocal tract length<break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'amazon:effect tag has invalid vocal-tract-length value -70%'));
promises.push(runTest('Vocal tract absolute', '<speak><amazon:effect name="whispered" vocal-tract-length="200%">Simple test<break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Vocal tract invalid attribute', '<speak><amazon:effect name="whispered" vocal-tract-length="200s">Simple test<break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, 'amazon:effect tag has invalid vocal-tract-length value 200s'));
promises.push(runTest('Invalid Platform with amazon:effect', '<speak><amazon:effect name="drc" phonation="soft">Simple test with phonation<break strength="medium"/> code</amazon:effect></speak>', null, 'amazon:effect tag has invalid thing'));

// Amazon:emotion and amazom:domain
promises.push(runTest('Valid emotion', '<speak><amazon:emotion name="excited" intensity="medium">Christina wins this round!</amazon:emotion></speak>', {platform: 'amazon', locale: 'en-US'}, 'valid'));
promises.push(runTest('Valid emotion', '<speak><amazon:emotion name="disappointed" intensity="high">Here I am with a brain the size of a planet and they ask me to pick up a piece of paper.</amazon:emotion></speak>', {platform: 'amazon', locale: 'en-US'}, 'valid'));
promises.push(runTest('Invalid locale', '<speak><amazon:emotion name="excited" intensity="medium">Christina wins this round!</amazon:emotion></speak>', {platform: 'amazon', locale: 'de-DE'}, 'amazon:emotion tag has invalid attribute none'));
promises.push(runTest('Valid domain', '<speak><amazon:domain name="news">TA miniature manuscript written by the teenage Charlotte Bronte is returning to her childhood home in West Yorkshire after it was bought by a British museum at auction in Paris. </amazon:domain></speak>', {platform: 'amazon', locale: 'en-AU'}, 'valid'));
promises.push(runTest('Invalid locale', '<speak><amazon:domain name="music">Sweet Child O’ Mine by Guns N’ Roses became one of their most successful singles, topping the billboard Hot 100 in 1988. Slash’s guitar solo on this song was ranked the 37th greatest solo of all time. Here’s Sweet Child O’ Mine. </amazon:domain></speak>', {platform: 'amazon', locale: 'en-AU'}, 'amazon:domain tag has invalid name value music'));
promises.push(runTest('Valid locale', '<speak><amazon:domain name="long-form">Sweet Child O’ Mine by Guns N’ Roses became one of their most successful singles, topping the billboard Hot 100 in 1988. Slash’s guitar solo on this song was ranked the 37th greatest solo of all time. Here’s Sweet Child O’ Mine. </amazon:domain></speak>', {platform: 'amazon', locale: 'en-US'}, 'valid'));
promises.push(runTest('Invalid locale', '<speak><amazon:domain name="long-form">Sweet Child O’ Mine by Guns N’ Roses became one of their most successful singles, topping the billboard Hot 100 in 1988. Slash’s guitar solo on this song was ranked the 37th greatest solo of all time. Here’s Sweet Child O’ Mine. </amazon:domain></speak>', {platform: 'amazon', locale: 'en-AU'}, 'amazon:domain tag has invalid name value long-form'));
promises.push(runTest('Valid locale', '<speak><amazon:domain name="fun">Sweet Child O’ Mine by Guns N’ Roses became one of their most successful singles, topping the billboard Hot 100 in 1988. Slash’s guitar solo on this song was ranked the 37th greatest solo of all time. Here’s Sweet Child O’ Mine. </amazon:domain></speak>', {platform: 'amazon', locale: 'jp-JP'}, 'valid'));
promises.push(runTest('No locale domain', '<speak><amazon:domain name="conversational">Hi! Hello World</amazon:domain></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('No locale breath', '<speak><amazon:breath duration="medium" volume="x-loud">Agents are assisting other callers</amazon:breath></speak>', {platform: 'amazon'}, 'valid'));

// Audio tests
promises.push(runTest('Valid audio', '<speak><audio src="foo.mp3" clipBegin="2.2s" clipEnd="3000ms" repeatCount="3"/> You like that?</speak>', {platform: 'google', locale: 'de-DE'}, 'valid'));
promises.push(runTest('Invalid Amazon audio', '<speak><audio src="foo.mp3" clipBegin="2.2s" clipEnd="3000ms" repeatCount="3"/> You like that?</speak>', {platform: 'amazon'}, 'audio tag has invalid attribute clipBeginaudio tag has invalid attribute clipEndaudio tag has invalid attribute repeatCount'));
promises.push(runTest('Valid Google OOG', '<speak><audio speed="80%" soundLevel="-20.5dB" src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg"><desc>a cat purring</desc>PURR (sound didn\'t load)</audio></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Invalid Google speed', '<speak><audio speed="40%" src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg"><desc>a cat purring</desc>PURR (sound didn\'t load)</audio></speak>', {platform: 'google'}, 'audio tag has invalid speed value 40%'));
promises.push(runTest('Invalid Google sound level', '<speak><audio soundLevel="+50dB" src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg"><desc>a cat purring</desc>PURR (sound didn\'t load)</audio></speak>', {platform: 'google'}, 'audio tag has invalid soundLevel value +50dB'));
promises.push(runTest('Stray desc', '<speak><desc>Some Text</desc></speak>', {platform: 'google'}, 'desc tag has invalid thing'));

// Break tests
promises.push(runTest('With break', '<speak>You lost <break time="200ms"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'valid'));
promises.push(runTest('With break in seconds', '<speak>You lost <break time="2.5s"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'valid'));
promises.push(runTest('Break with bad attribute', '<speak>You lost <break tim="200ms"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'break tag has invalid attribute tim'));
promises.push(runTest('Break with long attribute', '<speak>You lost <break time="200s"/> Getting used to losing?  Take a break and come back tomorrow</speak>', null, 'break tag has invalid time value 200s'));

// Mark tests
promises.push(runTest('Valid mark', '<speak>Mary had a little <mark name="animal"/>lamb.</speak>', null, 'valid'));
promises.push(runTest('Invalid mark', '<speak>Mary had a little <mark animal="lamb"/>lamb.</speak>', null, 'mark tag has invalid attribute animal'));

// Breath and auto-breath tests
promises.push(runTest('Valid breath', '<speak>Sometimes you want to insert only <amazon:breath duration="medium" volume="x-loud"/>a single breath.</speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Invalid breath values', '<speak>Sometimes you want to insert only <amazon:breath duration="not too long" volume="xxx-loud"/>a single breath.</speak>', {platform: 'amazon'}, 'amazon:breath tag has invalid duration value not too longamazon:breath tag has invalid volume value xxx-loud'));
promises.push(runTest('Invalid breath attributes', '<speak>Sometimes you want to insert only <amazon:breath duration="medium" loudness="x-loud"/>a single breath.</speak>', {platform: 'amazon'}, 'amazon:breath tag has invalid attribute loudness'));
promises.push(runTest('Valid auto-breath', '<speak><amazon:auto-breaths>Take a breather in reading this text, even though it\'s not too long it\'s perfectly valid SSML</amazon:auto-breaths></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Auto-breath with values', '<speak><amazon:auto-breaths volume="default" frequency="low" duration="long">Take a breather in reading this text, even though it\'s not too long it\'s perfectly valid SSML</amazon:auto-breaths></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Invalid Auto-breath values', '<speak><amazon:auto-breaths volume="whatever" frequency="lowest" duration="long">Take a breather in reading this text, even though it\'s not too long it\'s perfectly valid SSML</amazon:auto-breaths></speak>', {platform: 'amazon'}, 'amazon:auto-breaths tag has invalid volume value whateveramazon:auto-breaths tag has invalid frequency value lowest'));
promises.push(runTest('Invalid auto-breath attributes', '<speak><amazon:auto-breaths name="breathe">Take a breather in reading this text, even though it\'s not too long it\'s perfectly valid SSML</amazon:auto-breaths></speak>', {platform: 'amazon'}, 'amazon:auto-breaths tag has invalid attribute name'));

// Emphasis tests
promises.push(runTest('Valid emphasis', '<speak>I already told you I <emphasis level="strong">really like</emphasis> that person. </speak>', null, 'valid'));
promises.push(runTest('Bad emphasis', '<speak>I already told you I <emphasis level="cute">really like</emphasis> that person. </speak>', null, 'emphasis tag has invalid level value cute'));
promises.push(runTest('Google emphasis', '<speak>I already told you I <emphasis level="none">really like</emphasis> that person. </speak>', {platform: 'google', locale: 'en-GB'}, 'valid'));

// Lang tests
promises.push(runTest('Valid lang', '<speak><lang xml:lang="fr-FR">J\'adore chanter</lang></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Valid lang Brazil', '<speak><lang xml:lang="pt-BR">Blame it on Rio</lang></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Invalid lang', '<speak><lang xml:lang="pt-DE">German Portguese</lang></speak>', {platform: 'amazon'}, 'lang tag has invalid xml:lang value pt-DE'));
promises.push(runTest('Valid lang Brazil All', '<speak><lang xml:lang="pt-BR">Blame it on Rio</lang></speak>', {platform: 'all'}, 'valid'));

// p tests
promises.push(runTest('Valid p', '<speak><p>This is the first paragraph. There should be a pause after this text is spoken.</p><p>This is the second paragraph.</p></speak>', null, 'valid'));
promises.push(runTest('Invalid p', '<speak><p dog="cute">This is the first paragraph. There should be a pause after this text is spoken.</p><p>This is the second paragraph.</p></speak>', null, 'p tag has invalid attribute dog'));

// phoneme tests
promises.push(runTest('Valid phoneme', '<speak>You say, <phoneme alphabet="ipa" ph="pɪˈkɑːn">pecan</phoneme>. I say, <phoneme alphabet="ipa" ph="ˈpi.kæn">pecan</phoneme>.</speak>', {platform: 'all'}, 'valid'));
promises.push(runTest('Invalid phoneme', '<speak>You say, <phoneme alphabet="ipa2">pecan</phoneme>. I say, <phoneme alphabet="ipa" ph="ˈpi.kæn">pecan</phoneme>.</speak>', {platform: 'amazon'}, 'phoneme tag has invalid alphabet value ipa2'));

// prosody tests
promises.push(runTest('Valid rate', '<speak><prosody rate="slow">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid rate', '<speak><prosody rate="xx-large">Hello world</prosody></speak>', null, 'prosody tag has invalid rate value xx-large'));
promises.push(runTest('Valid rate percent', '<speak><prosody rate="150%">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid rate percent', '<speak><prosody rate="5%">Hello world</prosody></speak>', null, 'prosody tag has invalid rate value 5%'));
promises.push(runTest('Valid pitch', '<speak><prosody pitch="low">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid pitch', '<speak><prosody pitch="x-small">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value x-small'));
promises.push(runTest('Valid pitch percent positive', '<speak><prosody pitch="+20%">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Valid pitch percent negative', '<speak><prosody pitch="-10.5%">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid pitch percent positive', '<speak><prosody pitch="+60%">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value +60%'));
promises.push(runTest('Invalid pitch percent negative', '<speak><prosody pitch="-40%">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value -40%'));
promises.push(runTest('Invalid pitch percent format', '<speak><prosody pitch="+2.5.6%">Hello world</prosody></speak>', null, 'prosody tag has invalid pitch value +2.5.6%'));
promises.push(runTest('Valid volume', '<speak><prosody volume="loud">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid volume', '<speak><prosody volume="xx-large">Hello world</prosody></speak>', null, 'prosody tag has invalid volume value xx-large'));
promises.push(runTest('Valid volume dB', '<speak><prosody volume="+4.5dB">Hello world</prosody></speak>', null, 'valid'));
promises.push(runTest('Invalid volume dB', '<speak><prosody volume="-5.5.5dB">Hello world</prosody></speak>', null, 'prosody tag has invalid volume value -5.5.5dB'));
promises.push(runTest('Prosody st', '<speak><prosody rate="slow" pitch="-1st">Come in!<break time="0.5"/>Welcome to the terrifying world of the imagination.</prosody></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Prosody amazon max-duration', '<speak><prosody amazon:max-duration="2s">Come in!<break time="0.5s"/>Welcome to the terrifying world of the imagination.</prosody></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Prosody amazon max-duration on all platforms', '<speak><prosody amazon:max-duration="2s">Come in!<break time="0.5s"/>Welcome to the terrifying world of the imagination.</prosody></speak>', null, 'prosody tag has invalid attribute amazon:max-duration'));

// say-as tests
promises.push(runTest('Valid say-as Amazon', '<speak><say-as interpret-as="interjection">Wow</say-as></speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Valid say-as Google', '<speak><say-as interpret-as="bleep">Wow</say-as></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Invalid say-as all', '<speak><say-as interpret-as="bleep">Wow</say-as></speak>', {platform: 'all'}, 'say-as tag has invalid interpret-as value bleep'));
promises.push(runTest('Valid say-as date', '<speak><say-as interpret-as="date" format="mdy">September 22</say-as></speak>', null, 'valid'));
promises.push(runTest('Invalid say-as', '<speak><say-as interpret-as="interjections">Wow</say-as></speak>', null, 'say-as tag has invalid interpret-as value interjections'));
promises.push(runTest('Invalid say-as date', '<speak><say-as interpret-as="date" format="mddy">September 22</say-as></speak>', null, 'say-as tag has invalid format value mddy'));
promises.push(runTest('Valid Google time', '<speak><say-as interpret-as="time" format="hms12">2:30pm</say-as></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Another valid Google time', '<speak><say-as interpret-as="time" format="hh:mms12">2:30pm</say-as></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Invalid Google time', '<speak><say-as interpret-as="time" format="hqs12">2:30pm</say-as></speak>', {platform: 'google'}, 'say-as tag has invalid format value hqs12'));

// voice tests
promises.push(runTest('Valid voice', '<speak>I want to tell you a secret. <voice name="Kendra">I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'amazon'}, 'valid'));
promises.push(runTest('Valid voice', '<speak>I want to tell you a secret. <voice name="Samantha">I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'amazon'}, 'voice tag has invalid name value Samantha'));
promises.push(runTest('Invalid voice Google', '<speak>I want to tell you a secret. <voice name="Samantha">I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'google'}, 'voice tag has invalid name value Samantha'));
promises.push(runTest('Valid voice Google', '<speak>The dog is friendly<voice name="fr-CA-Wavenet-B">mais la chat est mignon</voice><break time="250ms"/> said a pet shop owner</speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Valid voice Google', '<speak>Today is supposed to be <voice language="en-GB" gender="female" ordering="language gender">Sunday Funday.</voice></speak>', {platform: 'google'}, 'valid'));

// Media tests
promises.push(runTest('Valid media', '<speak><seq><media begin="0.5s"><speak>Who invented the Internet?</speak></media><media begin="2.0s"><speak>The Internet was invented by cats.</speak></media><media soundLevel="-6dB"><audio src="https://actions.google.com/.../cartoon_boing.ogg"/></media><media repeatCount="3" soundLevel="+2.28dB" fadeInDur="2s" fadeOutDur="0.2s"><audio src="https://actions.google.com/.../cat_purr_close.ogg"/></media></seq> </speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Issue 1', '<speak><media xml:id="crowd" soundLevel="5dB" fadeOutDur="1.0s"><audio src="https://actions.google.com/sounds/v1/crowds/battle_cry_high_pitch.ogg" clipEnd="3.0s"><desc>crowd cheering</desc>YEAH!</audio></media></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Issue 2', '<speak><media xml:id="words" begin="crowd.end-1.0s"><speak><emphasis level="strong">Great catch by Amendola! I can\'t believe he got both feet in bounds!</emphasis></speak></media></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Valid syncbase', '<speak><media xml:id="background" soundLevel="-5dB" begin="1s" end="words.end-0.0s" fadeInDur="2.0s" fadeOutDur="1.0s"><audio src="https://actions.google.com/sounds/v1/crowds/battle_crowd_celebration.ogg"><desc>crowd cheering</desc>YEAH!</audio></media></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Long sample', '<speak><par><media xml:id="intro" soundLevel="5dB" fadeOutDur="2.0s"><audio src="https://upload.wikimedia.org/wikipedia/commons/4/43/Nowhere_Land_%28ISRC_USUAN1600051%29.mp3" clipEnd="5.0s"><desc>news intro</desc>INTRO</audio></media><media xml:id="crowd" soundLevel="5dB" fadeOutDur="1.0s" begin="intro.end-1.0s"><audio src="https://actions.google.com/sounds/v1/crowds/battle_cry_high_pitch.ogg" clipEnd="3.0s"><desc>crowd cheering</desc>YEAH!</audio></media><media xml:id="words" begin="crowd.end-1.0s"><speak><emphasis level="strong">Great catch by Amendola! I can\'t believe he got both feet in bounds!</emphasis></speak></media><media xml:id="background" soundLevel="-5dB" begin="1s" end="words.end-0.0s" fadeInDur="2.0s" fadeOutDur="1.0s"><audio src="https://actions.google.com/sounds/v1/crowds/battle_crowd_celebration.ogg"><desc>crowd cheering</desc>YEAH!</audio></media><media xml:id="cheer" begin="words.end-1.0s" soundLevel="0dB" fadeOutDur="1.0s"><audio src="https://actions.google.com/sounds/v1/crowds/team_cheer.ogg" clipBegin="2.0s" clipEnd="6.0s"><desc>team cheer</desc>CHEER!</audio></media></par></speak>', {platform: 'google'}, 'valid'));
promises.push(runTest('Lots of audio files', '<speak><par><media xml:id="sound2" fadeOutDur="2.0s" soundLevel="5dB"><audio src="https://actions.google.com/sounds/v1/weather/distant_thunder.ogg" clipBegin="3.0s" clipEnd="7.0s"/></media><media xml:id="sound3" begin="sound2.end-1.0s" fadeOutDur="2.0s"><audio src="https://actions.google.com/sounds/v1/horror/monster_alien_growl_pained.ogg" clipEnd="3.0s"/></media><media xml:id="sound4" begin="sound3.end-1.0s" fadeOutDur="2.0s"><audio src="https://actions.google.com/sounds/v1/foley/dress_shoe_run_on_wood.ogg" clipEnd="3.0s"/></media><media xml:id="sound5" begin="sound4.end-1.0s" fadeOutDur="2.0s" soundLevel="15dB"><audio src="https://actions.google.com/sounds/v1/doors/wood_door_close_hard.ogg" clipEnd="2.0s"/></media><media xml:id="intro" begin="sound5.end+1.0s"><speak><prosody rate="slow" pitch="-1st">Come in!<break time="0.5"/>Welcome to the terrifying world of the imagination.</prosody></speak></media><media xml:id="sound6" begin="intro.end-0.0s" fadeInDur="1.0s" fadeOutDur="2.0s" soundLevel="5dB"><audio src="https://actions.google.com/sounds/v1/horror/monster_alien_grunt_sleepy.ogg" clipBegin="0.0s" clipEnd="5.0s"/></media><media xml:id="sound1" fadeOutDur="2.0s" end="sound6.end+2.0s"><audio src="https://actions.google.com/sounds/v1/science_fiction/ringing_ambient_background.ogg"/></media></par></speak>', {platform: 'google'}, 'valid'));

// Unsupported tags
promises.push(runTest('Prosody unsupported', '<speak><prosody rate="slow">Hello world</prosody></speak>', {unsupportedTags: ['prosody']}, 'prosody tag has invalid thing'));

// Multiple errors
promises.push(runTest('Bad break and invalid prosody rate', '<speak>You lost <break tim="200ms"/> Getting used to losing?  <prosody rate="xx-large">Take a break and come back tomorrow</prosody></speak>', null, 'break tag has invalid attribute timprosody tag has invalid rate value xx-large'));

// Invalid formats
promises.push(runTest('Invalid XML', '<tag>What is this?', null, 'Converting circular structure to JSON\n    --> starting at object with constructor \'Object\'\n    |     property \'elements\' -> object with constructor \'Array\'\n    |     index 0 -> object with constructor \'Object\'\n    --- property \'parent\' closes the circle'));
promises.push(runTest('Too many audio files', '<speak><audio src=\"https://www.foo.com/foo.mp3\"/> one <audio src=\"https://www.foo.com/foo.mp3\"/> two <audio src=\"https://www.foo.com/foo.mp3\"/> three <audio src=\"https://www.foo.com/foo.mp3\"/> four <audio src=\"https://www.foo.com/foo.mp3\"/> five <audio src=\"https://www.foo.com/foo.mp3\"/> six </speak>', null, 'Too many audio files'));
promises.push(runTest('Invalid platform', '<speak>Hello there</speak>', {platform: 'siri'}, 'invalid platform'));
promises.push(runTest('Invalid ampersand', '<speak>This & that & those</speak>', null, 'Invalid & character'));

// Position tests
promises.push(runTest('Invalid say-as all with position', '<speak><say-as interpret-as="bleep">Wow</say-as></speak>', {platform: 'all', getPositions: true}, 'at position 7 say-as tag has invalid interpret-as value bleep'));
promises.push(runTest('Invalid locale with position', '<speak><amazon:domain name="music">Sweet Child O’ Mine by Guns N’ Roses became one of their most successful singles, topping the billboard Hot 100 in 1988. Slash’s guitar solo on this song was ranked the 37th greatest solo of all time. Here’s Sweet Child O’ Mine. </amazon:domain></speak>', {platform: 'amazon', locale: 'en-AU', getPositions: true}, 'at position 7 amazon:domain tag has invalid name value music'));
promises.push(runTest('Invalid Phonation with position', '<speak><amazon:effect name="drc" phonation="softly">Simple test with phonation<break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon', getPositions: true}, 'at position 7 amazon:effect tag has invalid phonation value softly'));
promises.push(runTest('Bad break and invalid prosody rate with position', '<speak>You lost <break tim="200ms"/> Getting used to losing?  <prosody rate="xx-large">Take a break and come back tomorrow</prosody></speak>', {getPositions: true}, 'at position 16 break tag has invalid attribute timat position 62 prosody tag has invalid rate value xx-large'));
promises.push(runTest('Too many audio files with position', '<speak><audio src=\"https://www.foo.com/foo.mp3\"/> one <audio src=\"https://www.foo.com/foo.mp3\"/> two <audio src=\"https://www.foo.com/foo.mp3\"/> three <audio src=\"https://www.foo.com/foo.mp3\"/> four <audio src=\"https://www.foo.com/foo.mp3\"/> five <audio src=\"https://www.foo.com/foo.mp3\"/> six </speak>', {getPositions: true}, 'at position 246 Too many audio files'));
promises.push(runTest('Invalid tag with position', '<speak><break time="20000ms"/><tag>What is this?</tag>This &amp; that</speak>', {getPositions: true}, 'at position 7 break tag has invalid time value 20000msat position 30 tag tag has invalid thing'));
promises.push(runTest('Invalid tag with element in second position', '<speak><break time="100ms"/><break time="20000ms"/><tag>What is this?</tag>This &amp; that</speak>', {getPositions: true}, 'at position 28 break tag has invalid time value 20000msat position 51 tag tag has invalid thing'));
promises.push(runTest('Invalid tag among similar tags with position','<speak> <p> This is an example of SSML text. Here\'s a sentence with a pause. <break time="2s"/> And here\'s another sentence. </p> <p> <prosody rate="slow">This sentence is spoken slowly.</prosody> <prosody volume="loud">This sentence is spoken loudly.</prosody> <prosody pitch="high">This sentence is spoken with a high pitch.</prosody> </p> <p> <emphasis level="strong">This sentence is emphasized.</emphasis> <emphasis level="moderate">This sentence is moderately emphasized.</emphasis> <emphasis level="reduced">This sentence is reduced in emphasis.</emphasis> </p> <p> <say-as interpret-as="cardinal">123</say-as> <say-as interpret-as="ordinal">1st</say-as> <say-as interpret-as="characters">Hello</say-as> <say-as interpret-as="spell-out">ABC</say-as> <say-as interpret-as="telephone">555-1234</say-as> <say-as interpret-as="date">2023-07-10</say-as> <say-as interpret-as="time">15:30:00</say-as> <say-as interpret-as="verbatim">Text that is read verbatim</say-as> </p> </speak>',{getPositions:true}, 'at position 902 say-as tag has invalid interpret-as value verbatim'));

// Test correct function
promises.push(runCorrection('Valid voice', '<speak>I want to tell you a secret. <voice name="Kendra">I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'amazon'}, 'valid'));
promises.push(runCorrection('Too many audio files', '<speak><audio src=\"https://www.foo.com/foo.mp3\"/> one <audio src=\"https://www.foo.com/foo.mp3\"/> two <audio src=\"https://www.foo.com/foo.mp3\"/> three <audio src=\"https://www.foo.com/foo.mp3\"/> four <audio src=\"https://www.foo.com/foo.mp3\"/> five <audio src=\"https://www.foo.com/foo.mp3\"/> six </speak>', null, '<speak><audio src="https://www.foo.com/foo.mp3"/> one <audio src="https://www.foo.com/foo.mp3"/> two <audio src="https://www.foo.com/foo.mp3"/> three <audio src="https://www.foo.com/foo.mp3"/> four <audio src="https://www.foo.com/foo.mp3"/> five  six </speak>'));
promises.push(runCorrection('Invalid ampersand', '<speak>This & that</speak>', null, '<speak>This &amp; that</speak>'));
promises.push(runCorrection('Invalid prosody rate', '<speak><prosody rate="60">Hello world</prosody></speak>', null, '<speak><prosody rate="60%">Hello world</prosody></speak>'));
promises.push(runCorrection('Invalid volume', '<speak><prosody pokemon="pikachu" volume="louder">Hello <break time="200ms"/> world</prosody></speak>', null, '<speak><prosody volume="+0dB">Hello <break time="200ms"/> world</prosody></speak>'));
promises.push(runCorrection('Whisper effect', '<speak><amazon:effect>Simple test <break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, '<speak><amazon:effect name="whispered">Simple test <break strength="medium"/> code</amazon:effect></speak>'));
promises.push(runCorrection('Invalid tag', '<speak><tag>What is this?</tag><break time="20000ms"/>This & that</speak>', null, '<speak>What is this?<break time="10s"/>This &amp; that</speak>'));
promises.push(runCorrection('Correct voice', '<speak>I want to tell you a secret. <voice name="Samantha">I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'amazon'}, '<speak>I want to tell you a secret. <voice name="Ivy">I am not a real human.</voice>. Can you believe it?</speak>'));
promises.push(runCorrection('Correct say-as all', '<speak><say-as interpret-as="bleep">Wow</say-as></speak>', {platform: 'all'}, '<speak><say-as interpret-as="cardinal">Wow</say-as></speak>'));
promises.push(runCorrection('Invalid Google speed', '<speak><audio speed="140" src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg"><desc>a cat purring</desc>PURR (sound didn\'t load)</audio></speak>', {platform: 'google'}, '<speak><audio speed="140%" src="https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg"><desc>a cat purring</desc>PURR (sound didn\'t load)</audio></speak>'));
promises.push(runCorrection('Prosody invalid', '<speak><prosody rate="slow" pitch="soft">Come in!<break time="0.5"/>Welcome to the terrifying world of the imagination.</prosody></speak>', {platform: 'google'}, '<speak><prosody rate="slow" pitch="+0%">Come in!<break time="0.5"/>Welcome to the terrifying world of the imagination.</prosody></speak>'));
promises.push(runCorrection('Invalid tags', '<speak><tag>What is this?<break time="20000ms"/>This & that<foo/><bar> & those</bar></tag></speak>', null, '<speak>What is this?<break time="10s"/>This &amp; that &amp; those</speak>'));
promises.push(runCorrection('Invalid locale on amazon:emotion', '<speak><amazon:emotion name="excited" intensity="medium">Christina wins this round!</amazon:emotion></speak>', {platform: 'amazon', locale: 'de-DE'}, '<speak>Christina wins this round!</speak>'));
promises.push(runCorrection('Invalid attribute on amazon:domain', '<speak><amazon:domain name="excited" intensity="medium">Christina wins this round!</amazon:domain></speak>', {platform: 'amazon', locale: 'en-US'}, '<speak><amazon:domain name="news">Christina wins this round!</amazon:domain></speak>'));
promises.push(runCorrection('Vocal tract out of range', '<speak><amazon:effect name="whispered" vocal-tract-length="-70%">Simple test with lower vocal tract length<break strength="medium"/> code</amazon:effect></speak>', {platform: 'amazon'}, '<speak><amazon:effect name="whispered" vocal-tract-length="-50%">Simple test with lower vocal tract length<break strength="medium"/> code</amazon:effect></speak>'));
promises.push(runCorrection('Invalid Auto-breath values', '<speak><amazon:auto-breaths volume="whatever" frequency="lowest" duration="long">Take a breather in reading this text, even though it\'s not too long it\'s perfectly valid SSML</amazon:auto-breaths></speak>', {platform: 'amazon'}, '<speak><amazon:auto-breaths volume="medium" frequency="lowest" duration="long" frequncy="medium">Take a breather in reading this text, even though it\'s not too long it\'s perfectly valid SSML</amazon:auto-breaths></speak>'));
promises.push(runCorrection('Invalid voice Google', '<speak>I want to tell you a secret. <voice name="Samantha">I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'google'}, '<speak>I want to tell you a secret. <voice name="en-US-Standard-A">I am not a real human.</voice>. Can you believe it?</speak>'));
promises.push(runCorrection('Invalid voice Google', '<speak>No secrets. <voice>I am not a real human.</voice>. Can you believe it?</speak>', {platform: 'google'}, '<speak>No secrets. <voice name="en-US-Standard-A">I am not a real human.</voice>. Can you believe it?</speak>'));

// Final summary
Promise.all(promises).then(() => {
  console.log('\r\nRan ' + (succeeded + failed) + ' tests in ' + (Date.now() - start) + 'ms; ' + succeeded + ' passed and ' + failed + ' failed');
});
