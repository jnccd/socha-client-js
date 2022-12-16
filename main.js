import { Socket } from 'net';
import Enumerable from 'linq';
import DOMParser from 'dom-parser';

let host = "127.0.0.1";
let port = 13050;
let reservation = null;
let strategy = null;

let logNetwork = true;

let moveProvider = null;

const boardSize = 8
let board = [[]];

let lastArg = "";
Enumerable.from(process.argv).skip(2).forEach(x => {

	if (x == "--help") {
		console.log(`Usage: start.sh [options]
-h, --host:
	The IP address of the host to connect to (default: {host}).
-p, --port:
	The port used for the connection (default: {port}).
-r, --reservation:
	The reservation code to join a prepared game.
-s, --strategy:
	The strategy used for the game.
--help:
	Print this help message.`);
		process.exit(1)
	}

	if (lastArg == "-h" || lastArg == "--host")
		host = x;
	else if (lastArg == "-p" || lastArg == "--port")
		port = parseInt(x);
	else if (lastArg == "-r" || lastArg == "--reservation")
		reservation = x;
	else if (lastArg == "-s" || lastArg == "--strategy")
		strategy = x;
});



var client = new Socket();
client.connect(port, host, function() {
	console.log('Connected');

	if (reservation == null) {
		client.write(`<protocol><join gameType=\"swc_2023_penguins\" />`);
	} else {
		client.write(`<protocol><joinPrepared reservationCode=\"${reservation}\" />`);
	}
	

});

var responseData = "";
client.on('data', function(data) {
	responseData += data
	if (!responseData.includes("</room>") && !responseData.includes("</protocol>")) {
		return
	}

	if (logNetwork)
		console.log('Received: ' + responseData);
		
	if (responseData.includes("</protocol>")) {
		client.destroy();
		process.exit(1);
	}

	const parser = new DOMParser();
	const dom = parser.parseFromString(responseData, "text/xml");

	let domBoard = dom.getElementsByTagName('board')
	if (domBoard.length > 0) {
		
		let domFields = dom.getElementsByTagName('field').map(function(x){ return x.textContent })
		console.log(domFields)

		// Fill board with field data
		board = new Array(boardSize)
		for(var i = 0; i < board.length; i++){
			board[i] = new Array(boardSize)
			for(var j = 0; j < board.length; j++){
				board[i][j] = domFields[i*boardSize+j]-1+1
			}
		}
	}
	console.log(board)

	responseData = ""
});

client.on('close', function() {
	console.log('Connection closed');

	client.destroy();
	process.exit(1);
});

export default function(newMoveProvider) {
	moveProvider = newMoveProvider
	console.log('lul')
}