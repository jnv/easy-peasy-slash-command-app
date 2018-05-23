'use strict'

/* Uses the slack button feature to offer a real time bot to multiple teams */
const Botkit = require('botkit')
const { join: pathResolve } = require('path')

if (
	!process.env.CLIENT_ID ||
	!process.env.CLIENT_SECRET ||
	!process.env.PORT ||
	!process.env.VERIFICATION_TOKEN
) {
	console.log(
		'Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN and PORT in environment'
	)
	process.exit(1)
}

const config = {
	json_file_store: pathResolve(__dirname, '..', '.data'),
}

const controller = Botkit.slackbot(config).configureSlackApp({
	clientId: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	scopes: ['commands'],
})

controller.setupWebserver(process.env.PORT, (err, webserver) => {
	if (err) {
		console.log(err)
	}
	controller.createWebhookEndpoints(controller.webserver)

	controller.createOauthEndpoints(controller.webserver, (err, req, res) => {
		if (err) {
			res.status(500).send(`ERROR: ${err}`)
		} else {
			res.send('Success!')
		}
	})
})

controller.on('slash_command', (slashCommand, message) => {
	switch (message.command) {
	case '/echo': // handle the `/echo` slash command. We might have others assigned to this app too!
		// The rules are simple: If there is no text following the command, treat it as though they had requested "help"
		// Otherwise just echo back to them what they sent us.

		if (message.token !== process.env.VERIFICATION_TOKEN) {
			return // just ignore it.
		}

		// if no text was supplied, treat it as a help command
		if (message.text === '' || message.text === 'help') {
			slashCommand.replyPrivate(
				message,
				'I echo back what you tell me. ' + 'Try typing `/echo hello` to see.'
			)
			return
		}

		// If we made it here, just echo what the user typed back at them
		// TODO You do it!
		slashCommand.replyPublic(message, '1', () => {})
		break
	default:
		slashCommand.replyPublic(
			message,
			`I'm afraid I don't know how to ${message.command} yet.`
		)
	}
})
