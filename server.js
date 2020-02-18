'use strict';

const tmi = require('tmi.js');

require('dotenv').config();

const fs = require('fs');

//Define configuration options
const opts = {
  options: { debug: true },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ]
};
let customChannelCommands = []

fs.readFile(`${process.env.CHANNEL_NAME}Commands.txt`, 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
  let dividedCommands = data.split('|||');
  let count = 0;
  let processedCommands = [];
  while(count < dividedCommands.length){
    let newCommand = {command: `!${dividedCommands[count]}`, text: dividedCommands[count + 1]};
    processedCommands.push(newCommand);
    count = count + 2;
  }
  customChannelCommands = processedCommands;
  console.log(processedCommands);
});


// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = msg.trim();

  // If the command is known, let's execute it
  if (commandName === '!dice') {
    const num = rollDice();
    client.say(target, `You rolled a ${num}`);
    console.log(`* Executed ${commandName} command`);
  }
  else if (commandName === '!hello'){
    client.say(target, `Hello, ${context.username}`);
    console.log(context);
    console.log(msg);
  }
  else if (commandName.includes('!add')){
    if (context.badges.broadcaster === '1'){
      let indexOfFirstSpace = msg.indexOf(' ');
      let newCommandName = msg.slice(indexOfFirstSpace + 1, msg.indexOf(' ', indexOfFirstSpace + 1));
      let newCommandText = msg.slice(msg.indexOf(' ', indexOfFirstSpace + 1) + 1);

      console.log('The name of the new command: ' + newCommandName)
      console.log('The text of the new command: ' + newCommandText)
      fs.appendFile(`${process.env.CHANNEL_NAME}Commands.txt`, `${newCommandName}|||${newCommandText}|||`, function (err) {
        if (err) throw err;
        console.log('Command Saved!');
        let newCommand = {command: `!${newCommandName}`, text: newCommandText};
        customChannelCommands.push(newCommand);
      });
    }
  }
  else {
    let commandDone = false;
    customChannelCommands.forEach(command => {
      if (commandName === command.command){
        client.say(target, command.text);
        commandDone = true;
      }
    });
    if(commandDone === false){
      console.log('Unknown Command')
    }
  }
}
// Function called when the "dice" command is issued
function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}
// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
