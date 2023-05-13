//
// Validates different tags
//

function createTagError(element, attribute, undefinedValue) {
  const error = {type: 'tag', tag: element.name};

  error.type = 'tag';
  error.tag = element.name;
  error.attribute = attribute;
  error.value = (undefinedValue || !element.attributes) ? undefined : element.attributes[attribute];
  if (element.position !== undefined) {
    error.position = element.position;
  }

  return error;
}

function readDuration(text, platform, maximum) {
  // It must be of the form #s or #ms
  let time;
  if (!maximum && (text === 'infinity')) {
    time = Number.MAX_SAFE_INTEGER;
  } else if (text.match('[0-9]+ms')) {
    time = parseInt(text);
  } else if (text.match(/^[0-9]+(\.[0-9]+)?s$/g)) {
    time = 1000 * parseInt(text);
  } else if ((platform === 'google') && text.match(/^[0-9]+(\.[0-9]+)?$/g)) {
    time = 1000 * parseInt(text);
  } else {
    // No good
    return undefined;
  }

  if (maximum) {
    time = (time <= maximum) ? time : undefined;
  }

  return time;
}

function numberInRange(text, min, max, defaultValue) {
  let value = parseFloat(text);
  let inRange = true;

  if (isNaN(value)) {
    inRange = false;
    value = defaultValue;
  } else if (value < min) {
    inRange = false;
    value = min;
  } else if (value > max) {
    inRange = false;
    value = max;
  }

  return {inRange: inRange, value: value};
}

//
// Set of functions that check individual tags
//

