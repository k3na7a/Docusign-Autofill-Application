const express = require('express')
const router = express.Router()

const docusignService = require('../js/docusign.js').DocusignService
const MailerService = require('../js/nodemailer.js').MailerService

router.post('/docusign', async function (req, res) {
  const mappedData = req.body

  await docusignService
    .createDocumentRedirectURL({
      obj: mappedData,
      session: req.session,
      redirect: `${process.env.BASE_URL}/success`
    })
    .then((results) => {
      res.send(results.url)
      MailerService.sendMail({
        $to: mappedData.email,
        $name: mappedData.name,
        $url: results.url,
        $subject: process.env.DOCUSIGN_EMAIL_SUBJECT
      })
    })
    .catch((error) => res.send(error.message))
})

module.exports = {
  router
}

router.get('/success', function (_req, res) {
  res.send('Success')
})
