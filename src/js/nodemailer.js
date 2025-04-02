const nodemailer = require('nodemailer')

class MailerService {
  static sendMail({ $to, $name, $url, $subject }) {
    const mailer = nodemailer.createTransport({
      host: process.env.HOST,
      port: process.env.MAILER_PORT,
      secure: false,
      auth: {
        user: process.env.USER,
        pass: process.env.PASS
      }
    })

    mailer
      .sendMail({
        from: `${process.env.SUPPORT_NAME} <${process.env.SUPPORT_EMAIL}>`,
        to: `${$name} <${$to}>`,
        replyto: process.env.SUPPORT_EMAIL,
        cc: null,
        subject: $subject,
        html: `<span>Your Docusign Document can be found at the following link: <a href="${$url}">CLICK HERE</a></span>`
      })
      .catch((e) => console.log(e.message))
  }
}

module.exports = {
  MailerService
}
