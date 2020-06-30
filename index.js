//
// Check for valid SSML
//

const convert = require('xml-js');
const checktag = require('./checktag');

function getAudioFiles(element) {
  let files = [];

  if ((element.name === 'audio') && (element.attributes.src)) {
    files.push(element.attributes.src);
  }

  if (element.elements) {
    element.elements.forEach((item) => {
      files = files.concat(getAudioFiles(item));
    });
  }

  return files;
}

function removeExtraAudioRecursive(parent, index, element, found) {
  let total = found;
  let removed = false;

  if ((element.name === 'audio') && (element.attributes.src)) {
    if (total < 5) {
      total++;
    } else {
      // Need to remove this one
      parent.splice(index, 1);
      removed = true;
    }
  }

  if (element.elements) {
    let index;
    let result;
    for (index = 0; index < element.elements.length; index++) {
      result = removeExtraAudioRecursive(element.elements, index, element.elements[index], total);
      total = result.total;
      if (result.removed) {
        // Decrement index since an item was removed
        index--;
      }
    }
  }

  // Return the total number of audio files encountered
  return {total: total, removed: removed};
}

function removeExtraAudio(element) {
  removeExtraAudioRecursive(null, 0, element, 0);
}

function checkForValidTagsRecursive(parent, index, errors, element, platform, locale) {
  const validTags = ['audio', 'break', 'emphasis', 'p', 'prosody', 's', 'say-as', 'speak', 'sub'];
  const validAmazonTags = ['amazon:effect', 'amazon:emotion', 'amazon:domain', 'lang', 'phoneme', 'voice', 'w', 'alexa:name'];
  const validGoogleTags = ['par', 'seq', 'media', 'desc'];
  let removedTag;

  if (element.name) {
    if ((validTags.indexOf(element.name) === -1) &&
      !(((platform === 'amazon') && (validAmazonTags.indexOf(element.name) !== -1)) ||
      ((platform === 'google') && (validGoogleTags.indexOf(element.name) !== -1)))) {
      errors.push({type: 'tag', tag: element.name});
      if (element.elements) {
        parent.elements.splice(index, 1, ...element.elements);
      } else {
        parent.elements.splice(index, 1);
      }
      removedTag = true;
    } else {
      const funcName = 'check_' + element.name.replace(/:|-/g, '_');
      removedTag = checktag[funcName](parent, index, errors, element, platform, locale);
    }
  }

  if (element.elements) {
    let i;
    let removed;
    for (i = 0; i < element.elements.length; i++) {
      removed = checkForValidTagsRecursive(element, i, errors, element.elements[i], platform, locale);
      if (removed) {
        // Decrement i since an item was removed
        i--;
      }
    }
  }

  return removedTag;
}

function checkForValidTags(errors, json, platform, locale) {
  checkForValidTagsRecursive(json, 0, errors, json.elements[0], platform, locale);
}

function checkInternal(ssml, options, fix) {
  let errors = [];

  try {
    let result;
    const userOptions = options || {};
    userOptions.platform = userOptions.platform || 'all';

    if (['all', 'amazon', 'google'].indexOf(userOptions.platform) === -1) {
      errors.push({type: 'invalid platform'});
      return Promise.resolve({errors: errors});
    }

    try {
      result = JSON.parse(convert.xml2json(ssml, {compact: false}));
    } catch (err) {
      // Special case - if we replace & with &amp; does it fix it?
      try {
        let text = ssml;
        text = text.replace(/&/g, '&amp;');
        result = JSON.parse(convert.xml2json(text, {compact: false}));

        // OK that worked, let them know it's an & problem
        errors.push({type: 'Invalid & character'});
      } catch(err) {
        // Nope, it's some other error
        errors.push({type: 'Can\'t parse SSML'});
      }

      if (!result || !fix) {
        return Promise.resolve({errors: errors});
      }
    }

    // This needs to be a single item wrapped in a speak tag
    if (!result.elements || (result.elements.length !== 1) ||
      (result.elements[0].name !== 'speak')) {
      errors.push({type: 'tag', tag: 'speak'});
      return Promise.resolve({errors: errors});
    }

    // Make sure only valid tags are present
    checkForValidTags(errors, result, userOptions.platform, userOptions.locale);

    // Count the audio files - is it more than 5?
    // This isn't allowed for Amazon
    if (userOptions.platform !== 'google') {
      const audio = getAudioFiles(result.elements[0]);
      if (audio.length > 5) {
        errors.push({type: 'Too many audio files'});
        if (fix) {
          removeExtraAudio(result.elements[0]);
        }
      }
    }

    return Promise.resolve({json: result, errors: (errors.length ? errors : undefined)});
  } catch (err) {
    errors.push({type: 'unknown error'});
  }

  return Promise.resolve({errors: (errors.length ? errors : undefined)});
}

module.exports = {
  check: function(ssml, options) {
    return checkInternal(ssml, options)
      .then((result) => {
        return result.errors;
      });
  },
  verifyAndFix: function(ssml, options) {
    return checkInternal(ssml, options, true)
      .then((result) => {
        let ssml;
        if (result.json && result.errors) {
          // We have a corrected result
          ssml = convert.json2xml(result.json, {compact: false});
        }

        return {fixedSSML: ssml, errors: result.errors};
      });
  },
};
