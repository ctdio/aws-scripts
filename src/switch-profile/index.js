/**
 * Switches aws temp profiles
 */
const colors = require('colors')
const { STS } = require('aws-sdk')
const fs = require('fs')
const ini = require('ini')

const CREDENTIALS_PATH = `${process.env['HOME']}/.aws/credentials`

const parser = require('argly').createParser({
  '--help -h': {
    type: 'boolean',
    description: 'Prints this help message',
  },
  '--arn -a': {
    type: 'string',
    description: 'The arn of the mfa device you are using'
  },
  '--tokenCode -c': {
    type: 'string',
    description: 'the mfa token code'
  },
  // long term credentials
  '--sourceProfile -s': {
    type: 'string',
    description: 'Profile (with long term credentials) to use when grabbing the temp credentials'
  },
  // where to place temp credentials
  '--targetProfile -t': {
    type: 'string',
    description: 'The profile to set temporary credentials for'
  }
}).usage('Usage: $0 [options]')
  .example('Sets temporary credentials under default profile:\n       ' +
    'aws-switch-profile --arn <arn> --sourceProfile' +
    ' --tokenCode <MFA token code>')
  .example('To specify where to place temporary credentials:\n       ' +
    'aws-switch-profile --arn <arn> --sourceProfile' +
    ' <aws profile> --targetProfile <targetProfile> --tokenCode <MFA token code>')
  .validate(function (result) {
    if (result.help) {
      this.printUsage()
      process.exit(0)
    }

    const {
      arn,
      tokenCode,
      sourceProfile,
      targetProfile
    } = result

    if (!arn) {
      throw new Error('arn must be specified.')
    }

    if (!sourceProfile) {
      const errorMsg = 'Source profile not specified. Please specify the profile ' +
        '(containing long term credentials) to use when retrieving the temp credentials.'
      throw new Error(errorMsg)
    }

    if (!tokenCode || !tokenCode.length) {
      throw new Error('MFA code must be specified.')
    }

    if (!targetProfile) {
      console.warn(colors.yellow('Target Profile was not specified. Defaulting to "default" profile.'));
      result.targetProfile = 'default'
    }
  })

;(async () => {
  try {
    const {
      arn,
      tokenCode,
      sourceProfile,
      targetProfile
    } = parser.parse()

    const file = fs.readFileSync(CREDENTIALS_PATH, 'utf8')
    let credentials = ini.parse(file)

    let sourceProfileCredentials = credentials[sourceProfile]

    if (!sourceProfileCredentials) {
      throw new Error(`Source profile "${sourceProfile}" does not exist in your credentials.`)
    }

    const sts = new STS({
      accessKeyId: sourceProfileCredentials['aws_access_key_id'],
      secretAccessKey: sourceProfileCredentials['aws_secret_access_key'],
      apiVersion: '2011-06-15'
    })

    console.log(colors.cyan('Retrieving aws session token...'))

    const response = await sts.getSessionToken({
      DurationSeconds: 129600,
      SerialNumber: arn,
      TokenCode: tokenCode
    }).promise()

    credentials[targetProfile] = {
      aws_access_key_id: response.Credentials.AccessKeyId,
      aws_secret_access_key: response.Credentials.SecretAccessKey,
      aws_session_token: response.Credentials.SessionToken
    }

    // update aws_session_token
    fs.writeFileSync(CREDENTIALS_PATH, ini.stringify(credentials))

    console.log(colors.green('Complete!'))
  } catch (err) {
    console.error(err);
    process.exit(1)
  }
})()
