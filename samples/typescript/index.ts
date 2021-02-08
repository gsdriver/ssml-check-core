import { check, ISSMLCheckError, ISSMLCheckVerifyResponse, ISSMLCheckOptions, verifyAndFix} from "ssml-check-core";

// Run some samples to verify TS builds properly
const sample = async () => {
  const ssml: string = "<speak><prosody rate=\"5%\">Hello world</prosody></speak>";
  const options: ISSMLCheckOptions = {
    platform: "all",
  };

  const errors: ISSMLCheckError[] | undefined = await check(ssml, options);
  if (!errors) {
    console.log("No errors found!")
  } else {
    errors.forEach((e) => {
      console.log(e.type);
    });
  }

  const f: ISSMLCheckVerifyResponse = await verifyAndFix(ssml, options);
  console.log("\n");
  console.log(f.errors);
  console.log(f.fixedSSML);
};

sample();
