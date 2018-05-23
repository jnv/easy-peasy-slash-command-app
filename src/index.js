'use strict'

const Botkit = require('botkit')
const { join: pathResolve } = require('path')

const PORT = process.env.PORT || 8765
if (
	!process.env.CLIENT_ID ||
	!process.env.CLIENT_SECRET ||
	!process.env.VERIFICATION_TOKEN
) {
	console.log(
		'Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN environment'
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

controller.setupWebserver(PORT, (err, webserver) => {
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

function handleScrumbotCommand (slashCommand, message) {
	const { text, channel } = message
	if (text === 'current') {
		controller.storage.channels.get(channel, (err, data) => {
			let response = 'No scrum master was set for this channel'
			if (!err && data) {
				response = `Current scrum master is: ${data.winner}`
			}
			slashCommand.replyPublic(message, response)
		})
		return
	}
	/*
  if (text === 'pick') {
    const dialog = slashCommand.createDialog(
         'Pick a new scrum master',
         'callback_id',
         'Shuffle'
       ).addTextarea('Who is on roll?','users','',{placeholder: '@user1 @user2 @user3'})
    console.log('pick', dialog.asObject())
    return slashCommand.replyWithDialog(message, dialog.asObject())
  }

  return slashCommand.replyPrivate(message, 'I did not get that') */

	const items = text.split(/[,\s+]/)
	const winner = items[Math.floor(Math.random() * items.length)]
	const replyText = `The next scrum master is: ${winner}`
	controller.storage.channels.save({ id: channel, winner }, console.log)
	slashCommand.replyPublic(message, {
		attachments: [
			{
				fallback: replyText,
				text: replyText,
				image_url: 'https://media.giphy.com/media/g9582DNuQppxC/200w_d.gif',
				color: '#004492',
			},
		],
	})
}

controller.on('slash_command', (slashCommand, message) => {
	if (message.token !== process.env.VERIFICATION_TOKEN) {
		slashCommand.replyPrivate(
			message,
			'Invalid verification token, are you sure you got it right?'
		)
		return
	}

	switch (message.command) {
	case '/scrumbot':
		handleScrumbotCommand(slashCommand, message)
		break
	case '/echo': // handle the `/echo` slash command. We might have others assigned to this app too!
		// The rules are simple: If there is no text following the command, treat it as though they had requested "help"
		// Otherwise just echo back to them what they sent us.

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

controller.on('dialog_submission', (bot, message) => {
	if (message.token !== process.env.VERIFICATION_TOKEN) {
		bot.replyPrivate(
			message,
			'Invalid verification token, are you sure you got it right?'
		)
		return
	}
	const { submission } = message
	console.log(submission)
	bot.reply(message, 'Got it!')
	bot.dialogOk()
})