const check_alexa_name = (parent, index, errors, element, platform, locale) => {
  // If a alexa:name tag is available it must have an attribute type with value 'first' and an attribute personId
  const attributes = Object.keys(element.attributes || {});
  attributes.forEach((attribute) => {
    if (attribute === 'type') {
      if (['first'].indexOf(element.attributes.type) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.type = 'first';
      }
    } else if (attribute === 'personId') {
      if ((element.attributes.personId).indexOf('amzn1.ask.person.') === -1) {
        errors.push(createTagError(element, attribute));
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  // Also, type is required
  if (attributes.indexOf('type') === -1) {
    errors.push(createTagError(element, 'missing type'));
    element.attributes = {type: 'first'};
  }

  // Also, personId is required
  if (attributes.indexOf('personId') === -1) {
    errors.push(createTagError(element, 'missing personId'));
    element.attributes = {personId: 'amzn1.ask.person.ABCD'};
  }

  return false;
};

const check_amazon_auto_breaths = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});

  // Valid attributes are duration, frequency and volume
  attributes.forEach((attribute) => {
    if (attribute === 'duration') {
      if (['default', 'x-short', 'short', 'medium', 'long', 'x-long']
        .indexOf(element.attributes.duration) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.duration = 'medium';
      }
    } else if (attribute === 'volume') {
      if (['default', 'x-soft', 'soft', 'medium', 'loud', 'x-loud']
        .indexOf(element.attributes.volume) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.volume = 'medium';
      }
    } else if (attribute === 'frequency') {
      if (['default', 'x-low', 'low', 'medium', 'high', 'x-high']
        .indexOf(element.attributes.frequency) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.frequncy = 'medium';
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  return false;
};

const check_amazon_breath = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});

  // Valid attributes are duration and volume
  attributes.forEach((attribute) => {
    if (attribute === 'duration') {
      if (['default', 'x-short', 'short', 'medium', 'long', 'x-long']
        .indexOf(element.attributes.duration) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.duration = 'medium';
      }
    } else if (attribute === 'volume') {
      if (['default', 'x-soft', 'soft', 'medium', 'loud', 'x-loud']
        .indexOf(element.attributes.volume) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.volume = 'medium';
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  return false;
};

const check_amazon_domain = (parent, index, errors, element, platorm, locale) => {
  // The locale is optional but if set
  // This tag is only valid for en-US, de-DE, en-GB, en-CA, en-AU, and jp-JP
  if (locale && (['en-US', 'en-GB', 'jp-JP', 'de-DE', 'en-CA', 'en-AU'].indexOf(locale) === -1)) {
    // Keep the text, but remove the element
    errors.push(createTagError(element, 'none'));
    if (element.elements) {
      parent.elements.splice(index, 1, ...element.elements);
    } else {
      parent.elements.splice(index, 1);
    }
    return true;
  }

  // name field is required and can be news or music
  const attributes = Object.keys(element.attributes || {});
  attributes.forEach((attribute) => {
    if (attribute === 'name') {
      const allowedValues = {
        conversational: ['en-US', 'jp-JP'],
        'long-form': ['en-US'],
        music: ['de-DE', 'en-US', 'en-CA', 'en-GB'],
        news: ['en-US', 'en-AU'],
        fun: ['jp-JP'],
      };

      if (!allowedValues[element.attributes.name] || 
        ((locale && (allowedValues[element.attributes.name].indexOf(locale) === -1)))) {
        errors.push(createTagError(element, attribute));
        element.attributes.name = 'news';
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  // Also, name is required
  if (attributes.length === 0) {
    errors.push(createTagError(element, 'none'));
    element.attributes = {name: 'news'};
  }
};

const check_amazon_effect = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});
  attributes.forEach((attribute) => {
    if (attribute === 'name') {
      if (['drc', 'whispered'].indexOf(element.attributes.name) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.name = 'whispered';
      }
    } else if (attribute === 'phonation') {
      if (['soft'].indexOf(element.attributes.phonation) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.phonation = 'soft';
      }
    } else if (attribute === 'vocal-tract-length') {
      // Value can be between -50% and +100%, or an absolute value percentage
      const match = element.attributes['vocal-tract-length'].match(/([\+|\-]?)(\d+)%/);
      if (!match) {
        errors.push(createTagError(element, attribute));
        element.attributes['vocal-tract-length'] = '+100%';
      } else if (match[1].length) {
        const range = numberInRange(`${match[1]}${match[2]}`, -50, 100, undefined);
        if (!range.inRange) {
          errors.push(createTagError(element, attribute));
          element.attributes['vocal-tract-length'] = `${range.value > 0 ? '+' : ''}${range.value}%`;
        }
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  // Also, name is required
  if (attributes.length === 0) {
    errors.push(createTagError(element, 'none'));
    element.attributes = {name: 'whispered'};
  }

  return false;
};

const check_amazon_emotion = (parent, index, errors, element, platform, locale) => {
  // This tag is only valid for en-US, en-GB, and jp-JP
  if (['en-US', 'en-GB', 'jp-JP'].indexOf(locale) === -1) {
    // Keep the text, but remove the element
    errors.push(createTagError(element, 'none'));
    if (element.elements) {
      parent.elements.splice(index, 1, ...element.elements);
    } else {
      parent.elements.splice(index, 1);
    }
    return true;
  }

  // name and intensity are the supported attributes
  const attributes = Object.keys(element.attributes || {});
  attributes.forEach((attribute) => {
    if (attribute === 'name') {
      if (['excited', 'disappointed'].indexOf(element.attributes.name) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.name = 'excited';
      }
    } else if (attribute === 'intensity') {
      if (['low', 'medium', 'high'].indexOf(element.attributes.intensity) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.intensity = 'medium';
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  // Also, name and intensity are both required
  if (attributes.length !== 2) {
    errors.push(createTagError(element, 'none'));
    element.attributes.name = element.attributes.name || 'excited';
    element.attributes.intensity = element.attributes.intensity || 'medium';
  }

  return false;
};

const check_audio = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});
  let removed;

  attributes.forEach((attribute) => {
    if ((platform === 'google') && (attribute === 'clipBegin')) {
      if (readDuration(element.attributes.clipBegin, platform) === undefined) {
        errors.push(createTagError(element, attribute));
        element.attributes.clipBegin = undefined;
      }
    } else if ((platform === 'google') && (attribute === 'clipEnd')) {
      if (readDuration(element.attributes.clipEnd, platform) === undefined) {
        errors.push(createTagError(element, attribute));
        element.attributes.clipEnd = undefined;
      }
    } else if ((platform === 'google') && (attribute === 'speed')) {
      const speed = numberInRange(element.attributes.speed, 50, 200, 100);
      if (!element.attributes.speed.match(/^(\+)?[0-9]+(\.[0-9]+)?%$/g) || !speed.inRange) {
        errors.push(createTagError(element, attribute));
        element.attributes.speed = speed.value + '%';
      }
    } else if ((platform === 'google') && (attribute === 'repeatCount')) {
      if (!element.attributes.repeatCount.match(/^(\+)?[0-9]+(\.[0-9]+)?$/g)) {
        errors.push(createTagError(element, attribute));
        element.attributes.repeatCount = '1';
      }
    } else if ((platform === 'google') && (attribute === 'repeatDur')) {
      if (readDuration(element.attributes.repeatDur, platform) === undefined) {
        errors.push(createTagError(element, attribute));
        element.attributes.repeatDur = undefined;
      }
    } else if ((platform === 'google') && (attribute === 'soundLevel')) {
      // It's OK if it's of the form +xdB or - xdB; value doesn't matter
      const soundLevel = numberInRange(element.attributes.soundLevel, -40, 40, 0);
      if (!element.attributes.soundLevel.match(/^[+-][0-9]+(\.[0-9]+)?dB$/g) || !soundLevel.inRange) {
        errors.push(createTagError(element, attribute));
        element.attributes.soundLevel = (soundLevel.value < 0)
          ? (soundLevel.value + 'dB') : ('+' + soundLevel.value + 'dB');
      }
    } else if (attribute !== 'src') {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  // Also, src is required - if not present remove the whole element
  if (attributes.length === 0) {
    errors.push(createTagError(element, 'none'));
    parent.elements.splice(index, 1);
    removed = true;
  }

  return removed;
};

const check_break = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});
  // Attribute must be time or strength
  attributes.forEach((attribute) => {
    if (attribute === 'strength') {
      if (['none', 'x-weak', 'weak', 'medium', 'strong', 'x-strong']
        .indexOf(element.attributes.strength) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.strength = 'medium';
      }
    } else if (attribute === 'time') {
      // Must be valid duration
      if (readDuration(element.attributes.time, platform, 10000) === undefined) {
        errors.push(createTagError(element, attribute));
        element.attributes.time = '10s';
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  // If there isn't a strength or time, add one
  if (!element.attributes.strength && !element.attributes.time) {
    element.attributes.strength = 'medium';
  }

  return false;
};

const check_desc = (parent, index, errors, element, platform, locale) => {
  // Desc is valid as part of an audio tag on Google
  let removed;
  if (!parent || (parent.name !== 'audio')) {
    // Invalid in this context
    const error = {type: 'tag', tag: element.name};
    if (element.position !== undefined) {
      error.position = element.position;
    }
    errors.push(error);
    parent.elements.splice(index, 1);
    removed = true;
  }

  return removed;
};

const check_emphasis = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});

  // Must be level attribute
  attributes.forEach((attribute) => {
    if (attribute === 'level') {
      if (['strong', 'moderate', 'reduced']
        .indexOf(element.attributes.level) === -1) {
        // None is also allowed on Google
        if ((platform !== 'google') || (element.attributes.level !== 'none')) {
          errors.push(createTagError(element, attribute));
          element.attributes.level = 'moderate';
        }
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  // Also, level is required
  if (attributes.length === 0) {
    errors.push(createTagError(element, 'none'));
    element.attributes = {level: 'moderate'};
  }

  return false;
};

const check_lang = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});

  const validLocales = [
    'de-DE', 'en-AU', 'en-CA', 'en-GB', 'en-IN', 'en-US', 'es-ES', 'es-MX', 'es-US',
    'fr-CA', 'fr-FR', 'hi-IN', 'it-IT', 'ja-JP', 'pt-BR'
  ];
  // Must be xml:lang attribute
  attributes.forEach((attribute) => {
    if (attribute === 'xml:lang') {
      if (!validLocales.includes(element.attributes['xml:lang'])) {
        errors.push(createTagError(element, attribute));
        element.attributes['xml:lang'] = 'en-US';
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  // Also, xml:lang is required
  if (attributes.length === 0) {
    errors.push(createTagError(element, 'none'));
    element.attributes = {'xml:lang': 'en-US'};
  }

  return false;
};

const check_mark = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});

  // Only the name field is recognized and is required
  attributes.forEach((attribute) => {
    if (attribute !== 'name') {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  // Also, name is required
  if (attributes.length === 0) {
    errors.push(createTagError(element, 'none'));
    element.attributes = {name: 'mark'};
  }

  return false;
};

const check_media = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});
  attributes.forEach((attribute) => {
    if (attribute === 'xml:id') {
      if (!element.attributes['xml:id'].match(/^([-_#]|[a-z]|[A-Z]|ß|ö|ä|ü|Ö|Ä|Ü|æ|é|[0-9])+$/g)) {
        errors.push(createTagError(element, attribute));
        element.attributes['xml:id'] = 'id_' + index;
      }
    } else if (attribute === 'begin') {
      if (!element.attributes.begin.match(/^[+-]?[0-9]+(\.[0-9]+)?(h|min|s|ms)$/g)
        && !element.attributes.begin.match(/^([-_#]|[a-z]|[A-Z]|ß|ö|ä|ü|Ö|Ä|Ü|æ|é|[0-9])+\.(begin|end)[+-][0-9]+(\.[0-9]+)?(h|min|s|ms)$/g)) {
        errors.push(createTagError(element, attribute));
        element.attributes.begin = '0';
      }
    } else if (attribute === 'end') {
      if (!element.attributes.end.match(/^[+-]?[0-9]+(\.[0-9]+)?(h|min|s|ms)$/g)
        && !element.attributes.end.match(/^([-_#]|[a-z]|[A-Z]|ß|ö|ä|ü|Ö|Ä|Ü|æ|é|[0-9])+\.(begin|end)[+-][0-9]+(\.[0-9]+)?(h|min|s|ms)$/g)) {
        errors.push(createTagError(element, attribute));
        element.attributes.end = undefined;
      }
    } else if (attribute === 'repeatCount') {
      if (!element.attributes.repeatCount.match(/^(\+)?[0-9]+(\.[0-9]+)?$/g)) {
        errors.push(createTagError(element, attribute));
        element.attributes.repeatCount = '1';
      }
    } else if (attribute === 'repeatDur') {
      if (readDuration(element.attributes.repeatDur, platform) === undefined) {
        errors.push(createTagError(element, attribute));
        element.attributes.repeatDur = undefined;
      }
    } else if (attribute === 'soundLevel') {
      // It's OK if it's of the form +xdB or - xdB; value doesn't matter
      if (!element.attributes.soundLevel.match(/^[+-]?[0-9]+(\.[0-9]+)?dB$/g)) {
        errors.push(createTagError(element, attribute));
        element.attributes.soundLevel = '+0dB';
      }
    } else if (attribute === 'fadeInDur') {
      if (readDuration(element.attributes.fadeInDur, platform) === undefined) {
        errors.push(createTagError(element, attribute));
        element.attributes.fadeInDur = '0s';
      }
    } else if (attribute === 'fadeOutDur') {
      if (readDuration(element.attributes.fadeOutDur, platform) === undefined) {
        errors.push(createTagError(element, attribute));
        element.attributes.fadeOutDur = '0s';
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
    }
  });

  return false;
};

const check_p = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});

  // No attributes allowed
  attributes.forEach((attribute) => {
    errors.push(createTagError(element, attribute, true));
    element.attributes[attribute] = undefined;
  });

  return false;
};

const check_s = check_p;

const check_par = (parent, index, errors, element, platform, locale) => {
  // These elements house other par, seq, or media elements
  if (element.elements) {
    let i;
    for (i = 0; i < element.elements.length; i++) {
      const item = element.elements[i];
      if (['par', 'seq', 'media'].indexOf(item.name) === -1) {
        const error = {type: 'tag', tag: element.name};
        error.value = item.name;
        if (element.position !== undefined) {
          error.position = element.position;
        }
        errors.push(error);
        element.elements.splice(i, 1);
        i--;
      }
    }
  }

  return false;
};

const check_seq = check_par;

const check_phoneme = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});
  attributes.forEach((attribute) => {
    if (attribute === 'alphabet') {
      if (['ipa', 'x-sampa']
        .indexOf(element.attributes.alphabet) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.alphabet = 'ipa';
      }
    } else if (attribute !== 'ph') {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  return false;
};

const check_prosody = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});
  attributes.forEach((attribute) => {
    if (attribute === 'rate') {
      if (['x-slow', 'slow', 'medium', 'fast', 'x-fast'].indexOf(element.attributes.rate) === -1) {
        // Must be of the form #%
        const rate = numberInRange(element.attributes.rate, 20, Number.MAX_SAFE_INTEGER, 100);
        if (!element.attributes.rate.match(/^[0-9]+(\.[0-9]+)?%$/g) || !rate.inRange) {
          errors.push(createTagError(element, attribute));
          element.attributes.rate = rate.value + '%';
        }
      }
    } else if (attribute === 'pitch') {
      if (['x-low', 'low', 'medium', 'high', 'x-high'].indexOf(element.attributes.pitch) === -1) {
        // It's OK, it has to be of the form +x% or -x%
        const pitch = numberInRange(element.attributes.pitch, -33.3, 50, 0);
        if (!element.attributes.pitch.match(/^[+-][0-9]+(\.[0-9]+)?%$/g) || !pitch.inRange) {
          // On Google, it can be a semitone
          if ((platform !== 'google') ||
            !element.attributes.pitch.match(/^[+-]+[0-9]+(\.[0-9]+)?st$/g)) {
            errors.push(createTagError(element, attribute));
            element.attributes.pitch = (pitch.value < 0)
              ? (pitch.value + '%') : ('+' + pitch.value + '%');
          }
        }
      }
    } else if (attribute === 'volume') {
      if (['silent', 'x-soft', 'soft', 'medium', 'loud', 'x-loud'].indexOf(element.attributes.volume) === -1) {
        // It's OK if it's of the form +xdB or - xdB; value doesn't matter
        if (!element.attributes.volume.match(/^[+-][0-9]+(\.[0-9]+)?dB$/g)) {
          errors.push(createTagError(element, attribute));
          element.attributes.volume = '+0dB';
        }
      }
    } else if ((attribute === 'amazon:max-duration') && (platform === 'amazon')) {
      // Needs to be a valid duration
      if (readDuration(element.attributes['amazon:max-duration'], platform, undefined) === undefined) {
        errors.push(createTagError(element, attribute));
        element.attributes['amazon:max-duration'] = '2s';
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  return false;
};

const check_say_as = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});
  // Attribute must be interpret-as or format
  attributes.forEach((attribute) => {
    if (attribute === 'interpret-as') {
      if (['characters', 'spell-out', 'cardinal', 'ordinal',
          'fraction', 'unit', 'date', 'time', 'telephone', 'expletive']
          .indexOf(element.attributes['interpret-as']) === -1) {
        // Some attributes are platform specific
        let supported = false;
        if ((platform === 'amazon') &&
          ['number', 'digits', 'address', 'interjection']
          .indexOf(element.attributes['interpret-as'] !== -1)) {
          supported = true;
        } else if ((platform === 'google') &&
          ['bleep', 'verbatim'].indexOf(element.attributes['interpret-as'] !== -1)) {
          supported = true;
        }

        if (!supported) {
          errors.push(createTagError(element, attribute));
          element.attributes['interpret-as'] = 'cardinal';
        }
      }
    } else if (attribute === 'format') {
      // Is this in support of a date or a time?
      let isDate = (element.attributes['interpret-as'] === 'date');
      if (isDate) {
        if (['mdy', 'dmy', 'ymd', 'md', 'dm', 'ym',
            'my', 'd', 'm', 'y'].indexOf(element.attributes.format) === -1) {
          errors.push(createTagError(element, attribute));
          element.attributes.format = 'mdy';
        }
      } else if (platform === 'google') {
        // We allow format for time variable
        if (!element.attributes.format.match(/^[hmsZ^\s.!?:;(12|24)]*$/g)) {
          errors.push(createTagError(element, attribute));
          element.attributes.format = 'hms12';
        }
      } else {
        // Format for Amazon is only supported on date
        errors.push(createTagError(element, attribute));
        element.attributes.format = undefined;
      }
    } else if ((platform === 'google') && (attribute === 'detail')) {
      if (['1', '2'].indexOf(element.attributes.detail) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.detail = '1';
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  return false;
};

const check_sub = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});
  // alias is optional
  attributes.forEach((attribute) => {
    if (attribute !== 'alias') {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  return false;
};

const check_speak = (parent, index, errors, element, platform, locale) => {
  return false;
};

const check_voice = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});
  // Attribute must be name
  attributes.forEach((attribute) => {
    if (attribute === 'name') {
      if (['Ivy', 'Joanna', 'Joey', 'Justin', 'Kendra', 'Kimberly', 'Matthew', 'Salli',
          'Nicole', 'Russell', 'Amy', 'Brian', 'Emma', 'Aditi', 'Raveena',
          'Hans', 'Marlene', 'Vicki', 'Conchita', 'Enrique',
          'Carla', 'Giorgio', 'Mizuki', 'Takumi', 'Celine', 'Lea', 'Mathieu']
        .indexOf(element.attributes.name) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.name = 'Ivy';
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  return false;
};

const check_w = (parent, index, errors, element, platform, locale) => {
  const attributes = Object.keys(element.attributes || {});
  // Attribute must be role
  attributes.forEach((attribute) => {
    if (attribute === 'role') {
      if (['amazon:VB', 'amazon:VBD', 'amazon:NN', 'amazon:DT', 'amazon:IN', 'amazon:JJ', 'amazon:SENSE_1']
        .indexOf(element.attributes.role) === -1) {
        errors.push(createTagError(element, attribute));
        element.attributes.role = 'amazon:VB';
      }
    } else {
      // Invalid attribute
      errors.push(createTagError(element, attribute, true));
      element.attributes[attribute] = undefined;
    }
  });

  return false;
};

module.exports = {
  check_alexa_name,
  check_amazon_auto_breaths,
  check_amazon_breath,
  check_amazon_domain,
  check_amazon_effect,
  check_amazon_emotion,
  check_audio,
  check_break,
  check_desc,
  check_emphasis,
  check_lang,
  check_mark,
  check_media,
  check_p,
  check_par,
  check_phoneme,
  check_prosody,
  check_s,
  check_say_as,
  check_seq,
  check_speak,
  check_sub,
  check_voice,
  check_w,
};
