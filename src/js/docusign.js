const docusign = require('docusign-esign')
const fs = require('fs')
const path = require('path')

class DocusignService {
  static async createDocumentRedirectURL({ obj, session, redirect }) {
    await this.checkJWTUserToken({ session })
    if (!session.access_token) return

    const envelopesApi = this.getEnvelopesApi({ token: session.access_token })
    const envelopeDefinition = this.makeEnvelope({ obj })

    let results = await envelopesApi
      .createEnvelope(process.env.DOCUSIGN_API_ACCOUNT_ID, {
        envelopeDefinition
      })
      .catch((e) => {
        console.log(e.message)
      })

    let viewRequest = this.makeRecipientViewRequest({
      name: obj.name,
      email: obj.email,
      userId: obj.userId,
      redirect
    })

    return await envelopesApi.createRecipientView(
      process.env.DOCUSIGN_API_ACCOUNT_ID,
      results.envelopeId,
      { recipientViewRequest: viewRequest }
    )
  }

  static async checkJWTUserToken({ session }) {
    if (session.access_token && Date.now() < session.expires_at) return

    let dsApiClient = new docusign.ApiClient()
    dsApiClient.setBasePath(process.env.DOCUSIGN_API_BASE_PATH)

    await dsApiClient
      .requestJWTUserToken(
        process.env.DOCUSIGN_INTEGRATION_KEY,
        process.env.DOCUSIGN_IMPERSONATED_USER_ID,
        'signature',
        fs.readFileSync(path.join(__dirname, '../../config/private.key')),
        3600
      )
      .then((results) => {
        session.access_token = results.body.access_token
        session.expires_at = Date.now() + results.body.expires_in * 1000
      })
  }

  static getEnvelopesApi({ token }) {
    let dsApiClient = new docusign.ApiClient()

    dsApiClient.setBasePath(process.env.DOCUSIGN_API_BASE_PATH)
    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + token)

    return new docusign.EnvelopesApi(dsApiClient)
  }

  static makeEnvelope({ obj }) {
    let env = new docusign.EnvelopeDefinition()
    env.templateId = obj.templateId
    env.emailSubject = obj.emailSubject

    let tabs = docusign.Tabs.constructFromObject({
      textTabs: [
        ...Object.keys(obj.fields)
          .filter((key) => obj.fields[key].type == 'text')
          .map((key) => {
            return {
              tabLabel: key,
              value: obj.fields[key].value
            }
          })
      ],
      dateTabs: [
        ...Object.keys(obj.fields)
          .filter((key) => obj.fields[key].type == 'date')
          .map((key) => {
            return {
              tabLabel: key,
              value: obj.fields[key].value
            }
          })
      ],
      radioGroupTabs: [
        ...Object.keys(obj.fields)
          .filter((key) => obj.fields[key].type == 'radio')
          .map((key) => {
            return {
              groupName: key,
              radios: [{ value: obj.fields[key].value, selected: true }]
            }
          })
      ],
      numericalTabs: [
        ...Object.keys(obj.fields)
          .filter((key) => obj.fields[key].type == 'number')
          .map((key) => {
            return {
              tabLabel: key,
              numericalValue: obj.fields[key].value
            }
          })
      ],
      checkboxTabs: [
        ...Object.keys(obj.fields)
          .filter((key) => obj.fields[key].type == 'checkbox')
          .map((key) => {
            return {
              tabLabel: key,
              name: key,
              selected: true
            }
          })
      ]
    })

    let signer = docusign.TemplateRole.constructFromObject({
      email: obj.email,
      name: obj.name,

      tabs: tabs,

      clientUserId: obj.userId,
      roleName: obj.roleName
    })

    let subscriber = docusign.TemplateRole.constructFromObject({
      email: obj.signers[0].email,
      name: obj.signers[0].name,
      tabs: tabs,
      roleName: obj.signers[0].roleName
    })

    env.templateRoles = [signer, subscriber, obj.signers[1], obj.signers[2]]
    env.status = 'sent'

    return env
  }

  static makeRecipientViewRequest({ name, email, userId, redirect }) {
    let viewRequest = new docusign.RecipientViewRequest()

    viewRequest.returnUrl = redirect
    viewRequest.authenticationMethod = 'none'

    viewRequest.email = email
    viewRequest.userName = name

    viewRequest.clientUserId = userId

    return viewRequest
  }
}

module.exports = {
  DocusignService
}
