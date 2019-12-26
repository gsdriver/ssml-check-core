# SSML-Check-Core

SSML-Check-Core will verify that a given input is valid SSML

# Usage

This library exposes two functions which allow you to check and optionally correct a given SSML string

## Check
The first is `check` which verifies whether the given input is a valid SSML string on either the Amazon Alexa or Google Assistant platform (or both). This function returns a Promise with an array of errors indicating how the input fails validation, or a Promise of undefined if there are no errors.

```
check(ssml, options)
```

The arguments to this function are:

 * ssml - The SSML to check
 * options - Options for evaluating the SSML as noted below
 
The options structure is composed of the following fields with the following default values:

```
{
  platform:all,     // The voice platform to evaluate this SSML against.
                    // Valid values are "all", "amazon", or "google".
  locale:undefined, // The locale you want to check against, used for certain
                    // locale-specific attributes like amazon:emotion
}
```

The return value is a Promise resolving to an array of errors that were encountered in processing the SSML, or `undefined` if no errors were encountered.  The format of each error object is as follows:

```
{
  type,       // The type of error encountered ("tag" or a specific error)
  tag,        // The tag that had an error (set if type is "tag")
  attribute,  // The attribute that had an error (set if type is "tag")
  value,      // The attribute value that was in error (set if type is "tag" or "audio")
}
```

The current version of ssml-check-core will check for the following:

 * Valid XML format
 * All tags are valid tags for their platform with valid attributes and values
 * No more than five `audio` tags in the response
 * Note invalid & character

### Example

```
const ssmlCheck = require('ssml-check-core');
ssmlCheck.check('<speak><prosody rate="5%">Hello world</prosody></speak>')
.then((errors) => {
  if (errors) {
    console.log(JSON.stringify(errors));
  } else {
    console.log('SSML is clean');
  }
});
```
will output `[{"type":"tag","tag":"prosody","attribute":"rate","value":"5%"}]`

## verifyAndFix 
The second function is `verifyAndFix` which returns a Promise of an object containing an array of caught SSML errors (similar to check) and, if possible, corrected SSML as noted below.

```
verifyAndFix(ssml, options)
```

The arguments to this function, including the options structure, are the same as for check.

The return value is a Promise resolving to an object with the following fields:

```
{
  fixedSSML,  // A fixed SSML string if errors are found that can be corrected for
              // This field will be undefined if the SSML cannot be corrected
  errors,     // An array of errors. The format of each object in this array is as
              // defined above for the check function. This field is undefined
              // if there are no errors.    
}
```

If there are no errors, then the Promise will contain an empty object.

The current version of ssml-check-core will correct the following errors:

 * If more than five `audio` tags are in the response, elements after the first five are removed
 * If an invalid tag is found, the tag will be removed but the contents of the element will remain 
 * If an invalid attribute is found, it will be removed (in the case of the src attribute for audio, if this is missing or invalid the element will be removed)
 * If an invalid value is found for an attribute within a valid tag, the value will be corrected as best possible. For example, adding a leading + to values that require it like prosody's pitch attribute, adjusting the value to be within an acceptable range, or substituting a default value if necessary 

### Examples

```
const ssmlCheck = require('ssml-check-core');
ssmlCheck.verifyAndFix('<speak><tag>What is this?</tag><break time="20000ms"/>This & that</speak>')
.then((result) => {
  if (result.fixedSSML) {
    console.log(result.fixedSSML);
  } else if (result.errors) {
    console.log(JSON.stringify(result.errors));
  } else {
    console.log('SSML is clean');
  }
});
```
will output `<speak>What is this?<break time="10s"/>This &amp; that</speak>`

```
const ssmlCheck = require('ssml-check-core');
ssmlCheck.verifyAndFix('<speak><prosody rate="60">Hello world</prosody></speak>')
.then((result) => {
  if (result.fixedSSML) {
    console.log(result.fixedSSML);
  } else if (result.errors) {
    console.log(JSON.stringify(result.errors));
  } else {
    console.log('SSML is clean');
  }
});
```
will output `<speak><prosody rate="60%">Hello world</prosody></speak>`

# Contributions

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

When contributing to this repository, please first discuss the change you wish to make by raising an issue or sending an e-mail with to the owners of this repository.
