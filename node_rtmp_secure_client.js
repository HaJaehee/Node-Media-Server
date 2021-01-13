/* node_rtmp_secure_client.js
 * This is an extension of NodeRtmpClient with modified RTMP Handshake.
 * The constructor needs one more argument: intended_streamId which will be used for stream key for broadcasting.
 * nonceGenerate() method generates nonce based on intended_streamId.
 * when _start() is called, it prepares c0c1 packet with nonce.
 */
const NodeRtmpClient = require('./node_rtmp_client');
const Net = require('net');
const Crypto = require('crypto');
const Logger = require('./node_core_logger');
const NodeRSA = require('node-rsa')

let ENCRYPTED_MESSAGE_SIZE = 172;
let PUBKEY_SIZE = 204;

class NodeRtmpSecureClient extends NodeRtmpClient{
    constructor(rtmpUrl, intended_streamId, ID, passwd) {
        super(rtmpUrl);
        this.intended_streamId = intended_streamId;
		this.ID = ID;
		this.passwd = passwd;
        this.nonce_length = ENCRYPTED_MESSAGE_SIZE + PUBKEY_SIZE;
    }

    startPull() {
        Logger.error("NodeRtmpSecureClient does not support Pull");
    }

    nonceGenerate() {
		let buf = Buffer.alloc(PUBKEY_SIZE + ENCRYPTED_MESSAGE_SIZE);
		Buffer.from(this.intended_streamId).copy(buf);
		
		let pubkey = new NodeRSA('ssh-rsa ' + this.intended_streamId, 'openssh-public');
		let input_message = this.ID + ':' + this.passwd;
		let output_message = Buffer.alloc(ENCRYPTED_MESSAGE_SIZE);
		output_message = pubkey.encrypt(input_message, 'base64');
		Buffer.from(output_message).copy(buf, PUBKEY_SIZE);
		
		return buf;
    }
    
    /* override rtmp handshake */
    _start() {
        this.socket = Net.createConnection(this.info.port, this.info.hostname, () => {
            //rtmp handshake c0c1
            let c0c1 = Crypto.randomBytes(1537);
            //let c0c1 = Buffer.alloc(1537);
			c0c1.writeUInt8(3); //c0
            this.nonceGenerate().copy(c0c1, 1, 0, this.nonceLength); //c1
            this.socket.write(c0c1);
        });
        this.socket.on('data', this.onSocketData.bind(this));
        this.socket.on('error', this.onSocketError.bind(this));
        this.socket.on('close', this.onSocketClose.bind(this));
        this.socket.on('timeout', this.onSocketTimeout.bind(this));
        this.socket.setTimeout(60000);
    }
}

module.exports = NodeRtmpSecureClient;
