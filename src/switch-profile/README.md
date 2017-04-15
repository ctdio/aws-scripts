# aws-switch-profile

A little script for generating temp credentials using GetSessionToken.

### Usage

```
$ aws-switch-profile --help
Usage: aws-switch-profile [options]

Examples:

   Sets temporary credentials under default profile:
       aws-switch-profile --arn <arn> --sourceProfile --tokenCode <MFA token code>

   To specify where to place temporary credentials:
       aws-switch-profile --arn <arn> --sourceProfile <aws profile> --targetProfile <targetProfile> --tokenCode <MFA token code>

Options:

          --help -h Prints this help message [boolean]

           --arn -a The arn of the mfa device you are using [string]

     --tokenCode -c the mfa token code [string]

--sourceProfile -sp Profile (with long term credentials) to use when grabbing the temp credentials [string]

--targetProfile -tp The profile to set temporary credentials for [string]
```

If you plan on using this, I recommend dropping a function into your
`.bash_profile` or `.zprofile`.

```bash
awsgen () {
  aws-switch-profile \
    --arn <arn> \
    --sourceProfile <profile> \
    --targetProfile default \
    --tokenCode $1
}
```

Then you can simply pass in a token code to it

```bash
$ awsgen 123456
```

If you switch between different profiles often, create multiple functions
